import React, { useState, useEffect } from 'react';
import { NoteDocument } from '../types';
import { Sparkles, Globe, Lock } from 'lucide-react';

interface PublicShareViewProps {
  shareToken: string;
}

export const PublicShareView: React.FC<PublicShareViewProps> = ({ shareToken }) => {
  const [document, setDocument] = useState<NoteDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedDoc = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/share/${shareToken}`);
        if (!res.ok) {
          throw new Error('This shared document does not exist or public sharing has been turned off.');
        }
        const data = await res.json();
        setDocument(data.document);
      } catch (err: any) {
        setError(err.message || 'Failed to load shared document.');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedDoc();
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] text-[#2A2826] flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-[#8C8881]">
          <Sparkles className="w-4 h-4 animate-spin text-[#5A5A40]" />
          <span>Loading shared note...</span>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] text-[#2A2826] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#F3F1EE] border border-[#E8E4DF] flex items-center justify-center mb-4 text-[#5A5A40]">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Note Unavailable</h2>
        <p className="text-xs text-[#8C8881] max-w-md mb-6">{error || 'This link may have expired or been revoked.'}</p>
        <a
          href="/"
          className="px-5 py-2.5 text-xs font-semibold text-white bg-[#5A5A40] rounded-full hover:bg-[#484833] transition"
        >
          Go to MyNotes
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#2A2826] antialiased">
      {/* Read-only Header Banner */}
      <header className="px-6 py-3 border-b border-[#E8E4DF] bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#5A5A40] text-white font-black text-sm flex items-center justify-center shadow-xs">
            M
          </div>
          <span className="text-xs font-bold tracking-tight">MyNotes</span>
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#F3F1EE] text-[#5A5A40] rounded-full flex items-center gap-1">
            <Globe className="w-3 h-3" />
            <span>Public Read-Only</span>
          </span>
        </div>

        <a
          href="/"
          className="px-3.5 py-1.5 text-xs font-semibold text-[#5A5A40] bg-[#F3F1EE] hover:bg-[#E8E4DF] rounded-full transition"
        >
          Open MyNotes App
        </a>
      </header>

      {/* Main Document Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Title & Icon */}
        <div className="mb-8">
          <div className="text-4xl mb-3">{document.icon || '📝'}</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#2A2826] tracking-tight">
            {document.title || 'Untitled Document'}
          </h1>
          <div className="text-xs text-[#8C8881] mt-3">
            Last updated {new Date(document.updatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
          </div>
        </div>

        {/* Blocks */}
        <div className="space-y-4">
          {document.blocks.map((block) => {
            if (block.type === 'heading1') {
              return (
                <h2 key={block.id} className="text-2xl font-bold pt-4 text-[#2A2826]">
                  {block.content}
                </h2>
              );
            }
            if (block.type === 'heading2') {
              return (
                <h3 key={block.id} className="text-xl font-bold pt-3 text-[#2A2826]">
                  {block.content}
                </h3>
              );
            }
            if (block.type === 'heading3') {
              return (
                <h4 key={block.id} className="text-lg font-semibold pt-2 text-[#2A2826]">
                  {block.content}
                </h4>
              );
            }
            if (block.type === 'bullet') {
              return (
                <div key={block.id} className="flex items-start gap-2 text-sm text-[#33302E] pl-2">
                  <span className="text-[#5A5A40] font-bold">•</span>
                  <span>{block.content}</span>
                </div>
              );
            }
            if (block.type === 'numbered') {
              return (
                <div key={block.id} className="flex items-start gap-2 text-sm text-[#33302E] pl-2">
                  <span className="text-[#5A5A40] font-bold">1.</span>
                  <span>{block.content}</span>
                </div>
              );
            }
            if (block.type === 'todo') {
              return (
                <div key={block.id} className="flex items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    disabled
                    checked={block.checked}
                    className="w-4 h-4 rounded border-[#E8E4DF] accent-[#5A5A40]"
                  />
                  <span className={block.checked ? 'line-through text-[#8C8881]' : 'text-[#33302E]'}>
                    {block.content}
                  </span>
                </div>
              );
            }
            if (block.type === 'quote') {
              return (
                <blockquote
                  key={block.id}
                  className="pl-4 py-2 border-l-4 border-[#5A5A40] italic text-sm text-[#4A4744] bg-[#F3F1EE]/50 rounded-r-xl"
                >
                  "{block.content}"
                </blockquote>
              );
            }
            if (block.type === 'code') {
              return (
                <pre
                  key={block.id}
                  className="p-4 rounded-2xl bg-[#1C1A19] text-[#F9F8F6] text-xs font-mono overflow-x-auto shadow-xs"
                >
                  <code>{block.content}</code>
                </pre>
              );
            }
            if (block.type === 'callout') {
              return (
                <div
                  key={block.id}
                  className="p-4 rounded-2xl border border-[#E8E4DF] bg-[#F3F1EE]/60 flex items-start gap-3"
                >
                  <span className="text-xl">{block.calloutIcon || '💡'}</span>
                  <div className="text-sm text-[#2A2826] leading-relaxed">{block.content}</div>
                </div>
              );
            }
            if (block.type === 'image' && block.imageUrl) {
              return (
                <div key={block.id} className="my-4 text-center">
                  <img
                    src={block.imageUrl}
                    alt={block.caption || 'Shared image'}
                    className="max-w-full max-h-[500px] mx-auto rounded-2xl border border-[#E8E4DF] shadow-xs"
                  />
                  {block.caption && (
                    <div className="text-xs text-[#8C8881] mt-2 italic">{block.caption}</div>
                  )}
                </div>
              );
            }
            if (block.type === 'table' && block.tableData) {
              return (
                <div key={block.id} className="my-4 overflow-x-auto border border-[#E8E4DF] rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <tbody>
                      {block.tableData.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={rIdx === 0 ? 'bg-[#F3F1EE] font-bold text-[#2A2826]' : 'border-t border-[#F3F1EE]'}
                        >
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-3 border-r border-[#F3F1EE] last:border-r-0">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
            if (block.type === 'divider') {
              return <hr key={block.id} className="my-6 border-[#E8E4DF]" />;
            }
            return (
              <p key={block.id} className="text-sm text-[#33302E] leading-relaxed whitespace-pre-wrap">
                {block.content}
              </p>
            );
          })}
        </div>
      </main>
    </div>
  );
};
