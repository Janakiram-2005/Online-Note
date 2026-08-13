import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Share2, Copy, Check, Globe, QrCode, ExternalLink, ShieldCheck } from 'lucide-react';
import { NoteDocument } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: NoteDocument | null;
  onToggleShare: (docId: string, isShared: boolean) => Promise<string | null>;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  document,
  onToggleShare,
}) => {
  const [isPublic, setIsPublic] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (document) {
      setIsPublic(Boolean(document.isPublicShared));
      if (document.shareToken) {
        const url = `${window.location.origin}/share/${document.shareToken}`;
        setShareUrl(url);
        QRCode.toDataURL(url, { width: 220, margin: 2, color: { dark: '#2A2826', light: '#FFFFFF' } })
          .then((dataUrl) => setQrCodeUrl(dataUrl))
          .catch((err) => console.error('QR code generation error:', err));
      } else {
        setShareUrl('');
        setQrCodeUrl('');
      }
    }
  }, [document]);

  if (!isOpen || !document) return null;

  const handleToggle = async () => {
    setLoading(true);
    try {
      const nextSharedState = !isPublic;
      const newShareToken = await onToggleShare(document.id, nextSharedState);
      setIsPublic(nextSharedState);

      if (nextSharedState && newShareToken) {
        const url = `${window.location.origin}/share/${newShareToken}`;
        setShareUrl(url);
        const dataUrl = await QRCode.toDataURL(url, {
          width: 220,
          margin: 2,
          color: { dark: '#2A2826', light: '#FFFFFF' },
        });
        setQrCodeUrl(dataUrl);
      } else {
        setShareUrl('');
        setQrCodeUrl('');
      }
    } catch (err) {
      console.error('Failed to toggle share:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2A2826]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-[#1C1A19] border border-[#E8E4DF] dark:border-[#2C2A28] rounded-3xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F3F1EE] dark:border-[#2C2A28] pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#5A5A40]" />
            <h3 className="text-base font-bold text-[#2A2826] dark:text-[#F9F8F6]">
              Share Note & QR Code
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8C8881] hover:text-[#2A2826] dark:hover:text-[#F9F8F6] rounded-lg cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Public Access Toggle */}
        <div className="p-4 rounded-2xl border border-[#E8E4DF] dark:border-[#2C2A28] bg-[#F9F8F6] dark:bg-[#1A1918]/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#F3F1EE] dark:bg-[#2C2A28] text-[#5A5A40]">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#2A2826] dark:text-[#F9F8F6]">
                Public Read-Only Sharing
              </div>
              <div className="text-[11px] text-[#8C8881]">
                {isPublic
                  ? 'Anyone with link or QR code can view this note.'
                  : 'Only you can view this document.'}
              </div>
            </div>
          </div>

          <button
            onClick={handleToggle}
            disabled={loading}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              isPublic ? 'bg-[#5A5A40]' : 'bg-[#E8E4DF] dark:bg-[#2C2A28]'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                isPublic ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Share Link & QR Display */}
        {isPublic && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Copyable URL input */}
            <div>
              <label className="block text-xs font-semibold text-[#4A4744] dark:text-[#D1CDC7] mb-1.5">
                Shareable Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full px-3.5 py-2 text-xs font-mono bg-[#F9F8F6] dark:bg-[#1A1918] border border-[#E8E4DF] dark:border-[#2C2A28] rounded-xl text-[#2A2826] dark:text-[#F9F8F6] outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#5A5A40] hover:bg-[#484833] rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* QR Code Canvas Card */}
            {qrCodeUrl && (
              <div className="p-4 rounded-2xl border border-[#E8E4DF] dark:border-[#2C2A28] bg-white dark:bg-[#1A1918] flex flex-col items-center space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#2A2826] dark:text-[#F9F8F6]">
                  <QrCode className="w-4 h-4 text-[#5A5A40]" />
                  <span>Scan to View on Mobile</span>
                </div>
                <img
                  src={qrCodeUrl}
                  alt="Document QR Code"
                  className="w-44 h-44 rounded-xl border border-[#F3F1EE] p-2 bg-white shadow-xs"
                />
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#5A5A40] dark:text-[#A3D9A5] hover:underline flex items-center gap-1 pt-1"
                >
                  <span>Open preview in new tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Free Service Badge */}
        <div className="flex items-center gap-2 text-[11px] text-[#8C8881] pt-1 border-t border-[#F3F1EE] dark:border-[#2C2A28]">
          <ShieldCheck className="w-4 h-4 text-[#5A5A40]" />
          <span>100% Free & Unlimited Read-Only Sharing</span>
        </div>
      </div>
    </div>
  );
};
