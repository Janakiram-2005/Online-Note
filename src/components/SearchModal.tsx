import React, { useState, useEffect, useRef } from 'react';
import { NoteDocument } from '../types';
import { Search, FileText, X, ArrowRight, CornerDownLeft } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: NoteDocument[];
  onSelectDoc: (id: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  documents,
  onSelectDoc,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeDocs = documents.filter((d) => !d.isTrashed);

  const filtered = activeDocs.filter((doc) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const titleMatch = doc.title.toLowerCase().includes(q);
    const blockMatch = doc.blocks.some((b) => b.content.toLowerCase().includes(q));
    return titleMatch || blockMatch;
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filtered[selectedIndex];
      if (target) {
        onSelectDoc(target.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2A2826]/60 backdrop-blur-xs flex items-start justify-center pt-16 px-4">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-[#1C1A19] border border-[#E8E4DF] dark:border-[#2C2A28] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search Bar */}
        <div className="p-3 border-b border-[#F3F1EE] dark:border-[#2C2A28] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#8C8881] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search documents and notes..."
            className="w-full bg-transparent border-none outline-none text-sm text-[#2A2826] dark:text-[#F9F8F6] placeholder:text-[#C4C0B9]"
          />
          <button
            onClick={onClose}
            className="p-1 text-[#8C8881] hover:text-[#2A2826] dark:hover:text-[#F9F8F6] rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8C8881]">
              No matching documents found for "{query}"
            </div>
          ) : (
            filtered.map((doc, idx) => {
              const isSelected = idx === selectedIndex;
              const matchingBlock = doc.blocks.find(
                (b) => query.trim() && b.content.toLowerCase().includes(query.toLowerCase())
              );

              return (
                <button
                  key={doc.id}
                  onClick={() => {
                    onSelectDoc(doc.id);
                    onClose();
                  }}
                  className={`w-full px-3 py-2.5 text-left flex items-start justify-between rounded-xl transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#F3F1EE] dark:bg-[#2C2A28] text-[#2A2826] dark:text-[#F9F8F6] font-medium'
                      : 'text-[#4A4744] dark:text-[#D1CDC7] hover:bg-[#F9F8F6] dark:hover:bg-[#2C2A28]/50'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-base shrink-0 mt-0.5">{doc.icon || '📝'}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#2A2826] dark:text-[#F9F8F6] truncate">
                        {doc.title || 'Untitled'}
                      </div>
                      {matchingBlock && (
                        <div className="text-[11px] text-[#8C8881] truncate mt-0.5">
                          "{matchingBlock.content}"
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <CornerDownLeft className="w-4 h-4 text-[#8C8881] shrink-0 mt-1" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-3 py-2 bg-[#F9F8F6] dark:bg-[#1A1918] border-t border-[#F3F1EE] dark:border-[#2C2A28] flex items-center justify-between text-[11px] text-[#8C8881]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 bg-white dark:bg-[#2C2A28] border border-[#E8E4DF] rounded">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-white dark:bg-[#2C2A28] border border-[#E8E4DF] rounded">↵</kbd> Select
            </span>
          </div>
          <span>
            <kbd className="px-1 py-0.5 bg-white dark:bg-[#2C2A28] border border-[#E8E4DF] rounded">ESC</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
};
