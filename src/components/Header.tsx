import React, { useState } from 'react';
import { NoteDocument, NoteFolder, SaveStatus } from '../types';
import {
  Menu,
  Star,
  Trash2,
  Lock,
  Share2,
  Download,
  Upload,
  FileType,
  FileCode,
  FileText,
  Moon,
  Sun,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  document: NoteDocument | null;
  folder: NoteFolder | null;
  saveStatus: SaveStatus;
  isFavorite: boolean;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
  onToggleFavorite: () => void;
  onDeleteDocument: () => void;
  onLock: () => void;
  onOpenMobileMenu: () => void;
  onOpenShare: () => void;
  onExportPdf: () => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  onImportDocument: (file: File) => void;
}

export const Header: React.FC<HeaderProps> = ({
  document,
  folder,
  saveStatus,
  isFavorite,
  theme,
  onToggleTheme,
  onToggleFavorite,
  onDeleteDocument,
  onLock,
  onOpenMobileMenu,
  onOpenShare,
  onExportPdf,
  onExportMarkdown,
  onExportJson,
  onImportDocument,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <header className="h-14 px-4 sm:px-8 border-b border-[#F3F1EE] dark:border-[#2C2A28] bg-white/90 dark:bg-[#1A1918]/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
      {/* Left: App Logo, Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-3 truncate">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 md:hidden text-[#8C8881] hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28] rounded-lg cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* M Logo Badge */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#5A5A40] text-white font-black text-xs flex items-center justify-center shadow-xs">
            M
          </div>
          <span className="font-extrabold text-sm text-[#2A2826] dark:text-[#F9F8F6] hidden sm:inline tracking-tight">
            MyNotes
          </span>
        </div>

        {document && (
          <div className="flex items-center gap-2 text-sm truncate pl-2 border-l border-[#E8E4DF] dark:border-[#2C2A28]">
            {folder ? (
              <>
                <span className="text-[#8C8881] hover:text-[#5A5A40] flex items-center gap-1">
                  <span>📁</span>
                  <span>{folder.name}</span>
                </span>
                <span className="text-[#C4C0B9]">/</span>
              </>
            ) : (
              <>
                <span className="text-[#8C8881] hidden sm:inline">Workspace</span>
                <span className="text-[#C4C0B9] hidden sm:inline">/</span>
              </>
            )}
            <span className="font-semibold text-[#33302E] dark:text-[#F9F8F6] truncate">
              {document.title || 'Untitled'}
            </span>
          </div>
        )}
      </div>

      {/* Right: Save Status, Import, Export, Share, Lock, Theme */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Save Status Badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#8C8881]">
          {saveStatus.state === 'saving' && (
            <>
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus.state === 'saved' && (
            <>
              <div className="w-2 h-2 rounded-full bg-[#A3D9A5]" />
              <span>Saved to server</span>
            </>
          )}
          {saveStatus.state === 'offline' && (
            <>
              <div className="w-2 h-2 rounded-full bg-[#C4C0B9]" />
              <span>Saved locally</span>
            </>
          )}
        </div>

        {document && (
          <div className="flex items-center gap-1">
            {/* Share / QR Button */}
            <button
              onClick={onOpenShare}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#5A5A40] hover:bg-[#484833] rounded-full transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Share document & QR code"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-2.5 py-1.5 text-xs font-medium text-[#2A2826] dark:text-[#F9F8F6] bg-[#F3F1EE] dark:bg-[#2C2A28] hover:bg-[#E8E4DF] rounded-full transition flex items-center gap-1 cursor-pointer"
                title="Export or download document"
              >
                <Download className="w-3.5 h-3.5" />
                <ChevronDown className="w-3 h-3" />
              </button>

              {showExportMenu && (
                <div
                  onClick={() => setShowExportMenu(false)}
                  className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1C1A19] border border-[#E8E4DF] dark:border-[#2C2A28] rounded-2xl shadow-xl py-1.5 text-xs z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    onClick={onExportPdf}
                    className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28] text-[#2A2826] dark:text-[#F9F8F6] cursor-pointer"
                  >
                    <FileType className="w-4 h-4 text-rose-500" />
                    <span>Export PDF Document</span>
                  </button>
                  <button
                    onClick={onExportMarkdown}
                    className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28] text-[#2A2826] dark:text-[#F9F8F6] cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-blue-500" />
                    <span>Download Markdown (.md)</span>
                  </button>
                  <button
                    onClick={onExportJson}
                    className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28] text-[#2A2826] dark:text-[#F9F8F6] cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-[#5A5A40]" />
                    <span>Download Backup (.json)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Favorite Star */}
            <button
              onClick={onToggleFavorite}
              className={`p-1.5 rounded-full transition cursor-pointer ${
                isFavorite
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                  : 'text-[#8C8881] hover:text-[#33302E] dark:hover:text-[#F9F8F6] hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28]'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-500' : ''}`} />
            </button>

            {/* Trash Document */}
            <button
              onClick={onDeleteDocument}
              className="p-1.5 text-[#8C8881] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition cursor-pointer"
              title="Move document to trash"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Import Document File Picker */}
        <label
          className="p-1.5 text-[#8C8881] hover:text-[#33302E] dark:hover:text-[#F9F8F6] hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28] rounded-full transition cursor-pointer"
          title="Import document (.md or .json)"
        >
          <Upload className="w-4 h-4" />
          <input
            type="file"
            accept=".json,.md,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportDocument(file);
            }}
          />
        </label>

        {/* Dual Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 text-[#8C8881] hover:text-[#33302E] dark:hover:text-[#F9F8F6] hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28] rounded-full transition cursor-pointer"
          title={`Current theme: ${theme}. Click to switch.`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Lock Workspace */}
        <button
          onClick={onLock}
          className="p-1.5 text-[#8C8881] hover:text-[#33302E] dark:hover:text-[#F9F8F6] hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28] rounded-full transition cursor-pointer"
          title="Lock workspace"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
