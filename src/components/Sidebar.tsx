import React, { useState } from 'react';
import { NoteDocument, NoteFolder } from '../types';
import { exportFolderToZip } from '../utils/zip';
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
  MoreVertical,
  Download,
  Edit2,
  Info,
} from 'lucide-react';

interface SidebarProps {
  documents: NoteDocument[];
  folders: NoteFolder[];
  activeDocId: string | null;
  onSelectDoc: (id: string) => void;
  onCreateDoc: (folderId?: string | null) => void;
  onDeleteDoc?: (id: string) => void;
  onCreateFolder: () => void;
  onRenameFolder?: (id: string, newName: string) => void;
  onDeleteFolder?: (id: string) => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onLock: () => void;
  favorites: string[];
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isDesktopSidebarOpen?: boolean;
  onToggleDesktopSidebar?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  documents,
  folders,
  activeDocId,
  onSelectDoc,
  onCreateDoc,
  onDeleteDoc,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onOpenSearch,
  onOpenSettings,
  onLock,
  favorites,
  isOpenMobile,
  onCloseMobile,
  isDesktopSidebarOpen = true,
  onToggleDesktopSidebar,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [activeFolderMenu, setActiveFolderMenu] = useState<string | null>(null);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const activeDocs = documents.filter((d) => !d.isTrashed);
  const favoriteDocs = activeDocs.filter((d) => favorites.includes(d.id) || d.isFavorite);
  const recentDocs = [...activeDocs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
  const rootDocs = activeDocs.filter((d) => !d.folderId);

  const handleFolderAction = (e: React.MouseEvent, folder: NoteFolder, action: string) => {
    e.stopPropagation();
    setActiveFolderMenu(null);
    if (action === 'zip') {
      exportFolderToZip(folder, documents);
    } else if (action === 'rename' && onRenameFolder) {
      const newName = prompt('Enter new folder name:', folder.name);
      if (newName && newName.trim()) {
        onRenameFolder(folder.id, newName.trim());
      }
    } else if (action === 'delete' && onDeleteFolder) {
      if (confirm(`Are you sure you want to delete the folder "${folder.name}"? Documents inside will be moved to root.`)) {
        onDeleteFolder(folder.id);
      }
    } else if (action === 'properties') {
      const folderDocs = documents.filter((d) => d.folderId === folder.id && !d.isTrashed);
      const createdAt = new Date(folder.createdAt).toLocaleString();
      alert(`Folder Properties:\n\nName: ${folder.name}\nDocuments: ${folderDocs.length}\nCreated: ${createdAt}`);
    }
  };

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
        className={`fixed md:static inset-y-0 left-0 z-50 bg-[#F3F1EE] dark:bg-[#1A1918] border-r border-[#E8E4DF] dark:border-[#2C2A28] flex flex-col justify-between transition-all duration-300 ${
          isOpenMobile ? 'translate-x-0 w-64' : (isDesktopSidebarOpen ? 'w-64 -translate-x-full md:translate-x-0' : 'w-0 -translate-x-full overflow-hidden opacity-0 border-r-0')
        }`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-[#E8E4DF] dark:border-[#2C2A28] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5A5A40] text-white flex items-center justify-center font-bold text-base shadow-xs">
                M
              </div>
              <div>
                <div className="font-semibold text-base text-[#33302E] dark:text-[#F9F8F6] tracking-tight">MyNotes</div>
                <div className="text-[11px] text-[#8C8881] dark:text-[#A39F98] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#A3D9A5]" />
                  <span>Server Storage Active</span>
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
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
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
                        className="w-full px-2 py-1.5 flex items-center justify-between text-sm text-[#4A4744] dark:text-[#D1CDC7] hover:bg-[#E8E4DF] dark:hover:bg-[#2C2A28] rounded-md transition group cursor-pointer relative"
                      >
                        <div
                          onClick={() => toggleFolder(folder.id)}
                          className="flex items-center gap-2 flex-1 truncate"
                        >
                          <span>📁</span>
                          <span className="truncate">{folder.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] bg-[#DED9D2] dark:bg-[#383432] px-1.5 rounded text-[#706C64] dark:text-[#A39F98] font-mono group-hover:hidden">
                            {folderDocs.length}
                          </span>
                          
                          <div className="hidden group-hover:flex items-center gap-0.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCreateDoc(folder.id);
                              }}
                              className="p-1 hover:bg-[#DED9D2] dark:hover:bg-[#383432] rounded transition"
                              title="Add doc to folder"
                            >
                              <Plus className="w-3 h-3 text-[#5A5A40]" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFolderMenu(activeFolderMenu === folder.id ? null : folder.id);
                              }}
                              className="p-1 hover:bg-[#DED9D2] dark:hover:bg-[#383432] rounded transition"
                            >
                              <MoreVertical className="w-3 h-3 text-[#5A5A40]" />
                            </button>
                          </div>
                        </div>

                        {activeFolderMenu === folder.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#1C1A19] border border-[#E8E4DF] dark:border-[#2C2A28] rounded-xl shadow-lg z-50 py-1 text-xs">
                            <button
                              onClick={(e) => handleFolderAction(e, folder, 'zip')}
                              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28] text-[#4A4744] dark:text-[#D1CDC7]"
                            >
                              <Download className="w-3.5 h-3.5" /> Download Zip
                            </button>
                            <button
                              onClick={(e) => handleFolderAction(e, folder, 'rename')}
                              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28] text-[#4A4744] dark:text-[#D1CDC7]"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Rename
                            </button>
                            <button
                              onClick={(e) => handleFolderAction(e, folder, 'properties')}
                              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28] text-[#4A4744] dark:text-[#D1CDC7]"
                            >
                              <Info className="w-3.5 h-3.5" /> Properties
                            </button>
                            <div className="my-1 border-t border-[#F3F1EE] dark:border-[#2C2A28]" />
                            <button
                              onClick={(e) => handleFolderAction(e, folder, 'delete')}
                              className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Folder Child Docs */}
                      {isExpanded && (
                        <div className="ml-4 pl-2 border-l border-[#E8E4DF] dark:border-[#2C2A28] space-y-1 my-1">
                          {folderDocs.length === 0 ? (
                            <div className="px-2 py-1 text-[11px] text-[#8C8881] italic">Empty folder</div>
                          ) : (
                            folderDocs.map((doc) => (
                              <div key={doc.id} className="group relative flex items-center">
                                <button
                                  onClick={() => {
                                    onSelectDoc(doc.id);
                                    onCloseMobile();
                                  }}
                                  className={`flex-1 min-w-0 px-2 py-1 flex items-center gap-2 text-xs rounded-md transition truncate pr-6 ${
                                    activeDocId === doc.id
                                      ? 'bg-[#E8E4DF] dark:bg-[#2C2A28] text-[#33302E] dark:text-[#F9F8F6] font-medium'
                                      : 'text-[#706C64] dark:text-[#A39F98] hover:bg-[#E8E4DF] dark:hover:bg-[#2C2A28]'
                                  }`}
                                >
                                  <span className="text-xs shrink-0">{doc.icon || '📝'}</span>
                                  <span className="truncate">{doc.title || 'Untitled'}</span>
                                </button>
                                {onDeleteDoc && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteDoc(doc.id);
                                    }}
                                    className="absolute right-1 p-1 opacity-0 group-hover:opacity-100 hover:bg-[#DED9D2] dark:hover:bg-[#383432] rounded transition text-[#8C8881] hover:text-rose-500"
                                    title="Move to Trash"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Root Uncategorized Docs */}
                {rootDocs.map((doc) => (
                  <div key={doc.id} className="group relative flex items-center">
                    <button
                      onClick={() => {
                        onSelectDoc(doc.id);
                        onCloseMobile();
                      }}
                      className={`flex-1 min-w-0 px-2 py-1.5 flex items-center gap-2 text-sm rounded-md transition truncate pr-6 ${
                        activeDocId === doc.id
                          ? 'bg-[#E8E4DF] dark:bg-[#2C2A28] text-[#33302E] dark:text-[#F9F8F6] font-medium'
                          : 'text-[#4A4744] dark:text-[#D1CDC7] hover:bg-[#E8E4DF] dark:hover:bg-[#2C2A28]'
                      }`}
                    >
                      <span className="text-sm shrink-0">{doc.icon || '📝'}</span>
                      <span className="truncate">{doc.title || 'Untitled'}</span>
                    </button>
                    {onDeleteDoc && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDoc(doc.id);
                        }}
                        className="absolute right-1 p-1 opacity-0 group-hover:opacity-100 hover:bg-[#DED9D2] dark:hover:bg-[#383432] rounded transition text-[#8C8881] hover:text-rose-500"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
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
