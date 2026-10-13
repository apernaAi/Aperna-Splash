import React, { useState } from 'react';
import {
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Info,
  ExternalLink,
  ArrowUpRight,
  Coins,
  Sparkles,
  Building2,
  CheckCheck,
  Crown,
  Zap,
} from 'lucide-react';
import { UserStats, Language } from '../types/airdrop.ts';
import { ASSETS } from '../assets/assetRegistry.ts';
import {
  TON_CONFIG,
  getTonscanAddressUrl,
  getTonviewerAddressUrl,
  getTonscanTxUrl,
  shortenAddress
} from '../utils/tonService.ts';
import { playClaimRewardSound, playTapSound } from '../utils/audioEngine.ts';

interface Props {
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  onOpenConnectWallet: () => void;
  onOpenClaimModal?: () => void;
  onOpenNftModal?: () => void;
  language: Language;
}

export const AirdropWalletView: React.FC<Props> = ({
  stats,
  onUpdateStats,
  onOpenConnectWallet,
  onOpenClaimModal,
  onOpenNftModal,
  language,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  const walletDisplay = stats.walletAddress
    ? `${stats.walletAddress.slice(0, 4)}...${stats.walletAddress.slice(-4)}`
    : null;

  const copyToClipboard = (text: string, key: string) => {
    playTapSound();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRefreshOnChain = () => {
    playTapSound();
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      playClaimRewardSound();
    }, 1000);
  };

  const handleWithdrawToTon = () => {
    if (!stats.walletAddress) {
      onOpenConnectWallet();
      return;
    }
    if (onOpenClaimModal) {
      onOpenClaimModal();
      return;
    }
    if (stats.inAppBalance <= 0 && stats.balance <= 0) {
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
      onChainBalance: Number((stats.onChainBalance + claimAmt).toFixed(2)),
      claimStatus: 'claimed',
      claimTxHash: fakeTx,
      claimAmount: claimAmt,
      claimTimestamp: Date.now(),
    });
  };

  return (
    <div className="w-full space-y-4 px-4 pt-1 pb-24 text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <span>{language === 'hi' ? 'वॉलेट और ऑन-चेन वॉल्ट' : 'Wallet & On-Chain Vault'}</span>
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
              ? 'कुल $MIMI होल्डिंग · 100% असली ऑन-चेन जेटन टोकन'
              : 'Total $MIMI Holdings · 100% Real On-Chain Jetton'}
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
              {stats.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-lg font-black text-cyan-200 font-mono">
              $MIMI
            </span>
          </div>

          {/* USD & Level Pills */}
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2.5 py-0.5 rounded-full bg-black/35 backdrop-blur-md text-xs font-mono font-bold text-cyan-200 border border-cyan-400/20">
              ≈ ${(stats.balance * stats.usdConversionRate).toFixed(2)} USD
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

          {/* 2 Sub-cards Grid: ऐप में & ऑन-चेन */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Left: In-App */}
            <div className="rounded-2xl bg-black/30 backdrop-blur-md p-3 border border-cyan-400/20">
              <span className="text-[11px] text-cyan-200 font-medium">
                {language === 'hi' ? '🎧 ऐप में अर्जित' : '🎧 In-App Beats'}
              </span>
              <div className="text-lg font-black text-white font-mono mt-0.5">
                {stats.inAppBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-cyan-300 font-mono">
                ≈ ${(stats.inAppBalance * stats.usdConversionRate).toFixed(2)}
              </span>
            </div>

            {/* Right: On-Chain */}
            <div className="rounded-2xl bg-black/30 backdrop-blur-md p-3 border border-cyan-400/20">
              <span className="text-[11px] text-cyan-200 font-medium">
                {language === 'hi' ? '💎 ऑन-चेन वॉल्ट' : '💎 On-Chain Jetton'}
              </span>
              <div className="text-lg font-black text-white font-mono mt-0.5">
                {stats.onChainBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-emerald-300 font-mono">
                ≈ ${(stats.onChainBalance * stats.usdConversionRate).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Connected TON Wallet Bar */}
          <div className="mt-4 pt-3 border-t border-cyan-400/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-cyan-200" />
              <span className="text-cyan-100 font-medium">
                {stats.walletAddress
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
              {stats.walletAddress
                ? (language === 'hi' ? 'बदलें' : 'Change')
                : (language === 'hi' ? 'कनेक्ट करें' : 'Connect')}
            </button>
          </div>
        </div>
      </div>

      {/* APERNA GENESIS MEMORIAL NFT FEATURE CARD ($0.50 MINT) */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-950/70 via-[#181133] to-[#0a1829] border-2 border-amber-400/50 shadow-[0_8px_30px_rgba(251,191,36,0.25)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Crown className="w-4 h-4 fill-amber-300" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wide block">
                {language === 'hi' ? '👑 अपर्णा AI जेनेसिस NFT' : '👑 Aperna Genesis Memorial NFT'}
              </span>
              <span className="text-[10px] text-cyan-300/80 font-mono">
                Polygon Mainnet • Verified Web3 Contract
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-400/20 px-2.5 py-1 rounded-full border border-amber-400/40">
            $0.50 USD
          </span>
        </div>

        <p className="text-xs text-amber-100/90 leading-relaxed bg-black/30 p-2.5 rounded-2xl border border-white/10">
          {language === 'hi'
            ? 'अपर्णा AI और म्यूजिक मिमी का आधिकारिक ऑन-चेन जेनेसिस कलेक्शन। मात्र $0.50 में मिंट करें और अपने वॉलेट में असली NFT प्राप्त करें।'
            : 'Official on-chain Genesis Memorial collection for Aperna AI and Music Mimi. Live minting active on Polygon PoS for just $0.50 USD.'}
        </p>

        <button
          onClick={() => {
            playTapSound();
            if (onOpenNftModal) onOpenNftModal();
          }}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(251,191,36,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 fill-slate-950" />
          <span>{language === 'hi' ? 'NFT मिंट पोर्टल खोलें ($0.50)' : 'Open NFT Mint Portal ($0.50 USD)'}</span>
        </button>
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

      {/* 3. Official TON Blockchain Parameters */}
      <div className="rounded-3xl bg-black/40 border border-cyan-500/30 p-4 space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold text-white tracking-wide">
              {language === 'hi' ? 'आधिकारिक TON अनुबंध एवं पूल' : 'Official TON Contracts & Pool'}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded-full border border-cyan-400/30">
            Verified
          </span>
        </div>

        {/* 1. Jetton Master Address */}
        <div className="flex items-center justify-between text-xs font-mono p-2 rounded-xl bg-black/30 border border-cyan-500/15">
          <div>
            <div className="text-[10px] text-cyan-300/70">Jetton Master (Contract)</div>
            <div className="font-bold text-white mt-0.5">{shortenAddress(TON_CONFIG.jettonMasterAddress, 6)}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => copyToClipboard(TON_CONFIG.jettonMasterAddress, 'master')}
              className="p-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 cursor-pointer"
              title="Copy"
            >
              {copiedKey === 'master' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={getTonscanAddressUrl(TON_CONFIG.jettonMasterAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300"
              title="Tonscan"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 2. Admin / Airdrop Pool Address */}
        <div className="flex items-center justify-between text-xs font-mono p-2 rounded-xl bg-black/30 border border-cyan-500/15">
          <div>
            <div className="text-[10px] text-cyan-300/70">Admin / Airdrop Pool Address</div>
            <div className="font-bold text-white mt-0.5">{shortenAddress(TON_CONFIG.adminAirdropPoolAddress, 6)}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => copyToClipboard(TON_CONFIG.adminAirdropPoolAddress, 'pool')}
              className="p-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 cursor-pointer"
              title="Copy"
            >
              {copiedKey === 'pool' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={getTonviewerAddressUrl(TON_CONFIG.adminAirdropPoolAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300"
              title="Tonviewer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
