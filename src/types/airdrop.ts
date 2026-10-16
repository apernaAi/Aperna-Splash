export type TabType = 'tasks' | 'studio' | 'beats' | 'vault' | 'profile' | 'nft';

export type Language = 'hi' | 'en';

export interface MusicTrack {
  id: number;
  levelRequired: number;
  title: string;
  genre: string;
  duration: string;
  bpm: number;
  coverEmoji: string;
  description: string;
  unlockedAt?: number;
}

export interface UserStats {
  userId: string;
  name: string;
  telegramUsername: string;
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
  
  // Real $MIMI On-Chain Claim Architecture
  claimStatus?: 'unclaimed' | 'pending' | 'approved' | 'claimed';
  claimTxHash?: string | null;
  claimAmount?: number;
  claimTimestamp?: number | null;
  lastAllocationClaimDate?: string;
  lastAllocationClaimTimestamp?: number | null;
  lastDaily50ClaimDate?: string;
  
  // CORE LOOP MAKING MECHANICS (Telegram Mini App)
  loopMakingActive: boolean;
  loopStartTime: number | null;
  loopDurationSec: number; // 28800 sec = 8 hours
  currentLevelLoops: number; // Collected loops for current level
  totalLoopsCrafted: number;
  unlockedTrackIds: number[]; // e.g. [1, 2]

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
  category: 'all' | 'adsgram' | 'liquidity' | 'social' | 'ton' | 'community' | 'partner';
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  reward: number;
  iconType: 'adsgram' | 'liquidity' | 'telegram' | 'twitter' | 'wallet' | 'music' | 'users' | 'flame' | 'instagram' | 'discord';
  actionUrl?: string;
  isCompleted: boolean;
  requiresWallet?: boolean;
  isAdsgramTask?: boolean;
  lpBoostTon?: number;
  verificationType?: 'ad_watched' | 'wallet_connected' | 'external_confirmed' | 'auto';
  isStarted?: boolean;
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
    title: 'Mimi Genesis Anthem',
    genre: 'Future Bass',
    duration: '2:45',
    bpm: 128,
    coverEmoji: '🎧',
    description: 'The foundation track of Music Mimi Protocol. Punchy kicks and radiant synth chords.'
  },
  {
    id: 2,
    levelRequired: 2,
    title: 'Neon Soundwave Drift',
    genre: 'Synthwave',
    duration: '3:12',
    bpm: 120,
    coverEmoji: '🌊',
    description: 'Nostalgic 80s analog basslines blended with modern futuristic vocal chops.'
  },
  {
    id: 3,
    levelRequired: 3,
    title: 'Cyberpunk Sub-Bass Rush',
    genre: 'Electro House',
    duration: '2:58',
    bpm: 132,
    coverEmoji: '⚡',
    description: 'High-energy cyberpunk drop with roaring bass and sharp claps.'
  },
  {
    id: 4,
    levelRequired: 4,
    title: 'Celestial Vinyl Groove',
    genre: 'Deep House',
    duration: '3:30',
    bpm: 124,
    coverEmoji: '🪐',
    description: 'Smooth atmospheric groove crafted from warm vinyl dust and Rhodes chords.'
  },
  {
    id: 5,
    levelRequired: 5,
    title: 'Quantum Synth Harmonic',
    genre: 'Melodic Techno',
    duration: '3:45',
    bpm: 126,
    coverEmoji: '🌌',
    description: 'Hypnotic rolling bassline and soaring celestial arpeggios.'
  },
  {
    id: 6,
    levelRequired: 6,
    title: 'Tokyo Midnight Beat',
    genre: 'Lo-Fi Chillhop',
    duration: '2:35',
    bpm: 88,
    coverEmoji: '🌃',
    description: 'Mellow midnight vibes with jazzy piano chops and soothing vinyl crackle.'
  },
  {
    id: 7,
    levelRequired: 7,
    title: 'Solar Flare Drop',
    genre: 'Drum & Bass',
    duration: '3:10',
    bpm: 174,
    coverEmoji: '☀️',
    description: 'Fast-paced liquid drum and bass rhythm with soaring pad textures.'
  },
  {
    id: 8,
    levelRequired: 8,
    title: 'Deep Ocean Sub-Bass',
    genre: 'Ambient Dub',
    duration: '4:02',
    bpm: 110,
    coverEmoji: '🌊',
    description: 'Subterranean 40Hz bass frequencies resonating through infinite digital reverb.'
  },
  {
    id: 9,
    levelRequired: 9,
    title: 'Starlight Echoes',
    genre: 'Trance',
    duration: '3:50',
    bpm: 138,
    coverEmoji: '✨',
    description: 'Euphoric uplifting progression with glittering supersaw leads.'
  },
  {
    id: 10,
    levelRequired: 10,
    title: 'Mimi Legend (Final Master)',
    genre: 'Symphonic Electronic',
    duration: '4:20',
    bpm: 130,
    coverEmoji: '👑',
    description: 'The ultimate masterpiece of Music Mimi Protocol. All 13 master loops unified in harmony.'
  }
];
