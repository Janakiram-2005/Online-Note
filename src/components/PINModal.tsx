import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface PINModalProps {
  isSetupMode: boolean;
  onSuccess: () => void;
}

export const PINModal: React.FC<PINModalProps> = ({ isSetupMode, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!pin || pin.trim().length < 4) {
      setErrorMsg('PIN / Passphrase must be at least 4 characters.');
      return;
    }

    if (isSetupMode && pin !== confirmPin) {
      setErrorMsg('PIN and Confirmation do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = isSetupMode ? '/api/auth/setup-pin' : '/api/auth/unlock';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Authentication failed.');
      } else {
        onSuccess();
      }
    } catch (err) {
      setErrorMsg('Unable to reach server. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'back') {
      setPin((prev) => prev.slice(0, -1));
    } else {
      if (pin.length < 16) {
        setPin((prev) => prev + val);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2A2826]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#1C1A19] border border-[#E8E4DF] dark:border-[#2C2A28] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#5A5A40] text-white flex items-center justify-center shadow-lg">
          {isSetupMode ? <ShieldCheck className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
        </div>

        <div>
          <h1 className="text-xl font-bold text-[#2A2826] dark:text-[#F9F8F6] tracking-tight">
            {isSetupMode ? 'Create Personal PIN' : 'Unlock Workspace'}
          </h1>
          <p className="text-xs text-[#8C8881] mt-1.5 leading-relaxed">
            {isSetupMode
              ? 'Set a personal PIN or passphrase to protect your notes and workspace.'
              : 'Enter your personal PIN or passphrase to open your notes.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main PIN Input */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder={isSetupMode ? 'Create PIN (min 4 chars)' : 'Enter PIN / Passphrase'}
              autoFocus
              className="w-full px-4 py-3 text-center text-lg font-mono tracking-widest bg-[#F9F8F6] dark:bg-[#1A1918] border border-[#E8E4DF] dark:border-[#2C2A28] rounded-2xl text-[#2A2826] dark:text-[#F9F8F6] outline-none focus:border-[#5A5A40] transition shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-[#8C8881] hover:text-[#2A2826] dark:hover:text-[#F9F8F6]"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Confirm PIN Input in Setup Mode */}
          {isSetupMode && (
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Confirm PIN / Passphrase"
              className="w-full px-4 py-3 text-center text-lg font-mono tracking-widest bg-[#F9F8F6] dark:bg-[#1A1918] border border-[#E8E4DF] dark:border-[#2C2A28] rounded-2xl text-[#2A2826] dark:text-[#F9F8F6] outline-none focus:border-[#5A5A40] transition shadow-inner"
            />
          )}

          {/* Error display */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-300 text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-[#5A5A40] hover:bg-[#484833] text-white text-sm font-semibold rounded-full transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{isSetupMode ? 'Save PIN & Start' : 'Unlock'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Phone-Style Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F3F1EE] dark:border-[#2C2A28]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                if (k === 'C') {
                  setPin('');
                  setConfirmPin('');
                } else if (k === '⌫') {
                  handleKeypadPress('back');
                } else {
                  handleKeypadPress(k);
                }
              }}
              className="py-2.5 text-sm font-semibold rounded-xl bg-[#F3F1EE] dark:bg-[#2C2A28] hover:bg-[#E8E4DF] text-[#33302E] dark:text-[#F9F8F6] transition active:scale-95 cursor-pointer"
            >
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
