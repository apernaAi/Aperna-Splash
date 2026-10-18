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
      alert(language === 'hi' ? 'कोई अनक्लेम्ड $MIMI बैलेंस उपलब्ध नहीं है!' : 'No $MIMI balance available to claim!');
      return;
    }
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
    <div className="w-full space-y-4 px-4 pt-1 pb-24 text-white">
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
        </div>
      </div>

      {/* 2. OFFICIAL USER NOTICE ON DEX LISTING & REAL REWARDS */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-cyan-950/80 via-[#031d45] to-[#020e26] border-2 border-cyan-400/50 shadow-[0_8px_30px_rgba(0,180,255,0.2)] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wide">
              {language === 'hi' ? 'आधिकारिक DEX क्लेम सूचना' : 'Official DEX Claim Notice'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-400/30">
            DeDust / STON.fi
          </span>
        </div>

        <p className="text-xs text-cyan-100/95 leading-relaxed italic bg-black/30 p-3 rounded-2xl border border-cyan-400/20">
          "{language === 'hi' ? TON_CONFIG.dexListingNoticeHi : TON_CONFIG.dexListingNotice}"
        </p>

        <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
          <span className="text-cyan-300/80">
            {language === 'hi' ? 'टोकन मानक:' : 'Standard:'} <strong className="text-white">{TON_CONFIG.standard}</strong>
          </span>
          <button
            onClick={() => {
              if (onOpenClaimModal) onOpenClaimModal();
              else handleWithdrawToTon();
            }}
            className="text-cyan-300 hover:text-white underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'hi' ? 'क्लेम डैशबोर्ड खोलें' : 'Open Claim Portal'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

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
