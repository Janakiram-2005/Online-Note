import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NoteBlock, BlockType } from '../types';
import {
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  GripVertical,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Plus,
  Bold,
  Italic,
  Strikethrough,
  Code2,
  Image as ImageIcon,
  Table as TableIcon,
  MessageSquareQuote,
  Upload,
  Link,
  Check,
  PlusCircle,
  Trash,
} from 'lucide-react';

interface EditorProps {
  title: string;
  onTitleChange: (title: string) => void;
  blocks: NoteBlock[];
  onBlocksChange: (blocks: NoteBlock[]) => void;
  icon?: string;
  onIconChange?: (icon: string) => void;
  readOnly?: boolean;
  onForceSave?: () => void;
}

const EMOJI_PRESETS = ['📝', '💡', '🚀', '⭐', '📚', '🎯', '🔥', '💻', '🎨', '⚙️', '📌', '🧠', '💼', '📊', '🌐', '🔮'];
const CALLOUT_EMOJIS = ['💡', '⚠️', 'ℹ️', '🔥', '📌', '🚀', '⭐', '✅', '❤️', '🎯'];

const BLOCK_MENU_ITEMS: { type: BlockType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: 'paragraph', label: 'Text', icon: <Type className="w-4 h-4" />, desc: 'Just start writing with plain text.' },
  { type: 'heading1', label: 'Heading 1', icon: <Heading1 className="w-4 h-4" />, desc: 'Large section heading.' },
  { type: 'heading2', label: 'Heading 2', icon: <Heading2 className="w-4 h-4" />, desc: 'Medium section heading.' },
  { type: 'heading3', label: 'Heading 3', icon: <Heading3 className="w-4 h-4" />, desc: 'Small section heading.' },
  { type: 'todo', label: 'To-do list', icon: <CheckSquare className="w-4 h-4" />, desc: 'Track tasks with a checkable box.' },
  { type: 'bullet', label: 'Bulleted list', icon: <List className="w-4 h-4" />, desc: 'Create a simple bulleted list.' },
  { type: 'numbered', label: 'Numbered list', icon: <ListOrdered className="w-4 h-4" />, desc: 'Create a list with numbers.' },
  { type: 'quote', label: 'Quote', icon: <Quote className="w-4 h-4" />, desc: 'Capture a quote or highlight.' },
  { type: 'callout', label: 'Callout', icon: <MessageSquareQuote className="w-4 h-4" />, desc: 'Highlighted box with icon.' },
  { type: 'image', label: 'Image', icon: <ImageIcon className="w-4 h-4" />, desc: 'Upload or embed image.' },
  { type: 'table', label: 'Table', icon: <TableIcon className="w-4 h-4" />, desc: 'Add a grid table.' },
  { type: 'code', label: 'Code', icon: <Code className="w-4 h-4" />, desc: 'Capture code snippet with syntax styling.' },
  { type: 'divider', label: 'Divider', icon: <Minus className="w-4 h-4" />, desc: 'Visually divide sections with a line.' },
];

export const Editor: React.FC<EditorProps> = ({
  title,
  onTitleChange,
  blocks,
  onBlocksChange,
  icon = '📝',
  onIconChange,
  readOnly = false,
  onForceSave,
}) => {
  const [slashMenuIndex, setSlashMenuIndex] = useState<number | null>(null);
  const [slashFilter, setSlashFilter] = useState('');
  const [slashMenuPos, setSlashMenuPos] = useState<number>(0);
  const [activeHoverBlock, setActiveHoverBlock] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [blockMenuOpen, setBlockMenuOpen] = useState<string | null>(null);

  const blockRefs = useRef<{ [id: string]: HTMLTextAreaElement | HTMLInputElement | null }>({});

  // Ensure there's always at least one block
  useEffect(() => {
    if (blocks.length === 0) {
      onBlocksChange([
        {
          id: 'block-' + Date.now(),
          type: 'paragraph',
          content: '',
        },
      ]);
    }
  }, [blocks, onBlocksChange]);

  const updateBlock = useCallback(
    (id: string, newFields: Partial<NoteBlock>) => {
      const newBlocks = blocks.map((b) => (b.id === id ? { ...b, ...newFields } : b));
      onBlocksChange(newBlocks);
    },
    [blocks, onBlocksChange]
  );

  const addBlock = useCallback(
    (afterId: string, type: BlockType = 'paragraph', content: string = '') => {
      const newId = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      const newBlock: NoteBlock = { id: newId, type, content };

      const index = blocks.findIndex((b) => b.id === afterId);
      let newBlocks: NoteBlock[];
      if (index === -1) {
        newBlocks = [...blocks, newBlock];
      } else {
        newBlocks = [...blocks.slice(0, index + 1), newBlock, ...blocks.slice(index + 1)];
      }

      onBlocksChange(newBlocks);

      // Focus new block on next tick
      setTimeout(() => {
        const el = blockRefs.current[newId];
        if (el) el.focus();
      }, 50);
    },
    [blocks, onBlocksChange]
  );

  const removeBlock = useCallback(
    (id: string) => {
      if (blocks.length <= 1) {
        // Just clear the single block content
        updateBlock(id, { content: '', type: 'paragraph', checked: false });
        return;
      }

      const index = blocks.findIndex((b) => b.id === id);
      const prevBlock = blocks[index - 1] || blocks[index + 1];

      const newBlocks = blocks.filter((b) => b.id !== id);
      onBlocksChange(newBlocks);

      if (prevBlock) {
        setTimeout(() => {
          const el = blockRefs.current[prevBlock.id];
          if (el) {
            el.focus();
            if ('setSelectionRange' in el && el.value) {
              el.setSelectionRange(el.value.length, el.value.length);
            }
          }
        }, 50);
      }
    },
    [blocks, onBlocksChange, updateBlock]
  );

  const duplicateBlock = (id: string) => {
    const target = blocks.find((b) => b.id === id);
    if (!target) return;
    addBlock(id, target.type, target.content);
    setBlockMenuOpen(null);
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === blocks.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(idx, 1);
    newBlocks.splice(targetIdx, 0, moved);

    onBlocksChange(newBlocks);
    setBlockMenuOpen(null);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
    block: NoteBlock,
    index: number
  ) => {
    // Ctrl/Cmd + S -> Force save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      if (onForceSave) onForceSave();
      return;
    }

    // Slash menu navigation
    if (slashMenuIndex === index) {
      if (e.key === 'Escape') {
        setSlashMenuIndex(null);
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const filtered = BLOCK_MENU_ITEMS.filter((item) =>
          item.label.toLowerCase().includes(slashFilter.toLowerCase())
        );
        if (filtered.length === 0) return;

        setSlashMenuPos((prev) => {
          if (e.key === 'ArrowDown') {
            return (prev + 1) % filtered.length;
          } else {
            return (prev - 1 + filtered.length) % filtered.length;
          }
        });
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const filtered = BLOCK_MENU_ITEMS.filter((item) =>
          item.label.toLowerCase().includes(slashFilter.toLowerCase())
        );
        const selected = filtered[slashMenuPos] || filtered[0];
        if (selected) {
          updateBlock(block.id, { type: selected.type, content: '' });
          setSlashMenuIndex(null);
          setSlashFilter('');
        }
        return;
      }
    }

    // Enter key creates new block
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (block.type === 'code') {
        // Shift+Enter creates newline in code, Enter also creates newline unless Ctrl/Cmd+Enter
        if (e.ctrlKey || e.metaKey) {
          addBlock(block.id, 'paragraph');
        } else {
          // Standard enter in code inserts newline
          const target = e.currentTarget as HTMLTextAreaElement;
          const start = target.selectionStart || 0;
          const end = target.selectionEnd || 0;
          const val = block.content;
          const newVal = val.substring(0, start) + '\n' + val.substring(end);
          updateBlock(block.id, { content: newVal });
          setTimeout(() => {
            target.setSelectionRange(start + 1, start + 1);
          }, 0);
        }
        return;
      }

      addBlock(block.id, block.type === 'todo' || block.type === 'bullet' || block.type === 'numbered' ? block.type : 'paragraph');
      return;
    }

    // Backspace on empty block
    if (e.key === 'Backspace') {
      const target = e.currentTarget;
      const isEmpty = block.content.trim() === '';
      const isCursorAtStart = target.selectionStart === 0 && target.selectionEnd === 0;

      if (isEmpty || isCursorAtStart) {
        if (block.type !== 'paragraph') {
          e.preventDefault();
          updateBlock(block.id, { type: 'paragraph' });
          return;
        } else if (isEmpty) {
          e.preventDefault();
          removeBlock(block.id);
          return;
        }
      }
    }

    // Arrow keys up / down navigation
    if (e.key === 'ArrowUp') {
      const target = e.currentTarget;
      if (target.selectionStart === 0 || block.type !== 'code') {
        if (index > 0) {
          e.preventDefault();
          const prevId = blocks[index - 1].id;
          const prevEl = blockRefs.current[prevId];
          if (prevEl) prevEl.focus();
        }
      }
    } else if (e.key === 'ArrowDown') {
      const target = e.currentTarget;
      if (target.selectionEnd === target.value.length || block.type !== 'code') {
        if (index < blocks.length - 1) {
          e.preventDefault();
          const nextId = blocks[index + 1].id;
          const nextEl = blockRefs.current[nextId];
          if (nextEl) nextEl.focus();
        }
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, block: NoteBlock, index: number) => {
    const val = e.target.value;

    // Check for markdown shortcuts at line start
    if (val.startsWith('# ') && block.type === 'paragraph') {
      updateBlock(block.id, { type: 'heading1', content: val.slice(2) });
      return;
    }
    if (val.startsWith('## ') && block.type === 'paragraph') {
      updateBlock(block.id, { type: 'heading2', content: val.slice(3) });
      return;
    }
    if (val.startsWith('### ') && block.type === 'paragraph') {
      updateBlock(block.id, { type: 'heading3', content: val.slice(4) });
      return;
    }
    if ((val.startsWith('- ') || val.startsWith('* ')) && block.type === 'paragraph') {
      updateBlock(block.id, { type: 'bullet', content: val.slice(2) });
      return;
    }
    if (val.startsWith('1. ') && block.type === 'paragraph') {
      updateBlock(block.id, { type: 'numbered', content: val.slice(3) });
      return;
    }
    if (val.startsWith('[] ') || val.startsWith('[ ] ')) {
      updateBlock(block.id, { type: 'todo', content: val.slice(val.startsWith('[] ') ? 3 : 4), checked: false });
      return;
    }
    if (val.startsWith('> ') && block.type === 'paragraph') {
      updateBlock(block.id, { type: 'quote', content: val.slice(2) });
      return;
    }
    if (val.startsWith('```') && block.type === 'paragraph') {
      updateBlock(block.id, { type: 'code', content: val.slice(3) });
      return;
    }
    if (val.startsWith('---') && block.type === 'paragraph') {
      updateBlock(block.id, { type: 'divider', content: '' });
      addBlock(block.id, 'paragraph');
      return;
    }

    // Check for Slash command `/`
    if (val.startsWith('/')) {
      setSlashMenuIndex(index);
      setSlashFilter(val.slice(1));
      setSlashMenuPos(0);
    } else if (slashMenuIndex === index && !val.includes('/')) {
      setSlashMenuIndex(null);
    }

    updateBlock(block.id, { content: val });
  };

  const filteredMenuItems = BLOCK_MENU_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(slashFilter.toLowerCase())
  );

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-8 py-10 md:py-16 transition-all">
      {/* Document Header / Title */}
      <div className="mb-8 group">
        <div className="flex items-center gap-3 mb-3">
          {/* Emoji Picker Button */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-4xl hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28] p-1.5 rounded-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Change icon"
            >
              {icon}
            </button>
            {showEmojiPicker && (
              <div className="absolute top-14 left-0 z-50 p-3 bg-white dark:bg-[#1C1A19] border border-[#E8E4DF] dark:border-[#2C2A28] rounded-2xl shadow-xl grid grid-cols-4 gap-2 w-52">
                {EMOJI_PRESETS.map((e) => (
                  <button
                    key={e}
                    onClick={() => {
                      if (onIconChange) onIconChange(e);
                      setShowEmojiPicker(false);
                    }}
                    className="text-2xl p-2 hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28] rounded-lg transition"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled"
          readOnly={readOnly}
          className="w-full text-4xl md:text-5xl font-bold text-[#2A2826] dark:text-[#F9F8F6] bg-transparent border-none outline-none placeholder:text-[#C4C0B9] dark:placeholder:text-[#524E4A] tracking-tight"
        />
      </div>

      {/* Blocks Container */}
      <div className="space-y-3 min-h-[500px]">
        {blocks.map((block, index) => {
          const isHovered = activeHoverBlock === block.id;

          return (
            <div
              key={block.id}
              onMouseEnter={() => setActiveHoverBlock(block.id)}
              onMouseLeave={() => setActiveHoverBlock(null)}
              className="group relative flex items-start gap-1 rounded-lg transition-colors py-1"
            >
              {/* Drag & Action Handle */}
              {!readOnly && (
                <div
                  className={`absolute -left-9 top-1.5 flex items-center gap-0.5 transition-opacity duration-150 ${
                    isHovered || blockMenuOpen === block.id ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <button
                    onClick={() => addBlock(block.id, 'paragraph')}
                    className="p-1 text-[#8C8881] hover:text-[#2A2826] dark:hover:text-[#F9F8F6] rounded hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28]"
                    title="Add block below"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setBlockMenuOpen(blockMenuOpen === block.id ? null : block.id)}
                      className="p-1 text-[#8C8881] hover:text-[#2A2826] dark:hover:text-[#F9F8F6] rounded hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28]"
                      title="Block options"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </button>

                    {blockMenuOpen === block.id && (
                      <div className="absolute left-6 top-0 z-50 w-44 bg-white dark:bg-[#1C1A19] border border-[#E8E4DF] dark:border-[#2C2A28] rounded-xl shadow-lg py-1 text-xs">
                        <button
                          onClick={() => moveBlock(block.id, 'up')}
                          disabled={index === 0}
                          className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28] text-[#4A4744] dark:text-[#D1CDC7] disabled:opacity-40"
                        >
                          <ChevronUp className="w-3.5 h-3.5" /> Move up
                        </button>
                        <button
                          onClick={() => moveBlock(block.id, 'down')}
                          disabled={index === blocks.length - 1}
                          className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28] text-[#4A4744] dark:text-[#D1CDC7] disabled:opacity-40"
                        >
                          <ChevronDown className="w-3.5 h-3.5" /> Move down
                        </button>
                        <button
                          onClick={() => duplicateBlock(block.id)}
                          className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28] text-[#4A4744] dark:text-[#D1CDC7]"
                        >
                          <Copy className="w-3.5 h-3.5" /> Duplicate
                        </button>
                        <div className="my-1 border-t border-[#F3F1EE] dark:border-[#2C2A28]" />
                        <button
                          onClick={() => {
                            removeBlock(block.id);
                            setBlockMenuOpen(null);
                          }}
                          className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Block Content Rendering */}
              <div className="w-full flex items-start gap-3">
                {/* Checkbox for todo block */}
                {block.type === 'todo' && (
                  <button
                    onClick={() => updateBlock(block.id, { checked: !block.checked })}
                    className={`mt-1.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                      block.checked
                        ? 'border-[#5A5A40] bg-[#5A5A40] text-white'
                        : 'border-[#DED9D2] dark:border-[#524E4A] bg-white dark:bg-[#1C1A19] hover:border-[#5A5A40]'
                    }`}
                  >
                    {block.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                )}

                {/* Bullet prefix */}
                {block.type === 'bullet' && (
                  <span className="mt-3 w-1.5 h-1.5 rounded-full bg-[#5A5A40] shrink-0" />
                )}

                {/* Numbered prefix */}
                {block.type === 'numbered' && (
                  <span className="mt-1 text-base font-semibold text-[#8C8881] select-none shrink-0 w-6">
                    {index + 1}.
                  </span>
                )}

                {/* Divider block */}
                {block.type === 'divider' ? (
                  <div className="w-full py-4 my-1">
                    <hr className="border-t border-[#F3F1EE] dark:border-[#2C2A28]" />
                  </div>
                ) : block.type === 'callout' ? (
                  /* Callout Block */
                  <div className="w-full p-4 rounded-2xl border border-[#E8E4DF] dark:border-[#2C2A28] bg-[#F9F8F6] dark:bg-[#1C1A19] flex items-start gap-3 my-2">
                    <button
                      onClick={() => {
                        const currentIcon = block.calloutIcon || '💡';
                        const currentIdx = CALLOUT_EMOJIS.indexOf(currentIcon);
                        const nextIcon = CALLOUT_EMOJIS[(currentIdx + 1) % CALLOUT_EMOJIS.length];
                        updateBlock(block.id, { calloutIcon: nextIcon });
                      }}
                      title="Click to cycle icon"
                      className="text-2xl hover:scale-110 transition cursor-pointer p-1 rounded-lg hover:bg-[#F3F1EE] dark:hover:bg-[#2C2A28]"
                    >
                      {block.calloutIcon || '💡'}
                    </button>
                    <textarea
                      ref={(el) => {
                        blockRefs.current[block.id] = el;
                      }}
                      value={block.content}
                      onChange={(e) => handleInputChange(e, block, index)}
                      onKeyDown={(e) => handleKeyDown(e, block, index)}
                      readOnly={readOnly}
                      placeholder="Callout text or reminder..."
                      className="w-full bg-transparent border-none outline-none resize-none text-base text-[#2A2826] dark:text-[#F9F8F6] leading-relaxed placeholder:text-[#C4C0B9]"
                    />
                  </div>
                ) : block.type === 'image' ? (
                  /* Image Attachment Block */
                  <div className="w-full my-3 p-4 rounded-2xl border border-[#E8E4DF] dark:border-[#2C2A28] bg-[#F9F8F6] dark:bg-[#1C1A19]/50 space-y-3">
                    {block.imageUrl ? (
                      <div className="space-y-2">
                        <div className="relative group/img overflow-hidden rounded-xl border border-[#E8E4DF] dark:border-[#2C2A28]">
                          <img
                            src={block.imageUrl}
                            alt={block.caption || 'Attached image'}
                            className="max-h-[450px] w-auto mx-auto object-contain rounded-xl"
                          />
                          {!readOnly && (
                            <button
                              onClick={() => updateBlock(block.id, { imageUrl: undefined })}
                              className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition shadow-md cursor-pointer"
                              title="Remove image"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={block.caption || ''}
                          onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                          placeholder="Add image caption..."
                          readOnly={readOnly}
                          className="w-full text-center text-xs text-[#8C8881] bg-transparent outline-none italic"
                        />
                      </div>
                    ) : (
                      /* Drag & Drop Upload Zone */
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file && file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              updateBlock(block.id, { imageUrl: event.target?.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="p-6 border-2 border-dashed border-[#DED9D2] dark:border-[#383532] rounded-xl flex flex-col items-center justify-center text-center space-y-3 bg-white dark:bg-[#1A1918]"
                      >
                        <div className="p-3 rounded-full bg-[#F3F1EE] dark:bg-[#2C2A28] text-[#5A5A40]">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#2A2826] dark:text-[#F9F8F6]">
                            Drag & drop an image here, or choose file
                          </p>
                          <p className="text-[11px] text-[#8C8881] mt-0.5">PNG, JPG, GIF up to 10MB</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                          <label className="px-3 py-1.5 text-xs font-semibold text-white bg-[#5A5A40] hover:bg-[#484833] rounded-full cursor-pointer transition">
                            <span>Browse File</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (evt) => {
                                    updateBlock(block.id, { imageUrl: evt.target?.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          <button
                            onClick={() => {
                              const url = prompt('Enter Image URL:');
                              if (url) updateBlock(block.id, { imageUrl: url });
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-[#2A2826] dark:text-[#F9F8F6] bg-[#F3F1EE] dark:bg-[#2C2A28] hover:bg-[#E8E4DF] rounded-full transition flex items-center gap-1 cursor-pointer"
                          >
                            <Link className="w-3.5 h-3.5" />
                            <span>Embed URL</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : block.type === 'table' ? (
                  /* Grid Table Block */
                  <div className="w-full my-3 space-y-2">
                    {(() => {
                      const data =
                        block.tableData && block.tableData.length > 0
                          ? block.tableData
                          : [
                              ['Header 1', 'Header 2'],
                              ['Row 1 Cell 1', 'Row 1 Cell 2'],
                            ];

                      const updateCell = (rIdx: number, cIdx: number, val: string) => {
                        const newData = data.map((row, r) =>
                          r === rIdx ? row.map((cell, c) => (c === cIdx ? val : cell)) : row
                        );
                        updateBlock(block.id, { tableData: newData });
                      };

                      const addRow = () => {
                        const cols = data[0]?.length || 2;
                        const newRow = Array(cols).fill('');
                        updateBlock(block.id, { tableData: [...data, newRow] });
                      };

                      const addCol = () => {
                        const newData = data.map((row, idx) => [...row, idx === 0 ? `Header ${row.length + 1}` : '']);
                        updateBlock(block.id, { tableData: newData });
                      };

                      const removeRow = (rIdx: number) => {
                        if (data.length <= 1) return;
                        const newData = data.filter((_, idx) => idx !== rIdx);
                        updateBlock(block.id, { tableData: newData });
                      };

                      const removeCol = (cIdx: number) => {
                        if (data[0]?.length <= 1) return;
                        const newData = data.map((row) => row.filter((_, idx) => idx !== cIdx));
                        updateBlock(block.id, { tableData: newData });
                      };

                      return (
                        <div className="space-y-2">
                          <div className="overflow-x-auto border border-[#E8E4DF] dark:border-[#2C2A28] rounded-2xl">
                            <table className="w-full text-xs text-left border-collapse">
                              <tbody>
                                {data.map((row, rIdx) => (
                                  <tr
                                    key={rIdx}
                                    className={
                                      rIdx === 0
                                        ? 'bg-[#F3F1EE] dark:bg-[#2C2A28] font-bold'
                                        : 'border-t border-[#F3F1EE] dark:border-[#2C2A28]'
                                    }
                                  >
                                    {row.map((cell, cIdx) => (
                                      <td
                                        key={cIdx}
                                        className="p-2 border-r border-[#F3F1EE] dark:border-[#2C2A28] last:border-r-0 relative group/cell"
                                      >
                                        <input
                                          type="text"
                                          value={cell}
                                          onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                                          readOnly={readOnly}
                                          className="w-full bg-transparent outline-none text-[#2A2826] dark:text-[#F9F8F6]"
                                        />
                                      </td>
                                    ))}
                                    {!readOnly && data.length > 1 && (
                                      <td className="w-8 text-center p-1">
                                        <button
                                          onClick={() => removeRow(rIdx)}
                                          className="text-[#8C8881] hover:text-rose-500 cursor-pointer"
                                          title="Delete row"
                                        >
                                          <Trash className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {!readOnly && (
                            <div className="flex items-center gap-2 pt-1 text-xs text-[#8C8881]">
                              <button
                                onClick={addRow}
                                className="px-3 py-1 bg-[#F3F1EE] dark:bg-[#2C2A28] hover:bg-[#E8E4DF] rounded-lg font-medium text-[#2A2826] dark:text-[#F9F8F6] flex items-center gap-1 cursor-pointer"
                              >
                                <PlusCircle className="w-3.5 h-3.5" /> Row
                              </button>
                              <button
                                onClick={addCol}
                                className="px-3 py-1 bg-[#F3F1EE] dark:bg-[#2C2A28] hover:bg-[#E8E4DF] rounded-lg font-medium text-[#2A2826] dark:text-[#F9F8F6] flex items-center gap-1 cursor-pointer"
                              >
                                <PlusCircle className="w-3.5 h-3.5" /> Column
                              </button>
                              {data[0]?.length > 1 && (
                                <button
                                  onClick={() => removeCol(data[0].length - 1)}
                                  className="px-3 py-1 bg-[#F3F1EE] dark:bg-[#2C2A28] hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 rounded-lg font-medium flex items-center gap-1 cursor-pointer ml-auto"
                                >
                                  <Trash className="w-3.5 h-3.5" /> Last Col
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* Standard Input Field per Block Type */
                  <textarea
                    ref={(el) => {
                      blockRefs.current[block.id] = el;
                    }}
                    value={block.content}
                    onChange={(e) => handleInputChange(e, block, index)}
                    onKeyDown={(e) => handleKeyDown(e, block, index)}
                    readOnly={readOnly}
                    rows={block.type === 'code' ? Math.max(2, block.content.split('\n').length) : 1}
                    placeholder={
                      block.type === 'heading1'
                        ? 'Heading 1'
                        : block.type === 'heading2'
                        ? 'Heading 2'
                        : block.type === 'heading3'
                        ? 'Heading 3'
                        : block.type === 'quote'
                        ? 'Quote or reflection...'
                        : block.type === 'code'
                        ? '// Code snippet...'
                        : "Type '/' for commands..."
                    }
                    className={`w-full bg-transparent border-none outline-none resize-none overflow-hidden transition-all placeholder:text-[#C4C0B9] dark:placeholder:text-[#524E4A] ${
                      block.type === 'heading1'
                        ? 'text-2xl md:text-3xl font-bold text-[#2A2826] dark:text-[#F9F8F6] mt-6 mb-2 border-b border-[#F3F1EE] dark:border-[#2C2A28] pb-2'
                        : block.type === 'heading2'
                        ? 'text-xl md:text-2xl font-bold text-[#2A2826] dark:text-[#F9F8F6] mt-5 mb-2'
                        : block.type === 'heading3'
                        ? 'text-lg font-bold text-[#2A2826] dark:text-[#F9F8F6] mt-4 mb-1'
                        : block.type === 'quote'
                        ? 'bg-[#F9F8F6] dark:bg-[#1C1A19] p-5 rounded-2xl border border-[#F3F1EE] dark:border-[#2C2A28] italic font-serif text-[#706C64] dark:text-[#A39F98] leading-relaxed my-2'
                        : block.type === 'code'
                        ? 'font-mono text-sm p-4 bg-[#F3F1EE] dark:bg-[#1C1A19] text-[#2A2826] dark:text-[#F9F8F6] rounded-xl border border-[#E8E4DF] dark:border-[#2C2A28] my-2'
                        : block.type === 'todo' && block.checked
                        ? 'line-through text-[#8C8881] dark:text-[#706C64] text-lg'
                        : 'text-lg text-[#4A4744] dark:text-[#D1CDC7] leading-relaxed'
                    }`}
                  />
                )}
              </div>

              {/* Slash Command Palette Overlay */}
              {slashMenuIndex === index && filteredMenuItems.length > 0 && (
                <div className="absolute left-0 top-full mt-1 z-50 w-64 max-h-60 overflow-y-auto bg-white dark:bg-[#1C1A19] border border-[#E8E4DF] dark:border-[#2C2A28] rounded-2xl shadow-xl p-1.5 text-sm">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-[#8C8881] uppercase tracking-wider">
                    Basic Blocks
                  </div>
                  {filteredMenuItems.map((item, idx) => {
                    const isSelected = idx === slashMenuPos;
                    return (
                      <button
                        key={item.type}
                        onClick={() => {
                          updateBlock(block.id, { type: item.type, content: '' });
                          setSlashMenuIndex(null);
                          setSlashFilter('');
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center gap-3 rounded-xl transition-colors ${
                          isSelected
                            ? 'bg-[#F3F1EE] dark:bg-[#2C2A28] text-[#2A2826] dark:text-[#F9F8F6] font-medium'
                            : 'text-[#4A4744] dark:text-[#D1CDC7] hover:bg-[#F9F8F6] dark:hover:bg-[#2C2A28]/50'
                        }`}
                      >
                        <div className="p-1.5 rounded-lg bg-[#F3F1EE] dark:bg-[#2C2A28] text-[#5A5A40] shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[#2A2826] dark:text-[#F9F8F6]">{item.label}</div>
                          <div className="text-[11px] text-[#8C8881] truncate">{item.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
