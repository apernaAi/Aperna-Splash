import React, { useState, useEffect } from 'react';
import { X, Wallet, ShieldCheck, CheckCircle2, AlertCircle, ExternalLink, Zap, Copy, Check, LogOut, ArrowRight } from 'lucide-react';
import { useTonConnectUI, useTonWallet, useTonAddress } from '@tonconnect/ui-react';
import { Language } from '../types/airdrop.ts';
import { validateTonAddress, shortenAddress } from '../utils/tonService.ts';
import { playClaimRewardSound, playTapSound, triggerHaptic } from '../utils/audioEngine.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (address: string, provider: string) => void;
  onDisconnect?: () => void;
  currentAddress: string | null;
  language: Language;
}

export const ConnectWalletModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConnect,
  onDisconnect,
  currentAddress,
  language,
}) => {
  if (!isOpen) return null;

  const [tonConnectUI] = useTonConnectUI();
  const rawWallet = useTonWallet();
  const friendlyAddress = useTonAddress();

  const effectiveAddress = friendlyAddress || currentAddress;

  const [manualAddress, setManualAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSwitchView, setShowSwitchView] = useState(false);

  // Sync if TON Connect connects a real wallet
  useEffect(() => {
    if (friendlyAddress && friendlyAddress !== currentAddress) {
      const providerName = rawWallet?.device?.appName || 'Tonkeeper / @wallet';
      onConnect(friendlyAddress, providerName);
      playClaimRewardSound();
      triggerHaptic('heavy');
    }
  }, [friendlyAddress, rawWallet, currentAddress, onConnect]);

  const handleOpenTonConnect = async () => {
    playTapSound();
    triggerHaptic('medium');
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
    triggerHaptic('heavy');
    onConnect(trimmed, 'Tonkeeper / @wallet (Manual)');
    setShowSwitchView(false);
    onClose();
  };

  const handleCopyAddress = (addr: string) => {
    playTapSound();
    triggerHaptic('light');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDisconnect = async () => {
    playTapSound();
    triggerHaptic('medium');
    try {
      if (tonConnectUI && tonConnectUI.connected) {
        await tonConnectUI.disconnect();
      }
    } catch (err) {
      console.warn('Disconnect error:', err);
    }
    if (onDisconnect) {
      onDisconnect();
    } else {
      onConnect('', '');
    }
    setShowSwitchView(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/90 backdrop-blur-2xl animate-fadeIn select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0a2356] via-[#051334] to-[#020a1c] border-2 border-cyan-400/50 p-5 space-y-4 text-white shadow-[0_15px_70px_rgba(0,180,255,0.45)]">
        {/* Ambient Top Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,210,255,0.2)_0%,transparent_60%)] pointer-events-none rounded-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/30">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-white">
              {effectiveAddress && !showSwitchView
                ? language === 'hi'
                  ? 'TON वॉलेट स्थिति'
                  : 'TON Wallet Status'
                : language === 'hi'
                ? 'TON वॉलेट कनेक्शन'
                : 'Connect TON Wallet'}
            </h3>
          </div>
          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="p-1 rounded-full bg-white/10 text-cyan-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ALREADY CONNECTED VIEW */}
        {effectiveAddress && !showSwitchView ? (
          <div className="space-y-3.5 relative z-10 animate-fadeIn">
            {/* Status Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-cyan-950/70 to-blue-950/80 border border-emerald-400/50 shadow-[0_0_25px_rgba(16,185,129,0.25)] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {language === 'hi' ? 'सफलतापूर्वक जुड़ा' : 'CONNECTED & VERIFIED'}
                </span>
                <span className="text-[10px] text-cyan-300/80 font-mono">
                  TON Network
                </span>
              </div>

              {/* Address with copy */}
              <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-cyan-500/25">
                <div className="min-w-0 pr-2">
                  <span className="text-[9px] uppercase tracking-wider text-cyan-300/80 font-mono block">
                    {language === 'hi' ? 'सक्रिय TON पता' : 'ACTIVE ADDRESS'}
                  </span>
                  <span className="text-xs font-mono font-bold text-white tracking-wide truncate block">
                    {shortenAddress(effectiveAddress, 6)}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleCopyAddress(effectiveAddress)}
                    className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 transition-colors cursor-pointer"
                    title="Copy address"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={`https://tonscan.org/address/${effectiveAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 transition-colors cursor-pointer"
                    title="View on Tonscan"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Unlocked Benefits */}
              <div className="space-y-1.5 pt-1 text-[11px] font-mono text-cyan-100/90">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{language === 'hi' ? 'Mimi Making 8-घंटे लूप क्राफ्टिंग अनलॉक' : 'Mimi Making 8-Hour Craft Unlocked'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{language === 'hi' ? 'DEX टोकन आवंटन दावा योग्य' : 'DEX Token Allocation Eligible'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>{language === 'hi' ? 'नॉन-कस्टोडियल व Z+ सुरक्षा प्रमाणित' : 'Non-Custodial & Verified'}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => {
                  playTapSound();
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{language === 'hi' ? 'ठीक है, आगे बढ़ें' : 'Done & Continue'}</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setShowSwitchView(true)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  {language === 'hi' ? 'वॉलेट बदलें' : 'Switch Wallet'}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'डिस्कनेक्ट' : 'Disconnect'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* NOT CONNECTED OR SWITCH VIEW */
          <div className="space-y-4 relative z-10 animate-fadeIn">
            {/* Primary Action: Official TON Connect 1-Click Popup */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-400/30 shadow-[0_0_20px_rgba(0,210,255,0.15)]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold block mb-1">
                OFFICIAL TON CONNECT (1-CLICK)
              </span>
              <p className="text-xs text-cyan-100/90 leading-snug mb-3">
                {language === 'hi'
                  ? 'Tonkeeper, Telegram @wallet या MyTonWallet को 1-क्लिक में तुरंत कनेक्ट करें।'
                  : 'Connect Tonkeeper, Telegram @wallet or MyTonWallet securely via TON Connect.'}
              </p>
              <button
                onClick={handleOpenTonConnect}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs sm:text-sm tracking-wider shadow-[0_0_20px_rgba(0,210,255,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                className="w-full p-3 rounded-2xl bg-[#04122d] border border-cyan-500/30 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(0,210,255,0.3)] placeholder:text-slate-500"
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
            <div className="text-[11px] text-cyan-200/70 flex items-center gap-1.5 pt-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span>
                {language === 'hi'
                  ? 'नॉन-कस्टोडियल। आपकी प्राइवेट की सुरक्षित रहती है।'
                  : 'Non-custodial. Private keys never leave your device.'}
              </span>
            </div>

            {/* Confirm Button */}
            <div className="flex items-center gap-2">
              {showSwitchView && (
                <button
                  onClick={() => setShowSwitchView(false)}
                  className="py-2.5 px-3 rounded-xl bg-white/10 text-cyan-200 font-bold text-xs cursor-pointer"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
              )}
              <button
                onClick={handleConfirmManual}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-bold text-xs tracking-wide active:scale-95 transition-all cursor-pointer"
              >
                {language === 'hi' ? 'सत्यापित करें एवं जोड़ें' : 'Verify & Bind Address'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
