/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Crown, Sparkles, Zap, ShieldCheck, ExternalLink, 
  Layers, ArrowLeft, CheckCircle2, ChevronRight, Copy, Check 
} from 'lucide-react';
import { Language, UserStats } from '../types/airdrop.ts';
import { 
  APERNA_NFT_CONTRACT, 
  APERNA_NFT_CHAPTERS, 
  NFT_MINT_PRICE_USD, 
  ESTIMATED_POL_PER_MINT, 
  POLYGON_EXPLORER, 
  OPENSEA_COLLECTION,
  NftChapter,
  MintedNftRecord,
  getMintedNftsStorage
} from '../utils/apernaNftService.ts';
import { playTapSound } from '../utils/audioEngine.ts';

interface Props {
  language: Language;
  stats: UserStats;
  onOpenMintModal: () => void;
  onBack: () => void;
}

export const ApernaNftPage: React.FC<Props> = ({
  language,
  stats,
  onOpenMintModal,
  onBack,
}) => {
  const [selectedChapter, setSelectedChapter] = useState<NftChapter>(APERNA_NFT_CHAPTERS[0]);
  const [mintedNfts, setMintedNfts] = useState<MintedNftRecord[]>([]);
  const [copiedContract, setCopiedContract] = useState(false);

  useEffect(() => {
    setMintedNfts(getMintedNftsStorage());
  }, []);

  const copyContract = () => {
    playTapSound();
    navigator.clipboard.writeText(APERNA_NFT_CONTRACT);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <div className="w-full space-y-4 px-4 pt-1 pb-24 text-white select-none animate-fadeIn">
      {/* Page Top Header with Direct Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playTapSound();
              onBack();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#091b40] hover:bg-[#0f2c66] border border-cyan-500/30 text-xs font-bold text-cyan-200 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'वापस' : 'Back'}</span>
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              <span>{language === 'hi' ? '👑 जेनेसिस NFT पोर्टल' : '👑 Genesis NFT Portal'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono border border-amber-400/40">
                $0.50 USD
              </span>
            </h2>
          </div>
        </div>

        <button
          onClick={() => {
            playTapSound();
            onOpenMintModal();
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(251,191,36,0.5)] active:scale-95 transition-all cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 fill-slate-950" />
          <span>{language === 'hi' ? 'मिंट करें' : 'Mint Now'}</span>
        </button>
      </div>

      {/* Hero Showcase Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1d1033] via-[#0b1638] to-[#041d24] border-2 border-amber-400/60 p-5 shadow-[0_0_35px_rgba(251,191,36,0.3)] space-y-3">
        {/* Glow orb */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/60 text-[9px] font-mono font-bold text-amber-300 uppercase">
                POLYGON POS MAINNET
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-400/20 border border-cyan-400/40 text-[9px] font-mono font-bold text-cyan-300">
                ERC-721 + EIP-2981
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-1.5">
              Aperna AI Genesis Memorial Saga
            </h3>
            <p className="text-xs text-amber-200/90 font-medium mt-0.5">
              {language === 'hi'
                ? 'अपर्णा AI और म्यूजिक मिमी का आधिकारिक ऑन-चेन वेब3 मास्टरपीस कलेक्शन।'
                : 'Official sovereign Web3 audio artifact collection on Polygon Mainnet.'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-cyan-300 font-mono block">Mint Price</span>
            <span className="text-xl font-black text-amber-300 font-mono">
              ${NFT_MINT_PRICE_USD.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-300 font-mono block">
              ~{ESTIMATED_POL_PER_MINT} POL
            </span>
          </div>
        </div>

        {/* SPECIAL USER INCENTIVES BANNER */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-purple-500/25 border-2 border-amber-400/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              {language === 'hi' ? 'विशेष ऑफर: 1,000 + 500 टोकन बोनस!' : 'SPECIAL OFFER: 1,000 + 500 TOKEN BONUSES!'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono text-[9px] font-bold border border-amber-400/40">
              LIMITED TIME
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-left">
            <div className="p-2 rounded-xl bg-black/40 border border-amber-400/30">
              <div className="text-[10px] text-amber-300 font-mono font-bold">1st NFT Reward</div>
              <div className="text-sm font-black text-white">+1,000 Tokens</div>
              <div className="text-[9px] text-slate-300">
                {language === 'hi' ? 'NFT मिंट या इन-ऐप क्लेम पर' : 'On 1st mint or claim'}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-purple-400/30">
              <div className="text-[10px] text-purple-300 font-mono font-bold">Listing Task</div>
              <div className="text-sm font-black text-white">+500 Tokens</div>
              <div className="text-[9px] text-slate-300">
                {language === 'hi' ? 'सेल लिस्टिंग टास्क पूरा करने पर' : 'On listing task'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            playTapSound();
            onOpenMintModal();
          }}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm tracking-wider shadow-[0_0_20px_rgba(251,191,36,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          <span>{language === 'hi' ? 'NFT मिंट करें और 1,000 टोकन पाएं ($0.50 USD)' : 'Mint NFT & Claim 1,000 Tokens ($0.50 USD)'}</span>
        </button>

        {/* Smart Contract Proof */}
        <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] font-mono text-cyan-300/80">
          <div className="flex items-center gap-1 truncate mr-2">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            <span className="truncate">Contract: {APERNA_NFT_CONTRACT}</span>
          </div>
          <button
            onClick={copyContract}
            className="hover:text-white flex items-center gap-0.5 shrink-0 cursor-pointer"
          >
            {copiedContract ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedContract ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Chapter Selection Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-cyan-200">
          <span>{language === 'hi' ? 'सभी 4 अध्याय (Chapters)' : 'All 4 Genesis Chapters'}</span>
          <span className="text-amber-300 font-mono text-[11px]">$0.50 Each</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {APERNA_NFT_CHAPTERS.map((ch) => {
            const isSel = ch.chapterNumber === selectedChapter.chapterNumber;
            return (
              <div
                key={ch.id}
                onClick={() => {
                  playTapSound();
                  setSelectedChapter(ch);
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSel
                    ? 'bg-gradient-to-br from-[#1d1238] to-[#091538] border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] scale-[1.01]'
                    : 'bg-[#071333] border-cyan-500/20 hover:border-cyan-400/40 text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-base">{ch.imageEmoji}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${ch.badgeBg}`}>
                      {ch.rarity}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-white mt-1.5 truncate">
                    Ch. {ch.chapterRoman}: {ch.stageTag}
                  </h4>
                  <p className="text-[10px] text-slate-300/80 font-mono line-clamp-2 mt-0.5">
                    {ch.title}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono font-bold text-amber-300">
                    ${ch.priceUsd.toFixed(2)} USD
                  </span>
                  <span className="text-[10px] text-cyan-300 underline font-bold">
                    View →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Chapter Full Preview Card */}
      <div className={`p-4 rounded-3xl bg-gradient-to-br ${selectedChapter.themeGradient} border-2 border-amber-400/60 shadow-[0_0_25px_rgba(251,191,36,0.2)] space-y-3`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${selectedChapter.badgeBg}`}>
                {selectedChapter.rarity}
              </span>
              <span className="text-[10px] font-mono text-cyan-300">
                Chapter {selectedChapter.chapterRoman} • {selectedChapter.tokenId}
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-black text-white mt-1">
              {selectedChapter.title}
            </h4>
            <p className="text-xs text-amber-200/80 font-mono">
              {selectedChapter.subtitle}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-200/90 leading-relaxed bg-black/35 p-3 rounded-2xl border border-white/10 italic">
          "{selectedChapter.story}"
        </p>

        {/* Audio Stems */}
        <div>
          <span className="text-[10px] font-mono uppercase text-cyan-300 font-bold block mb-1">
            Included Neural Audio Stems:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {selectedChapter.stems.map((stem, i) => (
              <span key={i} className="text-[10px] px-2.5 py-1 rounded-lg bg-black/40 text-cyan-200 font-mono border border-cyan-500/20">
                🎵 {stem}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            playTapSound();
            onOpenMintModal();
          }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 cursor-pointer"
        >
          {language === 'hi' 
            ? `अध्याय ${selectedChapter.chapterRoman} मिंट करें ($0.50)` 
            : `Mint Chapter ${selectedChapter.chapterRoman} ($0.50 USD)`}
        </button>
      </div>

      {/* User's Minted Collection Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-200">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-300" />
            <span>{language === 'hi' ? 'मेरा NFT संग्रह' : 'My Collected Genesis NFTs'}</span>
          </div>
          <span className="text-amber-300 font-mono">
            {mintedNfts.length} Minted
          </span>
        </div>

        {mintedNfts.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#06112e] border border-cyan-500/20 text-center space-y-1.5">
            <p className="text-xs text-slate-300">
              {language === 'hi' ? 'आपने अभी तक कोई NFT मिंट नहीं किया है।' : 'No NFTs minted in this browser yet.'}
            </p>
            <button
              onClick={() => {
                playTapSound();
                onOpenMintModal();
              }}
              className="text-xs text-amber-300 underline font-bold cursor-pointer"
            >
              {language === 'hi' ? 'पहला NFT सिर्फ $0.50 में मिंट करें →' : 'Mint your first NFT for $0.50 USD →'}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {mintedNfts.map((nft) => (
              <div
                key={nft.id}
                className="p-3 rounded-2xl bg-[#081538] border border-amber-400/40 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">👑</span>
                    <div>
                      <div className="text-xs font-black text-white">{nft.chapterTitle}</div>
                      <div className="text-[10px] font-mono text-cyan-300">{nft.tokenId} • {nft.rarity}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    Verified
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
                  <span className="truncate mr-2">Tx: {nft.txHash.slice(0, 16)}...</span>
                  <a
                    href={`${POLYGON_EXPLORER}/tx/${nft.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 underline flex items-center gap-0.5 shrink-0"
                  >
                    <span>Polygonscan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* External Verified Links */}
      <div className="flex gap-2">
        <a
          href={OPENSEA_COLLECTION}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 rounded-xl bg-purple-950/70 border border-purple-400/40 text-purple-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
        >
          <span>OpenSea Collection</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <a
          href={`${POLYGON_EXPLORER}/address/${APERNA_NFT_CONTRACT}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 rounded-xl bg-cyan-950/70 border border-cyan-400/40 text-cyan-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
        >
          <span>Contract Scan</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
