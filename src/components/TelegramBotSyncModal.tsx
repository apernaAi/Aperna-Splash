import React, { useState, useEffect } from 'react';
import { X, Bot, Check, AlertCircle, RefreshCw, Send, ExternalLink, Globe } from 'lucide-react';
import { TELEGRAM_BOT_CONFIG, syncTelegramWebhook, checkTelegramWebhookStatus } from '../utils/telegramBot.ts';
import { playClaimRewardSound, playTapSound } from '../utils/audioEngine.ts';
import { Language } from '../types/airdrop.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const TelegramBotSyncModal: React.FC<Props> = ({ isOpen, onClose, language }) => {
  const [targetUrl, setTargetUrl] = useState<string>('https://mimi-airdrop-app.vercel.app');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [webhookInfo, setWebhookInfo] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')) {
      setTargetUrl(window.location.origin);
    }
  }, []);

  const handleFetchStatus = async () => {
    setIsLoading(true);
    const data = await checkTelegramWebhookStatus();
    setWebhookInfo(data);
    setIsLoading(false);
  };

  const handleSyncWebhook = async () => {
    playTapSound();
    setIsLoading(true);
    setStatusMessage(null);
    setIsSuccess(null);

    const result = await syncTelegramWebhook(targetUrl);
    setIsLoading(false);

    if (result.ok) {
      playClaimRewardSound();
      setIsSuccess(true);
      setStatusMessage(language === 'hi'
        ? '✅ Telegram Bot Webhook सफलतापूर्वक लिंक हो गया! अब बॉट /start पर तुरंत रिप्लाई करेगा।'
        : '✅ Telegram Bot Webhook synced! The bot will now instantly reply to /start with the Mini App launch button.');
      handleFetchStatus();
    } else {
      setIsSuccess(false);
      setStatusMessage(result.description || 'Webhook sync failed.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl glass-panel-blue p-5 border border-cyan-400/40 shadow-[0_0_50px_rgba(0,210,255,0.35)] flex flex-col gap-4 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {language === 'hi' ? 'टेलीग्राम बॉट /start हैंडलर' : 'Telegram Bot /start Handler'}
              </h3>
              <p className="text-[11px] text-cyan-200/80">
                Bot Token: <code className="text-cyan-300">830347...PL0</code>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-400/30 flex items-center justify-center text-cyan-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Explainer */}
        <div className="rounded-2xl bg-cyan-950/40 border border-cyan-400/20 p-3 text-xs leading-relaxed text-cyan-100 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-cyan-300 font-bold">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{language === 'hi' ? 'ऑटोमैटिक वेलकम मैसेज व लॉन्च बटन' : 'Automatic Welcome & Launch Button'}</span>
          </div>
          <p className="text-[11px] text-cyan-200/70">
            {language === 'hi'
              ? 'जब भी कोई यूजर टेलीग्राम बॉट में /start भेजेगा, बॉट तुरंत इनलाइन "Open Mimi App" बटन और परसिस्टेंट कीबोर्ड बटन के साथ वेलकम मैसेज भेजेगा।'
              : 'Whenever a user opens your bot or sends /start, it triggers an instant welcome message with an inline WebApp button and a persistent launch keyboard.'}
          </p>
        </div>

        {/* Vercel App URL Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'hi' ? 'Vercel ऐप URL' : 'Vercel Deployment URL'}</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://mimi-airdrop-app.vercel.app"
              className="w-full rounded-xl bg-black/40 border border-cyan-400/30 px-3 py-2 text-xs font-mono text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-300"
            />
          </div>
        </div>

        {/* Sync Button */}
        <button
          onClick={handleSyncWebhook}
          disabled={isLoading || !targetUrl}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(0,210,255,0.6)] flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{language === 'hi' ? 'सिंक हो रहा है...' : 'Syncing Webhook...'}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{language === 'hi' ? '🔗 बॉट वेबहुक सक्रिय करें' : '🔗 Activate Bot Webhook Now'}</span>
            </>
          )}
        </button>

        {/* Status result */}
        {statusMessage && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-start gap-2 ${
              isSuccess
                ? 'bg-emerald-950/60 border border-emerald-400/50 text-emerald-200'
                : 'bg-rose-950/60 border border-rose-400/50 text-rose-200'
            }`}
          >
            {isSuccess ? <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />}
            <span className="leading-snug">{statusMessage}</span>
          </div>
        )}

        {/* Action Link to Test */}
        <div className="flex items-center justify-between text-xs pt-1">
          <a
            href={`https://t.me/${TELEGRAM_BOT_CONFIG.botUsername}?start=mimi`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-cyan-300 hover:text-white font-bold underline transition-colors"
          >
            <span>{language === 'hi' ? 'टेलीग्राम में बॉट टेस्ट करें' : 'Test in Telegram'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={handleFetchStatus}
            className="text-[11px] text-cyan-300/80 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{language === 'hi' ? 'स्टेटस देखें' : 'Check Status'}</span>
          </button>
        </div>

        {webhookInfo && (
          <div className="bg-black/50 p-2.5 rounded-xl border border-cyan-400/20 text-[10px] font-mono text-cyan-200/90 overflow-x-auto max-h-24">
            <p className="text-cyan-400 font-bold mb-1">Telegram getWebhookInfo:</p>
            <pre>{JSON.stringify(webhookInfo.result || webhookInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
