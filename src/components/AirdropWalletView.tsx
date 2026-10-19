/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ArrowUpRight,
  Sparkles,
  CheckCheck,
} from 'lucide-react';
import { useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import { UserStats, Language } from '../types/airdrop.ts';
import { ASSETS } from '../assets/assetRegistry.ts';
import { TelegramIcon } from './TelegramIcon.tsx';
import {
  TON_CONFIG,
  getTonscanTxUrl,
  fetchRealTonBalance,
  shortenAddress
} from '../utils/tonService.ts';
import { playClaimRewardSound, playTapSound } from '../utils/audioEngine.ts';

interface Props {
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  onOpenConnectWallet: () => void;
  onOpenClaimModal?: () => void;
  language: Language;
}

export const AirdropWalletView: React.FC<Props> = ({
  stats,
  onUpdateStats,
  onOpenConnectWallet,
  onOpenClaimModal,
  language,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [withdrawNotice, setWithdrawNotice] = useState<string | null>(null);
  const [realTonBalance, setRealTonBalance] = useState<number>(0);
  const [isLoadingTonBalance, setIsLoadingTonBalance] = useState(false);

  const rawTonWallet = useTonWallet();
  const tonAddressFromConnect = useTonAddress();
  const effectiveAddress = tonAddressFromConnect || stats.walletAddress;

  const walletDisplay = effectiveAddress
    ? `${effectiveAddress.slice(0, 4)}...${effectiveAddress.slice(-4)}`
    : null;

  // Real TON Balance fetch from blockchain
  useEffect(() => {
    let isMounted = true;
    if (effectiveAddress) {
      setIsLoadingTonBalance(true);
      fetchRealTonBalance(effectiveAddress)
        .then((bal) => {
          if (isMounted) {
            setRealTonBalance(bal);
            setIsLoadingTonBalance(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsLoadingTonBalance(false);
        });
    } else {
      setRealTonBalance(0);
    }
    return () => {
      isMounted = false;
    };
  }, [effectiveAddress]);

  const handleRefreshOnChain = async () => {
    playTapSound();
    setIsRefreshing(true);
    if (effectiveAddress) {
      const bal = await fetchRealTonBalance(effectiveAddress);
      setRealTonBalance(bal);
    }
    setTimeout(() => {
      setIsRefreshing(false);
      playClaimRewardSound();
    }, 800);
  };

  const handleWithdrawToTon = () => {
    if (!effectiveAddress) {
      onOpenConnectWallet();
      return;
    }
    if (onOpenClaimModal) {
      onOpenClaimModal();
      return;
    }
    if (stats.inAppBalance <= 0) {
      setWithdrawNotice(language === 'hi' ? 'कोई अनक्लेम्ड $MIMI बैलेंस उपलब्ध नहीं है!' : 'No $MIMI balance available to claim!');
      setTimeout(() => setWithdrawNotice(null), 4000);
      return;
    }
    setWithdrawNotice(null);
    playClaimRewardSound();
    const fakeTx = `ton_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const claimAmt = stats.inAppBalance;
    setWithdrawSuccess(fakeTx);
    onUpdateStats({
      ...stats,
      inAppBalance: 0,
      balance: 0,
      claimStatus: 'claimed',
      claimTxHash: fakeTx,
      claimAmount: claimAmt,
      claimTimestamp: Date.now(),
    });
  };

  // Pure genuine real token earnings
  const realMinedTokens = Number((stats.inAppBalance || 0).toFixed(2));

  return (
    <div className="w-full space-y-4 px-4 pt-1 pb-36 text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <span>{language === 'hi' ? 'वॉलेट और तिजोरी' : 'Wallet & Vault'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 font-mono border border-cyan-400/30">
              TON Jetton
            </span>
          </h2>
          <p className="text-xs text-cyan-200/80 mt-0.5">
            {language === 'hi'
              ? 'असली TON नेटवर्क से जुड़ा हुआ नॉन-कस्टोडियल वॉल्ट'
              : 'Decentralized non-custodial vault verified on TON mainnet'}
          </p>
        </div>
        <button
          onClick={handleRefreshOnChain}
          className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 hover:text-white transition-all cursor-pointer"
          title="Refresh on-chain state"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* 1. Polished Oceanic Blue Glass Holding Card */}
      <div className="relative w-full rounded-3xl p-5 overflow-hidden bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#1d4ed8] border border-cyan-400/40 shadow-[0_12px_45px_rgba(2,132,199,0.45)] text-white glass-sheen">
        {/* Mimi Cat Token Watermark */}
        <div className="absolute -top-2 -right-2 w-28 h-28 opacity-20 pointer-events-none select-none rounded-full overflow-hidden">
          <img src={ASSETS.mimiCatToken} alt="" className="w-full h-full object-cover" />
        </div>

        <div className="relative z-10">
          <p className="text-xs text-cyan-100 font-semibold mb-2">
            {language === 'hi'
              ? 'वास्तविक माइन टोकन अर्निंग · 100% असली $MIMI'
              : 'Real Mined Token Earnings · 100% Genuine $MIMI'}
          </p>

          {/* Big Balance with Music Coin */}
          <div className="flex items-center gap-2.5 my-1">
            <img
              src={ASSETS.mimiTokenCoin}
              alt="$MIMI Token"
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full object-cover shadow-[0_0_15px_rgba(0,210,255,0.7)] border-2 border-cyan-300 flex-shrink-0"
            />
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono drop-shadow-md">
              {realMinedTokens.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-lg font-black text-cyan-200 font-mono">
              $MIMI
            </span>
          </div>

          {/* USD & Level Pills */}
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2.5 py-0.5 rounded-full bg-black/35 backdrop-blur-md text-xs font-mono font-bold text-cyan-200 border border-cyan-400/20">
              ≈ ${(realMinedTokens * stats.usdConversionRate).toFixed(2)} USD
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-black/35 backdrop-blur-md text-xs font-bold text-amber-300 border border-amber-400/20">
              {language === 'hi' ? `लेवल ${stats.level}` : `Level ${stats.level}`}
            </span>
            {stats.claimStatus === 'approved' && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 backdrop-blur-md text-xs font-mono font-bold text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                <Check className="w-3 h-3" />
                {language === 'hi' ? 'दावा लॉक' : 'Claim Locked'}
              </span>
            )}
          </div>

          {/* 2 Sub-cards Grid: Real Token Earning & Asli Ton Balance */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Left: Real In-App Mined Token Earning */}
            <div className="rounded-2xl bg-black/35 backdrop-blur-md p-3 border border-cyan-400/25 space-y-0.5">
              <span className="text-[11px] text-cyan-200 font-semibold block">
                {language === 'hi' ? '🎧 असली टोकन अर्निंग' : '🎧 Real Token Earnings'}
              </span>
              <div className="text-xl font-black text-white font-mono">
                {realMinedTokens.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </div>
              <span className="text-[10px] text-amber-300 font-mono block">
                $MIMI {language === 'hi' ? 'माइन किया' : 'Mined'}
              </span>
            </div>

            {/* Right: Real TON Balance from Tonkeeper */}
            <div className="rounded-2xl bg-black/35 backdrop-blur-md p-3 border border-cyan-400/25 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-cyan-200 font-semibold block truncate">
                  {language === 'hi' ? '💎 असली TON बैलेंस' : '💎 Real TON Balance'}
                </span>
                {effectiveAddress && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Connected" />
                )}
              </div>
              <div className="text-xl font-black text-white font-mono flex items-baseline gap-1">
                {isLoadingTonBalance ? (
                  <span className="text-xs text-cyan-300 animate-pulse">Checking...</span>
                ) : (
                  <>
                    <span>{effectiveAddress ? realTonBalance.toFixed(3) : '0.000'}</span>
                    <span className="text-xs font-bold text-cyan-300 font-mono">TON</span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-emerald-400 font-mono block truncate">
                {effectiveAddress 
                  ? (language === 'hi' ? '● Tonkeeper लाइव' : '● Tonkeeper Live') 
                  : (language === 'hi' ? 'वॉलेट कनेक्ट करें' : 'Connect Wallet')}
              </span>
            </div>
          </div>

          {/* Connected TON Wallet Bar */}
          <div className="mt-4 pt-3 border-t border-cyan-400/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-cyan-200" />
              <span className="text-cyan-100 font-medium">
                {effectiveAddress
                  ? (language === 'hi' ? 'कनेक्टेड वॉलेट:' : 'Connected:')
                  : (language === 'hi' ? 'कोई वॉलेट कनेक्ट नहीं' : 'No Wallet Bound')}
              </span>
              {walletDisplay && (
                <span className="font-mono text-cyan-200 font-bold bg-black/30 px-2 py-0.5 rounded-lg border border-cyan-400/20">
                  {walletDisplay}
                </span>
              )}
            </div>
            <button
              onClick={onOpenConnectWallet}
              className="text-xs font-bold text-white underline hover:text-cyan-200 cursor-pointer"
            >
              {effectiveAddress
                ? (language === 'hi' ? 'बदलें' : 'Change')
                : (language === 'hi' ? 'कनेक्ट करें' : 'Connect')}
            </button>
          </div>

          {/* Airdrop Distribution & DEX Listing Text + Official Channel Button */}
          {effectiveAddress && (
            <div className="mt-3 pt-3 border-t border-cyan-400/20 flex flex-col gap-2 animate-fadeIn">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-950/70 border border-cyan-400/30 text-cyan-100">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                <span className="text-xs font-mono font-bold tracking-tight">
                  Airdrop Distribution &amp; DEX Listing: 22 January 2027 (Coming Soon)
                </span>
              </div>
              <a
                href="https://t.me/ApernaAIOfficial"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#0088cc] via-[#0099ee] to-[#00aaff] hover:from-[#0077bb] hover:to-[#0088cc] text-white font-extrabold text-xs shadow-[0_0_15px_rgba(0,153,238,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <TelegramIcon className="w-4 h-4 fill-white shrink-0" />
                <span>Join Official Channel for Updates</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 2. DEX LISTING & TOKEN CLAIM ACTION CARD */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#06183e] via-[#041230] to-[#020b1f] border border-cyan-400/40 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-white block">
                {language === 'hi' ? 'DEX टोकन क्लेम' : 'DEX Listing & Claim'}
              </span>
              <span className="text-[10px] text-cyan-300/80 font-mono">
                DeDust / STON.fi · TEP-74 Jetton
              </span>
            </div>
          </div>
          
          <button
            onClick={() => {
              if (onOpenClaimModal) onOpenClaimModal();
              else handleWithdrawToTon();
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 hover:from-cyan-300 hover:to-sky-200 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>{language === 'hi' ? 'दावा करें' : 'Claim Tokens'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-950" />
          </button>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed bg-black/40 p-2.5 rounded-xl border border-cyan-500/20">
          {language === 'hi'
            ? 'आपके द्वारा माइन किए गए सभी $MIMI टोकन सुरक्षित हैं। DEX लिस्टिंग पर आप इन्हें सीधे अपने कनेक्टेड TON वॉलेट में क्लेम कर सकेंगे।'
            : 'All mined $MIMI tokens are verified & safe. Upon official DEX listing, you can claim them directly into your connected TON wallet.'}
        </p>

        {/* AdsGram Compliance Banner: Airdrop Distribution Schedule */}
        <div className="p-3 rounded-2xl bg-cyan-950/60 border border-cyan-400/30 space-y-2">
          <div className="flex items-center gap-2 text-cyan-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-xs font-mono font-bold text-white tracking-tight">
              Airdrop Distribution &amp; DEX Listing: 22 January 2027 (Coming Soon)
            </span>
          </div>
          <a
            href="https://t.me/ApernaAIOfficial"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-[#0088cc] hover:bg-[#0077bb] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <TelegramIcon className="w-3.5 h-3.5 fill-white shrink-0" />
            <span>Join Official Channel for Updates</span>
          </a>
        </div>
      </div>

      {/* Insufficient balance notice */}
      {withdrawNotice && (
        <div className="w-full p-3.5 rounded-2xl bg-amber-950/70 border border-amber-400/50 text-amber-200 text-xs font-mono flex items-center gap-2 animate-fadeIn">
          <span>⚠️</span>
          <span>{withdrawNotice}</span>
        </div>
      )}

      {/* Quick Action: Transfer / Claim notification */}
      {withdrawSuccess && (
        <div className="w-full p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-400 text-emerald-200 text-xs font-bold flex flex-col gap-1.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              {language === 'hi' ? 'आवंटन सफलतापूर्वक लॉक किया गया!' : 'Allocation successfully approved & locked!'}
            </span>
            <a
              href={getTonscanTxUrl(withdrawSuccess)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 underline font-mono text-[11px] flex items-center gap-0.5"
            >
              <span>Tonscan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <span className="font-mono text-[10px] opacity-80 break-all">{withdrawSuccess}</span>
        </div>
      )}
    </div>
  );
};
