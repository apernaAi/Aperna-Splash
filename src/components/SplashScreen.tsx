import React, { useEffect, useState } from 'react';
import { ShieldCheck, ChevronDown, MoreVertical, X, CheckCircle2 } from 'lucide-react';
import { ASSETS } from '../assets/assetRegistry.ts';
import { Language } from '../types/airdrop.ts';

interface Props {
  language: Language;
  onComplete: () => void;
}

export const SplashScreen: React.FC<Props> = ({ language, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setVerified(true);
          setTimeout(() => {
            onComplete();
          }, 700);
          return 100;
        }
        return prev + 15;
      });
    }, 150);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-gradient-to-b from-[#0a2356] via-[#051334] to-[#020a1c] text-white px-5 py-4 select-none overflow-hidden">
      {/* Top Telegram Header Bar */}
      <div className="w-full flex items-center justify-between text-cyan-200">
        <button
          onClick={onComplete}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d2a64]/80 text-white text-xs font-semibold hover:bg-[#123886] border border-cyan-400/30 transition-all"
        >
          <X className="w-3.5 h-3.5 text-cyan-300" />
          <span>Close</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onComplete}
            className="p-1.5 rounded-full bg-[#0d2a64]/80 text-cyan-200 hover:text-white border border-cyan-400/30"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-full bg-[#0d2a64]/80 text-cyan-200 hover:text-white border border-cyan-400/30">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Center Content */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto text-center px-4">
        {/* 3D Music Mimi Mascot */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-3xl scale-125 pointer-events-none" />
          <img
            src={ASSETS.mimiMascot}
            alt="Music Mimi Mascot"
            referrerPolicy="no-referrer"
            className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-3xl drop-shadow-[0_15px_40px_rgba(0,180,255,0.45)] transition-transform duration-700 hover:scale-105"
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-wide text-white drop-shadow-[0_0_20px_rgba(0,210,255,0.8)] mb-2">
          Music Mimi
        </h1>
        <p className="text-xs font-mono text-cyan-300 tracking-widest uppercase mb-4">
          $MIMI Web3 Music Protocol
        </p>

        {/* Security Verification Status */}
        <div className="flex items-center justify-center gap-2 text-cyan-300 text-sm sm:text-base font-semibold mb-4">
          {verified ? (
            <CheckCircle2 className="w-5 h-5 text-cyan-300 animate-bounce" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-cyan-400 animate-pulse" />
          )}
          <span>
            {language === 'hi'
              ? verified
                ? 'कनेक्शन सत्यापित! ऐप लोड हो रहा है...'
                : 'जाँच रहे हैं कि आपका TON कनेक्शन सुरक्षित है...'
              : verified
              ? 'Connection verified! Entering protocol...'
              : 'Verifying secure TON node connection...'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1.5 bg-[#06183e] rounded-full overflow-hidden mb-6 border border-cyan-500/20">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          onClick={onComplete}
          className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(0,210,255,0.45)] active:scale-95 transition-all"
        >
          {language === 'hi' ? 'प्रोटोकॉल में प्रवेश करें' : 'Enter Protocol'}
        </button>
      </div>

      {/* Footer */}
      <div className="w-full text-center pb-2">
        <p className="text-xs text-cyan-200/70 max-w-xs mx-auto leading-relaxed">
          {language === 'hi'
            ? 'बॉट और नकली खातों को रोकने के लिए विकेंद्रीकृत एंटी-सिबिल सुरक्षा द्वारा सुरक्षित।'
            : 'Protected by decentralized Anti-Sybil verification to ensure fair community distribution.'}
        </p>
      </div>
    </div>
  );
};
