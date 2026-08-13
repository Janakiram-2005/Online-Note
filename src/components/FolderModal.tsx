import React, { useState } from 'react';
import { Folder, X } from 'lucide-react';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string) => void;
}

export const FolderModal: React.FC<FolderModalProps> = ({ isOpen, onClose, onCreateFolder }) => {
  const [folderName, setFolderName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreateFolder(folderName.trim());
      setFolderName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2A2826]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-[#1C1A19] border border-[#E8E4DF] dark:border-[#2C2A28] rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between border-b border-[#F3F1EE] dark:border-[#2C2A28] pb-3">
          <h3 className="text-base font-bold text-[#2A2826] dark:text-[#F9F8F6] flex items-center gap-2">
            <Folder className="w-5 h-5 text-[#5A5A40]" />
            <span>New Folder</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-[#8C8881] hover:text-[#2A2826] dark:hover:text-[#F9F8F6] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#4A4744] dark:text-[#D1CDC7] mb-1">
              Folder Name
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. Projects, Personal, Ideas"
              autoFocus
              className="w-full px-3.5 py-2.5 text-sm bg-[#F9F8F6] dark:bg-[#1A1918] border border-[#E8E4DF] dark:border-[#2C2A28] rounded-xl text-[#2A2826] dark:text-[#F9F8F6] outline-none focus:border-[#5A5A40]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#706C64] dark:text-[#D1CDC7] hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28] rounded-full transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!folderName.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#5A5A40] hover:bg-[#484833] rounded-full transition disabled:opacity-50 cursor-pointer"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
