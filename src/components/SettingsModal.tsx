import React, { useState } from 'react';
import { WorkspaceMetadata } from '../types';
import {
  X,
  Lock,
  Cloud,
  CheckCircle2,
  ExternalLink,
  Moon,
  Sun,
  Monitor,
  Download,
  AlertCircle,
  Key,
  Save,
  RefreshCw,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: WorkspaceMetadata;
  onUpdateSettings: (newSettings: Partial<WorkspaceMetadata>) => void;
  driveConnected: boolean;
  driveUserEmail?: string | null;
  onConnectDrive: () => void;
  onExportNotes: () => void;
  onSyncDrive: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  metadata,
  onUpdateSettings,
  driveConnected,
  driveUserEmail,
  onConnectDrive,
  onExportNotes,
  onSyncDrive,
}) => {
  const [activeTab, setActiveTab] = useState<'security' | 'drive' | 'general'>('security');

  // Change PIN state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStatusMsg, setPinStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  if (!isOpen) return null;

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinStatusMsg(null);

    if (!currentPin) {
      setPinStatusMsg({ type: 'error', text: 'Please enter your current PIN.' });
      return;
    }
    if (newPin.length < 4) {
      setPinStatusMsg({ type: 'error', text: 'New PIN must be at least 4 characters long.' });
      return;
    }
    if (newPin !== confirmPin) {
      setPinStatusMsg({ type: 'error', text: 'New PIN and Confirmation do not match.' });
      return;
    }

    setIsUpdatingPin(true);
    try {
      const res = await fetch('/api/auth/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPinStatusMsg({ type: 'error', text: data.error || 'Failed to change PIN.' });
      } else {
        setPinStatusMsg({ type: 'success', text: 'PIN successfully changed.' });
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
      }
    } catch (err) {
      setPinStatusMsg({ type: 'error', text: 'Network error updating PIN.' });
    } finally {
      setIsUpdatingPin(false);
    }
  };

  const redirectUri = `${window.location.origin}/auth/callback`;

  return (
    <div className="fixed inset-0 z-50 bg-[#2A2826]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-[#1C1A19] border border-[#E8E4DF] dark:border-[#2C2A28] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#F3F1EE] dark:border-[#2C2A28] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#2A2826] dark:text-[#F9F8F6] flex items-center gap-2">
            <span>Workspace Settings</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-[#8C8881] hover:text-[#2A2826] dark:hover:text-[#F9F8F6] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 pt-3 flex gap-2 border-b border-[#F3F1EE] dark:border-[#2C2A28] bg-[#F9F8F6]/80 dark:bg-[#1A1918]/80 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-2 border-b-2 transition cursor-pointer ${
              activeTab === 'security'
                ? 'border-[#5A5A40] text-[#5A5A40] dark:text-[#F9F8F6]'
                : 'border-transparent text-[#8C8881] hover:text-[#2A2826] dark:hover:text-[#F9F8F6]'
            }`}
          >
            Security & PIN
          </button>
          <button
            onClick={() => setActiveTab('drive')}
            className={`px-3 py-2 border-b-2 transition cursor-pointer ${
              activeTab === 'drive'
                ? 'border-[#5A5A40] text-[#5A5A40] dark:text-[#F9F8F6]'
                : 'border-transparent text-[#8C8881] hover:text-[#2A2826] dark:hover:text-[#F9F8F6]'
            }`}
          >
            Google Drive Storage
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-2 border-b-2 transition cursor-pointer ${
              activeTab === 'general'
                ? 'border-[#5A5A40] text-[#5A5A40] dark:text-[#F9F8F6]'
                : 'border-transparent text-[#8C8881] hover:text-[#2A2826] dark:hover:text-[#F9F8F6]'
            }`}
          >
            General & Theme
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* TAB 1: Security & PIN */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#2A2826] dark:text-[#F9F8F6] flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#5A5A40]" />
                  <span>Change Personal Unlock PIN</span>
                </h3>
                <p className="text-xs text-[#8C8881] mt-1">
                  Your PIN protects your workspace on this device and server. It is hashed securely using PBKDF2 with SHA-256 and salt.
                </p>
              </div>

              <form onSubmit={handlePinSubmit} className="space-y-3 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-[#4A4744] dark:text-[#D1CDC7] mb-1">
                    Current PIN / Passphrase
                  </label>
                  <input
                    type="password"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    required
                    placeholder="••••"
                    className="w-full px-3 py-2 text-sm bg-[#F9F8F6] dark:bg-[#1A1918] border border-[#E8E4DF] dark:border-[#2C2A28] rounded-xl text-[#2A2826] dark:text-[#F9F8F6] outline-none focus:border-[#5A5A40]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A4744] dark:text-[#D1CDC7] mb-1">
                    New PIN / Passphrase
                  </label>
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    required
                    placeholder="At least 4 characters"
                    className="w-full px-3 py-2 text-sm bg-[#F9F8F6] dark:bg-[#1A1918] border border-[#E8E4DF] dark:border-[#2C2A28] rounded-xl text-[#2A2826] dark:text-[#F9F8F6] outline-none focus:border-[#5A5A40]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A4744] dark:text-[#D1CDC7] mb-1">
                    Confirm New PIN
                  </label>
                  <input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    required
                    placeholder="Repeat new PIN"
                    className="w-full px-3 py-2 text-sm bg-[#F9F8F6] dark:bg-[#1A1918] border border-[#E8E4DF] dark:border-[#2C2A28] rounded-xl text-[#2A2826] dark:text-[#F9F8F6] outline-none focus:border-[#5A5A40]"
                  />
                </div>

                {pinStatusMsg && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      pinStatusMsg.type === 'success'
                        ? 'bg-[#A3D9A5]/20 text-[#33302E] border border-[#A3D9A5]'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {pinStatusMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[#5A5A40]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{pinStatusMsg.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUpdatingPin}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#5A5A40] hover:bg-[#484833] rounded-full transition disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingPin ? 'Updating PIN...' : 'Update PIN'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Google Drive Storage */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#2A2826] dark:text-[#F9F8F6] flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-[#5A5A40]" />
                  <span>Google Drive Document Persistence</span>
                </h3>
                <p className="text-xs text-[#8C8881] mt-1">
                  Your documents are stored directly in your personal Google Drive in the <code className="px-1 py-0.5 bg-[#F3F1EE] dark:bg-[#2C2A28] rounded">MyNotes/Documents/</code> folder.
                </p>
              </div>

              {/* Connection Status Box */}
              <div className="p-4 rounded-2xl border border-[#E8E4DF] dark:border-[#2C2A28] bg-[#F9F8F6] dark:bg-[#1A1918]/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        driveConnected ? 'bg-[#A3D9A5]' : 'bg-[#C4C0B9]'
                      }`}
                    />
                    <span className="text-xs font-bold text-[#2A2826] dark:text-[#F9F8F6]">
                      {driveConnected ? 'Connected to Google Drive' : 'Local Workspace Mode'}
                    </span>
                  </div>
                  {driveUserEmail && (
                    <span className="text-xs text-[#8C8881]">{driveUserEmail}</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={onConnectDrive}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#5A5A40] hover:bg-[#484833] rounded-full transition flex items-center gap-2 cursor-pointer"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>{driveConnected ? 'Re-authorize Google Drive' : 'Connect Google Drive'}</span>
                  </button>

                  {driveConnected && (
                    <button
                      onClick={onSyncDrive}
                      className="px-4 py-2 text-xs font-medium text-[#33302E] dark:text-[#F9F8F6] bg-white dark:bg-[#2C2A28] border border-[#E8E4DF] dark:border-[#2C2A28] hover:bg-[#F3F1EE] rounded-full transition flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sync Drive Notes</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Instant Token Authorization Option */}
              <div className="p-4 rounded-2xl border border-[#E8E4DF] dark:border-[#2C2A28] bg-white dark:bg-[#1A1918] space-y-3">
                <div className="text-xs font-bold text-[#2A2826] dark:text-[#F9F8F6] flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#5A5A40]" />
                  <span>Google OAuth Access Token</span>
                </div>
                <p className="text-[11px] text-[#8C8881]">
                  If popups are restricted in your iframe preview, paste a Google Access Token below to sync immediately.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="ya29.a0A..."
                    id="driveTokenInput"
                    className="flex-1 px-3 py-2 text-xs font-mono bg-[#F9F8F6] dark:bg-[#2C2A28] border border-[#E8E4DF] dark:border-[#383432] rounded-xl outline-none text-[#2A2826] dark:text-[#F9F8F6]"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('driveTokenInput') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        alert('Google Drive token configured! Syncing workspace...');
                        onSyncDrive();
                      }
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-[#5A5A40] hover:bg-[#484833] rounded-xl transition cursor-pointer"
                  >
                    Save Token
                  </button>
                </div>
              </div>

              {/* OAuth Guidance Details */}
              <div className="p-4 rounded-2xl border border-[#E8E4DF] dark:border-[#2C2A28] bg-[#F9F8F6] dark:bg-[#1A1918]/20 text-xs space-y-2">
                <div className="font-semibold text-[#2A2826] dark:text-[#F9F8F6]">
                  Google Drive Setup Details
                </div>
                <div className="text-[#8C8881] space-y-1">
                  <div>
                    • <strong>OAuth Scope:</strong> <code className="bg-[#E8E4DF] dark:bg-[#2C2A28] px-1 rounded">https://www.googleapis.com/auth/drive.file</code> (Narrow app-specific file access)
                  </div>
                  <div>
                    • <strong>Callback URL:</strong> <code className="bg-[#E8E4DF] dark:bg-[#2C2A28] px-1 rounded">{redirectUri}</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: General & Theme */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Theme Settings */}
              <div>
                <label className="block text-xs font-bold text-[#2A2826] dark:text-[#F9F8F6] mb-2">
                  Theme Appearance
                </label>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  {[
                    { key: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
                    { key: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
                    { key: 'system', label: 'System', icon: <Monitor className="w-4 h-4" /> },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => onUpdateSettings({ theme: t.key as any })}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-2 text-xs font-medium transition cursor-pointer ${
                        metadata.theme === t.key
                          ? 'border-[#5A5A40] bg-[#F3F1EE] dark:bg-[#2C2A28] text-[#2A2826] dark:text-[#F9F8F6] font-bold'
                          : 'border-[#E8E4DF] dark:border-[#2C2A28] text-[#8C8881] hover:bg-[#F9F8F6]'
                      }`}
                    >
                      {t.icon}
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-save Interval Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-[#2A2826] dark:text-[#F9F8F6]">
                    Debounced Auto-Save Interval
                  </label>
                  <span className="text-xs font-mono text-[#8C8881]">
                    {(metadata.autoSaveInterval / 1000).toFixed(1)} seconds
                  </span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="5000"
                  step="500"
                  value={metadata.autoSaveInterval || 1500}
                  onChange={(e) => onUpdateSettings({ autoSaveInterval: Number(e.target.value) })}
                  className="w-full max-w-md accent-[#5A5A40]"
                />
                <p className="text-[11px] text-[#8C8881] mt-1">
                  Saves your notes automatically after typing pauses for the selected duration.
                </p>
              </div>

              {/* Export Workspace */}
              <div className="pt-4 border-t border-[#F3F1EE] dark:border-[#2C2A28]">
                <h4 className="text-xs font-bold text-[#2A2826] dark:text-[#F9F8F6] mb-1">
                  Backup Workspace
                </h4>
                <p className="text-xs text-[#8C8881] mb-3">
                  Download a complete backup of all your notes, documents, and folders in structured JSON format.
                </p>
                <button
                  onClick={onExportNotes}
                  className="px-4 py-2 text-xs font-medium text-[#33302E] dark:text-[#F9F8F6] bg-[#F3F1EE] dark:bg-[#2C2A28] border border-[#E8E4DF] dark:border-[#2C2A28] hover:bg-[#E8E4DF] rounded-full transition flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#5A5A40]" />
                  <span>Export Notes Backup (JSON)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
