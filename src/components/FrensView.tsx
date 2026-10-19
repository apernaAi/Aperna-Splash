import React, { useState } from 'react';
import {
  Copy,
  Check,
  Users,
  Gift,
  Percent,
  Edit2,
  Share2,
  Coins,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
  Link2,
  Clock,
  Flame,
  CheckCircle2,
  TrendingUp,
  Camera,
} from 'lucide-react';
import { UserStats, RealReferral, Language } from '../types/airdrop.ts';
import { ASSETS } from '../assets/assetRegistry.ts';
import { TON_CONFIG } from '../utils/tonService.ts';
import { playClaimRewardSound, playTapSound, triggerHaptic } from '../utils/audioEngine.ts';
import {
  bindManualReferral,
  claimSquadReferralRewards,
  claimDaily10PercentCommission,
  updateUserProfileData,
} from '../utils/referralCloudService.ts';
import { TelegramIcon } from './TelegramIcon.tsx';
import { ProfileAvatarModal } from './ProfileAvatarModal.tsx';

interface Props {
  stats: UserStats;
  referrals: RealReferral[];
  onUpdateStats: (newStats: UserStats) => void;
  onOpenClaimModal?: () => void;
  onOpenNftPage?: () => void;
  language: Language;
}

export const FrensView: React.FC<Props> = ({
  stats,
  referrals,
  onUpdateStats,
  onOpenClaimModal,
  onOpenNftPage,
  language,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [tempName, setTempName] = useState(stats.name);
  const [tempUsername, setTempUsername] = useState(stats.telegramUsername || '@mimi_user');
  const todayDateStr = new Date().toISOString().slice(0, 10);

  // Sub-page Modals
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showRecruitsModal, setShowRecruitsModal] = useState(false);
  const [showBindModal, setShowBindModal] = useState(false);

  // Manual Referral Binder state
  const [manualCode, setManualCode] = useState('');
  const [isBinding, setIsBinding] = useState(false);
  const [bindResult, setBindResult] = useState<{ message: string; success: boolean } | null>(null);

  // Claim loaders
  const [isClaimingBonus, setIsClaimingBonus] = useState(false);
  const [isClaimingCommission, setIsClaimingCommission] = useState(false);

  // Strictly REAL recruits from Firestore — absolutely NO fake/mock data
  const realRecruitsCount = referrals.length;

  // 1. Referral Recruit Bonus (+100 $MIMI per genuine recruit)
  const totalEarnableBonus = realRecruitsCount * 100;
  const alreadyClaimedBonus = stats.claimedReferralBonus || 0;
  const claimableBonus = Math.max(0, totalEarnableBonus - alreadyClaimedBonus);

  // 2. Daily 10% Squad Royalty Commission (10% of real recruits' daily yields)
  const dailyCommissionAmount = Number((realRecruitsCount * 10).toFixed(2));
  const isCommissionClaimedToday = stats.lastCommissionClaimDate === todayDateStr;

  const referralLink = `https://t.me/Musicmimi_bot/app?startapp=ref_${stats.userId}`;

  const handleCopyLink = () => {
    playTapSound();
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    playTapSound();
    navigator.clipboard.writeText(stats.userId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareTelegram = () => {
    playTapSound();
    const shareText = encodeURIComponent(
      language === 'hi'
        ? `🔥 म्यूजिक मिमी ($MIMI) में मेरे साथ जुड़ें और तुरंत 100 $MIMI टोकन प्राप्त करें!`
        : `🔥 Join my music crew in Music Mimi ($MIMI) and claim 100 $MIMI tokens instantly!`
    );
    const fullShareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${shareText}`;
    if (typeof window !== 'undefined') {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(fullShareUrl);
        return;
      }
    }
    window.open(fullShareUrl, '_blank');
  };

  const handleSaveName = async () => {
    const cleanName = tempName.trim() || stats.name;
    const cleanHandle = tempUsername.trim()
      ? (tempUsername.trim().startsWith('@') ? tempUsername.trim() : `@${tempUsername.trim()}`)
      : (stats.telegramUsername || '@mimi_user');

    if (typeof window !== 'undefined') {
      localStorage.setItem('mimi_permanent_user_name', cleanName);
      localStorage.setItem('mimi_permanent_user_username', cleanHandle);
      localStorage.setItem('music_mimi_tg_name', cleanName);
      localStorage.setItem('music_mimi_tg_username', cleanHandle);
      if (stats.avatarUrl) {
        localStorage.setItem('mimi_permanent_avatar_url', stats.avatarUrl);
      }
    }

    // Persist permanently in Firestore so future applet updates NEVER revert name to default
    updateUserProfileData(stats.userId, {
      name: cleanName,
      telegramUsername: cleanHandle,
      avatarUrl: stats.avatarUrl,
    }).catch(console.error);

    onUpdateStats({
      ...stats,
      name: cleanName,
      telegramUsername: cleanHandle,
    });
    setIsEditingName(false);
  };

  // Claim 100 $MIMI per real recruit
  const handleClaimReferralBonus = async () => {
    if (claimableBonus <= 0) return;
    setIsClaimingBonus(true);
    playTapSound();
    triggerHaptic('medium');

    try {
      const res = await claimSquadReferralRewards(stats.userId, realRecruitsCount, alreadyClaimedBonus);
      playClaimRewardSound();
      triggerHaptic('heavy');

      const newInApp = Number(((stats.inAppBalance || 0) + res.amountAwarded).toFixed(2));
      const newTotal = Number(((stats.balance || 0) + res.amountAwarded).toFixed(2));

      onUpdateStats({
        ...stats,
        balance: newTotal,
        inAppBalance: newInApp,
        claimedReferralBonus: res.newTotalClaimed,
        recruitsCount: realRecruitsCount,
      });

      alert(
        language === 'hi'
          ? `बधाई! आपके असली रेफरल्स का +${res.amountAwarded} $MIMI टोकन बोनस आपके बैलेंस में क्रेडिट हो गया है!`
          : `Congratulations! +${res.amountAwarded} $MIMI referral bonus credited to your balance!`
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsClaimingBonus(false);
    }
  };

  // Claim Daily 10% Squad Royalty
  const handleClaimDailyCommission = async () => {
    if (isCommissionClaimedToday || realRecruitsCount === 0) return;
    setIsClaimingCommission(true);
    playTapSound();
    triggerHaptic('medium');

    try {
      const res = await claimDaily10PercentCommission(stats.userId, realRecruitsCount);
      playClaimRewardSound();
      triggerHaptic('heavy');

      const newInApp = Number(((stats.inAppBalance || 0) + res.commissionAwarded).toFixed(2));
      const newTotal = Number(((stats.balance || 0) + res.commissionAwarded).toFixed(2));
      const newCommission = Number(((stats.commissionEarned || 0) + res.commissionAwarded).toFixed(2));

      onUpdateStats({
        ...stats,
        balance: newTotal,
        inAppBalance: newInApp,
        commissionEarned: newCommission,
        lastCommissionClaimDate: todayDateStr,
        recruitsCount: realRecruitsCount,
      });

      alert(
        language === 'hi'
          ? `शानदार! आज का 10% दैनिक कमीशन (+${res.commissionAwarded} $MIMI) आपके बैलेंस में जुड़ गया है!`
          : `Success! Today's 10% squad commission (+${res.commissionAwarded} $MIMI) credited to your balance!`
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsClaimingCommission(false);
    }
  };

  // Bind Friend's Referral Code manually
  const handleBindReferral = async () => {
    if (!manualCode.trim()) return;
    setIsBinding(true);
    playTapSound();
    try {
      const res = await bindManualReferral(stats.userId, manualCode.trim(), stats.name, stats.telegramUsername);
      if (res.success) {
        playClaimRewardSound();
        triggerHaptic('heavy');
        const newInApp = Number(((stats.inAppBalance || 0) + res.bonus).toFixed(2));
        const newTotal = Number(((stats.balance || 0) + res.bonus).toFixed(2));
        onUpdateStats({
          ...stats,
          balance: newTotal,
          inAppBalance: newInApp,
          referrerId: manualCode.trim().replace(/^ref_/, ''),
        });
        setManualCode('');
      }
      setBindResult({ message: language === 'hi' ? res.messageHi : res.messageEn, success: res.success });
      setTimeout(() => setBindResult(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBinding(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 pb-40 pt-1 px-3.5 select-none">
      {/* 1. Sleek Modern Profile Card */}
      <div className="relative w-full rounded-3xl p-4 overflow-hidden bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#1e40af] border border-cyan-400/40 shadow-[0_12px_35px_rgba(2,132,199,0.35)] text-white">
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar with Camera badge */}
            <div 
              onClick={() => {
                playTapSound();
                setIsAvatarModalOpen(true);
              }}
              className="relative group cursor-pointer flex-shrink-0"
              title={language === 'hi' ? 'लोगो या फोटो बदलें' : 'Change Avatar / Logo'}
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 via-sky-300 to-amber-300 p-0.5 shadow-md group-hover:scale-105 transition-all">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#05173e] flex items-center justify-center text-white font-black text-base">
                  {stats.avatarUrl ? (
                    <img 
                      src={stats.avatarUrl} 
                      alt={stats.name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = ASSETS.minerCharacter;
                      }}
                    />
                  ) : (
                    <span>{stats.name ? stats.name.slice(0, 2).toUpperCase() : 'MM'}</span>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 p-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow border border-white">
                <Camera className="w-2.5 h-2.5 text-slate-950" />
              </div>
            </div>

            {/* User Name & Telegram Info */}
            <div className="min-w-0">
              {isEditingName ? (
                <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-black/70 border border-cyan-400/50">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-300 font-bold w-12">{language === 'hi' ? 'नाम:' : 'Name:'}</span>
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      placeholder="Name"
                      className="bg-black/50 text-white text-xs font-bold px-2 py-0.5 rounded border border-cyan-300/40 w-32 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-cyan-300 font-bold w-12 flex items-center gap-0.5">
                      <TelegramIcon className="w-3 h-3 text-[#24A1DE]" /> TG:
                    </span>
                    <input
                      type="text"
                      value={tempUsername}
                      onChange={(e) => setTempUsername(e.target.value)}
                      placeholder="@username"
                      className="bg-black/50 text-cyan-200 text-xs font-mono font-bold px-2 py-0.5 rounded border border-cyan-300/40 w-32 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <button
                      onClick={handleSaveName}
                      className="text-[10px] bg-cyan-400 hover:bg-cyan-300 text-black px-2.5 py-1 rounded-md font-black cursor-pointer shadow"
                    >
                      ✓ {language === 'hi' ? 'सुरक्षित करें' : 'Save'}
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="text-[10px] bg-white/10 hover:bg-white/20 text-slate-300 px-2 py-1 rounded-md cursor-pointer"
                    >
                      {language === 'hi' ? 'रद्द' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div 
                    className="flex items-center gap-1.5 cursor-pointer group" 
                    onClick={() => {
                      playTapSound();
                      setIsEditingName(true);
                    }}
                  >
                    <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate drop-shadow-sm group-hover:text-cyan-200">
                      {stats.name || (language === 'hi' ? 'नया कलाकार' : 'Mimi Artist')}
                    </h2>
                    <div className="p-1 rounded-full bg-cyan-400/20 group-hover:bg-cyan-400 text-cyan-200 group-hover:text-slate-950 transition-all">
                      <Edit2 className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-cyan-200 font-mono mt-0.5">
                    <TelegramIcon className="w-3.5 h-3.5 text-[#24A1DE] flex-shrink-0" />
                    <span className="font-semibold">{stats.telegramUsername || '@mimi_user'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-black font-mono shadow-sm">
                      Lvl {stats.level}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 ${
                      stats.walletAddress
                        ? 'bg-emerald-500/80 text-white'
                        : 'bg-black/30 text-cyan-300/80 border border-cyan-500/30'
                    }`}>
                      <span>{stats.walletAddress ? '✓' : '○'}</span>
                      <span>{stats.walletAddress ? (language === 'hi' ? 'वॉलेट जुड़ा' : 'Wallet Linked') : (language === 'hi' ? 'बिना वॉलेट' : 'No Wallet')}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Balance Pill */}
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[10px] font-mono text-cyan-200 uppercase font-bold tracking-wider">
              {language === 'hi' ? 'कुल बैलेंस' : 'Balance'}
            </span>
            <span className="text-xl font-black font-mono text-amber-300 mt-0.5 drop-shadow">
              {stats.balance.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono text-cyan-300/80">$MIMI</span>
          </div>
        </div>
      </div>

      {/* 2. Stats Strip (4 columns: स्ट्रीम, उच्चतम लेवल, रिक्रूट, दिन) */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { labelHi: '🎧 स्ट्रीम', labelEn: '🎧 Stream', val: stats.beatsStreamed },
          { labelHi: '👑 उच्चतम लेवल', labelEn: '👑 Max Lvl', val: stats.highestLevel },
          { labelHi: '👥 रिक्रूट', labelEn: '👥 Recruits', val: realRecruitsCount },
          { labelHi: '📅 दिन', labelEn: '📅 Days', val: stats.daysActive },
        ].map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl glass-panel-blue text-center"
          >
            <span className="text-[10px] font-semibold text-cyan-200">
              {language === 'hi' ? item.labelHi : item.labelEn}
            </span>
            <span className="text-sm font-black text-white mt-0.5 font-mono">
              {item.val}
            </span>
          </div>
        ))}
      </div>

      {/* 3. 1x Daily 50 Tokens Claim Box (Clean & Compact) */}
      <div className="w-full rounded-2xl bg-gradient-to-br from-cyan-950/80 via-[#031d45] to-[#020e26] border border-cyan-400/40 p-3.5 shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-cyan-400/20 text-cyan-300 flex items-center justify-center flex-shrink-0">
            <Coins className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-white truncate">
              {language === 'hi' ? 'दैनिक 50 $MIMI कॉइन' : 'Daily 50 $MIMI Coins'}
            </div>
            <div className="text-[10px] font-mono text-cyan-300/80">
              {stats.lastDaily50ClaimDate === todayDateStr || stats.lastAllocationClaimDate === todayDateStr
                ? (language === 'hi' ? '✓ आज क्लेम हो चुका (कल वापस आएँ)' : '✓ Claimed Today (Next tomorrow)')
                : (language === 'hi' ? '+50 $MIMI उपलब्ध [दिन में 1 बार]' : '+50 $MIMI Available [1x Daily]')}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (stats.lastDaily50ClaimDate === todayDateStr || stats.lastAllocationClaimDate === todayDateStr) return;
            playClaimRewardSound();
            const newInApp = Number(((stats.inAppBalance || 0) + 50).toFixed(2));
            const newTotal = Number(((stats.balance || 0) + 50).toFixed(2));
            onUpdateStats({
              ...stats,
              inAppBalance: newInApp,
              balance: newTotal,
              lastDaily50ClaimDate: todayDateStr,
              lastAllocationClaimDate: todayDateStr,
            });
          }}
          disabled={stats.lastDaily50ClaimDate === todayDateStr || stats.lastAllocationClaimDate === todayDateStr}
          className={`px-3 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
            stats.lastDaily50ClaimDate === todayDateStr || stats.lastAllocationClaimDate === todayDateStr
              ? 'bg-[#09224f] border border-cyan-400/30 text-cyan-300 opacity-80 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.6)] active:scale-95'
          }`}
        >
          {stats.lastDaily50ClaimDate === todayDateStr || stats.lastAllocationClaimDate === todayDateStr ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'hi' ? 'क्लेम हुआ' : 'Claimed'}</span>
            </>
          ) : (
            <>
              <Gift className="w-3.5 h-3.5 text-slate-950" />
              <span>{language === 'hi' ? '50 क्लेम करें' : 'Claim 50'}</span>
            </>
          )}
        </button>
      </div>

      {/* 4. TWO COMPACT INTERACTIVE TILES (User requested clean clickable boxes instead of clutter) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Tile A: Squad Rewards & 10% Commission Sub-Page Trigger */}
        <button
          onClick={() => {
            playTapSound();
            setShowRewardsModal(true);
          }}
          className="relative w-full rounded-2xl p-4 text-left bg-gradient-to-br from-[#0c2e68] via-[#09224d] to-[#041029] border border-amber-400/40 hover:border-amber-400/70 shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] group-hover:scale-105 transition-transform">
              <Gift className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5">
                <span>{language === 'hi' ? 'रेफरल टोकन एवं 10% कमीशन' : 'Squad Rewards & 10% Royalty'}</span>
              </div>
              <div className="text-[10px] text-cyan-200/80 font-mono mt-0.5">
                {claimableBonus > 0
                  ? (language === 'hi' ? `🔥 +${claimableBonus} $MIMI क्लेम तैयार` : `🔥 +${claimableBonus} $MIMI Ready to Claim`)
                  : (language === 'hi' ? `${realRecruitsCount} रिक्रूट्स • 10% कमीशन` : `${realRecruitsCount} recruits • 10% royalty`)}
              </div>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-amber-300 group-hover:translate-x-0.5 transition-transform">
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        {/* Tile B: My Recruits List Sub-Page Trigger */}
        <button
          onClick={() => {
            playTapSound();
            setShowRecruitsModal(true);
          }}
          className="relative w-full rounded-2xl p-4 text-left bg-gradient-to-br from-[#034078] via-[#022b54] to-[#01142b] border border-cyan-400/40 hover:border-cyan-400/70 shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-400/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(0,210,255,0.3)] group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>{language === 'hi' ? 'मेरी रिक्रूट सूची' : 'My Squad Recruits'}</span>
                <span className="text-[10px] font-mono font-bold bg-cyan-400/20 text-cyan-300 px-1.5 py-0.2 rounded-full border border-cyan-400/30">
                  {realRecruitsCount}
                </span>
              </div>
              <div className="text-[10px] text-cyan-300/80 font-mono mt-0.5">
                {realRecruitsCount === 0
                  ? (language === 'hi' ? 'असली टेलीग्राम मेंबर्स सूची' : 'Real Telegram members list')
                  : (language === 'hi' ? `${realRecruitsCount} असली सदस्य जुड़े हुए` : `${realRecruitsCount} verified members`)}
              </div>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-cyan-300 group-hover:translate-x-0.5 transition-transform">
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* 4.5 Dedicated 1,000 Early Reserve Pool Card */}
      {onOpenNftPage && (
        <button
          onClick={() => {
            playTapSound();
            onOpenNftPage();
          }}
          className="relative w-full rounded-2xl p-3.5 text-left bg-gradient-to-r from-[#031d47] via-[#02183a] to-[#011029] border border-cyan-400/40 hover:border-cyan-400/70 shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-xl shadow group-hover:scale-105 transition-transform">
              🎟️
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>{language === 'hi' ? '1,000 सदस्यों का रिज़र्व पूल' : '1,000 Early Reserve Pool'}</span>
                <span className="text-[9.5px] font-mono font-bold bg-cyan-400/20 text-cyan-300 px-1.5 py-0.2 rounded-full border border-cyan-400/30">
                  1,000 MAX
                </span>
              </div>
              <div className="text-[10px] text-cyan-200/80 font-mono mt-0.5">
                {language === 'hi' ? 'क्लाउड सिंक समुदाय स्लॉट देखें' : 'View verified community reservation slots'}
              </div>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-cyan-300 group-hover:translate-x-0.5 transition-transform">
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      )}

      {/* 5. Clean Referral Share Box */}
      <div className="relative w-full rounded-3xl p-4 sm:p-5 overflow-hidden bg-gradient-to-br from-[#0284c7] via-[#2563eb] to-[#4f46e5] border border-cyan-400/40 shadow-lg text-white space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-cyan-200">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight drop-shadow-sm">
                {language === 'hi' ? 'दोस्त आमंत्रित करें' : 'Invite Friends to Squad'}
              </h2>
              <p className="text-[10px] text-cyan-200/90 font-medium">
                {language === 'hi' ? 'हर असली दोस्त पर टोकन + 10% आजीवन रॉयल्टी कमीशन' : 'Tokens per friend & 10% lifetime royalty'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-sm">
            +100 $MIMI
          </span>
        </div>

        {/* Highlighted 2-Rule Benefit Strip */}
        <div className="grid grid-cols-2 gap-2 text-left">
          <div className="p-2.5 rounded-2xl bg-black/40 border border-white/15">
            <div className="text-sm font-black text-amber-300 font-mono">+100 $MIMI</div>
            <div className="text-[10px] text-cyan-200 font-medium mt-0.5">
              {language === 'hi' ? 'प्रति असली रेफरल बोनस' : 'Per genuine recruit bonus'}
            </div>
          </div>
          <div className="p-2.5 rounded-2xl bg-black/40 border border-white/15">
            <div className="text-sm font-black text-emerald-300 font-mono">
              {language === 'hi' ? '+10% कमीशन' : '+10% Royalty'}
            </div>
            <div className="text-[10px] text-cyan-200 font-medium mt-0.5">
              {language === 'hi' ? 'दोस्त की कमाई से आजीवन' : 'Lifetime recruit yields'}
            </div>
          </div>
        </div>

        {/* Primary Action Button: Big Telegram Share Button */}
        <button
          onClick={handleShareTelegram}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(251,191,36,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <TelegramIcon className="w-4 h-4 text-slate-950" />
          <span>{language === 'hi' ? 'Telegram पर दोस्त आमंत्रित करें (+100 $MIMI)' : 'Invite Friends on Telegram (+100 $MIMI)'}</span>
        </button>

        {/* Secondary Action Button: Copy Invite Link */}
        <button
          onClick={handleCopyLink}
          className="w-full py-2.5 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/25 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-cyan-300" />}
          <span>{copiedLink ? (language === 'hi' ? '✓ रेफरल लिंक कॉपी हो गया!' : '✓ Invite Link Copied!') : (language === 'hi' ? '🔗 रेफरल लिंक कॉपी करें' : '🔗 Copy Invite Link')}</span>
        </button>

        {/* Friendly Helper for Friends Who Opened Without Invite Link */}
        <div className="text-center pt-0.5">
          <button
            onClick={() => {
              playTapSound();
              setShowBindModal(true);
            }}
            className="text-[11px] text-cyan-200 hover:text-white underline cursor-pointer inline-flex items-center gap-1 font-mono"
          >
            <Link2 className="w-3 h-3 text-cyan-300" />
            <span>{language === 'hi' ? 'क्या आप बिना लिंक के जुड़े हैं? (दोस्त का @यूजरनेम जोड़ें)' : "Joined without a link? Enter friend's @username"}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB-PAGE MODAL 1: SQUAD REWARDS & 10% ROYALTY CLAIM PAGE */}
      {/* ======================================================== */}
      {showRewardsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0a2356] via-[#051334] to-[#020a1c] border border-cyan-400/40 p-5 sm:p-6 text-white shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto my-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <Gift className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {language === 'hi' ? 'रेफरल रिवॉर्ड्स एवं 10% कमीशन' : 'Squad Rewards & 10% Royalty'}
                  </h3>
                  <p className="text-[11px] text-cyan-200/80 font-mono">
                    {language === 'hi' ? `सक्रिय असली रिक्रूट्स: ${realRecruitsCount}` : `Active Real Recruits: ${realRecruitsCount}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRewardsModal(false)}
                className="p-1.5 rounded-full bg-white/10 text-cyan-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reward Part 1: Recruit Tokens Claim (+100 $MIMI per recruit) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c2e68] to-[#041029] border border-amber-400/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-300">
                    {language === 'hi' ? '🎁 प्रति रेफरल टोकन (+100 $MIMI)' : '🎁 Recruit Token Rewards (+100 $MIMI)'}
                  </div>
                  <div className="text-[10px] text-cyan-200/80 font-mono mt-0.5">
                    {language === 'hi' ? `कुल पात्र रिवॉर्ड: ${totalEarnableBonus} $MIMI` : `Total Eligible: ${totalEarnableBonus} $MIMI`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-amber-300 font-mono">
                    +{claimableBonus} $MIMI
                  </div>
                  <div className="text-[9px] text-cyan-300/70 font-mono">
                    {language === 'hi' ? 'उपलब्ध क्लेम' : 'Claimable'}
                  </div>
                </div>
              </div>

              {realRecruitsCount === 0 ? (
                <div className="p-3 rounded-xl bg-black/40 text-[11px] text-cyan-200/70 leading-relaxed font-mono">
                  {language === 'hi'
                    ? 'अभी आपके पास 0 रेफरल्स हैं। जब असली दोस्त आपके लिंक से जुड़ेंगे, तो प्रति सदस्य 100 $MIMI यहाँ क्लेम के लिए उपलब्ध होगा।'
                    : 'You currently have 0 recruits. When genuine users join via your link, 100 $MIMI per recruit will unlock here.'}
                </div>
              ) : claimableBonus > 0 ? (
                <button
                  onClick={handleClaimReferralBonus}
                  disabled={isClaimingBonus}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isClaimingBonus ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin text-slate-950" />
                      <span>{language === 'hi' ? 'क्लेम जारी...' : 'Claiming...'}</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4 text-slate-950 animate-bounce" />
                      <span>
                        {language === 'hi'
                          ? `🔥 क्लेम करें (+${claimableBonus} $MIMI)`
                          : `🔥 Claim (+${claimableBonus} $MIMI)`}
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold text-center font-mono">
                  {language === 'hi' ? '✓ सभी रेफरल टोकन क्लेम हो चुके हैं' : '✓ All referral tokens claimed'}
                </div>
              )}
            </div>

            {/* Reward Part 2: Daily 10% Squad Royalty Commission */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#034078] to-[#01142b] border border-cyan-400/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-cyan-300" />
                    <span>{language === 'hi' ? '⚡ दैनिक 10% रॉयल्टी कमीशन' : '⚡ Daily 10% Squad Royalty'}</span>
                  </div>
                  <div className="text-[10px] text-cyan-200/80 font-mono mt-0.5">
                    {language === 'hi'
                      ? `लाइफटाइम 10% रॉयल्टी (${realRecruitsCount} रिक्रूट्स)`
                      : `Lifetime 10% royalty on squad mining (${realRecruitsCount} recruits)`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-amber-300 font-mono">
                    +{dailyCommissionAmount.toFixed(1)} $MIMI
                  </div>
                  <div className="text-[9px] text-cyan-300/70 font-mono">
                    {language === 'hi' ? 'आज का कमीशन' : "Today's Yield"}
                  </div>
                </div>
              </div>

              {realRecruitsCount === 0 ? (
                <div className="p-3 rounded-xl bg-black/40 text-[11px] text-cyan-200/70 leading-relaxed font-mono">
                  {language === 'hi'
                    ? 'दैनिक 10% कमीशन आपके सक्रिय रिक्रूट्स की संगीत माइनिंग से बनता है। असली रिक्रूट्स जुड़ते ही यह एक्टिव हो जाएगा।'
                    : 'Daily 10% commission is earned from your active recruits daily music mining. Unlocks when recruits join.'}
                </div>
              ) : isCommissionClaimedToday ? (
                <div className="p-2.5 rounded-xl bg-[#09224f] border border-cyan-400/30 text-cyan-300 text-xs font-bold text-center font-mono">
                  {language === 'hi'
                    ? `✓ आज का 10% कमीशन (+${dailyCommissionAmount.toFixed(1)} $MIMI) क्लेम हो चुका है · कल वापस आएँ`
                    : `✓ Today's 10% commission (+${dailyCommissionAmount.toFixed(1)} $MIMI) claimed · Return tomorrow`}
                </div>
              ) : (
                <button
                  onClick={handleClaimDailyCommission}
                  disabled={isClaimingCommission}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isClaimingCommission ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin text-slate-950" />
                      <span>{language === 'hi' ? 'कमीशन सत्यापन जारी...' : 'Claiming...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950 animate-spin" />
                      <span>
                        {language === 'hi'
                          ? `⚡ आज का 10% कमीशन क्लेम करें (+${dailyCommissionAmount.toFixed(1)} $MIMI)`
                          : `⚡ Claim Today's 10% Royalty (+${dailyCommissionAmount.toFixed(1)} $MIMI)`}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Back Button */}
            <button
              onClick={() => setShowRewardsModal(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-cyan-200 text-xs font-bold transition-all cursor-pointer"
            >
              {language === 'hi' ? 'वापस जाएँ' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-PAGE MODAL 2: MY RECRUITS LIST (REAL TELEGRAM ONLY) */}
      {/* ======================================================== */}
      {showRecruitsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0a2356] via-[#051334] to-[#020a1c] border border-cyan-400/40 p-5 sm:p-6 text-white shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto my-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                  <Users className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {language === 'hi' ? 'मेरी रिक्रूट सूची' : 'My Squad Recruits'}
                  </h3>
                  <p className="text-[11px] text-cyan-200/80 font-mono">
                    {realRecruitsCount} {language === 'hi' ? 'असली टेलीग्राम सदस्य' : 'real Telegram members'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRecruitsModal(false)}
                className="p-1.5 rounded-full bg-white/10 text-cyan-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Real Recruits List or Clean Empty State */}
            {realRecruitsCount === 0 ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-300">
                  <Users className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    {language === 'hi' ? 'अभी तक कोई सदस्य नहीं जुड़ा है' : 'No Recruits Yet'}
                  </h4>
                  <p className="text-xs text-cyan-200/70 max-w-xs mx-auto leading-relaxed">
                    {language === 'hi'
                      ? 'जैसे ही कोई दोस्त आपके रेफरल लिंक से बॉट में आएगा, उनका असली Telegram Username और प्रोफाइल यहाँ लाइव दिखाई देगा!'
                      : 'As soon as a user joins using your invite link, their genuine Telegram username and profile will appear here in real-time!'}
                  </p>
                </div>
                <button
                  onClick={handleShareTelegram}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'आमंत्रण लिंक भेजें' : 'Share Invite Link'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {referrals.map((ref) => (
                  <div
                    key={ref.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#09224d] border border-cyan-500/30"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 border border-cyan-400/40 flex items-center justify-center text-xs font-black text-white shadow-sm flex-shrink-0">
                        {ref.name ? ref.name.slice(0, 2).toUpperCase() : 'MM'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white truncate">
                          {ref.name || 'Mimi Artist'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 font-mono font-bold truncate mt-0.5">
                          <TelegramIcon className="w-3.5 h-3.5 text-[#24A1DE] flex-shrink-0" />
                          <span className="truncate">{ref.username ? (ref.username.startsWith('@') ? ref.username : `@${ref.username}`) : `@${ref.userId}`}</span>
                        </div>
                        {(ref.commissionEarned || 0) > 0 && (
                          <div className="text-[10px] text-amber-300 font-mono mt-0.5">
                            10% रॉयल्टी: +{(ref.commissionEarned || 0).toFixed(2)} $MIMI
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-black text-amber-300 font-mono block">
                        +{ref.bonusEarned || 100} $MIMI
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                        ✓ QUALIFIED
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Back Button */}
            <button
              onClick={() => setShowRecruitsModal(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-cyan-200 text-xs font-bold transition-all cursor-pointer"
            >
              {language === 'hi' ? 'वापस जाएँ' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-PAGE MODAL 3: BIND FRIEND'S REFERRAL CODE           */}
      {/* ======================================================== */}
      {showBindModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0a2356] via-[#051334] to-[#020a1c] border border-cyan-400/40 p-5 sm:p-6 text-white shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto my-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-cyan-300" />
                <h3 className="text-base font-black text-white">
                  {language === 'hi' ? 'दोस्त का कोड जोड़ें (+100 $MIMI)' : "Bind Friend's Referral Code"}
                </h3>
              </div>
              <button
                onClick={() => setShowBindModal(false)}
                className="p-1.5 rounded-full bg-white/10 text-cyan-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-cyan-200/80 leading-relaxed">
              {language === 'hi'
                ? 'यदि आप किसी मित्र के निमंत्रण से जुड़े हैं, तो अपने दोस्त का Telegram @username या ID दर्ज करें। दोनों को तुरंत +100 $MIMI बोनस मिलेगा!'
                : "Joined via a friend? Enter your friend's Telegram @username or ID below. Both you and your friend will receive +100 $MIMI bonus!"}
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="उदा: @kingpapa या MIMI_6002"
                className="w-full bg-black/50 border border-cyan-400/40 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-cyan-300/40 outline-none focus:border-cyan-400"
              />

              <button
                onClick={handleBindReferral}
                disabled={isBinding || !manualCode.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isBinding ? 'सत्यापित किया जा रहा है...' : (language === 'hi' ? 'दोस्त से जुड़ें और +100 $MIMI क्लेम करें' : 'Link Friend & Claim +100 $MIMI')}
              </button>
            </div>

            {bindResult && (
              <div className={`p-3 rounded-xl text-xs font-medium ${bindResult.success ? 'bg-emerald-950/70 text-emerald-200 border border-emerald-400/40' : 'bg-rose-950/70 text-rose-200 border border-rose-400/40'}`}>
                {bindResult.message}
              </div>
            )}

            <button
              onClick={() => setShowBindModal(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-cyan-200 text-xs font-bold transition-all cursor-pointer"
            >
              {language === 'hi' ? 'वापस जाएँ' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* 4. Profile & Logo Customization Modal */}
      <ProfileAvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        userId={stats.userId}
        currentName={stats.name}
        currentUsername={stats.telegramUsername || '@mimi_user'}
        currentAvatarUrl={stats.avatarUrl}
        language={language}
        onSave={(updated) => {
          onUpdateStats({
            ...stats,
            name: updated.name,
            telegramUsername: updated.username,
            avatarUrl: updated.avatarUrl,
          });
        }}
      />
    </div>
  );
};
