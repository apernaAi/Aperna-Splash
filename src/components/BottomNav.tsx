import React from 'react';
import { TabType, Language } from '../types/airdrop.ts';
import { ASSETS } from '../assets/assetRegistry.ts';
import { playTapSound } from '../utils/audioEngine.ts';

interface Props {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  pendingTasksCount: number;
  language: Language;
}

export const BottomNav: React.FC<Props> = ({
  activeTab,
  onChangeTab,
  pendingTasksCount,
  language,
}) => {
  const handleSelect = (tab: TabType) => {
    playTapSound();
    onChangeTab(tab);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 px-2 sm:px-3 pb-3 pt-1 pointer-events-none">
      <nav className="max-w-md mx-auto bg-[#07173b]/95 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl px-1.5 py-1.5 shadow-[0_12px_45px_rgba(0,12,38,0.95)] pointer-events-auto flex items-center justify-between relative">
        {/* Tab 1: टास्क (Tasks) */}
        <button
          onClick={() => handleSelect('tasks')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 cursor-pointer ${
            activeTab === 'tasks' ? 'scale-105 opacity-100' : 'opacity-70 hover:opacity-100'
          }`}
        >
          <div className="relative w-7 h-7 flex items-center justify-center">
            <img
              src={ASSETS.scrollTask}
              alt="Tasks"
              referrerPolicy="no-referrer"
              className={`w-6 h-6 object-contain rounded-lg drop-shadow-md transition-transform ${
                activeTab === 'tasks' ? 'scale-110 drop-shadow-[0_0_10px_rgba(236,72,153,0.7)]' : ''
              }`}
            />
            {pendingTasksCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 min-w-3.5 h-3.5 flex items-center justify-center rounded-full bg-cyan-400 text-slate-950 text-[9px] font-black shadow-sm">
                {pendingTasksCount}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] mt-0.5 font-bold tracking-tight ${
              activeTab === 'tasks' ? 'text-cyan-300 font-black' : 'text-slate-300'
            }`}
          >
            {language === 'hi' ? 'टास्क' : 'Quests'}
          </span>
        </button>

        {/* Tab 2: लाइव रैंक (Real Users Rank & Leaderboard) */}
        <button
          onClick={() => handleSelect('rank')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 cursor-pointer ${
            activeTab === 'rank' ? 'scale-105 opacity-100' : 'opacity-70 hover:opacity-100'
          }`}
        >
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div className={`w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-sm ${
              activeTab === 'rank' ? 'scale-110 shadow-[0_0_14px_rgba(245,158,11,0.8)]' : ''
            }`}>
              🏆
            </div>
            {/* Live Indicator Dot */}
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)]" />
          </div>
          <span
            className={`text-[10px] mt-0.5 font-bold tracking-tight ${
              activeTab === 'rank' ? 'text-amber-300 font-black drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'text-slate-300'
            }`}
          >
            {language === 'hi' ? 'रैंक' : 'Rank'}
          </span>
        </button>

        {/* Tab 3: बीट्स (Center Raised Floating Vinyl Button) */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-5">
          <button
            onClick={() => handleSelect('beats')}
            className={`group relative w-13 h-13 rounded-full p-1 transition-all duration-300 cursor-pointer ${
              activeTab === 'beats'
                ? 'scale-110 shadow-[0_0_30px_rgba(0,210,255,0.8)]'
                : 'hover:scale-105 shadow-[0_0_15px_rgba(0,0,0,0.7)]'
            }`}
          >
            {/* Glowing Cyan & Gold ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500 via-sky-300 to-amber-300 p-[2px] shadow-lg animate-pulse">
              <div className="w-full h-full bg-[#07183d] rounded-full" />
            </div>

            {/* 3D Music Mimi Token Coin Graphic */}
            <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center z-10 bg-cyan-950/40 shadow-inner">
              <img
                src={ASSETS.mimiTokenCoin}
                alt="Music Mimi Beats"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </button>
          <span
            className={`text-[10px] mt-0.5 font-bold tracking-tight ${
              activeTab === 'beats' ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(0,210,255,0.8)]' : 'text-slate-300'
            }`}
          >
            {language === 'hi' ? 'मेकिंग' : 'Mimi'}
          </span>
        </div>

        {/* Tab 4: 1,000 Early Reserve Pool */}
        <button
          onClick={() => handleSelect('nft')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 cursor-pointer ${
            activeTab === 'nft' ? 'scale-105 opacity-100' : 'opacity-70 hover:opacity-100'
          }`}
        >
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div className={`w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center text-xs font-black shadow-sm ${
              activeTab === 'nft' ? 'scale-110 shadow-[0_0_12px_rgba(0,210,255,0.8)]' : ''
            }`}>
              🎟️
            </div>
            <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-cyan-400 text-slate-950 text-[7.5px] font-black uppercase tracking-tight shadow animate-pulse">
              1,000
            </span>
          </div>
          <span
            className={`text-[10px] mt-0.5 font-bold tracking-tight ${
              activeTab === 'nft' ? 'text-cyan-300 font-black' : 'text-slate-300'
            }`}
          >
            {language === 'hi' ? '1000 पूल' : '1K Pool'}
          </span>
        </button>

        {/* Tab 5: तिजोरी / वॉलेट (Vault) */}
        <button
          onClick={() => handleSelect('vault')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 cursor-pointer ${
            activeTab === 'vault' ? 'scale-105 opacity-100' : 'opacity-70 hover:opacity-100'
          }`}
        >
          <div className="relative w-7 h-7 flex items-center justify-center">
            <img
              src={ASSETS.moneyBag}
              alt="Vault"
              referrerPolicy="no-referrer"
              className={`w-6 h-6 object-contain drop-shadow-md transition-transform ${
                activeTab === 'vault' ? 'scale-110 drop-shadow-[0_0_10px_rgba(16,185,129,0.7)]' : ''
              }`}
            />
          </div>
          <span
            className={`text-[10px] mt-0.5 font-bold tracking-tight ${
              activeTab === 'vault' ? 'text-emerald-400 font-black' : 'text-slate-300'
            }`}
          >
            {language === 'hi' ? 'तिजोरी' : 'Vault'}
          </span>
        </button>

        {/* Tab 6: प्रोफ़ाइल (Profile) */}
        <button
          onClick={() => handleSelect('profile')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 cursor-pointer ${
            activeTab === 'profile' ? 'scale-105 opacity-100' : 'opacity-70 hover:opacity-100'
          }`}
        >
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div className={`w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-sm ${
              activeTab === 'profile' ? 'scale-110 shadow-[0_0_12px_rgba(59,130,246,0.6)]' : ''
            }`}>
              🎖️
            </div>
          </div>
          <span
            className={`text-[10px] mt-0.5 font-bold tracking-tight ${
              activeTab === 'profile' ? 'text-sky-300 font-black' : 'text-slate-300'
            }`}
          >
            {language === 'hi' ? 'प्रोफ़ाइल' : 'Squad'}
          </span>
        </button>
      </nav>
    </div>
  );
};
