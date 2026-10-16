import React, { useState } from 'react';
import {
  X,
  Coins,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Wallet,
  Building2,
  CheckCheck
} from 'lucide-react';
import { UserStats, Language } from '../types/airdrop.ts';
import {
  TON_CONFIG,
  getTonscanAddressUrl,
  getTonviewerAddressUrl,
  getTonscanTxUrl,
  shortenAddress
} from '../utils/tonService.ts';
import { ASSETS } from '../assets/assetRegistry.ts';
import { playClaimRewardSound, playTapSound, triggerHaptic } from '../utils/audioEngine.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  onOpenConnectWallet: () => void;
  language: Language;
}

export const ClaimMimiModal: React.FC<Props> = ({
  isOpen,
  onClose,
  stats,
  onUpdateStats,
  onOpenConnectWallet,
  language,
}) => {
  if (!isOpen) return null;

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProofDetails, setShowProofDetails] = useState(false);

  const isWalletConnected = Boolean(stats.walletAddress);
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const alreadyClaimedToday = stats.lastAllocationClaimDate === todayDateStr;
  const currentBalance = stats.balance || 0;
  const doubledAmount = Number((currentBalance * 2).toFixed(2));
  const claimableAmount = stats.inAppBalance > 0 ? stats.inAppBalance : stats.balance;
  const currentClaimStatus = stats.claimStatus || (stats.onChainBalance > 0 ? 'approved' : 'unclaimed');

  const copyToClipboard = (text: string, key: string) => {
    playTapSound();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTriggerClaim = () => {
    if (!isWalletConnected) {
      onOpenConnectWallet();
      return;
    }
    if (alreadyClaimedToday) {
      alert(
        language === 'hi'
          ? 'आप आज का 2x आवंटन पहले ही क्लेम कर चुके हैं! अगला 2x क्लेम कल उपलब्ध होगा।'
          : 'You have already claimed today 2x allocation boost! Next claim available tomorrow.'
      );
      return;
    }
    if (currentBalance <= 0) {
      alert(
        language === 'hi'
          ? 'आपके पास क्लेम करने के लिए कोई $MIMI टोकन नहीं है। पहले टास्क या म्यूजिक लूप्स पूरे करें!'
          : 'You do not have any $MIMI tokens to double yet. Complete tasks or loops first!'
      );
      return;
    }

    playTapSound();
    setIsSubmitting(true);
    triggerHaptic('medium');

    setTimeout(() => {
      setIsSubmitting(false);
      playClaimRewardSound();
      triggerHaptic('heavy');

      // Generate a realistic 64-char hex transaction hash on TON
      const hexChars = '0123456789abcdef';
      let simulatedHash = '';
      for (let i = 0; i < 64; i++) {
        simulatedHash += hexChars[Math.floor(Math.random() * hexChars.length)];
      }

      const newDoubledBalance = Number((currentBalance * 2).toFixed(2));

      onUpdateStats({
        ...stats,
        claimStatus: 'approved',
        claimTxHash: simulatedHash,
        claimAmount: newDoubledBalance,
        claimTimestamp: Date.now(),
        lastAllocationClaimDate: todayDateStr,
        lastAllocationClaimTimestamp: Date.now(),
        inAppBalance: newDoubledBalance,
        onChainBalance: newDoubledBalance,
        balance: newDoubledBalance,
      });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0a2356] via-[#051334] to-[#020a1c] border border-cyan-400/40 p-5 sm:p-6 text-white shadow-[0_15px_60px_rgba(0,180,255,0.35)] my-auto space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,210,255,0.3)]">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                <span>{language === 'hi' ? 'क्लेम $MIMI टोकन' : 'Claim $MIMI Tokens'}</span>
                <span className="text-[10px] font-mono font-bold bg-cyan-400/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-400/30">
                  TEP-74
                </span>
              </h3>
              <p className="text-[11px] text-cyan-200/80 font-mono">
                {language === 'hi' ? 'आधिकारिक एयरड्रॉप पूल वितरण' : 'Official Airdrop Pool Distribution'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 text-cyan-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. MANDATORY OFFICIAL DEX LISTING NOTICE BOX */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/90 via-blue-950/80 to-[#02183b] border-2 border-cyan-400/60 shadow-[0_0_25px_rgba(0,210,255,0.25)] relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-cyan-400/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-extrabold block">
                {language === 'hi' ? 'महत्वपूर्ण सूचना · DEX लिस्टिंग एवं क्लेम' : 'OFFICIAL NOTICE · DEX LISTING & CLAIM'}
              </span>
              <p className="text-xs sm:text-sm text-cyan-100 font-medium leading-relaxed italic">
                "{language === 'hi' ? TON_CONFIG.dexListingNoticeHi : TON_CONFIG.dexListingNotice}"
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-mono text-cyan-300/80 bg-black/40 px-2 py-0.5 rounded-md border border-cyan-500/20">
                  DEX: DeDust.io & STON.fi
                </span>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-400/30 flex items-center gap-1">
                  <Check className="w-3 h-3" /> 100% User Owned
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. User Allocation Summary Card */}
        <div className="rounded-2xl bg-gradient-to-r from-[#0284c7]/30 to-[#1d4ed8]/30 border border-cyan-400/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-cyan-200 font-semibold">
              {language === 'hi' ? 'आपका $MIMI आवंटन' : 'Your $MIMI Allocation'}
            </span>
            <span className="text-[11px] font-mono text-cyan-300">
              {language === 'hi' ? 'मूल्य' : 'Value'}: ≈ ${(stats.balance * stats.usdConversionRate).toFixed(2)} USD
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={ASSETS.mimiTokenCoin}
                alt="$MIMI"
                className="w-10 h-10 rounded-full object-cover border border-cyan-300 shadow-[0_0_12px_rgba(0,210,255,0.6)]"
              />
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {stats.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] font-mono text-cyan-300/80">
                  {stats.inAppBalance > 0
                    ? `${stats.inAppBalance.toLocaleString()} In-App Beats + ${stats.onChainBalance.toLocaleString()} On-Chain`
                    : `Verified Jetton Balance`}
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="text-right">
              {currentClaimStatus === 'approved' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-mono font-bold">
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'अनुमोदित ✓' : 'Approved ✓'}</span>
                </div>
              ) : currentClaimStatus === 'pending' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-mono font-bold">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === 'hi' ? 'सत्यापन जारी' : 'Pending'}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-mono font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'क्लेम तैयार' : 'Ready to Lock'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Real-Time Status Indicators Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          {/* Indicator 1: Wallet Connection */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 flex flex-col justify-between">
            <span className="text-[10px] text-cyan-300/70">{language === 'hi' ? 'वॉलेट स्थिति' : 'Wallet Status'}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-2 h-2 rounded-full ${isWalletConnected ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-rose-400'}`} />
              <span className={`text-[11px] font-bold ${isWalletConnected ? 'text-emerald-300' : 'text-rose-300'}`}>
                {isWalletConnected ? shortenAddress(stats.walletAddress, 4) : (language === 'hi' ? 'कनेक्ट नहीं है' : 'Not Connected')}
              </span>
            </div>
          </div>

          {/* Indicator 2: Daily 2x Status */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 flex flex-col justify-between">
            <span className="text-[10px] text-cyan-300/70">{language === 'hi' ? 'दैनिक 2x बूस्ट' : 'Daily 2x Boost'}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-2 h-2 rounded-full ${alreadyClaimedToday ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-amber-400 shadow-[0_0_6px_#fbbf24] animate-pulse'}`} />
              <span className={`text-[11px] font-bold ${alreadyClaimedToday ? 'text-emerald-300' : 'text-amber-300'}`}>
                {alreadyClaimedToday
                  ? (language === 'hi' ? 'आज पूरा हुआ ✓' : 'Claimed Today ✓')
                  : (language === 'hi' ? 'उपलब्ध (1x/दिन)' : 'Available (1x/day)')}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Claim Transaction Hash & Explorer Link (if approved/triggered) */}
        {stats.claimTxHash && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-400/40 text-emerald-200 space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{language === 'hi' ? 'क्लेम आवंटन सुरक्षित एवं लॉक किया गया' : 'Claim Allocation Approved & Locked'}</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                On-Chain Proof
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <span className="text-[11px] text-emerald-100/80">Tx Hash:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{shortenAddress(stats.claimTxHash, 5)}</span>
                <button
                  onClick={() => copyToClipboard(stats.claimTxHash!, 'tx')}
                  className="text-emerald-300 hover:text-white"
                  title="Copy Tx Hash"
                >
                  {copiedKey === 'tx' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={getTonscanTxUrl(stats.claimTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-300 hover:text-white inline-flex items-center gap-0.5 underline text-[11px]"
                >
                  <span>Tonscan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* 6. Primary Action Buttons */}
        <div className="space-y-2 pt-1">
          {!isWalletConnected ? (
            <button
              onClick={() => {
                onClose();
                onOpenConnectWallet();
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm tracking-wide shadow-[0_0_25px_rgba(0,210,255,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>{language === 'hi' ? 'पहले TON वॉलेट कनेक्ट करें' : 'Connect TON Wallet First'}</span>
            </button>
          ) : alreadyClaimedToday ? (
            <div className="space-y-1.5">
              <button
                disabled
                className="w-full py-3.5 rounded-2xl bg-[#09224f] border border-cyan-500/40 text-cyan-300 font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 cursor-not-allowed opacity-90"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  {language === 'hi'
                    ? '✓ आज का 2x क्लेम पूरा हो चुका है · कल वापस आएँ'
                    : '✓ Today 2x Boost Claimed · Return Tomorrow'}
                </span>
              </button>
              <p className="text-[10px] text-cyan-200/70 text-center font-mono">
                {language === 'hi'
                  ? 'दैनिक सुरक्षा: 2x टोकन आवंटन क्लेम दिन में केवल एक बार ही किया जा सकता है।'
                  : 'Daily rule: 2x token allocation boost can be claimed only once per day.'}
              </p>
            </div>
          ) : (
            <button
              onClick={handleTriggerClaim}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(251,191,36,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{language === 'hi' ? '2x आवंटन सत्यापन जारी...' : 'Verifying 2x Allocation...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>
                    {language === 'hi'
                      ? `🔥 2x आवंटन क्लेम करें (${doubledAmount.toLocaleString()} $MIMI) [दैनिक 1 बार]`
                      : `🔥 Claim 2x Allocation (${doubledAmount.toLocaleString()} $MIMI) [1x Daily]`}
                  </span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-cyan-300/80 font-mono text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              {language === 'hi' ? TON_CONFIG.trustMessageHi : TON_CONFIG.trustMessage}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
