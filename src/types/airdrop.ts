export type TabType = 'tasks' | 'studio' | 'beats' | 'vault' | 'profile' | 'nft' | 'rank';

export type Language = 'hi' | 'en';

export interface RankedUser {
  userId: string;
  name: string;
  telegramUsername: string;
  walletAddress: string | null;
  level: number;
  balance: number;
  tasksCompletedCount: number;
  dailyStreakDay: number;
  score: number;
  roleTitle: string;
  lastActive: string;
  avatarUrl?: string;
}

export function calculateRankScore(stats: {
  level: number;
  balance: number;
  tasksCompletedCount?: number;
  dailyStreakDay?: number;
}): number {
  const lvl = Math.max(1, Number(stats.level) || 1);
  const bal = Math.max(0, Number(stats.balance) || 0);
  const tasks = Math.max(0, Number(stats.tasksCompletedCount) || 0);
  const streak = Math.max(1, Number(stats.dailyStreakDay) || 1);

  // Transparent, merit-based scoring formula:
  // 1. Level Mastery: +1,000 points per level
  // 2. Token Holdings: +2 points per $MIMI token
  // 3. Task / Quest completions: +150 points per task
  // 4. Daily Consistency Streak: +100 points per streak day
  return Math.floor((lvl * 1000) + (bal * 2) + (tasks * 150) + (streak * 100));
}

export interface MusicTrack {
  id: number;
  levelRequired: number;
  title: string;
  artist: string;
  genre: string;
  duration: string;
  bpm: number;
  coverEmoji: string;
  description: string;
  audioUrl: string;
  unlockedAt?: number;
}

export interface UserStats {
  userId: string;
  name: string;
  telegramUsername: string;
  avatarUrl?: string;
  protocolId: string;
  level: number; // Level 1 to 10
  highestLevel: number;
  roleTitle: string;
  traineeBadge: string;
  balance: number;
  inAppBalance: number;
  onChainBalance: number;
  usdConversionRate: number;
  beatsStreamed: number;
  recruitsCount: number;
  commissionEarned?: number;
  daysActive: number;
  walletAddress: string | null;
  walletProvider: string | null;
  walletAgeDays: number;
  isWalletVerified: boolean;
  dailyStreakDay: number;
  lastDailyClaim: number | null;
  tasksCompletedCount?: number;
  score?: number;
  
  // Real $MIMI On-Chain Claim Architecture
  claimStatus?: 'unclaimed' | 'pending' | 'approved' | 'claimed';
  claimTxHash?: string | null;
  claimAmount?: number;
  claimTimestamp?: number | null;
  lastAllocationClaimDate?: string;
  lastAllocationClaimTimestamp?: number | null;
  lastDaily50ClaimDate?: string;
  claimedReferralBonus?: number;
  lastCommissionClaimDate?: string;
  claimedCommission?: number;
  referrerId?: string | null;
  
  // CORE LOOP MAKING MECHANICS (Telegram Mini App)
  loopMakingActive: boolean;
  loopStartTime: number | null;
  loopDurationSec: number; // 28800 sec = 8 hours
  currentLevelLoops: number; // Collected loops for current level
  totalLoopsCrafted: number;
  unlockedTrackIds: number[]; // e.g. [1, 2]
  bgmTrackId?: number; // Active background music track (1-10)
  bgmEnabled?: boolean; // Whether background music is active
  bgmVolume?: number; // Ambient background volume (0.0 to 1.0, default 0.28)

  energy: number;
  maxEnergy: number;
  hasClaimedWelcome: boolean;
  
  // Adsgram Revenue & DEX Liquidity Contributions
  adsWatchedCount?: number;
  liquidityContributedTon?: number;

  // Arcade / Beat Rush Daily Limits
  arcadePlaysToday?: number;
  lastArcadePlayDate?: string;

  studioUpgrades: {
    headphonesLevel: number;
    turntableLevel: number;
    amplifierLevel: number;
  };
}

export interface AirdropTask {
  id: string;
  category: 'all' | 'adsgram' | 'liquidity' | 'social' | 'ton' | 'community' | 'partner' | 'youtube';
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  reward: number;
  iconType: 'adsgram' | 'liquidity' | 'telegram' | 'twitter' | 'wallet' | 'music' | 'users' | 'flame' | 'instagram' | 'discord' | 'youtube';
  actionUrl?: string;
  isCompleted: boolean;
  requiresWallet?: boolean;
  isAdsgramTask?: boolean;
  lpBoostTon?: number;
  verificationType?: 'ad_watched' | 'wallet_connected' | 'external_confirmed' | 'auto';
  isStarted?: boolean;
  requiredWaitSeconds?: number;
  subType?: 'subscribe' | 'video' | 'telegram' | 'instagram' | 'partner' | 'other';
  lastCompletedDate?: string; // 'YYYY-MM-DD' for daily reset
  lastCompletedTimestamp?: number; // ms timestamp
  isDailyRepeatable?: boolean; // defaults to true for daily tasks
}

export interface RealReferral {
  id: string;
  userId: string;
  name: string;
  username: string;
  joinedTimestamp: number;
  level: number;
  bonusEarned: number;
  isQualified: boolean;
  commissionEarned?: number;
  status?: 'qualified' | 'pending';
}

export function getRequiredLoopsForLevel(level: number): number {
  // Level 1: 4 loops, Level 2: 5 loops, ..., Level 10: 13 loops
  return Math.min(13, level + 3);
}

export const MUSIC_TRACKS_DATABASE: MusicTrack[] = [
  {
    id: 1,
    levelRequired: 1,
    title: 'Dark Dark Beat',
    artist: 'Vaitsez',
    genre: 'Dark Trap Beat',
    duration: '1:27',
    bpm: 128,
    coverEmoji: '🎧',
    description: 'Vaitsez - Dark Dark Beat. Heavy 808 bass, punchy kicks and dark atmospheric rhythm.',
    audioUrl: '/audio/tracks/track-1.mp3'
  },
  {
    id: 2,
    levelRequired: 2,
    title: 'The Borderland',
    artist: 'Eugene Myers',
    genre: 'Synthwave',
    duration: '3:19',
    bpm: 120,
    coverEmoji: '🌊',
    description: 'Eugene Myers - The Borderland. Cyberpunk neon soundscapes with rich retro analog leads.',
    audioUrl: '/audio/tracks/track-2.mp3'
  },
  {
    id: 3,
    levelRequired: 3,
    title: 'Adrenaline',
    artist: 'Mickeys Cat',
    genre: 'Electro House',
    duration: '2:22',
    bpm: 132,
    coverEmoji: '⚡',
    description: 'Mickeys Cat - Adrenaline. High-energy electronic drops driving non-stop momentum.',
    audioUrl: '/audio/tracks/track-3.mp3'
  },
  {
    id: 4,
    levelRequired: 4,
    title: 'Halloween Suspense Horror Waltz',
    artist: 'BombinSound',
    genre: 'Cinematic Horror',
    duration: '3:02',
    bpm: 116,
    coverEmoji: '🎃',
    description: 'BombinSound - Halloween Suspense Horror Halloween Waltz. Theatrical strings and dramatic waltz.',
    audioUrl: '/audio/tracks/track-4.mp3'
  },
  {
    id: 5,
    levelRequired: 5,
    title: 'Uplifting Action Energetic Rock',
    artist: 'Ikoliks',
    genre: 'Sport Action Rock',
    duration: '2:05',
    bpm: 140,
    coverEmoji: '🎸',
    description: 'Ikoliks - Uplifting Action Sport Energetic Rock. Roaring guitars and dynamic driving drums.',
    audioUrl: '/audio/tracks/track-5.mp3'
  },
  {
    id: 6,
    levelRequired: 6,
    title: 'The Hip Hop',
    artist: 'AudioKnap',
    genre: 'Boom Bap Hip Hop',
    duration: '1:41',
    bpm: 90,
    coverEmoji: '🎤',
    description: 'AudioKnap - The Hip Hop. Classic urban breaks and soulful vinyl groove.',
    audioUrl: '/audio/tracks/track-6.mp3'
  },
  {
    id: 7,
    levelRequired: 7,
    title: 'Background Music',
    artist: 'Jonas Blakewood',
    genre: 'Lo-Fi Chillhop',
    duration: '2:19',
    bpm: 110,
    coverEmoji: '✨',
    description: 'Jonas Blakewood - Background Music. Smooth ambient chords and relaxed listening beats.',
    audioUrl: '/audio/tracks/track-7.mp3'
  },
  {
    id: 8,
    levelRequired: 8,
    title: 'Cinematic Background Music',
    artist: 'AudioEra',
    genre: 'Epic Orchestral',
    duration: '2:12',
    bpm: 100,
    coverEmoji: '🎬',
    description: 'AudioEra - Cinematic Background Music. Emotional cinematic journey and soaring crescendos.',
    audioUrl: '/audio/tracks/track-8.mp3'
  },
  {
    id: 9,
    levelRequired: 9,
    title: 'Beautiful Uplifting Music',
    artist: 'Twisterium',
    genre: 'Acoustic Uplifting Pop',
    duration: '2:09',
    bpm: 124,
    coverEmoji: '🌟',
    description: 'Twisterium - Beautiful Uplifting Music. Radiant acoustic melodies, sparkling piano and pure joy.',
    audioUrl: '/audio/tracks/track-9.mp3'
  },
  {
    id: 10,
    levelRequired: 10,
    title: 'Christmas Celebration',
    artist: 'Tunetank Special',
    genre: 'Festive Anthem',
    duration: '2:42',
    bpm: 128,
    coverEmoji: '🏆',
    description: 'Tunetank - Christmas Celebration. The ultimate victory celebration anthem for Level 10 masters.',
    audioUrl: '/audio/tracks/track-10.mp3'
  }
];
