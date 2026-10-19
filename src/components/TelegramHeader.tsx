/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Volume2, VolumeX, ChevronDown, MoreVertical, X, 
  ShieldCheck, RefreshCw, Radio, ArrowLeft, Shield, Users, Trophy, Music 
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
  onOpenNftPage?: () => void;
  onOpenSecurityModal?: () => void;
  onOpenRankPage?: () => void;
  onOpenProfile?: () => void;
  userAvatarUrl?: string;
  userName?: string;
  activeTab?: TabType;
  onBack?: () => void;
  onOpenLibrary?: () => void;
}

export const TelegramHeader: React.FC<Props> = ({
  language,
  onToggleLanguage,
  isMuted,
  onToggleMute,
  onShowSplash,
  onResetStats,
  onOpenBotSync,
  onOpenNftPage,
  onOpenSecurityModal,
  onOpenRankPage,
  onOpenProfile,
  userAvatarUrl,
  userName,
  activeTab = 'beats',
  onBack,
  onOpenLibrary,
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
    <header className="sticky top-0 z-40 w-full bg-[#051332]/95 backdrop-blur-2xl border-b border-cyan-500/20 px-3.5 py-2 flex items-center justify-between text-white select-none shadow-[0_4px_20px_rgba(0,10,40,0.6)]">
      {/* Left: Back Button (if on sub-tab) OR User Mini Profile Chip */}
      <div className="flex items-center gap-2 min-w-0">
        {isNotHome ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-xs font-bold text-cyan-200 border border-cyan-400/40 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-300" />
            <span>{language === 'hi' ? 'वापस' : 'Back'}</span>
          </button>
        ) : (
          onOpenProfile && (
            <button
              onClick={() => {
                playTapSound();
                onOpenProfile();
              }}
              className="flex items-center gap-2 p-1 pr-2.5 rounded-full bg-[#071d47]/80 hover:bg-[#0c2966] border border-cyan-500/30 transition-all active:scale-95 cursor-pointer max-w-[130px] sm:max-w-[160px]"
              title="Profile"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-[#05173e] p-0.5 border border-cyan-400/40 flex-shrink-0">
                {userAvatarUrl ? (
                  <img src={userAvatarUrl} alt={userName || 'User'} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-[9px] font-black text-white flex items-center justify-center h-full">
                    {userName ? userName.slice(0, 2).toUpperCase() : 'MM'}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-cyan-100 truncate">
                {userName || 'Mimi Artist'}
              </span>
            </button>
          )
        )}
      </div>

      {/* Center: Clean Brand Title */}
      <div className="flex items-center gap-1.5 justify-center">
        <span className="font-black text-sm tracking-tight text-white drop-shadow-[0_0_10px_rgba(0,210,255,0.6)]">
          Music Mimi
        </span>
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#0098ea] text-white text-[9px] font-bold shadow-sm">
          ✓
        </span>
      </div>

      {/* Right Controls: Language Switch, Sound Toggle, 3-Dots Menu */}
      <div className="flex items-center gap-1.5 relative flex-shrink-0">
        {/* Language switch */}
        <button
          onClick={() => {
            playTapSound();
            onToggleLanguage();
          }}
          title="Toggle Language"
          className="px-2 py-1 rounded-xl bg-[#0b2454]/90 text-[11px] font-extrabold text-cyan-300 border border-cyan-400/30 hover:bg-cyan-500/20 active:scale-95 transition-all cursor-pointer font-mono"
        >
          {language === 'hi' ? 'हिन्दी' : 'EN'}
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={() => {
            playTapSound();
            onToggleMute();
          }}
          className="p-1.5 rounded-xl bg-[#0b2454]/90 text-cyan-200 hover:text-white border border-cyan-500/20 active:scale-95 transition-colors cursor-pointer"
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
          className="p-1.5 rounded-xl bg-[#0b2454]/90 text-cyan-200 hover:text-white border border-cyan-500/20 active:scale-95 transition-colors cursor-pointer"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute top-10 right-0 w-60 bg-[#06183e] border border-cyan-500/30 rounded-2xl shadow-2xl p-2 z-50 text-xs flex flex-col gap-1 backdrop-blur-xl animate-fadeIn">
            {onOpenLibrary && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenLibrary();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-left bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 text-cyan-200 font-bold border border-cyan-400/40 cursor-pointer shadow-[0_0_12px_rgba(0,210,255,0.2)]"
              >
                <Music className="w-4 h-4 text-cyan-300" />
                <span>{language === 'hi' ? '🎵 म्यूजिक लाइब्रेरी व BGM' : '🎵 Music Library & BGM'}</span>
              </button>
            )}
            {onOpenRankPage && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenRankPage();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-left bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 text-amber-300 font-bold border border-amber-400/30 cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>{language === 'hi' ? '🏆 असली यूज़र्स रैंक (लीडरबोर्ड)' : '🏆 Live Users Leaderboard'}</span>
              </button>
            )}

            {onOpenNftPage && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenNftPage();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-left bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 text-cyan-300 font-bold border border-cyan-400/30 cursor-pointer"
              >
                <Users className="w-4 h-4 text-cyan-300" />
                <span>{language === 'hi' ? '🎟️ 1,000 रिज़र्व पूल (सीमित)' : '🎟️ 1,000 Reserve Pool (Limited)'}</span>
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
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-left bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 text-amber-300 font-bold border border-amber-400/40 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.2)]"
            >
              <Radio className="w-4 h-4 text-amber-400" />
              <span>{language === 'hi' ? '📢 चैनल ब्रॉडकास्ट (@ApernaAIOfficial)' : '📢 Channel Broadcast (@ApernaAIOfficial)'}</span>
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
