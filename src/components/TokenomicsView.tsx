import React, { useState } from 'react';
import {
  PieChart,
  Shield,
  FileCode2,
  Layers,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Building2,
  CheckCircle2
} from 'lucide-react';
import {
  TON_CONFIG,
  getTonscanAddressUrl,
  getTonviewerAddressUrl,
  shortenAddress
} from '../utils/tonService.ts';
import { playTapSound } from '../utils/audioEngine.ts';

export const TokenomicsView: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    playTapSound();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const ALLOCATIONS = [
    { label: 'Community Airdrop & DEX Liquidity', percent: 70, amount: '7,000,000,000', color: '#00d2ff', note: '100% Unlocked at TGE for active community nodes' },
    { label: 'Music Creators & Artist DAO Grants', percent: 15, amount: '1,500,000,000', color: '#38bdf8', note: '18-Month Linear DAO governance distribution' },
    { label: 'Ecosystem Staking Vaults', percent: 10, amount: '1,000,000,000', color: '#0284c7', note: 'Staking yields for long-term vinyl nodes' },
    { label: 'Core Engineering & Protocol Audits', percent: 5, amount: '500,000,000', color: '#6366f1', note: '24-Month Linear Vesting with 6-Month Cliff' }
  ];

  const ROADMAP = [
    {
      phase: 'Phase 1 • Q1 2026',
      title: 'Community Genesis & TMA Launch',
      status: 'active',
      desc: 'Launch Telegram Mini App, Mimi Mining turntable engine, and community quests.'
    },
    {
      phase: 'Phase 2 • Q2 2026',
      title: 'Block Snapshot & Sybil Verification',
      status: 'upcoming',
      desc: 'Capture TON block height snapshot, verify on-chain activity, and generate Merkle proofs.'
    },
    {
      phase: 'Phase 3 • Q3 2026',
      title: 'TGE & DEX Listing on TON',
      status: 'upcoming',
      desc: 'Token Generation Event on DeDust & STON.fi with permanent LP burn and claim.'
    },
    {
      phase: 'Phase 4 • Q4 2026',
      title: 'Decentralized Audio Protocol DAO',
      status: 'upcoming',
      desc: 'On-chain music copyright registry, royalty staking pools, and artist governance.'
    }
  ];

  return (
    <div className="flex flex-col items-center max-w-md mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="w-full text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel text-cyan-300 text-xs font-mono font-semibold">
          <PieChart className="w-3.5 h-3.5 text-cyan-400" />
          <span>Verifiable Tokenomics</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]">
          100% Fair Launch & Architecture
        </h2>
        <p className="text-xs text-slate-400">
          Transparent, community-first token distribution with zero private pre-sales, zero VC discounts, and audited smart contracts.
        </p>
      </div>

      {/* Official DEX Notice */}
      <div className="w-full p-4 rounded-3xl bg-gradient-to-br from-cyan-950/80 via-[#031d45] to-[#020e26] border-2 border-cyan-400/50 space-y-1.5 shadow-[0_4px_25px_rgba(0,210,255,0.2)]">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Official Community Notice</span>
        </div>
        <p className="text-xs text-cyan-100/95 leading-relaxed italic">
          "{TON_CONFIG.dexListingNotice}"
        </p>
      </div>

      {/* Total Supply Card */}
      <div className="w-full glass-panel-glow rounded-3xl p-6 text-center space-y-1">
        <div className="text-xs text-cyan-300 font-mono uppercase tracking-widest">
          Fixed Total Supply ($MIMI)
        </div>
        <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight drop-shadow-[0_0_20px_rgba(0,210,255,0.6)]">
          10,000,000,000
        </div>
        <div className="text-[11px] text-cyan-400 font-mono font-semibold">
          TEP-74 Jetton Standard • The Open Network (TON)
        </div>
      </div>

      {/* Official Verified Blockchain Parameters */}
      <div className="w-full glass-panel rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-cyan-500/20">
          <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>Official On-Chain Addresses</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-400/30">
            TON Mainnet
          </span>
        </div>

        {/* Jetton Master */}
        <div className="p-2.5 rounded-2xl bg-[#030914] border border-cyan-500/20 space-y-1">
          <div className="text-[10px] text-slate-400 font-mono">Jetton Master Contract Address</div>
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-white font-bold">{shortenAddress(TON_CONFIG.jettonMasterAddress, 6)}</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => copyToClipboard(TON_CONFIG.jettonMasterAddress, 'master')}
                className="text-cyan-300 hover:text-white p-1"
                title="Copy"
              >
                {copiedKey === 'master' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={getTonscanAddressUrl(TON_CONFIG.jettonMasterAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 hover:text-white p-1"
                title="View on Tonscan"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Admin / Airdrop Pool Address */}
        <div className="p-2.5 rounded-2xl bg-[#030914] border border-cyan-500/20 space-y-1">
          <div className="text-[10px] text-slate-400 font-mono">Admin / Airdrop Pool Address</div>
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-white font-bold">{shortenAddress(TON_CONFIG.adminAirdropPoolAddress, 6)}</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => copyToClipboard(TON_CONFIG.adminAirdropPoolAddress, 'pool')}
                className="text-cyan-300 hover:text-white p-1"
                title="Copy"
              >
                {copiedKey === 'pool' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={getTonscanAddressUrl(TON_CONFIG.adminAirdropPoolAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 hover:text-white p-1"
                title="View on Tonscan"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Connected Jetton Wallet Address */}
        <div className="p-2.5 rounded-2xl bg-[#030914] border border-cyan-500/20 space-y-1">
          <div className="text-[10px] text-slate-400 font-mono">Connected Jetton Wallet Address</div>
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-white font-bold">{shortenAddress(TON_CONFIG.connectedJettonWalletAddress, 6)}</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => copyToClipboard(TON_CONFIG.connectedJettonWalletAddress, 'wallet_dist')}
                className="text-cyan-300 hover:text-white p-1"
                title="Copy"
              >
                {copiedKey === 'wallet_dist' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={getTonviewerAddressUrl(TON_CONFIG.connectedJettonWalletAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 hover:text-white p-1"
                title="View on Tonviewer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Allocation Stack */}
      <div className="w-full space-y-3">
        <div className="w-full h-4 rounded-full overflow-hidden flex bg-[#030914] border border-cyan-500/30 p-0.5 shadow-inner">
          <div style={{ width: '70%' }} className="bg-cyan-400 shadow-[0_0_8px_rgba(0,210,255,0.8)]" title="Community: 70%" />
          <div style={{ width: '15%' }} className="bg-sky-400" title="Creators: 15%" />
          <div style={{ width: '10%' }} className="bg-blue-600" title="Staking: 10%" />
          <div style={{ width: '5%' }} className="bg-indigo-500" title="Core: 5%" />
        </div>

        {/* Breakdown Items */}
        <div className="space-y-2.5">
          {ALLOCATIONS.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl glass-panel space-y-1 hover:border-cyan-500/40 transition-all"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shadow-[0_0_6px]" style={{ backgroundColor: item.color }} />
                  <span className="font-bold text-white">{item.label}</span>
                </div>
                <span className="font-mono font-bold text-cyan-400">{item.percent}%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                <span>{item.amount} $MIMI</span>
                <span className="text-slate-500">{item.note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Contract Specs */}
      <div className="w-full glass-panel rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
          <FileCode2 className="w-4 h-4 text-cyan-400" />
          <span>Smart Contract Architecture</span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between p-2.5 rounded-xl bg-[#030914] border border-cyan-500/20 text-slate-300">
            <span className="text-slate-500">Contract Standard</span>
            <span className="text-cyan-300">TON TEP-74 Jetton</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-xl bg-[#030914] border border-cyan-500/20 text-slate-300">
            <span className="text-slate-500">Token Decimals</span>
            <span className="text-cyan-300">9 Decimals</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-xl bg-[#030914] border border-cyan-500/20 text-slate-300">
            <span className="text-slate-500">Mint Authority</span>
            <span className="text-cyan-400 font-bold">Revoked upon TGE</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-xl bg-[#030914] border border-cyan-500/20 text-slate-300">
            <span className="text-slate-500">Security Audit</span>
            <span className="text-emerald-400 font-bold">CertiK & TON Security</span>
          </div>
        </div>
      </div>

      {/* Protocol Roadmap */}
      <div className="w-full space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-white px-1 font-mono">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Protocol Execution Roadmap</span>
        </div>

        <div className="space-y-2.5">
          {ROADMAP.map((step, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl transition-all ${
                step.status === 'active'
                  ? 'glass-panel-glow border-cyan-400/80 ring-1 ring-cyan-400/40'
                  : 'glass-panel'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1 font-mono">
                <span className="text-[10px] text-slate-400">{step.phase}</span>
                {step.status === 'active' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_8px_rgba(0,210,255,0.4)]">
                    IN PROGRESS
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">PLANNED</span>
                )}
              </div>
              <h4 className="text-xs font-bold text-white">{step.title}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
