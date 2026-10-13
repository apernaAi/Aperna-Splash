import React, { useState, useEffect } from 'react';
import { X, Wallet, ShieldCheck, CheckCircle2, AlertCircle, ExternalLink, Zap } from 'lucide-react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { Language } from '../types/airdrop.ts';
import { validateTonAddress } from '../utils/tonService.ts';
import { playClaimRewardSound, playTapSound } from '../utils/audioEngine.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (address: string, provider: string) => void;
  currentAddress: string | null;
  language: Language;
}

export const ConnectWalletModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConnect,
  currentAddress,
  language,
}) => {
  if (!isOpen) return null;

  const [tonConnectUI] = useTonConnectUI();
  const rawWallet = useTonWallet();
  const [manualAddress, setManualAddress] = useState(currentAddress || '');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync if TON Connect connects a real wallet
  useEffect(() => {
    if (rawWallet?.account?.address) {
      const addr = rawWallet.account.address;
      const providerName = rawWallet.device?.appName || 'Tonkeeper';
      onConnect(addr, providerName);
    }
  }, [rawWallet, onConnect]);

  const handleOpenTonConnect = async () => {
    playTapSound();
    try {
      if (tonConnectUI) {
        await tonConnectUI.openModal();
      }
    } catch (err) {
      console.warn('TonConnect openModal fallback:', err);
    }
  };

  const handleConfirmManual = () => {
    playTapSound();
    const trimmed = manualAddress.trim();
    const validation = validateTonAddress(trimmed);

    if (!validation.isValid && trimmed.length < 10) {
      setErrorMsg(language === 'hi' ? 'कृपया मान्य TON पता दर्ज करें।' : 'Please enter a valid TON address.');
      return;
    }

    playClaimRewardSound();
    onConnect(trimmed, 'Tonkeeper / @wallet');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0a2356] via-[#051334] to-[#020a1c] border border-cyan-400/40 p-5 space-y-4 text-white shadow-[0_15px_60px_rgba(0,180,255,0.35)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-white">
              {language === 'hi' ? 'TON वॉलेट कनेक्शन' : 'Connect TON Wallet'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-white/10 text-cyan-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Action: Official TON Connect 1-Click Popup */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-400/30">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold block mb-1">
            OFFICIAL TON CONNECT
          </span>
          <p className="text-xs text-cyan-100/90 leading-snug mb-3">
            {language === 'hi'
              ? 'Tonkeeper, Telegram @wallet या MyTonWallet को 1-क्लिक में सुरक्षित कनेक्ट करें।'
              : 'Connect Tonkeeper, Telegram @wallet or MyTonWallet securely via TON Connect.'}
          </p>

          <button
            onClick={handleOpenTonConnect}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs tracking-wider shadow-[0_0_20px_rgba(0,210,255,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>{language === 'hi' ? 'TON Connect डायलॉग खोलें' : 'Open TON Connect'}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2 text-[10px] text-cyan-300/60 font-mono">
          <div className="flex-1 h-[1px] bg-cyan-500/20" />
          <span>{language === 'hi' ? 'या पता सीधे दर्ज करें' : 'OR PASTE ADDRESS'}</span>
          <div className="flex-1 h-[1px] bg-cyan-500/20" />
        </div>

        {/* Manual Address Input */}
        <div className="space-y-1.5">
          <input
            type="text"
            value={manualAddress}
            onChange={(e) => {
              setManualAddress(e.target.value);
              setErrorMsg('');
            }}
            placeholder="EQ... or UQ... (Tonkeeper address)"
            className="w-full p-3 rounded-2xl bg-[#04122d] border border-cyan-500/30 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(0,210,255,0.3)]"
          />

          {errorMsg ? (
            <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-mono">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : (
            <p className="text-[10px] text-cyan-200/60 font-mono">
              {language === 'hi'
                ? 'Tonkeeper / Telegram @wallet से रिसीव पता कॉपी करके पेस्ट करें।'
                : 'Copy your TON receive address from Tonkeeper or Telegram @wallet.'}
            </p>
          )}
        </div>

        {/* Security badge */}
        <div className="text-[11px] text-cyan-200/70 flex items-center gap-1.5 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
          <span>
            {language === 'hi'
              ? 'नॉन-कस्टोडियल। आपकी प्राइवेट की सुरक्षित रहती है।'
              : 'Non-custodial. Private keys never leave your device.'}
          </span>
        </div>

        {/* Confirm Button */}
        <div>
          <button
            onClick={handleConfirmManual}
            className="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-bold text-xs tracking-wide active:scale-95 transition-all cursor-pointer"
          >
            {language === 'hi' ? 'सत्यापित करें एवं जोड़ें' : 'Verify & Bind Address'}
          </button>
        </div>
      </div>
    </div>
  );
};
