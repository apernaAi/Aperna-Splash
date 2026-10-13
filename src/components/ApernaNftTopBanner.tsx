/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Crown, Zap, ShieldCheck, ExternalLink, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Language } from '../types/airdrop.ts';
import { NFT_MINT_PRICE_USD, APERNA_NFT_CONTRACT, getMintedNftsStorage } from '../utils/apernaNftService.ts';
import { playTapSound } from '../utils/audioEngine.ts';

interface Props {
  language: Language;
  onOpenMintModal: () => void;
}

export const ApernaNftTopBanner: React.FC<Props> = ({ language, onOpenMintModal }) => {
  const [mintedCount, setMintedCount] = useState(0);

  useEffect(() => {
    const list = getMintedNftsStorage();
    setMintedCount(list.length);
  }, []);

  return (
    <div className="w-full px-3 pt-2 pb-1 select-none">
      <div 
        onClick={() => {
          playTapSound();
          onOpenMintModal();
        }}
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#170e28] via-[#0b1b3d] to-[#122822] border-2 border-amber-400/70 p-3 shadow-[0_0_25px_rgba(251,191,36,0.45)] hover:shadow-[0_0_35px_rgba(251,191,36,0.7)] transition-all duration-300 cursor-pointer active:scale-[0.98]"
      >
        {/* Shimmer Light Sweep Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/15 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />

        {/* Floating Ambient Glowing Orbs */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/25 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-cyan-500/25 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          {/* Left Icon with Dual Rings */}
          <div className="relative flex items-center justify-center shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-[0_0_18px_rgba(251,191,36,0.8)] animate-pulse">
              <Crown className="w-6 h-6 fill-slate-950" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center text-[9px] font-bold text-slate-950 border border-slate-950 shadow-sm">
              ✨
            </div>
          </div>

          {/* Center Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/60 text-[9px] font-extrabold uppercase tracking-wider text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-spin" />
                {language === 'hi' ? 'विशेष Web3 मिंट' : 'EXCLUSIVE WEB3 MINT'}
              </span>
              <span className="text-[10px] font-mono text-cyan-300 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-400/30">
                Polygon Mainnet
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 mt-0.5">
              <h4 className="text-xs sm:text-sm font-black text-white tracking-tight truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {language === 'hi' ? '👑 अपर्णा AI जेनेसिस मेमोरियल NFT' : '👑 Aperna AI Genesis Memorial NFT'}
              </h4>
            </div>

            <p className="text-[10px] text-amber-200/90 font-medium truncate mt-0.2">
              {language === 'hi'
                ? 'सिर्फ $0.50 में लाइव मिंट करें • ओपनसी व पॉलीगॉन पर वेरिफाइड'
                : 'Live Mint for just $0.50 USD • Verified On-Chain Contract'}
            </p>
          </div>

          {/* Right Action Button */}
          <div className="shrink-0 flex flex-col items-end gap-1">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(251,191,36,0.7)] group-hover:scale-105 transition-transform duration-200 cursor-pointer">
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>${NFT_MINT_PRICE_USD.toFixed(2)}</span>
            </button>
            {mintedCount > 0 ? (
              <span className="text-[9px] font-mono font-bold text-emerald-400 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" />
                {mintedCount} Minted
              </span>
            ) : (
              <span className="text-[9px] font-mono text-amber-300/80">
                1-Click Mint →
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
