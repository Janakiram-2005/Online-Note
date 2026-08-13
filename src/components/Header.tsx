import React from 'react';
import { NoteDocument, NoteFolder, SaveStatus } from '../types';
import {
  Menu,
  Star,
  Trash2,
  Lock,
  Cloud,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  WifiOff,
  Folder,
} from 'lucide-react';

interface HeaderProps {
  document: NoteDocument | null;
  folder: NoteFolder | null;
  saveStatus: SaveStatus;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onDeleteDocument: () => void;
  onLock: () => void;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  document,
  folder,
  saveStatus,
  isFavorite,
  onToggleFavorite,
  onDeleteDocument,
  onLock,
  onOpenMobileMenu,
}) => {
  return (
    <header className="h-14 px-4 sm:px-8 border-b border-[#F3F1EE] dark:border-[#2C2A28] bg-white/90 dark:bg-[#1A1918]/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-3 truncate">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 md:hidden text-[#8C8881] hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28] rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        {document && (
          <div className="flex items-center gap-2 text-sm truncate">
            {folder ? (
              <>
                <span className="text-[#8C8881] hover:text-[#5A5A40] cursor-pointer flex items-center gap-1">
                  <span>📁</span>
                  <span>{folder.name}</span>
                </span>
                <span className="text-[#C4C0B9]">/</span>
              </>
            ) : (
              <>
                <span className="text-[#8C8881] hover:text-[#5A5A40] cursor-pointer hidden sm:inline">Workspace</span>
                <span className="text-[#C4C0B9] hidden sm:inline">/</span>
              </>
            )}
            <span className="font-medium text-[#33302E] dark:text-[#F9F8F6] truncate">
              {document.title || 'Untitled'}
            </span>
          </div>
        )}
      </div>

      {/* Right: Save Status & Quick Actions */}
      <div className="flex items-center gap-4">
        {/* Save Status Badge */}
        <div className="flex items-center gap-1.5 text-xs text-[#8C8881]">
          {saveStatus.state === 'saving' && (
            <>
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus.state === 'saved' && (
            <>
              <div className="w-2 h-2 rounded-full bg-[#A3D9A5]" />
              <span>Saved to Drive</span>
            </>
          )}
          {saveStatus.state === 'offline' && (
            <>
              <div className="w-2 h-2 rounded-full bg-[#C4C0B9]" />
              <span>Saved locally</span>
            </>
          )}
          {saveStatus.state === 'error' && (
            <>
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Sync error</span>
            </>
          )}
        </div>

        {document && (
          <div className="flex items-center gap-1">
            {/* Favorite Star */}
            <button
              onClick={onToggleFavorite}
              className={`p-1.5 rounded-full transition ${
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
              className="p-1.5 text-[#8C8881] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition"
              title="Move document to trash"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Lock Workspace */}
        <button
          onClick={onLock}
          className="p-1.5 text-[#8C8881] hover:text-[#33302E] dark:hover:text-[#F9F8F6] hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28] rounded-full transition"
          title="Lock workspace"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
