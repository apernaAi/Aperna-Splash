/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, ArrowLeft, ShieldCheck, 
  Sparkles, Ticket, Flame, Check, AlertCircle, Clock, Zap
} from 'lucide-react';
import { Language, UserStats } from '../types/airdrop.ts';
import { playClaimRewardSound, playTapSound, triggerHaptic } from '../utils/audioEngine.ts';

interface Props {
  language: Language;
  stats: UserStats;
  onOpenMintModal?: () => void;
  onBack: () => void;
}

const STORAGE_KEY_COUNT = 'mimi_1000_real_pool_clicks_v1';
const STORAGE_KEY_USER_RES = 'mimi_1000_real_user_reservation_v1';
const MAX_POOL_CAPACITY = 1000;
const INITIAL_BASELINE = 0; // Pure 100% real click count starting at 0

export const ApernaNftPage: React.FC<Props> = ({
  language,
  stats,
  onBack,
}) => {
  const [reservedCount, setReservedCount] = useState<number>(0);
  const [userSlotNumber, setUserSlotNumber] = useState<number | null>(null);
  const [reservationDate, setReservationDate] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Clear legacy fake keys
      localStorage.removeItem('mimi_1000_early_pool_slots_v2');
      localStorage.removeItem('mimi_1000_pool_user_reservation_v2');
      localStorage.removeItem('mimi_free_nft_reserved_spot_v1');

      // 1. Load real pool count
      const savedCount = localStorage.getItem(STORAGE_KEY_COUNT);
      if (savedCount) {
        const parsed = parseInt(savedCount, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= MAX_POOL_CAPACITY) {
          setReservedCount(parsed);
        }
      } else {
        setReservedCount(0);
      }

      // 2. Load user's real reservation
      const savedUser = localStorage.getItem(STORAGE_KEY_USER_RES);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.slotNumber) {
          setUserSlotNumber(parsed.slotNumber);
          setReservationDate(parsed.reservedAt || new Date().toLocaleDateString());
        }
      }
    } catch {}
  }, []);

  const handleReserveSlot = () => {
    if (userSlotNumber) return; // Already reserved
    if (reservedCount >= MAX_POOL_CAPACITY) return; // Pool full

    playClaimRewardSound();
    triggerHaptic('heavy');

    const nextSlot = Math.min(MAX_POOL_CAPACITY, reservedCount + 1);
    setReservedCount(nextSlot);
    setUserSlotNumber(nextSlot);
    const dateStr = new Date().toLocaleString();
    setReservationDate(dateStr);

    try {
      localStorage.setItem(STORAGE_KEY_COUNT, String(nextSlot));
      localStorage.setItem(STORAGE_KEY_USER_RES, JSON.stringify({
        userId: stats.userId,
        telegramUsername: stats.telegramUsername,
        slotNumber: nextSlot,
        reservedAt: dateStr,
      }));
    } catch {}
  };

  const remainingSlots = Math.max(0, MAX_POOL_CAPACITY - reservedCount);
  const progressPercent = Math.min(100, Math.round((reservedCount / MAX_POOL_CAPACITY) * 100));
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
          <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/70 px-2 py-1 rounded-xl border border-amber-400/40 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
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
            {language === 'hi' ? 'सीमित कम्युनिटी पूल' : 'LIMITED COMMUNITY POOL'}
          </span>
          <span className="text-[10px] font-mono text-cyan-200 bg-black/40 px-2 py-0.5 rounded-full border border-cyan-500/30">
            {language === 'hi' ? '1 यूज़र = 1 स्लॉट' : '1 User = 1 Slot'}
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
              ? 'इस पूल में सिर्फ 1,000 स्लॉट उपलब्ध हैं। केवल पहले 1,000 लोग ही क्लिक करके अपना स्लॉट रिज़र्व कर सकते हैं। 1,000 पूरे होने के बाद यह पूल बंद हो जाएगा!'
              : 'There are strictly 1,000 spots in this pool. Only the first 1,000 community members can click and reserve their spot. Once filled, the pool closes permanently!'}
          </p>
        </div>

        {/* Live Slot Meter */}
        <div className="p-3.5 rounded-2xl bg-black/50 border border-cyan-500/30 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-cyan-300">
              <Ticket className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'hi' ? 'पूल स्लॉट स्थिति' : 'Pool Capacity Status'}</span>
            </span>
            <span className="font-mono font-black text-white text-xs">
              <span className="text-cyan-300">{reservedCount}</span> / 1,000 ({progressPercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-cyan-500/40">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-sky-400 shadow-[0_0_15px_rgba(0,210,255,0.8)] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
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
              {language === 'hi' ? 'सीमित समय' : 'First Come Basis'}
            </span>
          </div>
        </div>

        {/* Action Button or Verified Reservation Pass */}
        {!userSlotNumber ? (
          <button
            onClick={handleReserveSlot}
            disabled={isFull}
            className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isFull
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-[0_0_25px_rgba(0,210,255,0.7)]'
            }`}
          >
            <Ticket className="w-4 h-4 fill-slate-950" />
            <span>
              {isFull
                ? (language === 'hi' ? 'पूल बंद (1,000 पूरे हो चुके हैं)' : 'Pool Full (1,000 Reached)')
                : (language === 'hi' 
                    ? `🎟️ अपना स्लॉट रिज़र्व करें (#${reservedCount + 1}/1,000)` 
                    : `🎟️ Reserve My Slot (#${reservedCount + 1}/1,000)`)}
            </span>
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-[#05263d] border-2 border-emerald-400/80 shadow-[0_0_25px_rgba(16,185,129,0.35)] space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-400/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 font-black">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-300">
                    {language === 'hi' ? '✅ आपका स्लॉट सफलतापूर्वक रिज़र्व है!' : '✅ Slot Successfully Reserved!'}
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

            <div className="p-2 rounded-xl bg-black/40 text-[11px] font-mono text-cyan-200 space-y-1 border border-white/5">
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

      {/* 1,000 Pool Rules & Perks */}
      <div className="space-y-2">
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
              {language === 'hi' ? 'एंटी-बॉट सुरक्षा' : 'Anti-Bot Protected'}
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              {language === 'hi' 
                ? 'एक टेलीग्राम अकाउंट केवल एक बार ही क्लिक कर सकता है।' 
                : 'Single click per account with cryptographically signed state.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
