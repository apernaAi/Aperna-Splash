import React, { useEffect } from 'react';
import { Gift, Zap, Wallet, Sparkles, CheckCircle2, ShieldCheck, X, ArrowRight, ExternalLink } from 'lucide-react';
import { Language } from '../types/airdrop.ts';
import { playClaimRewardSound, playTapSound, triggerHaptic } from '../utils/audioEngine.ts';

export interface RewardCelebrationItem {
  label: string;
  value: string;
  isHighlight?: boolean;
}

export interface RewardCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  category?: 'referral' | 'commission' | 'wallet' | 'airdrop' | 'task' | 'general';
  badgeText?: string;
  title: string;
  subtitle: string;
  amount?: number | string;
  tokenSymbol?: string;
  usdValue?: string;
  walletAddress?: string;
  txHash?: string;
  items?: RewardCelebrationItem[];
  actionText?: string;
  language?: Language;
}

export const RewardClaimCelebrationModal: React.FC<RewardCelebrationProps> = ({
  isOpen,
  onClose,
  category = 'referral',
  badgeText,
  title,
  subtitle,
  amount,
  tokenSymbol = '$MIMI',
  usdValue,
  walletAddress,
  txHash,
  items,
  actionText,
  language = 'en',
}) => {
  useEffect(() => {
    if (isOpen) {
      playClaimRewardSound();
      triggerHaptic('heavy');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getCategoryConfig = () => {
    switch (category) {
      case 'wallet':
        return {
          icon: <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-300" />,
          gradientBorder: 'border-cyan-400',
          glowColor: 'rgba(0,210,255,0.7)',
          haloGradient: 'from-cyan-400 via-sky-300 to-blue-500',
          defaultBadge: language === 'hi' ? '🛡️ TON वॉलेट कनेक्टेड' : '🛡️ TON WALLET CONNECTED',
          buttonGradient: 'from-cyan-400 via-sky-300 to-blue-500 hover:from-cyan-300 hover:to-blue-400',
        };
      case 'commission':
        return {
          icon: <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300 fill-amber-300/30" />,
          gradientBorder: 'border-amber-400',
          glowColor: 'rgba(245,158,11,0.7)',
          haloGradient: 'from-amber-400 via-yellow-300 to-orange-500',
          defaultBadge: language === 'hi' ? '⚡ 10% स्क्वाड रॉयल्टी' : '⚡ 10% SQUAD ROYALTY',
          buttonGradient: 'from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-400',
        };
      case 'airdrop':
        return {
          icon: <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-300" />,
          gradientBorder: 'border-cyan-400',
          glowColor: 'rgba(56,189,248,0.7)',
          haloGradient: 'from-sky-400 via-cyan-300 to-emerald-400',
          defaultBadge: language === 'hi' ? '💎 DEX टोकन आवंटन' : '💎 DEX ALLOCATION LOCKED',
          buttonGradient: 'from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300',
        };
      case 'referral':
      default:
        return {
          icon: <Gift className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300" />,
          gradientBorder: 'border-amber-400',
          glowColor: 'rgba(251,191,36,0.7)',
          haloGradient: 'from-amber-400 via-yellow-300 to-orange-400',
          defaultBadge: language === 'hi' ? '🎁 असली रिक्रूट रिवॉर्ड' : '🎁 SQUAD RECRUIT REWARD',
          buttonGradient: 'from-amber-400 via-yellow-300 to-cyan-400 hover:from-amber-300 hover:to-cyan-300',
        };
    }
  };

  const config = getCategoryConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/90 backdrop-blur-2xl animate-fadeIn select-none">
      <div
        className={`relative w-full max-w-sm bg-gradient-to-b from-[#0c2a68] via-[#06183e] to-[#020b1f] border-2 ${config.gradientBorder} rounded-3xl p-5 sm:p-6 text-white text-center shadow-[0_0_70px_${config.glowColor}] overflow-hidden animate-scaleIn`}
      >
        {/* Ambient Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,210,255,0.22)_0%,transparent_70%)] pointer-events-none" />

        {/* Floating Sparks Particles */}
        <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-cyan-500/20 blur-xl pointer-events-none" />
        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-amber-500/20 blur-xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            playTapSound();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-cyan-200 hover:text-white transition-colors cursor-pointer z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Glowing Badge & Icon */}
        <div className="relative mx-auto w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr p-1 flex items-center justify-center mb-3 shadow-[0_0_40px_rgba(0,210,255,0.7)] animate-bounce">
          <div className={`w-full h-full rounded-full bg-[#051538] flex items-center justify-center p-1 border border-cyan-400/40`}>
            {config.icon}
          </div>
        </div>

        {/* Category Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[10px] sm:text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase mb-2">
          <span>{badgeText || config.defaultBadge}</span>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_0_15px_rgba(0,210,255,0.8)] leading-tight">
          {title}
        </h2>

        {/* Subtitle */}
        <p className="text-xs sm:text-[13px] text-cyan-100/90 mt-1.5 mb-3 leading-snug px-1">
          {subtitle}
        </p>

        {/* Reward Big Display Box (if amount present) */}
        {amount !== undefined && (
          <div className="my-3 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/15 to-cyan-500/20 border border-amber-400/50 shadow-[0_0_25px_rgba(251,191,36,0.25)] relative overflow-hidden">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300/80 font-bold block mb-0.5">
              {language === 'hi' ? 'क्रेडिटेड रिवॉर्ड' : 'REWARD CREDITED'}
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-cyan-300 font-mono tracking-tight drop-shadow-[0_2px_12px_rgba(251,191,36,0.6)]">
                {typeof amount === 'number' && amount > 0 ? `+${amount.toLocaleString()}` : amount}
              </span>
              <span className="text-sm sm:text-base font-black text-cyan-200 font-mono">
                {tokenSymbol}
              </span>
            </div>
            {usdValue && (
              <span className="text-[11px] text-emerald-300 font-mono font-semibold block mt-0.5">
                ≈ {usdValue}
              </span>
            )}
          </div>
        )}

        {/* Details Checklist Table */}
        {items && items.length > 0 && (
          <div className="my-3 p-3 rounded-2xl bg-[#071d47]/80 border border-cyan-400/30 text-left space-y-2 text-xs">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-200/80 text-[11px]">{item.label}</span>
                <span className={`font-bold ${item.isHighlight ? 'text-amber-300' : 'text-white'}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Blockchain Proof / Tonscan link if present */}
        {txHash && (
          <div className="my-2 p-2 rounded-xl bg-black/40 border border-cyan-500/20 flex items-center justify-between text-[11px] text-cyan-200">
            <span className="flex items-center gap-1 font-mono text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>TX: {txHash.slice(0, 12)}...</span>
            </span>
            <a
              href={`https://tonscan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 underline font-mono text-[10px] flex items-center gap-0.5"
            >
              <span>Tonscan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-3 py-1 text-[10px] font-mono text-cyan-300/80">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'hi' ? 'बैलेंस में तत्काल अपडेट' : 'Instant Balance Credit'}</span>
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'hi' ? 'TON लेजर रिकॉर्डेड' : 'TON Ledger Verified'}</span>
          </span>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => {
            playTapSound();
            onClose();
          }}
          className={`w-full mt-3 py-3 rounded-2xl bg-gradient-to-r ${config.buttonGradient} text-slate-950 font-black text-xs sm:text-sm tracking-wider shadow-[0_0_25px_rgba(0,210,255,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer`}
        >
          <span>
            {actionText || (language === 'hi' ? 'शानदार! टोकन प्राप्त करें' : 'Awesome! Collect & Continue')}
          </span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>
      </div>
    </div>
  );
};
