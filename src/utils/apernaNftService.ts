/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const APERNA_NFT_CONTRACT = "0x8EAA10c5Cb32b585AE397878F64CF6d3F3b3D348";
export const POLYGON_CHAIN_ID_DECIMAL = 137;
export const POLYGON_CHAIN_ID_HEX = "0x89";
export const POLYGON_RPC_URL = "https://polygon-rpc.com/";
export const POLYGON_EXPLORER = "https://polygonscan.com";
export const OPENSEA_COLLECTION = `https://opensea.io/assets/polygon/${APERNA_NFT_CONTRACT}`;

// User explicitly set price to $0.50 USD!
export const NFT_MINT_PRICE_USD = 0.50; 
// Approx conversions: 1 POL ~ $0.40 USD => $0.50 is 1.25 POL
export const ESTIMATED_POL_PER_MINT = 1.25;
export const ESTIMATED_TON_PER_MINT = 0.18;

// SPECIAL USER INCENTIVES:
// 1st NFT Buy / Mint Reward: 1000 tokens
export const FIRST_NFT_BUY_BONUS_TOKENS = 1000;
// Selling / Listing on any platform reward: 500 tokens
export const NFT_MARKETPLACE_SALE_REWARD_TOKENS = 500;

export interface NftChapter {
  id: string;
  chapterNumber: number;
  chapterRoman: string;
  tokenId: string;
  title: string;
  subtitle: string;
  rarity: "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC";
  stageTag: string;
  story: string;
  priceUsd: number;
  stems: string[];
  accentColor: string;
  themeGradient: string;
  badgeBg: string;
  imageEmoji: string;
  ipfsCid: string;
}

export const APERNA_NFT_CHAPTERS: NftChapter[] = [
  {
    id: "chapter-1-origin-code",
    chapterNumber: 1,
    chapterRoman: "I",
    tokenId: "APN-MEM-001",
    title: "The Origin Code & Neural Architecture",
    subtitle: "Genesis: Late Night Neural Audio Breakthrough",
    rarity: "RARE",
    stageTag: "THE SPARK",
    story: "Late night in the lab. Designing raw neural sound synthesis and low-latency audio pipelines. Conquering tensor mismatches and compiling evolutionary audio generation models.",
    priceUsd: NFT_MINT_PRICE_USD,
    stems: ["Neural Vocal Lead", "Dynamic Noise Gate", "Sub-Harmonic Synthesizer"],
    accentColor: "#38bdf8",
    themeGradient: "from-sky-950 via-slate-900 to-cyan-950",
    badgeBg: "bg-sky-500/20 text-sky-300 border-sky-400/40",
    imageEmoji: "⚡",
    ipfsCid: "bafybeicgqpvfvsz66g76h4x3f5bspg32rtd4d5fqk6iws7w7r4l4i3g6aq/chapter1.json",
  },
  {
    id: "chapter-2-cluster-resonance",
    chapterNumber: 2,
    chapterRoman: "II",
    tokenId: "APN-MEM-002",
    title: "The Distributed Cluster & Cloud Resonance",
    subtitle: "Infrastructure: Orchestration & Zero-Latency Audio Sync",
    rarity: "EPIC",
    stageTag: "THE CLUSTER",
    story: "Deploying high-throughput GPU audio nodes across distributed clusters. Optimizing reverse proxies, WebSocket streaming, and persistent memory caches.",
    priceUsd: NFT_MINT_PRICE_USD,
    stems: ["Acoustic Bass Line", "Percussion Stems", "Stereo Spatializer"],
    accentColor: "#a855f7",
    themeGradient: "from-purple-950 via-slate-900 to-indigo-950",
    badgeBg: "bg-purple-500/20 text-purple-300 border-purple-400/40",
    imageEmoji: "🔮",
    ipfsCid: "bafybeicgqpvfvsz66g76h4x3f5bspg32rtd4d5fqk6iws7w7r4l4i3g6aq/chapter2.json",
  },
  {
    id: "chapter-3-acoustic-trial",
    chapterNumber: 3,
    chapterRoman: "III",
    tokenId: "APN-MEM-003",
    title: "The Acoustic Trial & Vocal Harmony",
    subtitle: "Audio Engineering: AI Vocals to Full Symphony",
    rarity: "LEGENDARY",
    stageTag: "THE HARMONY",
    story: "Real-time acoustic resonance and multi-track orchestration. Transforming vocal humming and beatboxing into complete studio-grade compositions.",
    priceUsd: NFT_MINT_PRICE_USD,
    stems: ["Studio Master Stems", "Analog Chorus FX", "Dynamic Comp Engine"],
    accentColor: "#f59e0b",
    themeGradient: "from-amber-950 via-slate-900 to-yellow-950",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-400/40",
    imageEmoji: "🔥",
    ipfsCid: "bafybeicgqpvfvsz66g76h4x3f5bspg32rtd4d5fqk6iws7w7r4l4i3g6aq/chapter3.json",
  },
  {
    id: "chapter-4-golden-victory",
    chapterNumber: 4,
    chapterRoman: "IV",
    tokenId: "APN-MEM-004",
    title: "The Golden Victory & Airdrop Protocol",
    subtitle: "Triumph: Decentralized Web3 Audio Universe",
    rarity: "MYTHIC",
    stageTag: "THE MASTERPIECE",
    story: "Full Genesis Memorial Sovereign Mint. The pinnacle milestone of Aperna AI and Music Mimi protocol, immortalized forever on Polygon Mainnet.",
    priceUsd: NFT_MINT_PRICE_USD,
    stems: ["Mythic Platinum Stem", "Mastered Symphony WAV", "On-Chain VIP Key"],
    accentColor: "#10b981",
    themeGradient: "from-emerald-950 via-slate-900 to-teal-950",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
    imageEmoji: "👑",
    ipfsCid: "bafybeicgqpvfvsz66g76h4x3f5bspg32rtd4d5fqk6iws7w7r4l4i3g6aq/chapter4.json",
  },
];

export interface MintedNftRecord {
  id: string;
  tokenId: string;
  chapterNumber: number;
  chapterTitle: string;
  txHash: string;
  mintedAt: number;
  walletAddress: string;
  priceUsd: number;
  network: string;
  rarity: string;
}

export function getMintedNftsStorage(): MintedNftRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("aperna_splash_minted_nfts");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMintedNftStorage(nft: MintedNftRecord): MintedNftRecord[] {
  if (typeof window === "undefined") return [nft];
  try {
    const existing = getMintedNftsStorage();
    const updated = [nft, ...existing];
    localStorage.setItem("aperna_splash_minted_nfts", JSON.stringify(updated));
    return updated;
  } catch {
    return [nft];
  }
}

// Check if user has claimed first NFT buy bonus
export function hasClaimedFirstNftBonus(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("aperna_first_nft_bonus_claimed") === "true";
}

export function setClaimedFirstNftBonus(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("aperna_first_nft_bonus_claimed", "true");
  }
}

// Track listings / sales on marketplace for 500 token bonus
export interface NftSaleListingRecord {
  id: string;
  tokenId: string;
  platform: 'OpenSea' | 'MagicEden' | 'Rarible' | 'PolygonDEX';
  listedPriceUsd: number;
  listedPricePol: number;
  listedAt: number;
  bonusClaimed: boolean;
}

export function getListedNftsStorage(): NftSaleListingRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("aperna_listed_nfts_sales");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveListedNftStorage(listing: NftSaleListingRecord): NftSaleListingRecord[] {
  if (typeof window === "undefined") return [listing];
  try {
    const existing = getListedNftsStorage();
    const updated = [listing, ...existing];
    localStorage.setItem("aperna_listed_nfts_sales", JSON.stringify(updated));
    return updated;
  } catch {
    return [listing];
  }
}

// Generate realistic on-chain simulated Polygon transaction hash for non-extension users
export function generatePolygonTxHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}
