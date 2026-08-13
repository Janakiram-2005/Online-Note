import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NoteDocument, NoteFolder, WorkspaceMetadata, SaveStatus } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Editor } from './components/Editor';
import { SearchModal } from './components/SearchModal';
import { SettingsModal } from './components/SettingsModal';
import { PINModal } from './components/PINModal';
import { ConfirmModal } from './components/ConfirmModal';
import { FolderModal } from './components/FolderModal';
import { ShareModal } from './components/ShareModal';
import { PublicShareView } from './components/PublicShareView';
import { exportDocumentToPdf } from './utils/pdf';
import { exportDocumentToMarkdown, parseMarkdownToBlocks } from './utils/markdown';
import { Plus, FileText, Lock, Sparkles, ShieldAlert } from 'lucide-react';

export default function App() {
  // Check if current URL is a public share link (/share/xyz)
  const shareMatch = window.location.pathname.match(/^\/share\/([a-zA-Z0-9_-]+)/);
  if (shareMatch && shareMatch[1]) {
    return <PublicShareView shareToken={shareMatch[1]} />;
  }

  // Auth & Workspace Lock State
  const [isPinSetup, setIsPinSetup] = useState<boolean | null>(null);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  // Inactivity tracking ref (5 min auto-lock)
  const lastActivityRef = useRef<number>(Date.now());

  // Workspace State
  const [documents, setDocuments] = useState<NoteDocument[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<WorkspaceMetadata>({
    favorites: [],
    recentDocs: [],
    folders: [],
    autoSaveInterval: 1500,
    theme: 'light',
    pinConfigured: false,
    driveConnected: false,
  });

  // Save Status
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: 'saved' });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modals & Drawers
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Check PIN status on app launch (Require PIN unlock on every fresh page open/reload if setup)
  const checkPinStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/pin-status');
      const data = await res.json();
      setIsPinSetup(data.isSetup);
      if (data.isSetup) {
        // Always require PIN re-authentication on new page open / reload
        setIsUnlocked(false);
      } else {
        setIsUnlocked(true);
      }
    } catch (e) {
      console.error('Failed to check PIN status:', e);
      setIsPinSetup(false);
      setIsUnlocked(true);
    }
  }, []);

  useEffect(() => {
    checkPinStatus();
  }, [checkPinStatus]);

  // 5-Minute Inactivity Auto-Lock
  useEffect(() => {
    if (!isUnlocked || !isPinSetup) return;

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll', 'pointerdown'];
    events.forEach((evt) => window.addEventListener(evt, resetActivity, { passive: true }));

    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= 5 * 60 * 1000) {
        // 5 minutes of inactivity passed -> lock workspace
        fetch('/api/auth/lock', { method: 'POST' }).catch(() => {});
        setIsUnlocked(false);
        setIsSettingsOpen(false);
        setIsShareModalOpen(false);
        setIsSearchOpen(false);
      }
    }, 10000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetActivity));
      clearInterval(checkInterval);
    };
  }, [isUnlocked, isPinSetup]);

  // Load Workspace Data
  const loadWorkspace = useCallback(async () => {
    try {
      const res = await fetch('/api/workspace');
      if (!res.ok) return;
      const data = await res.json();

      let docs: NoteDocument[] = data.documents || [];
      const fetchedFolders: NoteFolder[] = data.folders || [];
      const fetchedFavorites: string[] = data.favorites || [];

      // If no documents exist, create a default Welcome Document
      if (docs.length === 0) {
        const welcomeDoc: NoteDocument = {
          id: 'doc-welcome',
          title: 'Welcome to MyNotes 🚀',
          icon: '✨',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isFavorite: true,
          blocks: [
            {
              id: 'b1',
              type: 'heading1',
              content: 'Welcome to your private Notion-like workspace',
            },
            {
              id: 'b2',
              type: 'paragraph',
              content: 'MyNotes is a fast, clean, single-user document editor with automatic saving and Google Drive persistence.',
            },
            {
              id: 'b3',
              type: 'heading2',
              content: 'Key Features',
            },
            {
              id: 'b4',
              type: 'todo',
              content: 'Personal PIN / Passphrase unlock protection',
              checked: true,
            },
            {
              id: 'b5',
              type: 'todo',
              content: 'Slash commands (type / to insert headings, lists, quotes, code)',
              checked: true,
            },
            {
              id: 'b6',
              type: 'todo',
              content: 'Debounced auto-saving',
              checked: true,
            },
            {
              id: 'b7',
              type: 'todo',
              content: 'Organize notes into folders and favorites',
              checked: true,
            },
            {
              id: 'b8',
              type: 'quote',
              content: 'Simplicity is about subtracting the obvious and adding the meaningful.',
            },
            {
              id: 'b9',
              type: 'code',
              content: '// Keyboard Shortcuts\n// Cmd/Ctrl + K -> Quick Search\n// Cmd/Ctrl + S -> Force Save\n// Cmd/Ctrl + Shift + L -> Lock Workspace',
            },
          ],
        };
        docs = [welcomeDoc];
        // Save initial welcome doc to backend
        fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(welcomeDoc),
        });
      }

      setDocuments(docs);
      setFolders(fetchedFolders);
      setFavorites(fetchedFavorites);
      setMetadata({
        favorites: fetchedFavorites,
        recentDocs: data.recentDocs || [],
        folders: fetchedFolders,
        autoSaveInterval: data.autoSaveInterval || 1500,
        theme: data.theme || 'system',
        pinConfigured: true,
        driveConnected: data.driveConnected,
      });

      if (docs.length > 0 && !activeDocId) {
        setActiveDocId(docs[0].id);
      }
    } catch (e) {
      console.error('Error loading workspace:', e);
    }
  }, [activeDocId]);

  useEffect(() => {
    if (isUnlocked) {
      loadWorkspace();
    }
  }, [isUnlocked, loadWorkspace]);

  // Apply Theme (light / dark)
  useEffect(() => {
    const root = document.documentElement;
    if (metadata.theme === 'dark') {
      root.classList.add('dark');
    } else if (metadata.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [metadata.theme]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K -> Open Search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // Cmd/Ctrl + Shift + L -> Lock Workspace
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
        e.preventDefault();
        handleLockWorkspace();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Lock Workspace
  const handleLockWorkspace = async () => {
    try {
      await fetch('/api/auth/lock', { method: 'POST' });
      setIsUnlocked(false);
      setIsMobileMenuOpen(false);
    } catch (e) {
      console.error('Failed to lock:', e);
    }
  };

  // Create New Document
  const handleCreateDocument = (folderId: string | null = null) => {
    const newDoc: NoteDocument = {
      id: 'doc-' + Date.now(),
      title: 'Untitled Document',
      icon: '📝',
      folderId: folderId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blocks: [
        {
          id: 'block-' + Date.now(),
          type: 'paragraph',
          content: '',
        },
      ],
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);

    // Save to local backend
    fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDoc),
    });
  };

  // Create New Folder
  const handleCreateFolder = (name: string) => {
    const newFolder: NoteFolder = {
      id: 'folder-' + Date.now(),
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setFolders((prev) => [...prev, newFolder]);
    fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFolder),
    });
  };

  // Save Document with Debounce
  const saveDocument = useCallback(
    async (docToSave: NoteDocument) => {
      setSaveStatus({ state: 'saving' });

      try {
        // 1. Save to Express server local storage
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(docToSave),
        });

        setSaveStatus({ state: 'saved' });
      } catch (err) {
        console.error('Failed to save document:', err);
        setSaveStatus({ state: 'error', message: 'Save error - retrying...' });
      }
    },
    []
  );

  const handleDocumentChange = (updatedDoc: NoteDocument) => {
    // Update local React state instantly
    setDocuments((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));

    // Clear existing save timeout and trigger debounced auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus({ state: 'saving' });
    saveTimeoutRef.current = setTimeout(() => {
      saveDocument(updatedDoc);
    }, metadata.autoSaveInterval || 1500);
  };

  // Toggle Favorite
  const handleToggleFavorite = (docId: string) => {
    const isFav = favorites.includes(docId);
    const newFavs = isFav ? favorites.filter((id) => id !== docId) : [...favorites, docId];
    setFavorites(newFavs);

    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, isFavorite: !isFav } : d))
    );

    fetch('/api/favorites/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docId }),
    });
  };

  // Trash Document with Confirmation
  const handleDeleteDocumentRequest = (docId: string) => {
    const targetDoc = documents.find((d) => d.id === docId);
    if (!targetDoc) return;

    setConfirmModal({
      isOpen: true,
      title: `Move '${targetDoc.title || 'Untitled'}' to Trash?`,
      message: 'This document will be moved to trash. You can restore it or permanently delete it anytime.',
      onConfirm: () => {
        setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, isTrashed: true } : d)));
        if (activeDocId === docId) {
          const remaining = documents.filter((d) => d.id !== docId && !d.isTrashed);
          setActiveDocId(remaining.length > 0 ? remaining[0].id : null);
        }

        fetch(`/api/documents/${docId}`, { method: 'DELETE' });

        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Theme Application Effect
  useEffect(() => {
    const root = document.documentElement;
    if (metadata.theme === 'dark') {
      root.classList.add('dark');
    } else if (metadata.theme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [metadata.theme]);

  const handleToggleTheme = () => {
    const nextTheme = metadata.theme === 'dark' ? 'light' : 'dark';
    setMetadata((prev) => ({ ...prev, theme: nextTheme }));
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: nextTheme }),
    });
  };

  // Toggle Document Share
  const handleToggleShare = async (docId: string, isShared: boolean): Promise<string | null> => {
    try {
      const res = await fetch(`/api/documents/${docId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isShared }),
      });
      const data = await res.json();
      if (data.success) {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === docId
              ? { ...d, isPublicShared: data.isPublicShared, shareToken: data.shareToken }
              : d
          )
        );
        return data.shareToken;
      }
      return null;
    } catch (e) {
      console.error('Share toggle error:', e);
      return null;
    }
  };

  // Import Document (.md or .json)
  const handleImportDocument = async (file: File) => {
    try {
      const text = await file.text();
      let importedDoc: NoteDocument;

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        if (parsed.title && Array.isArray(parsed.blocks)) {
          importedDoc = {
            ...parsed,
            id: 'doc-' + Date.now(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        } else if (parsed.documents && Array.isArray(parsed.documents)) {
          // Workspace backup import
          setDocuments((prev) => [...parsed.documents, ...prev]);
          if (parsed.documents.length > 0) setActiveDocId(parsed.documents[0].id);
          return;
        } else {
          throw new Error('Invalid JSON note format');
        }
      } else {
        // Parse Markdown text
        const titleFromFileName = file.name.replace(/\.(md|txt)$/i, '');
        const blocks = parseMarkdownToBlocks(text);
        importedDoc = {
          id: 'doc-' + Date.now(),
          title: titleFromFileName || 'Imported Note',
          icon: '📄',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          blocks,
        };
      }

      setDocuments((prev) => [importedDoc, ...prev]);
      setActiveDocId(importedDoc.id);

      fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importedDoc),
      });
    } catch (err) {
      console.error('Import failed:', err);
      alert('Could not parse file. Please upload a valid .md or .json note file.');
    }
  };

  // Export Notes Backup
  const handleExportNotes = () => {
    const exportData = {
      app: 'MyNotes',
      exportedAt: new Date().toISOString(),
      documents,
      folders,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mynotes-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeDoc = documents.find((d) => d.id === activeDocId && !d.isTrashed) || null;
  const activeFolder = activeDoc?.folderId ? folders.find((f) => f.id === activeDoc.folderId) || null : null;

  // Export PDF
  const handleExportPdf = () => {
    if (activeDoc) exportDocumentToPdf(activeDoc);
  };

  // Export Markdown
  const handleExportMarkdown = () => {
    if (!activeDoc) return;
    const md = exportDocumentToMarkdown(activeDoc);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activeDoc.title || 'Note').replace(/[^a-z0-9_-]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render PIN modal if locked or setup needed
  if (isPinSetup === null) {
    return (
      <div className="min-h-screen bg-[#1C1A19] text-[#F9F8F6] flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-[#8C8881]">
          <Sparkles className="w-4 h-4 animate-spin text-[#A3D9A5]" />
          <span>Opening MyNotes...</span>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <PINModal
        isSetupMode={!isPinSetup}
        onSuccess={() => {
          setIsPinSetup(true);
          setIsUnlocked(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] dark:bg-[#1A1918] text-[#2A2826] dark:text-[#F9F8F6] flex flex-col md:flex-row antialiased selection:bg-[#E8E4DF] dark:selection:bg-[#2C2A28]">
      {/* Workspace Sidebar */}
      <Sidebar
        documents={documents}
        folders={folders}
        activeDocId={activeDocId}
        onSelectDoc={(id) => setActiveDocId(id)}
        onCreateDoc={handleCreateDocument}
        onCreateFolder={() => setIsFolderModalOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLock={handleLockWorkspace}
        favorites={favorites}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Workspace Main Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        <Header
          document={activeDoc}
          folder={activeFolder}
          saveStatus={saveStatus}
          theme={metadata.theme}
          onToggleTheme={handleToggleTheme}
          isFavorite={activeDoc ? favorites.includes(activeDoc.id) || Boolean(activeDoc.isFavorite) : false}
          onToggleFavorite={() => activeDoc && handleToggleFavorite(activeDoc.id)}
          onDeleteDocument={() => activeDoc && handleDeleteDocumentRequest(activeDoc.id)}
          onLock={handleLockWorkspace}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenShare={() => setIsShareModalOpen(true)}
          onExportPdf={handleExportPdf}
          onExportMarkdown={handleExportMarkdown}
          onExportJson={handleExportNotes}
          onImportDocument={handleImportDocument}
        />

        {activeDoc ? (
          <Editor
            title={activeDoc.title}
            onTitleChange={(title) => handleDocumentChange({ ...activeDoc, title })}
            blocks={activeDoc.blocks}
            onBlocksChange={(blocks) => handleDocumentChange({ ...activeDoc, blocks })}
            icon={activeDoc.icon || '📝'}
            onIconChange={(icon) => handleDocumentChange({ ...activeDoc, icon })}
            onForceSave={() => saveDocument(activeDoc)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8C8881] my-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#F3F1EE] dark:bg-[#2C2A28] border border-[#E8E4DF] dark:border-[#2C2A28] flex items-center justify-center mb-4 text-2xl">
              📝
            </div>
            <h3 className="text-base font-bold text-[#2A2826] dark:text-[#F9F8F6]">No Document Selected</h3>
            <p className="text-xs text-[#8C8881] max-w-sm mt-1 mb-4">
              Select a document from the workspace sidebar or create a new document to start writing.
            </p>
            <button
              onClick={() => handleCreateDocument(null)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#5A5A40] hover:bg-[#484833] rounded-full transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Document</span>
            </button>
          </div>
        )}
      </main>

      {/* Command & Dialog Modals */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        document={activeDoc}
        onToggleShare={handleToggleShare}
      />

      {/* Command & Dialog Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        documents={documents}
        onSelectDoc={(id) => setActiveDocId(id)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        metadata={metadata}
        onUpdateSettings={(newSettings) => {
          setMetadata((prev) => ({ ...prev, ...newSettings }));
          fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSettings),
          });
        }}
        onExportNotes={handleExportNotes}
      />

      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onCreateFolder={handleCreateFolder}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
