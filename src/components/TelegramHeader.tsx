/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Volume2, VolumeX, ChevronDown, MoreVertical, X, 
  ShieldCheck, RefreshCw, Radio, Crown, ArrowLeft, Shield 
} from 'lucide-react';
import { TabType, Language } from '../types/airdrop.ts';
import { playTapSound } from '../utils/audioEngine.ts';

interface Props {
  language: Language;
  onToggleLanguage: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onShowSplash: () => void;
  onResetStats: () => void;
  onOpenBotSync: () => void;
  onOpenNftModal?: () => void;
  onOpenNftPage?: () => void;
  onOpenSecurityModal?: () => void;
  activeTab?: TabType;
  onBack?: () => void;
}

export const TelegramHeader: React.FC<Props> = ({
  language,
  onToggleLanguage,
  isMuted,
  onToggleMute,
  onShowSplash,
  onResetStats,
  onOpenBotSync,
  onOpenNftModal,
  onOpenNftPage,
  onOpenSecurityModal,
  activeTab = 'beats',
  onBack,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const isNotHome = activeTab !== 'beats';

  const handleBack = () => {
    playTapSound();
    if (onBack) {
      onBack();
    }
  };

  const handleClose = () => {
    playTapSound();
    if (
      typeof window !== 'undefined' &&
      (window as unknown as { Telegram?: { WebApp?: { close: () => void } } }).Telegram?.WebApp
    ) {
      (window as unknown as { Telegram?: { WebApp?: { close: () => void } } }).Telegram?.WebApp?.close();
    } else {
      onShowSplash();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#051332]/95 backdrop-blur-2xl border-b border-cyan-500/25 px-3 sm:px-4 py-2.5 flex items-center justify-between text-white select-none shadow-[0_4px_25px_rgba(0,10,40,0.7)]">
      {/* Left: Back Button (if on another page) OR Close Pill + Quick NFT Pill */}
      <div className="flex items-center gap-1.5">
        {isNotHome ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 text-xs font-black text-cyan-200 border border-cyan-400/50 transition-all active:scale-95 shadow-[0_0_10px_rgba(0,210,255,0.3)] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-300" />
            <span>{language === 'hi' ? 'वापस' : 'Back'}</span>
          </button>
        ) : (
          <button
            onClick={handleClose}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0c224e]/80 hover:bg-[#12316e] text-xs font-semibold text-cyan-200 border border-cyan-500/30 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-cyan-300" />
            <span>Close</span>
          </button>
        )}

        {/* Top Shining NFT Button - Takes user to dedicated NFT Page */}
        {onOpenNftPage && (
          <button
            onClick={() => {
              playTapSound();
              onOpenNftPage();
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold active:scale-95 transition-all shadow-[0_0_12px_rgba(251,191,36,0.4)] cursor-pointer ${
              activeTab === 'nft'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black border-2 border-amber-300'
                : 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/60 text-amber-300'
            }`}
            title="Aperna Genesis Memorial NFT ($0.50 USD)"
          >
            <Crown className="w-3.5 h-3.5 fill-current" />
            <span className="font-mono text-[11px]">$0.50 NFT</span>
          </button>
        )}
      </div>

      {/* Center: Music Mimi with Verified Check */}
      <div className="flex items-center gap-1.5">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm sm:text-base tracking-tight text-white drop-shadow-[0_0_12px_rgba(0,210,255,0.7)]">
              Music Mimi
            </span>
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#0098ea] text-white text-[10px] font-bold shadow-[0_0_8px_rgba(0,152,234,0.8)]">
              ✓
            </span>
          </div>
          <span className="text-[9px] text-cyan-400 font-mono tracking-wider -mt-0.5">
            $MIMI Protocol
          </span>
        </div>
      </div>

      {/* Right Controls: Z+ Shield, Language Switch, Sound, Menu */}
      <div className="flex items-center gap-1.5 relative">
        {/* Z+ Security Shield status button */}
        <button
          onClick={() => {
            playTapSound();
            if (onOpenSecurityModal) onOpenSecurityModal();
            else onShowSplash();
          }}
          className="p-1.5 rounded-full bg-emerald-950/60 text-emerald-300 hover:text-white border border-emerald-400/40 shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
          title="Z+ Security Shield Active"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        </button>

        {/* Language switch */}
        <button
          onClick={() => {
            playTapSound();
            onToggleLanguage();
          }}
          title="Toggle Language"
          className="px-2 py-0.5 rounded-lg bg-[#0b2454]/90 text-[11px] font-bold text-cyan-300 border border-cyan-400/30 hover:bg-cyan-500/20 transition-all cursor-pointer"
        >
          {language === 'hi' ? 'हिन्दी' : 'EN'}
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={() => {
            playTapSound();
            onToggleMute();
          }}
          className="p-1.5 rounded-full bg-[#0b2454]/90 text-cyan-200 hover:text-white border border-cyan-500/20 transition-colors cursor-pointer"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-300" />}
        </button>

        {/* 3-dots Menu */}
        <button
          onClick={() => {
            playTapSound();
            setShowMenu(!showMenu);
          }}
          className="p-1.5 rounded-full bg-[#0b2454]/90 text-cyan-200 hover:text-white border border-cyan-500/20 transition-colors cursor-pointer"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute top-10 right-0 w-60 bg-[#06183e] border border-cyan-500/30 rounded-2xl shadow-2xl p-2 z-50 text-xs flex flex-col gap-1 backdrop-blur-xl animate-fadeIn">
            {onOpenNftPage && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenNftPage();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-left bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 text-amber-300 font-bold border border-amber-400/30 cursor-pointer"
              >
                <Crown className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span>{language === 'hi' ? '👑 जेनेसिस NFT पेज ($0.50)' : '👑 Genesis NFT Page ($0.50)'}</span>
              </button>
            )}

            <button
              onClick={() => {
                setShowMenu(false);
                if (onOpenSecurityModal) onOpenSecurityModal();
                else onShowSplash();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-cyan-950/60 text-emerald-300 font-bold cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{language === 'hi' ? '🛡️ Z+ सुरक्षा ऑडिट' : '🛡️ Z+ Security Status'}</span>
            </button>

            <button
              onClick={() => {
                setShowMenu(false);
                onOpenBotSync();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-cyan-950/60 text-cyan-300 font-bold cursor-pointer"
            >
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>{language === 'hi' ? '🤖 टेलीग्राम बॉट /start सिंक' : '🤖 Telegram Bot /start Sync'}</span>
            </button>

            <button
              onClick={() => {
                setShowMenu(false);
                onResetStats();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-rose-950/40 text-rose-300 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-rose-400" />
              <span>{language === 'hi' ? 'नया खाता रीसेट करें' : 'Reset to Fresh User'}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
