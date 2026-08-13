import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Local persistent data directory
const DATA_DIR = path.join(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SECURITY_FILE = path.join(DATA_DIR, 'security.json');
const STORAGE_FILE = path.join(DATA_DIR, 'storage.json');

// Memory security cache & rate limiter
interface SecurityData {
  pinHash: string;
  salt: string;
  driveToken?: string;
  driveUserEmail?: string;
  autoSaveInterval?: number;
  theme?: 'light' | 'dark' | 'system';
}

let securityCache: SecurityData | null = null;
const sessionTokens = new Set<string>();

// Failed PIN rate-limiting
const failedAttemptsMap = new Map<string, { count: number; lockoutUntil: number }>();

function loadSecurity(): SecurityData | null {
  if (securityCache) return securityCache;
  if (fs.existsSync(SECURITY_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(SECURITY_FILE, 'utf8'));
      securityCache = data;
      return securityCache;
    } catch (e) {
      console.error('Error reading security file:', e);
    }
  }
  return null;
}

function saveSecurity(data: SecurityData) {
  securityCache = data;
  try {
    fs.writeFileSync(SECURITY_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving security file:', e);
  }
}

function hashPin(pin: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(pin, salt, 100000, 64, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex'));
    });
  });
}

// Local Document Storage Fallback
interface LocalStorageData {
  documents: Record<string, any>;
  folders: Record<string, any>;
  favorites: string[];
  recentDocs: string[];
}

function loadLocalStorage(): LocalStorageData {
  if (fs.existsSync(STORAGE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
    } catch (e) {
      console.error('Error reading local storage file:', e);
    }
  }
  return { documents: {}, folders: {}, favorites: [], recentDocs: [] };
}

function saveLocalStorage(data: LocalStorageData) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving local storage file:', e);
  }
}

// Middleware: Verify Session
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const security = loadSecurity();
  if (!security || !security.pinHash) {
    // If PIN isn't setup yet, allow request or handle in setup
    return next();
  }

  const token = req.cookies.mynotes_session;
  if (!token || !sessionTokens.has(token)) {
    return res.status(401).json({ error: 'Locked. Authentication required.' });
  }
  next();
};

// --- AUTH / PIN ROUTES ---

// 1. PIN Status
app.get('/api/auth/pin-status', (req, res) => {
  const security = loadSecurity();
  const token = req.cookies.mynotes_session;
  const isUnlocked = Boolean(token && sessionTokens.has(token));

  res.json({
    isSetup: Boolean(security && security.pinHash),
    isUnlocked: !security?.pinHash || isUnlocked,
    driveConnected: Boolean(security && security.driveToken),
    driveUserEmail: security?.driveUserEmail || null,
  });
});

// 2. Setup initial PIN
app.post('/api/auth/setup-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || typeof pin !== 'string' || pin.trim().length < 4) {
      return res.status(400).json({ error: 'PIN / Passphrase must be at least 4 characters long.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const pinHash = await hashPin(pin.trim(), salt);

    const currentSecurity = loadSecurity() || { pinHash: '', salt: '' };
    saveSecurity({
      ...currentSecurity,
      pinHash,
      salt,
    });

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    sessionTokens.add(sessionToken);

    res.cookie('mynotes_session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({ success: true, isUnlocked: true });
  } catch (error) {
    console.error('Error setup PIN:', error);
    res.status(500).json({ error: 'Internal server error setting up PIN.' });
  }
});

// 3. Unlock with PIN
app.post('/api/auth/unlock', async (req, res) => {
  try {
    const ip = req.ip || 'client';
    const attempts = failedAttemptsMap.get(ip) || { count: 0, lockoutUntil: 0 };

    if (Date.now() < attempts.lockoutUntil) {
      const remainingSecs = Math.ceil((attempts.lockoutUntil - Date.now()) / 1000);
      return res.status(429).json({
        error: `Too many failed attempts. Please wait ${remainingSecs} seconds before trying again.`,
      });
    }

    const security = loadSecurity();
    if (!security || !security.pinHash) {
      return res.status(400).json({ error: 'PIN is not setup yet.' });
    }

    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ error: 'PIN required.' });
    }

    const computedHash = await hashPin(pin.trim(), security.salt);
    if (computedHash !== security.pinHash) {
      attempts.count += 1;
      if (attempts.count >= 5) {
        attempts.lockoutUntil = Date.now() + 30 * 1000; // 30s lockout
        attempts.count = 0;
      }
      failedAttemptsMap.set(ip, attempts);
      return res.status(401).json({ error: 'Incorrect PIN.' });
    }

    // Reset failed attempts on success
    failedAttemptsMap.delete(ip);

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    sessionTokens.add(sessionToken);

    res.cookie('mynotes_session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, isUnlocked: true });
  } catch (error) {
    console.error('Error unlocking with PIN:', error);
    res.status(500).json({ error: 'Internal server error during unlock.' });
  }
});

// 4. Lock application
app.post('/api/auth/lock', (req, res) => {
  const token = req.cookies.mynotes_session;
  if (token) {
    sessionTokens.delete(token);
  }
  res.clearCookie('mynotes_session', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  res.json({ success: true, isUnlocked: false });
});

// 5. Change PIN
app.post('/api/auth/change-pin', requireAuth, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    const security = loadSecurity();
    if (!security || !security.pinHash) {
      return res.status(400).json({ error: 'PIN is not set up.' });
    }

    const computedHash = await hashPin(currentPin.trim(), security.salt);
    if (computedHash !== security.pinHash) {
      return res.status(401).json({ error: 'Current PIN is incorrect.' });
    }

    if (!newPin || newPin.trim().length < 4) {
      return res.status(400).json({ error: 'New PIN must be at least 4 characters.' });
    }

    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = await hashPin(newPin.trim(), newSalt);

    saveSecurity({
      ...security,
      pinHash: newHash,
      salt: newSalt,
    });

    res.json({ success: true, message: 'PIN updated successfully.' });
  } catch (error) {
    console.error('Error changing PIN:', error);
    res.status(500).json({ error: 'Failed to change PIN.' });
  }
});

// --- LOCAL & DRIVE DATA ROUTES ---

// 1. Get Workspace Data (Documents, Folders, Settings)
app.get('/api/workspace', requireAuth, (req, res) => {
  const storage = loadLocalStorage();
  const security = loadSecurity();

  res.json({
    documents: Object.values(storage.documents),
    folders: Object.values(storage.folders),
    favorites: storage.favorites || [],
    recentDocs: storage.recentDocs || [],
    autoSaveInterval: security?.autoSaveInterval || 1500,
    theme: security?.theme || 'system',
    driveConnected: Boolean(security?.driveToken),
    driveUserEmail: security?.driveUserEmail || null,
  });
});

// 2. Save / Update Document
app.post('/api/documents', requireAuth, (req, res) => {
  try {
    const doc = req.body;
    if (!doc || !doc.id) {
      return res.status(400).json({ error: 'Document ID required.' });
    }

    const storage = loadLocalStorage();
    doc.updatedAt = new Date().toISOString();
    storage.documents[doc.id] = doc;

    // Update recent docs array
    storage.recentDocs = [
      doc.id,
      ...storage.recentDocs.filter((id) => id !== doc.id),
    ].slice(0, 20);

    saveLocalStorage(storage);
    res.json({ success: true, document: doc });
  } catch (e) {
    console.error('Error saving document:', e);
    res.status(500).json({ error: 'Failed to save document.' });
  }
});

// 3. Delete / Trash Document
app.delete('/api/documents/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const storage = loadLocalStorage();
    if (storage.documents[id]) {
      storage.documents[id].isTrashed = true;
      saveLocalStorage(storage);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to trash document.' });
  }
});

// 4. Restore Document
app.post('/api/documents/:id/restore', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const storage = loadLocalStorage();
    if (storage.documents[id]) {
      storage.documents[id].isTrashed = false;
      saveLocalStorage(storage);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to restore document.' });
  }
});

// 5. Permanent Delete Document
app.delete('/api/documents/:id/permanent', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const storage = loadLocalStorage();
    delete storage.documents[id];
    storage.favorites = storage.favorites.filter((fId) => fId !== id);
    storage.recentDocs = storage.recentDocs.filter((rId) => rId !== id);
    saveLocalStorage(storage);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete document.' });
  }
});

// 5b. Toggle Public Sharing
app.post('/api/documents/:id/share', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { isShared } = req.body;
    const storage = loadLocalStorage();
    const doc = storage.documents[id];

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!doc.shareToken) {
      doc.shareToken = crypto.randomBytes(16).toString('hex');
    }

    doc.isPublicShared = Boolean(isShared);
    storage.documents[id] = doc;
    saveLocalStorage(storage);

    res.json({
      success: true,
      shareToken: doc.shareToken,
      isPublicShared: doc.isPublicShared,
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update document share status.' });
  }
});

// 5c. Public Read-Only View Endpoint (NO Auth required)
app.get('/api/share/:shareToken', (req, res) => {
  try {
    const { shareToken } = req.params;
    const storage = loadLocalStorage();

    const doc = Object.values(storage.documents).find(
      (d) => d.shareToken === shareToken && d.isPublicShared && !d.isTrashed
    );

    if (!doc) {
      return res.status(404).json({ error: 'Shared document not found or link has expired.' });
    }

    res.json({
      document: {
        id: doc.id,
        title: doc.title,
        icon: doc.icon,
        updatedAt: doc.updatedAt,
        blocks: doc.blocks,
      },
    });
  } catch (e) {
    res.status(500).json({ error: 'Error fetching shared document.' });
  }
});

// 6. Folders CRUD
app.post('/api/folders', requireAuth, (req, res) => {
  try {
    const folder = req.body;
    if (!folder || !folder.id || !folder.name) {
      return res.status(400).json({ error: 'Invalid folder data.' });
    }
    const storage = loadLocalStorage();
    storage.folders[folder.id] = folder;
    saveLocalStorage(storage);
    res.json({ success: true, folder });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create folder.' });
  }
});

app.delete('/api/folders/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const storage = loadLocalStorage();
    delete storage.folders[id];
    // Move child documents to root
    Object.values(storage.documents).forEach((doc) => {
      if (doc.folderId === id) {
        doc.folderId = null;
      }
    });
    saveLocalStorage(storage);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete folder.' });
  }
});

// 7. Toggle Favorite
app.post('/api/favorites/toggle', requireAuth, (req, res) => {
  try {
    const { docId } = req.body;
    const storage = loadLocalStorage();
    if (!storage.favorites) storage.favorites = [];

    if (storage.favorites.includes(docId)) {
      storage.favorites = storage.favorites.filter((id) => id !== docId);
    } else {
      storage.favorites.push(docId);
    }

    if (storage.documents[docId]) {
      storage.documents[docId].isFavorite = storage.favorites.includes(docId);
    }

    saveLocalStorage(storage);
    res.json({ success: true, favorites: storage.favorites });
  } catch (e) {
    res.status(500).json({ error: 'Failed to toggle favorite.' });
  }
});

// 8. Update Settings
app.post('/api/settings', requireAuth, (req, res) => {
  try {
    const { autoSaveInterval, theme, driveUserEmail } = req.body;
    const security = loadSecurity() || { pinHash: '', salt: '' };

    if (autoSaveInterval) security.autoSaveInterval = autoSaveInterval;
    if (theme) security.theme = theme;
    if (driveUserEmail !== undefined) security.driveUserEmail = driveUserEmail;

    saveSecurity(security);
    res.json({ success: true, autoSaveInterval: security.autoSaveInterval, theme: security.theme });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// START SERVER
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // SPA Fallback for /share/* or other non-API routes in dev
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      try {
        const rawHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        const html = await vite.transformIndexHtml(req.originalUrl, rawHtml);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MyNotes server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
