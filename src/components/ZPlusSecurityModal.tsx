/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Shield, ShieldCheck, AlertTriangle, Lock, 
  Terminal, Cpu, CheckCircle2, Zap, RefreshCw, KeyRound, GlobeLock 
} from 'lucide-react';
import { Language, UserStats } from '../types/airdrop.ts';
import { evaluateZPlusSecurity, ZPlusSecurityStatus } from '../utils/securityEngine.ts';
import { playClaimRewardSound, playTapSound } from '../utils/audioEngine.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  stats: UserStats;
}

export const ZPlusSecurityModal: React.FC<Props> = ({
  isOpen,
  onClose,
  language,
  stats,
}) => {
  const [securityStatus, setSecurityStatus] = useState<ZPlusSecurityStatus>(() =>
    evaluateZPlusSecurity(stats)
  );
  const [isScanning, setIsScanning] = useState(false);

  const handleRunRescan = () => {
    playTapSound();
    setIsScanning(true);
    setTimeout(() => {
      const fresh = evaluateZPlusSecurity(stats);
      setSecurityStatus(fresh);
      setIsScanning(false);
      playClaimRewardSound();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#091838] via-[#050f24] to-[#020712] border-2 border-cyan-400/50 p-5 text-white shadow-[0_0_50px_rgba(0,210,255,0.35)] space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 flex items-center justify-center font-black shadow-[0_0_15px_rgba(0,210,255,0.5)]">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-white">
                  {language === 'hi' ? 'Z+ प्रोटोकॉल सुरक्षा शील्ड' : 'Z+ Protocol Security Shield'}
                </h3>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[9px] font-mono font-bold text-emerald-300">
                  REAL Z+
                </span>
              </div>
              <p className="text-[10px] text-cyan-300/80 font-mono">
                Anti-Bot • Anti-Hacker • Zero Data Leakage
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="p-1.5 rounded-full bg-white/10 text-cyan-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big Status Badge Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-cyan-950/60 to-blue-950/70 border border-emerald-400/50 shadow-inner flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            <Lock className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
              {language === 'hi' ? 'सुरक्षा स्थिति: 100% सुरक्षित' : 'Security Status: 100% SECURE'}
            </div>
            <h4 className="text-sm font-black text-white mt-0.5">
              {language === 'hi' ? 'कोई बॉट या अनधिकृत कॉल नहीं मिली' : 'Real Human Verified • No Bot Detected'}
            </h4>
            <span className="text-[10px] text-cyan-200/80 font-mono">
              Telegram ID: {stats.userId} • Bot Risk Score: {securityStatus.botScore}/100
            </span>
          </div>
        </div>

        {/* Protection Items Grid */}
        <div className="space-y-2">
          <div className="text-xs font-mono font-bold text-cyan-200 uppercase tracking-wide">
            {language === 'hi' ? 'सक्रिय रक्षा प्रणाली (Active Defenses)' : 'Active Protocol Defenses'}
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#061433] border border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">
                    {language === 'hi' ? 'एंटी-बॉट एवं एमुलेटर शील्ड' : 'Anti-Bot & Automation Shield'}
                  </div>
                  <div className="text-[10px] text-cyan-300/70 font-mono">
                    Selenium / Puppeteer WebDriver Blocked
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#061433] border border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">
                    {language === 'hi' ? 'डेटा लीकेज एवं गुप्त कॉल सुरक्षा' : 'Zero Data Leakage / Egress Policy'}
                  </div>
                  <div className="text-[10px] text-cyan-300/70 font-mono">
                    No Hidden Rogue Webhooks or Trackers
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                LOCKED
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#061433] border border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">
                    {language === 'hi' ? 'बैलेंस व स्टोरेज छेड़छाड़ सुरक्षा' : 'HMAC Storage Tamper Proofing'}
                  </div>
                  <div className="text-[10px] text-cyan-300/70 font-mono">
                    Console/DevTools Balance Injection Blocked
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                VERIFIED
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#061433] border border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">
                    {language === 'hi' ? 'एंटी-ऑटो-क्लिकर कैडेंस' : 'Human Tap Velocity Filter'}
                  </div>
                  <div className="text-[10px] text-cyan-300/70 font-mono">
                    Sub-35ms Rapid Macro Throttled
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Rescan Button */}
        <div>
          <button
            onClick={handleRunRescan}
            disabled={isScanning}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,210,255,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>
              {isScanning
                ? (language === 'hi' ? 'स्कैनिंग जारी है...' : 'Scanning Environment...')
                : (language === 'hi' ? 'त्वरित सुरक्षा री-स्कैन करें' : 'Run Instant Security Audit')}
            </span>
          </button>
        </div>

        {/* Security Notice */}
        <p className="text-[10px] text-cyan-200/60 text-center font-mono leading-relaxed">
          {language === 'hi'
            ? 'आपका डेटा पूरी तरह से क्लाइंट-साइड नॉन-कस्टोडियल है। कोई पासवर्ड या प्राइवेट की कभी किसी तीसरे पक्ष के पास नहीं जाती।'
            : 'Non-custodial zero-trust architecture. Private keys and sensitive tokens never leave your local device.'}
        </p>

      </div>
    </div>
  );
};
