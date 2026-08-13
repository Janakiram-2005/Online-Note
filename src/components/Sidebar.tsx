import React, { useState } from 'react';
import { NoteDocument, NoteFolder } from '../types';
import {
  FileText,
  Folder,
  FolderPlus,
  Plus,
  Search,
  Star,
  Clock,
  Trash2,
  Lock,
  Settings,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Cloud,
  CloudOff,
  Menu,
  X,
  HardDrive,
} from 'lucide-react';

interface SidebarProps {
  documents: NoteDocument[];
  folders: NoteFolder[];
  activeDocId: string | null;
  onSelectDoc: (id: string) => void;
  onCreateDoc: (folderId?: string | null) => void;
  onCreateFolder: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onLock: () => void;
  favorites: string[];
  driveConnected: boolean;
  driveUserEmail?: string | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  documents,
  folders,
  activeDocId,
  onSelectDoc,
  onCreateDoc,
  onCreateFolder,
  onOpenSearch,
  onOpenSettings,
  onLock,
  favorites,
  driveConnected,
  driveUserEmail,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const activeDocs = documents.filter((d) => !d.isTrashed);
  const favoriteDocs = activeDocs.filter((d) => favorites.includes(d.id) || d.isFavorite);
  const recentDocs = [...activeDocs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
  const rootDocs = activeDocs.filter((d) => !d.folderId);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#F3F1EE] dark:bg-[#1A1918] border-r border-[#E8E4DF] dark:border-[#2C2A28] flex flex-col justify-between transition-transform duration-200 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div>
          <div className="p-4 border-b border-[#E8E4DF] dark:border-[#2C2A28] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#5A5A40] text-white flex items-center justify-center font-bold text-base shadow-xs">
                M
              </div>
              <div>
                <div className="font-semibold text-base text-[#33302E] dark:text-[#F9F8F6] tracking-tight">MyNotes</div>
                <div className="text-[11px] text-[#8C8881] dark:text-[#A39F98] flex items-center gap-1">
                  {driveConnected ? (
                    <>
                      <Cloud className="w-3 h-3 text-[#5A5A40]" />
                      <span className="truncate max-w-[110px]">{driveUserEmail || 'Google Drive'}</span>
                    </>
                  ) : (
                    <>
                      <CloudOff className="w-3 h-3 text-[#8C8881]" />
                      <span>Local Workspace</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="p-1 md:hidden text-[#8C8881] hover:text-[#33302E] dark:hover:text-[#F9F8F6]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="p-3 space-y-2">
            <button
              onClick={onOpenSearch}
              className="w-full px-3 py-1.5 flex items-center justify-between text-xs font-medium text-[#706C64] dark:text-[#A39F98] hover:bg-[#E8E4DF] dark:hover:bg-[#2C2A28] rounded-lg transition"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#8C8881]" />
                <span>Search</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[#E8E4DF] dark:bg-[#2C2A28] border border-[#DED9D2] dark:border-[#383432] rounded text-[#706C64] dark:text-[#A39F98]">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={() => onCreateDoc(null)}
              className="w-full px-3 py-2 flex items-center justify-center gap-2 text-xs font-medium text-white bg-[#5A5A40] hover:bg-[#484833] rounded-full shadow-2xs transition"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ New Page</span>
            </button>
          </div>

          {/* Main Navigation Sections */}
          <div className="px-3 py-2 overflow-y-auto max-h-[calc(100vh-230px)] space-y-5">
            {/* Favorites Section */}
            {favoriteDocs.length > 0 && (
              <div>
                <div className="px-2 mb-1.5 text-[11px] font-bold text-[#8C8881] dark:text-[#8C8881] uppercase tracking-wider flex items-center gap-1">
                  <span>⭐ Favorites</span>
                </div>
                <div className="space-y-1">
                  {favoriteDocs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        onSelectDoc(doc.id);
                        onCloseMobile();
                      }}
                      className={`w-full px-2 py-1.5 flex items-center gap-2 text-sm rounded-md transition truncate ${
                        activeDocId === doc.id
                          ? 'bg-[#E8E4DF] dark:bg-[#2C2A28] text-[#33302E] dark:text-[#F9F8F6] font-medium'
                          : 'text-[#4A4744] dark:text-[#D1CDC7] hover:bg-[#E8E4DF] dark:hover:bg-[#2C2A28]'
                      }`}
                    >
                      <span className="text-sm shrink-0">{doc.icon || '📝'}</span>
                      <span className="truncate">{doc.title || 'Untitled'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Folders & Documents Hierarchy */}
            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between text-[11px] font-bold text-[#8C8881] dark:text-[#8C8881] uppercase tracking-wider">
                <span>Folders</span>
                <button
                  onClick={onCreateFolder}
                  className="hover:text-[#5A5A40] transition p-0.5"
                  title="New Folder"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Folders */}
              <div className="space-y-1">
                {folders.map((folder) => {
                  const folderDocs = activeDocs.filter((d) => d.folderId === folder.id);
                  const isExpanded = expandedFolders[folder.id];

                  return (
                    <div key={folder.id}>
                      <div
                        className="w-full px-2 py-1.5 flex items-center justify-between text-sm text-[#4A4744] dark:text-[#D1CDC7] hover:bg-[#E8E4DF] dark:hover:bg-[#2C2A28] rounded-md transition group cursor-pointer"
                      >
                        <div
                          onClick={() => toggleFolder(folder.id)}
                          className="flex items-center gap-2 flex-1 truncate"
                        >
                          <span>📁</span>
                          <span className="truncate">{folder.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] bg-[#DED9D2] dark:bg-[#383432] px-1.5 rounded text-[#706C64] dark:text-[#A39F98] font-mono">
                            {folderDocs.length}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateDoc(folder.id);
                            }}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[#DED9D2] dark:hover:bg-[#383432] rounded transition"
                            title="Add doc to folder"
                          >
                            <Plus className="w-3 h-3 text-[#5A5A40]" />
                          </button>
                        </div>
                      </div>

                      {/* Folder Child Docs */}
                      {isExpanded && (
                        <div className="ml-4 pl-2 border-l border-[#E8E4DF] dark:border-[#2C2A28] space-y-1 my-1">
                          {folderDocs.length === 0 ? (
                            <div className="px-2 py-1 text-[11px] text-[#8C8881] italic">Empty folder</div>
                          ) : (
                            folderDocs.map((doc) => (
                              <button
                                key={doc.id}
                                onClick={() => {
                                  onSelectDoc(doc.id);
                                  onCloseMobile();
                                }}
                                className={`w-full px-2 py-1 flex items-center gap-2 text-xs rounded-md transition truncate ${
                                  activeDocId === doc.id
                                    ? 'bg-[#E8E4DF] dark:bg-[#2C2A28] text-[#33302E] dark:text-[#F9F8F6] font-medium'
                                    : 'text-[#706C64] dark:text-[#A39F98] hover:bg-[#E8E4DF] dark:hover:bg-[#2C2A28]'
                                }`}
                              >
                                <span className="text-xs shrink-0">{doc.icon || '📝'}</span>
                                <span className="truncate">{doc.title || 'Untitled'}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Root Uncategorized Docs */}
                {rootDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      onSelectDoc(doc.id);
                      onCloseMobile();
                    }}
                    className={`w-full px-2 py-1.5 flex items-center gap-2 text-sm rounded-md transition truncate ${
                      activeDocId === doc.id
                        ? 'bg-[#E8E4DF] dark:bg-[#2C2A28] text-[#33302E] dark:text-[#F9F8F6] font-medium'
                        : 'text-[#4A4744] dark:text-[#D1CDC7] hover:bg-[#E8E4DF] dark:hover:bg-[#2C2A28]'
                    }`}
                  >
                    <span className="text-sm shrink-0">{doc.icon || '📝'}</span>
                    <span className="truncate">{doc.title || 'Untitled'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-[#E8E4DF] dark:border-[#2C2A28] space-y-1">
          <button
            onClick={onOpenSettings}
            className="w-full px-2 py-2 flex items-center gap-3 text-sm text-[#706C64] hover:text-[#33302E] dark:text-[#A39F98] dark:hover:text-[#F9F8F6] hover:bg-[#E8E4DF] dark:hover:bg-[#2C2A28] rounded-md transition cursor-pointer"
          >
            <Settings className="w-4 h-4 text-[#8C8881]" />
            <span>Settings</span>
          </button>

          <button
            onClick={onLock}
            className="w-full px-2 py-2 flex items-center gap-3 text-sm text-[#706C64] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-[#E8E4DF] dark:hover:bg-[#2C2A28] rounded-md transition cursor-pointer"
          >
            <Lock className="w-4 h-4 text-[#8C8881]" />
            <span>Lock Workspace</span>
          </button>
        </div>
      </aside>
    </>
  );
};
