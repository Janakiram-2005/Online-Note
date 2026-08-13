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
import { initDriveWorkspace, saveDocToDrive, loadDocsFromDrive, trashDocInDrive, restoreDocInDrive } from './lib/drive';
import { Plus, FileText, Lock, Sparkles, Cloud, ShieldAlert } from 'lucide-react';

export default function App() {
  // Auth & Workspace Lock State
  const [isPinSetup, setIsPinSetup] = useState<boolean | null>(null);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [driveConnected, setDriveConnected] = useState<boolean>(false);
  const [driveUserEmail, setDriveUserEmail] = useState<string | null>(null);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const [driveConfig, setDriveConfig] = useState<{ rootFolderId: string; docsFolderId: string } | null>(null);

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
    theme: 'system',
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

  // Check PIN status on app launch
  const checkPinStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/pin-status');
      const data = await res.json();
      setIsPinSetup(data.isSetup);
      setIsUnlocked(data.isUnlocked);
      setDriveConnected(data.driveConnected);
      setDriveUserEmail(data.driveUserEmail);
    } catch (e) {
      console.error('Failed to check PIN status:', e);
      setIsPinSetup(false);
      setIsUnlocked(false);
    }
  }, []);

  useEffect(() => {
    checkPinStatus();
  }, [checkPinStatus]);

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

        // 2. If Google Drive is authorized, sync to Drive
        if (driveAccessToken && driveConfig) {
          try {
            const fileId = await saveDocToDrive(driveAccessToken, docToSave, driveConfig.docsFolderId);
            docToSave.driveFileId = fileId;
          } catch (driveErr) {
            console.warn('Drive sync warning:', driveErr);
            setSaveStatus({ state: 'offline', message: 'Saved locally (Drive sync pending)' });
            return;
          }
        }

        setSaveStatus({ state: 'saved' });
      } catch (err) {
        console.error('Failed to save document:', err);
        setSaveStatus({ state: 'error', message: 'Save error - retrying...' });
      }
    },
    [driveAccessToken, driveConfig]
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

        if (driveAccessToken && targetDoc.driveFileId) {
          trashDocInDrive(driveAccessToken, targetDoc.driveFileId).catch((err) =>
            console.warn('Drive trash error:', err)
          );
        }

        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
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
        driveConnected={driveConnected}
        driveUserEmail={driveUserEmail}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Workspace Main Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        <Header
          document={activeDoc}
          folder={activeFolder}
          saveStatus={saveStatus}
          isFavorite={activeDoc ? favorites.includes(activeDoc.id) || Boolean(activeDoc.isFavorite) : false}
          onToggleFavorite={() => activeDoc && handleToggleFavorite(activeDoc.id)}
          onDeleteDocument={() => activeDoc && handleDeleteDocumentRequest(activeDoc.id)}
          onLock={handleLockWorkspace}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
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
        driveConnected={driveConnected}
        driveUserEmail={driveUserEmail}
        onConnectDrive={() => {
          setIsSettingsOpen(false);
          alert('Google Drive OAuth authorization flow can be initialized using your Google account credentials.');
        }}
        onExportNotes={handleExportNotes}
        onSyncDrive={() => {
          loadWorkspace();
        }}
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
