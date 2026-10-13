import React, { useState } from 'react';
import { Copy, Check, Users, Gift, Percent, Edit2, Share2, Coins, Sparkles, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { UserStats, RealReferral, Language } from '../types/airdrop.ts';
import { ASSETS } from '../assets/assetRegistry.ts';
import { TON_CONFIG, shortenAddress } from '../utils/tonService.ts';
import { playClaimRewardSound, playTapSound } from '../utils/audioEngine.ts';

interface Props {
  stats: UserStats;
  referrals: RealReferral[];
  onUpdateStats: (newStats: UserStats) => void;
  onOpenClaimModal?: () => void;
  language: Language;
}

export const FrensView: React.FC<Props> = ({
  stats,
  referrals,
  onUpdateStats,
  onOpenClaimModal,
  language,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(stats.name);
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const alreadyClaimedToday = stats.lastAllocationClaimDate === todayDateStr;

  const referralLink = `https://t.me/Musicmimi_bot/app?startapp=ref_${stats.userId}`;

  const handleCopyLink = () => {
    playTapSound();
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTelegram = () => {
    playTapSound();
    const shareText = encodeURIComponent(
      language === 'hi'
        ? `🔥 म्यूजिक मिमी ($MIMI) प्रोटोकॉल में मेरे साथ शामिल हों और तुरंत 10 $MIMI टोकन प्राप्त करें! \n${referralLink}`
        : `🔥 Join my music crew in Music Mimi ($MIMI) and claim 10 $MIMI tokens instantly! \n${referralLink}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${shareText}`, '_blank');
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      onUpdateStats({ ...stats, name: tempName.trim() });
    }
    setIsEditingName(false);
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-28 pt-2 px-4 select-none">
      {/* 1. Futuristic Artist Community ID Card (Polished Ocean Blue Glass) */}
      <div className="relative w-full rounded-3xl p-5 overflow-hidden bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#1e40af] border border-cyan-400/40 shadow-[0_12px_40px_rgba(2,132,199,0.4)] text-white glass-sheen">
        {/* Hologram soundwave shine */}
        <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />

        {/* Top Protocol ID Title */}
        <div className="flex items-center justify-between text-xs font-mono font-bold tracking-wider text-cyan-200 uppercase mb-3">
          <span>MUSIC MIMI · {language === 'hi' ? 'कलाकार कम्युनिटी ID' : 'ARTIST COMMUNITY ID'}</span>
          <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-full border border-cyan-300/20">{stats.protocolId || 'MIMI-01'}</span>
        </div>

        {/* Card Body */}
        <div className="flex items-center justify-between gap-3 relative z-10">
          {/* Left: User Info & Badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {/* Initials Avatar */}
              <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-cyan-400 via-sky-300 to-amber-300 p-0.5 shadow-md flex-shrink-0">
                <div className="w-full h-full rounded-full bg-[#05173e] flex items-center justify-center text-white font-black text-lg">
                  {stats.name ? stats.name.slice(0, 2).toUpperCase() : 'MM'}
                </div>
              </div>

              {/* Name & Handle */}
              <div className="min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="bg-black/50 text-white text-base font-black px-2 py-0.5 rounded-lg border border-cyan-300/40 w-32 outline-none"
                    />
                    <button
                      onClick={handleSaveName}
                      className="text-xs bg-cyan-400 text-black px-2 py-1 rounded-md font-bold"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setIsEditingName(true)}>
                    <h2 className="text-xl font-black text-white tracking-tight truncate drop-shadow-sm">
                      {stats.name || (language === 'hi' ? 'नया कलाकार' : 'New Producer')}
                    </h2>
                    <Edit2 className="w-3.5 h-3.5 text-cyan-200 hover:text-white" />
                  </div>
                )}
                <p className="text-xs text-cyan-200 font-mono">
                  {stats.telegramUsername || '@mimi_user'}
                </p>
              </div>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-1.5 my-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[11px] font-black shadow-sm">
                {language === 'hi' ? `लेवल ${stats.level}` : `Level ${stats.level}`}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#071d47] text-cyan-200 text-[11px] font-bold border border-cyan-400/30">
                {language === 'hi' ? stats.traineeBadge : 'Creator'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm flex items-center gap-1 ${
                stats.walletAddress
                  ? 'bg-emerald-500/80 text-white'
                  : 'bg-black/30 text-cyan-300/80 border border-cyan-500/30'
              }`}>
                <span>{stats.walletAddress ? '✓' : '○'}</span>
                <span>{stats.walletAddress ? (language === 'hi' ? 'वॉलेट जुड़ा' : 'Wallet Linked') : (language === 'hi' ? 'बिना वॉलेट' : 'No Wallet')}</span>
              </span>
            </div>

            {/* Role Title */}
            <div className="mt-1">
              <span className="text-xs sm:text-sm font-black text-amber-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                {language === 'hi' ? stats.roleTitle : 'Sonic Pioneer'}
              </span>
            </div>
          </div>

          {/* Right: 3D Music Mimi Mascot */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 relative">
            <img
              src={ASSETS.mimiMascot}
              alt="Music Mimi Mascot"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain rounded-2xl drop-shadow-[0_8px_25px_rgba(0,10,35,0.7)] transform translate-y-1 scale-105"
            />
          </div>
        </div>
      </div>

      {/* 1.5 DEDICATED PROFILE CLAIM $MIMI WORKFLOW CARD */}
      <div className="w-full rounded-3xl bg-gradient-to-br from-cyan-950/90 via-[#031d45] to-[#020e26] border-2 border-cyan-400/40 p-4 shadow-[0_8px_30px_rgba(0,180,255,0.2)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-400/20 text-cyan-300 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>{language === 'hi' ? 'आपका $MIMI आवंटन' : 'Your $MIMI Allocation'}</span>
                <span className="text-[9px] font-mono text-cyan-300 bg-black/40 px-1.5 py-0.2 rounded border border-cyan-400/30">
                  TEP-74
                </span>
              </h3>
              <p className="text-[10px] text-cyan-200/80 font-mono">
                {stats.claimStatus === 'approved'
                  ? (language === 'hi' ? 'आवंटन सत्यापित एवं सुरक्षित' : 'Allocation Verified & Locked')
                  : (language === 'hi' ? 'दावा तैयार · DEX लिस्टिंग पर क्लेम' : 'Ready to Lock · Claim upon DEX')}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-lg font-black text-white font-mono block">
              {stats.balance.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
            <span className="text-[10px] text-cyan-300 font-mono">
              ≈ ${(stats.balance * stats.usdConversionRate).toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* User Notice */}
        <p className="text-[11px] text-cyan-100/95 leading-relaxed italic bg-black/40 p-2.5 rounded-xl border border-cyan-500/20">
          "{language === 'hi' ? TON_CONFIG.dexListingNoticeHi : TON_CONFIG.dexListingNotice}"
        </p>

        {/* Claim Action Button */}
        {onOpenClaimModal && (
          <div className="space-y-1">
            <button
              onClick={onOpenClaimModal}
              className={`w-full py-2.5 rounded-xl font-black text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                alreadyClaimedToday
                  ? 'bg-[#09224f] border border-cyan-400/40 text-cyan-300'
                  : 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.6)] active:scale-95'
              }`}
            >
              {alreadyClaimedToday ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>
                    {language === 'hi'
                      ? `✓ आज का 2x क्लेम पूरा हुआ (${stats.balance.toLocaleString()} $MIMI)`
                      : `✓ Today's 2x Claim Done (${stats.balance.toLocaleString()} $MIMI)`}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>
                    {language === 'hi'
                      ? `🔥 2x आवंटन क्लेम करें (${(stats.balance * 2).toLocaleString()} $MIMI) [दैनिक 1 बार]`
                      : `🔥 Claim 2x Allocation (${(stats.balance * 2).toLocaleString()} $MIMI) [1x Daily]`}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
            <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300/80 px-1">
              <span>{language === 'hi' ? 'दैनिक 2x आवंटन बोनस:' : 'Daily 2x Allocation Bonus:'}</span>
              <span className={alreadyClaimedToday ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                {alreadyClaimedToday
                  ? (language === 'hi' ? 'आज इस्तेमाल हो चुका · कल फिर आएँ' : 'Used today · Next tomorrow')
                  : (language === 'hi' ? 'उपलब्ध (दिन में 1 बार)' : 'Available (1x/day)')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Stats Strip (4 columns: स्ट्रीम, उच्चतम लेवल, रिक्रूट, दिन) */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { labelHi: '🎧 स्ट्रीम', labelEn: '🎧 Stream', val: stats.beatsStreamed },
          { labelHi: '👑 उच्चतम लेवल', labelEn: '👑 Max Lvl', val: stats.highestLevel },
          { labelHi: '👥 रिक्रूट', labelEn: '👥 Recruits', val: stats.recruitsCount },
          { labelHi: '📅 दिन', labelEn: '📅 Days', val: stats.daysActive },
        ].map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl glass-panel-blue text-center"
          >
            <span className="text-[10px] sm:text-[11px] font-semibold text-cyan-200">
              {language === 'hi' ? item.labelHi : item.labelEn}
            </span>
            <span className="text-sm sm:text-base font-black text-white mt-0.5 font-mono">
              {item.val}
            </span>
          </div>
        ))}
      </div>

      {/* 3. Team & Referrals Section: दोस्तों को आमंत्रित करें */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-extrabold text-white px-1">
          {language === 'hi' ? 'कम्युनिटी टीम' : 'Community Squad'}
        </h3>

        {/* Radiant Blue Team Card */}
        <div className="relative w-full rounded-3xl p-5 overflow-hidden bg-gradient-to-br from-[#0284c7] via-[#2563eb] to-[#4f46e5] border border-cyan-400/40 shadow-[0_12px_40px_rgba(37,99,235,0.4)] text-white glass-sheen">
          <h2 className="text-2xl font-black tracking-tight drop-shadow-sm mb-4">
            {language === 'hi' ? 'अपनी संगीत टीम बनाएँ!' : 'Build Your Music Crew!'}
          </h2>

          {/* Reward perk 1 */}
          <div className="w-full rounded-2xl bg-white/15 backdrop-blur-md p-3.5 flex items-center justify-between mb-2.5 border border-white/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Gift className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-white">
                {language === 'hi' ? 'हर नए रिक्रूट के लिए +10' : '+10 For every recruit'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <img
                src={ASSETS.mimiCatToken}
                alt="$MIMI"
                className="w-4 h-4 rounded-full object-cover"
              />
              <span className="text-xs font-extrabold text-cyan-200 uppercase tracking-wider font-mono">
                $MIMI
              </span>
            </div>
          </div>

          {/* Reward perk 2 */}
          <div className="w-full rounded-2xl bg-white/15 backdrop-blur-md p-3.5 flex items-center gap-2.5 mb-4 border border-white/20">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Percent className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-white leading-snug">
              {language === 'hi'
                ? 'आपके रिक्रूट द्वारा स्ट्रीम किए गए टोकन्स का 10% रॉयल्टी'
                : '10% lifetime streaming royalty from all squad beats'}
            </span>
          </div>

          {/* Referral Link Box */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-2xl p-1.5 border border-white/25">
            <div className="flex-1 px-3 text-xs font-mono text-cyan-200 truncate">
              {referralLink}
            </div>
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-cyan-500/30 hover:bg-cyan-500/50 text-white transition-all active:scale-95 cursor-pointer flex-shrink-0"
              title="Copy Referral Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Big Invite Friends Button */}
          <button
            onClick={handleShareTelegram}
            className="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-300 hover:from-cyan-300 hover:to-blue-200 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(0,210,255,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4 text-blue-900" />
            <span>{language === 'hi' ? 'दोस्त आमंत्रित करें' : 'Invite Friends to Squad'}</span>
          </button>
        </div>

        {/* Recruits List */}
        <div className="w-full rounded-2xl glass-panel-blue p-4">
          <div className="flex items-center justify-between mb-3 text-xs font-bold text-cyan-200">
            <span>{language === 'hi' ? 'सक्रिय रिक्रूट सूची' : 'Active Recruits'}</span>
            <span>{referrals.length} {language === 'hi' ? 'सदस्य' : 'members'}</span>
          </div>

          {referrals.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-xs text-cyan-200/70">
                {language === 'hi'
                  ? 'अभी तक कोई सदस्य नहीं जुड़ा है। अपना आमंत्रण लिंक साझा करें!'
                  : 'No recruits yet. Share your invite link to build your crew!'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {referrals.map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#09224d] border border-cyan-500/20"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-cyan-600/40 border border-cyan-400/40 flex items-center justify-center text-xs font-bold text-white">
                      {ref.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-white">{ref.name}</div>
                      <div className="text-[10px] text-cyan-300/80">{ref.username} • Lvl {ref.level}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-amber-300 font-mono">+{ref.bonusEarned} $MIMI</span>
                    <div className="text-[9px] text-emerald-400 font-bold">QUALIFIED</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
