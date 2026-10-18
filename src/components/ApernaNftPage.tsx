/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, ArrowLeft, ShieldCheck, 
  Sparkles, Ticket, Flame, Check, AlertCircle, Clock, Zap, RefreshCw, UserCheck
} from 'lucide-react';
import { Language, UserStats } from '../types/airdrop.ts';
import { playClaimRewardSound, playTapSound, triggerHaptic } from '../utils/audioEngine.ts';
import { TelegramIcon } from './TelegramIcon.tsx';
import { ASSETS } from '../assets/assetRegistry.ts';
import { 
  listenToNftReservePool, 
  reserveNftPoolSlot, 
  NftPoolMember 
} from '../utils/referralCloudService.ts';

interface Props {
  language: Language;
  stats: UserStats;
  onOpenMintModal?: () => void;
  onBack: () => void;
}

const MAX_POOL_CAPACITY = 1000;
const STORAGE_KEY_USER_RES = 'mimi_1000_real_user_reservation_v1';
const STORAGE_KEY_COUNT = 'mimi_1000_real_pool_clicks_v1';

export const ApernaNftPage: React.FC<Props> = ({
  language,
  stats,
  onBack,
}) => {
  const [reservedCount, setReservedCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COUNT);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [membersList, setMembersList] = useState<NftPoolMember[]>([]);
  const [userSlotNumber, setUserSlotNumber] = useState<number | null>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER_RES);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.slotNumber) return parsed.slotNumber;
      }
    } catch {}
    return null;
  });

  const [reservationDate, setReservationDate] = useState<string | null>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER_RES);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return parsed?.reservedAt || null;
      }
    } catch {}
    return null;
  });

  const [isReserving, setIsReserving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real-Time Cloud Firestore Sync: Listens to all genuine joined members across all devices
  useEffect(() => {
    const unsub = listenToNftReservePool(
      (data) => {
        setReservedCount(data.count);
        setMembersList(data.members);

        if (data.userReservation) {
          setUserSlotNumber(data.userReservation.slotNumber);
          setReservationDate(data.userReservation.reservedAt);

          try {
            localStorage.setItem(STORAGE_KEY_USER_RES, JSON.stringify({
              userId: stats.userId,
              telegramUsername: stats.telegramUsername,
              slotNumber: data.userReservation.slotNumber,
              reservedAt: data.userReservation.reservedAt,
            }));
            localStorage.setItem(STORAGE_KEY_COUNT, String(data.count));
          } catch {}
        }
      },
      stats.userId
    );

    return () => {
      unsub();
    };
  }, [stats.userId]);

  const handleReserveSlot = async () => {
    if (userSlotNumber) return; // Already reserved
    if (reservedCount >= MAX_POOL_CAPACITY) return; // Pool full
    if (isReserving) return;

    setIsReserving(true);
    setErrorMessage(null);
    playTapSound();
    triggerHaptic('medium');

    try {
      const res = await reserveNftPoolSlot({
        userId: stats.userId,
        name: stats.name,
        telegramUsername: stats.telegramUsername,
        avatarUrl: stats.avatarUrl,
        walletAddress: stats.walletAddress,
      });

      if (res.success && res.slotNumber > 0) {
        setUserSlotNumber(res.slotNumber);
        setReservationDate(res.reservedAt);
        playClaimRewardSound();
        triggerHaptic('heavy');
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      console.error('Reservation error:', err);
      setErrorMessage(language === 'hi' ? 'स्लॉट रिज़र्व करने में त्रुटि आई' : 'Failed to reserve slot');
    } finally {
      setIsReserving(false);
    }
  };

  const remainingSlots = Math.max(0, MAX_POOL_CAPACITY - reservedCount);
  const progressPercent = Math.min(100, Number(((reservedCount / MAX_POOL_CAPACITY) * 100).toFixed(1)));
  const isFull = reservedCount >= MAX_POOL_CAPACITY;

  return (
    <div className="w-full space-y-4 px-4 pt-1 pb-28 text-white select-none animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playTapSound();
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#091b40] hover:bg-[#0f2c66] border border-cyan-500/30 text-xs font-bold text-cyan-200 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'वापस' : 'Back'}</span>
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              <span>🎟️ {language === 'hi' ? '1,000 रिज़र्व पूल' : '1,000 Reserve Pool'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 font-mono font-bold border border-cyan-400/40">
                1,000 MAX
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/70 px-2.5 py-1 rounded-xl border border-amber-400/40 flex items-center gap-1 shadow-sm">
            <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>{remainingSlots} {language === 'hi' ? 'बाकी' : 'Left'}</span>
          </span>
        </div>
      </div>

      {/* Main Hero Card: 1,000 Pool */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#061d4a] via-[#041333] to-[#020b1f] border-2 border-cyan-400/60 p-5 shadow-[0_0_40px_rgba(0,210,255,0.3)] space-y-4">
        {/* Glow Effects */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400 text-[10px] font-black uppercase tracking-wider text-cyan-300 shadow-[0_0_12px_rgba(0,210,255,0.4)]">
            <Users className="w-3 h-3 text-cyan-300" />
            {language === 'hi' ? 'लाइव कम्युनिटी पूल' : 'LIVE COMMUNITY POOL'}
          </span>
          <span className="text-[10px] font-mono text-cyan-200 bg-black/40 px-2 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {language === 'hi' ? 'क्लाउड सिंक एक्टिव' : 'Cloud Sync Active'}
          </span>
        </div>

        {/* Headline */}
        <div className="space-y-1">
          <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-sky-300 to-white tracking-tight leading-snug">
            {language === 'hi' 
              ? '1,000 सदस्यों का आधिकारिक रिज़र्व पूल' 
              : 'Official 1,000 Members Reserve Pool'}
          </h3>
          <p className="text-xs text-cyan-100/90 leading-relaxed font-medium">
            {language === 'hi'
              ? 'इस पूल में केवल 1,000 असली मेंबर्स ही जॉइन कर सकते हैं। हर जॉइन क्लाउड डेटाबेस में लाइव सिंक होता है।'
              : 'Strictly 1,000 spots for genuine community members. All slots are synchronized live in Cloud Firestore.'}
          </p>
        </div>

        {/* Live Real Capacity Meter */}
        <div className="p-3.5 rounded-2xl bg-black/50 border border-cyan-500/30 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-cyan-300">
              <Ticket className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'hi' ? 'पूल स्लॉट स्थिति (Live Status)' : 'Live Pool Capacity Status'}</span>
            </span>
            <span className="font-mono font-black text-white text-xs">
              <span className="text-cyan-300 font-bold">{reservedCount}</span> / 1,000 ({progressPercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-cyan-500/40">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-sky-400 shadow-[0_0_15px_rgba(0,210,255,0.8)] transition-all duration-500"
              style={{ width: `${Math.max(1, progressPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-amber-300 font-bold flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              {isFull 
                ? (language === 'hi' ? 'पूल 1,000/1,000 पूरा भर चुका है!' : 'Pool 1,000/1,000 is Full!') 
                : (language === 'hi' ? `सिर्फ ${remainingSlots} स्लॉट बाकी हैं!` : `Only ${remainingSlots} slots remaining!`)}
            </span>
            <span className="text-slate-400">
              {language === 'hi' ? 'पहले आओ, पहले पाओ' : 'First Come Basis'}
            </span>
          </div>
        </div>

        {/* Error message if any */}
        {errorMessage && (
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Button or Verified Reservation Pass */}
        {!userSlotNumber ? (
          <button
            onClick={handleReserveSlot}
            disabled={isFull || isReserving}
            className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isFull || isReserving
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-[0_0_25px_rgba(0,210,255,0.7)]'
            }`}
          >
            {isReserving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>{language === 'hi' ? 'क्लाउड में स्लॉट बुक हो रहा है...' : 'Reserving in Cloud...'}</span>
              </>
            ) : (
              <>
                <Ticket className="w-4 h-4 fill-slate-950" />
                <span>
                  {isFull
                    ? (language === 'hi' ? 'पूल बंद (1,000 पूरे हो चुके हैं)' : 'Pool Full (1,000 Reached)')
                    : (language === 'hi' 
                        ? `🎟️ अपना स्लॉट रिज़र्व करें (#${reservedCount + 1}/1,000)` 
                        : `🎟️ Reserve My Slot (#${reservedCount + 1}/1,000)`)}
                </span>
              </>
            )}
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-[#05263d] border-2 border-emerald-400/80 shadow-[0_0_25px_rgba(16,185,129,0.35)] space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* User avatar logo in ticket */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-300 p-0.5 shadow-md flex-shrink-0">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#05173e] flex items-center justify-center text-white font-black">
                    {stats.avatarUrl ? (
                      <img src={stats.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{stats.name ? stats.name.slice(0, 2).toUpperCase() : 'MM'}</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-300">
                    {language === 'hi' ? '✅ आपका स्लॉट सुरक्षित है!' : '✅ Slot Successfully Reserved!'}
                  </h4>
                  <p className="text-xs text-white font-mono font-bold">
                    Ticket Pass: #{userSlotNumber} / 1,000
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-mono font-bold text-[10px] border border-emerald-400/40">
                VERIFIED
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 text-[11px] font-mono text-cyan-200 space-y-1.5 border border-white/5">
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'hi' ? 'मेंबर:' : 'Member:'}</span>
                <span className="text-white font-bold">{stats.telegramUsername || stats.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'hi' ? 'रिज़र्व आईडी:' : 'Reserved ID:'}</span>
                <span className="text-emerald-300">{stats.userId}</span>
              </div>
              {reservationDate && (
                <div className="flex justify-between">
                  <span className="text-slate-400">{language === 'hi' ? 'समय:' : 'Time:'}</span>
                  <span className="text-slate-300">{reservationDate}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-emerald-100/90 leading-relaxed">
              {language === 'hi'
                ? 'बधाई हो! आपका नाम पहले 1,000 मेंबर्स की आधिकारिक लिस्ट में सुरक्षित हो गया है। आपके इस स्लॉट को कोई और क्लेम नहीं कर सकता।'
                : 'Congratulations! Your slot is permanently secured in the official 1,000 whitelist.'}
            </p>
          </div>
        )}
      </div>

      {/* Live Whitelist Members Feed (Real Users Joining) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {language === 'hi' 
                ? `हाल ही में जुड़े असली सदस्य (${reservedCount})` 
                : `Live Whitelist Members (${reservedCount})`}
            </span>
          </h4>
          <span className="text-[10px] font-mono text-slate-400">
            {language === 'hi' ? 'लाइव सिंक' : 'Live Sync'}
          </span>
        </div>

        {membersList.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#07173b]/60 border border-cyan-500/20 text-center space-y-1">
            <Ticket className="w-6 h-6 text-cyan-400 mx-auto opacity-70" />
            <p className="text-xs text-slate-300 font-bold">
              {language === 'hi' 
                ? 'अभी तक 0 सदस्य जुड़े हैं। पहले सदस्य बनने के लिए ऊपर क्लिक करें!' 
                : 'No members joined yet. Be the first to join above!'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {membersList.map((m) => {
              const isCurrent = m.userId === stats.userId;
              return (
                <div
                  key={m.id}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-r from-emerald-950/60 to-[#0c2e6f]/60 border-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-[#071a42]/70 border-cyan-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Pass number badge */}
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 font-black text-xs font-mono flex items-center justify-center flex-shrink-0 shadow">
                      #{m.slotNumber}
                    </div>

                    {/* Member Avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#05173e] border border-cyan-400/30 flex items-center justify-center flex-shrink-0">
                      {m.avatarUrl ? (
                        <img 
                          src={m.avatarUrl} 
                          alt={m.name} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = ASSETS.minerCharacter;
                          }}
                        />
                      ) : (
                        <span className="text-[10px] font-black text-white">
                          {m.name ? m.name.slice(0, 2).toUpperCase() : 'MM'}
                        </span>
                      )}
                    </div>

                    {/* Name & Username */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {m.name || 'Member'}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-black">
                            आप (You)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-cyan-300 font-mono">
                        <TelegramIcon className="w-3 h-3 text-[#24A1DE] flex-shrink-0" />
                        <span className="truncate">{m.telegramUsername}</span>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp & Verified badge */}
                  <div className="flex flex-col items-end text-right flex-shrink-0">
                    <span className="inline-flex items-center gap-1 text-[9px] text-emerald-300 font-mono font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-400/30">
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{language === 'hi' ? 'सुरक्षित' : 'Secured'}</span>
                    </span>
                    <span className="text-[8.5px] text-slate-400 font-mono mt-0.5">
                      {m.reservedAt}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 1,000 Pool Rules & Perks */}
      <div className="space-y-2 pt-2">
        <h4 className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>{language === 'hi' ? 'पूल के नियम एवं लाभ' : 'Pool Rules & Benefits'}</span>
        </h4>

        <div className="grid grid-cols-2 gap-2 text-left">
          <div className="p-3 rounded-2xl bg-[#07173b] border border-cyan-500/20 space-y-1">
            <div className="text-lg">🔒</div>
            <div className="text-xs font-black text-cyan-300">
              {language === 'hi' ? 'केवल 1,000 स्लॉट' : 'Strict 1,000 Cap'}
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              {language === 'hi' 
                ? '1,000 पूरे होने पर कोई नया रजिस्ट्रेशन संभव नहीं होगा।' 
                : 'Hard limit of 1,000 users. No exceptions once filled.'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#07173b] border border-cyan-500/20 space-y-1">
            <div className="text-lg">🎁</div>
            <div className="text-xs font-black text-emerald-400">
              {language === 'hi' ? '100% मुफ़्त रिज़र्वेशन' : '100% Free Access'}
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              {language === 'hi' 
                ? 'स्लॉट रिज़र्व करने के लिए कोई पैसे या टोकन नहीं देने हैं।' 
                : 'Zero cost to reserve. Dedicated community allocation.'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#07173b] border border-cyan-500/20 space-y-1">
            <div className="text-lg">⚡</div>
            <div className="text-xs font-black text-amber-300">
              {language === 'hi' ? 'एयरड्रॉप प्राथमिकता' : 'Airdrop Priority'}
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              {language === 'hi' 
                ? 'टोकन वितरण में पहले 1,000 सदस्यों को प्राथमिकता।' 
                : 'Priority claim queue during token airdrop distribution.'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#07173b] border border-cyan-500/20 space-y-1">
            <div className="text-lg">🛡️</div>
            <div className="text-xs font-black text-purple-300">
              {language === 'hi' ? 'क्लाउड सिंक सुरक्षा' : 'Cloud Sync Security'}
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              {language === 'hi' 
                ? 'हर सदस्य का डेटा Firestore में सुरक्षित और परमानेंट है।' 
                : 'Every member pass is stored permanently in Cloud Firestore.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
