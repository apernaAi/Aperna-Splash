import React from 'react';
import { ChevronRight, Radio, Disc3, Sparkles, Headphones, Volume2, Sliders, Zap } from 'lucide-react';
import { UserStats, Language } from '../types/airdrop.ts';
import { ASSETS } from '../assets/assetRegistry.ts';
import { playClaimRewardSound, playTapSound } from '../utils/audioEngine.ts';

interface Props {
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  language: Language;
  onOpenArcade: () => void;
}

export const MinerUpgradesView: React.FC<Props> = ({
  stats,
  onUpdateStats,
  language,
  onOpenArcade,
}) => {
  const hpLevel = stats.studioUpgrades?.headphonesLevel || 1;
  const ttLevel = stats.studioUpgrades?.turntableLevel || 1;
  const ampLevel = stats.studioUpgrades?.amplifierLevel || 1;

  const upgradesList = [
    {
      id: 'headphones',
      nameHi: 'होलोग्राफिक हेडफ़ोन (Hi-Fi)',
      nameEn: 'Holographic Hi-Fi Headphones',
      descHi: 'बीट रश आर्केड में +1 दैनिक प्ले और +500 अधिकतम ऊर्जा अनलॉक करता है',
      descEn: '+1 Extra Daily Beat Rush play & +500 Max Energy',
      level: hpLevel,
      cost: 15 * hpLevel,
      iconEmoji: '🎧',
      statBonusHi: `Lvl ${hpLevel} → ${3 + hpLevel} दैनिक खेल`,
      statBonusEn: `Lvl ${hpLevel} → ${3 + hpLevel} Daily Plays`,
    },
    {
      id: 'turntable',
      nameHi: 'गोल्डन विनाइल सुई (Gold Stylus)',
      nameEn: 'Gold Stylus Needle',
      descHi: '8-घंटे के लूप निर्माण का समय घटाता है (प्रति लेवल -2 मिनट तेज़ लूप जनरेशन)',
      descEn: 'Speeds up 8-hour loop craft (-2 mins per level)',
      level: ttLevel,
      cost: 25 * ttLevel,
      iconEmoji: '🎛️',
      statBonusHi: `Lvl ${ttLevel} → -${ttLevel * 2}m समय कटौती`,
      statBonusEn: `Lvl ${ttLevel} → -${ttLevel * 2}m Craft Time`,
    },
    {
      id: 'amplifier',
      nameHi: 'मास्टर साउंड एम्पलीफायर',
      nameEn: 'Master Sound Amplifier',
      descHi: 'प्रत्येक लूप मर्ज और क्लेम पर अतिरिक्त  टोकन बोनस देता है',
      descEn: 'Grants extra +5  bonus on loop merge & +2 on claim',
      level: ampLevel,
      cost: 35 * ampLevel,
      iconEmoji: '🔊',
      statBonusHi: `Lvl ${ampLevel} → +${ampLevel * 5}  मर्ज बोनस`,
      statBonusEn: `Lvl ${ampLevel} → +${ampLevel * 5}  Merge Bonus`,
    },
  ];

  const handleUpgrade = (id: string, cost: number) => {
    if (stats.balance < cost) {
      alert(language === 'hi' ? 'पर्याप्त  बैलेंस नहीं है! बीट्स या टास्क से टोकन अर्जित करें।' : 'Not enough  tokens! Earn tokens from tasks or beats.');
      return;
    }

    playClaimRewardSound();
    const newBalance = Number((stats.balance - cost).toFixed(2));
    const newInApp = Number(Math.max(0, stats.inAppBalance - cost).toFixed(2));
    const newUpgrades = {
      headphonesLevel: hpLevel,
      turntableLevel: ttLevel,
      amplifierLevel: ampLevel,
    };

    if (id === 'headphones') {
      newUpgrades.headphonesLevel += 1;
      onUpdateStats({
        ...stats,
        balance: newBalance,
        inAppBalance: newInApp,
        maxEnergy: (stats.maxEnergy || 1000) + 500,
        energy: (stats.energy || 1000) + 500,
        studioUpgrades: newUpgrades,
      });
    } else if (id === 'turntable') {
      newUpgrades.turntableLevel += 1;
      onUpdateStats({
        ...stats,
        balance: newBalance,
        inAppBalance: newInApp,
        studioUpgrades: newUpgrades,
      });
    } else if (id === 'amplifier') {
      newUpgrades.amplifierLevel += 1;
      onUpdateStats({
        ...stats,
        balance: newBalance,
        inAppBalance: newInApp,
        studioUpgrades: newUpgrades,
      });
    }
  };

  const todayDateStr = new Date().toISOString().slice(0, 10);
  const arcadePlaysToday = stats.lastArcadePlayDate === todayDateStr ? (stats.arcadePlaysToday || 0) : 0;
  const maxArcadePlays = 3 + hpLevel;
  const arcadePlaysRemaining = Math.max(0, maxArcadePlays - arcadePlaysToday);

  return (
    <div className="w-full flex flex-col gap-4 pb-28 pt-2 px-4 select-none">
      {/* 1. Header Banner */}
      <div className="w-full rounded-3xl bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#1e3a8a] border border-cyan-400/40 p-5 shadow-[0_10px_35px_rgba(2,132,199,0.35)] flex items-center justify-between glass-sheen">
        <div>
          <span className="text-[11px] font-mono font-bold text-cyan-200 uppercase tracking-wider">
            {language === 'hi' ? 'मिमी साउंड स्टूडियो' : "Mimi Sound Lab"}
          </span>
          <h2 className="text-xl font-black text-white mt-0.5">
            {language === 'hi' ? 'स्टूडियो उपकरण एवं गियर' : 'Studio Gear & Upgrades'}
          </h2>
          <p className="text-xs text-cyan-100 mt-1 max-w-xs">
            {language === 'hi'
              ? 'स्टूडियो गियर अपग्रेड करें: तेज़ लूप निर्माण, अधिक दैनिक गेम्स, और बड़ा मर्ज बोनस पाएं!'
              : 'Upgrade sound gear to speed up loops, unlock extra daily arcade plays & boost bonuses!'}
          </p>
        </div>
        <div className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center p-1 bg-gradient-to-tr from-cyan-400 via-sky-300 to-amber-300 shadow-[0_0_20px_rgba(0,210,255,0.6)]">
          <img
            src={ASSETS.mimiCatToken}
            alt="Music Mimi"
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
      </div>

      {/* 1.5 Active Studio Perks Dashboard */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
        <div className="p-2.5 rounded-2xl bg-[#09224f] border border-cyan-400/30 flex flex-col items-center justify-center">
          <span className="text-[10px] text-cyan-300/80 font-bold">
            {language === 'hi' ? 'दैनिक आर्केड' : 'Arcade Plays'}
          </span>
          <span className="text-sm font-black text-white mt-0.5">
            {arcadePlaysRemaining}/{maxArcadePlays}
          </span>
          <span className="text-[9px] text-cyan-400">+{hpLevel} HP Gear</span>
        </div>
        <div className="p-2.5 rounded-2xl bg-[#09224f] border border-cyan-400/30 flex flex-col items-center justify-center">
          <span className="text-[10px] text-cyan-300/80 font-bold">
            {language === 'hi' ? 'लूप स्पीड' : 'Craft Speed'}
          </span>
          <span className="text-sm font-black text-white mt-0.5">
            -{ttLevel * 2}m
          </span>
          <span className="text-[9px] text-cyan-400">Turntable Lvl {ttLevel}</span>
        </div>
        <div className="p-2.5 rounded-2xl bg-[#09224f] border border-cyan-400/30 flex flex-col items-center justify-center">
          <span className="text-[10px] text-cyan-300/80 font-bold">
            {language === 'hi' ? 'मर्ज बोनस' : 'Merge Bonus'}
          </span>
          <span className="text-sm font-black text-amber-300 mt-0.5">
            +{ampLevel * 5} 
          </span>
          <span className="text-[9px] text-cyan-400">Amp Lvl {ampLevel}</span>
        </div>
      </div>

      {/* 2. Mini Game Launcher with Daily Plays remaining badge */}
      <button
        onClick={() => {
          playTapSound();
          onOpenArcade();
        }}
        className="w-full rounded-2xl p-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 border border-cyan-400/30 text-white flex items-center justify-between shadow-lg active:scale-[0.98] transition-all cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎛️</span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">
                {language === 'hi' ? 'मिमी बीट रश खेलें' : 'Play Mimi Beat Rush'}
              </h3>
              <span className="text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-400/40">
                {arcadePlaysRemaining}/{maxArcadePlays} {language === 'hi' ? 'शेष' : 'Left'}
              </span>
            </div>
            <p className="text-xs text-cyan-100">
              {language === 'hi' ? '5 संगीत परतों में छिपे  अनलॉक करें (अधिकतम 13  प्रति गेम)!' : 'Unlock 5 rhythm layers for up to 13  per play!'}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* 3. Upgrades List */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-extrabold text-cyan-200 px-1">
          {language === 'hi' ? 'उपलब्ध स्टूडियो अपग्रेड' : 'Available Studio Upgrades'}
        </h3>
        {upgradesList.map((item) => (
          <div
            key={item.id}
            className="w-full rounded-2xl glass-panel-blue p-4 shadow-md flex items-center justify-between gap-3"
          >
            {/* Left: Icon */}
            <div className="w-13 h-13 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-2xl flex-shrink-0">
              {item.iconEmoji}
            </div>

            {/* Middle: Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
                  {language === 'hi' ? item.nameHi : item.nameEn}
                </h4>
                <span className="text-[10px] bg-cyan-950 px-2 py-0.5 rounded-full text-cyan-300 font-bold border border-cyan-500/30">
                  Lvl {item.level}
                </span>
              </div>
              <p className="text-[11px] text-cyan-200/80 truncate mt-0.5">
                {language === 'hi' ? item.descHi : item.descEn}
              </p>
              <span className="inline-block text-[10px] font-black text-cyan-300 mt-1 font-mono">
                {language === 'hi' ? item.statBonusHi : item.statBonusEn}
              </span>
            </div>

            {/* Right: Buy Button */}
            <button
              onClick={() => handleUpgrade(item.id, item.cost)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all flex flex-col items-center flex-shrink-0 cursor-pointer"
            >
              <span>{language === 'hi' ? 'अपग्रेड' : 'Upgrade'}</span>
              <span className="text-[10px] font-mono">{item.cost} </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
