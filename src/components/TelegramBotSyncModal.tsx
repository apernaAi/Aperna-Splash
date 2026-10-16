import React, { useState, useEffect } from 'react';
import { X, Bot, Check, AlertCircle, RefreshCw, Send, ExternalLink, Globe, Trash2, Smartphone, ShieldCheck, Sparkles } from 'lucide-react';
import { TELEGRAM_BOT_CONFIG, syncTelegramWebhook, checkTelegramWebhookStatus, updateTelegramMenuButton, resetTelegramMenuButton } from '../utils/telegramBot.ts';
import { playClaimRewardSound, playTapSound } from '../utils/audioEngine.ts';
import { Language } from '../types/airdrop.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const TelegramBotSyncModal: React.FC<Props> = ({ isOpen, onClose, language }) => {
  const [targetUrl, setTargetUrl] = useState<string>('https://my-project-six-coral-29.vercel.app');
  const [botToken, setBotToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [botInfo, setBotInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'quick_fix' | 'botfather_guide' | 'cache_guide'>('quick_fix');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')) {
      setTargetUrl(window.location.origin);
    }
  }, []);

  const handleFetchStatus = async () => {
    setIsLoading(true);
    const data = await checkTelegramWebhookStatus();
    setBotInfo(data);
    setIsLoading(false);
  };

  const handleSyncAll = async () => {
    playTapSound();
    setIsLoading(true);
    setStatusMessage(null);
    setIsSuccess(null);

    const result = await syncTelegramWebhook(targetUrl, botToken);
    setIsLoading(false);

    if (result.ok) {
      playClaimRewardSound();
      setIsSuccess(true);
      setStatusMessage(language === 'hi'
        ? '✅ Telegram Bot Webhook और नीचे का "Play Mimi" मेनू बटन दोनों नए URL पर अपडेट हो गए!'
        : '✅ Both Webhook and bottom "Play Mimi" menu button updated to the fresh URL!');
      handleFetchStatus();
    } else {
      setIsSuccess(false);
      setStatusMessage(result.description || 'Sync failed. Bot Token जांचें या Vercel में जोड़ें।');
    }
  };

  const handleUpdateMenuButtonOnly = async () => {
    playTapSound();
    setIsLoading(true);
    setStatusMessage(null);
    setIsSuccess(null);

    const result = await updateTelegramMenuButton(targetUrl, botToken);
    setIsLoading(false);

    if (result.ok) {
      playClaimRewardSound();
      setIsSuccess(true);
      setStatusMessage(language === 'hi'
        ? '✅ नीचे वाला "Play Mimi" बटन Telegram सर्वर पर तुरंत नए ताज़ा URL से बदल दिया गया!'
        : '✅ Bottom "Play Mimi" button globally updated to the new app URL on Telegram servers!');
      handleFetchStatus();
    } else {
      setIsSuccess(false);
      setStatusMessage(result.error || 'Failed to update menu button. Bot Token डालें या BotFather गाइड देखें।');
    }
  };

  const handleResetMenuButton = async () => {
    playTapSound();
    setIsLoading(true);
    setStatusMessage(null);
    setIsSuccess(null);

    const result = await resetTelegramMenuButton(botToken);
    setIsLoading(false);

    if (result.ok) {
      playClaimRewardSound();
      setIsSuccess(true);
      setStatusMessage(language === 'hi'
        ? '🗑️ पुराना मेनू बटन हटा दिया गया है (Default पर रीसेट हो गया)।'
        : '🗑️ Custom menu button cleared and reset to default.');
      handleFetchStatus();
    } else {
      setIsSuccess(false);
      setStatusMessage(result.error || 'Failed to reset menu button.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel-blue p-4 sm:p-6 border border-cyan-400/40 shadow-[0_0_50px_rgba(0,210,255,0.35)] flex flex-col gap-4 text-white my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <span>{language === 'hi' ? 'Telegram बॉट व मेनू बटन सिंक' : 'Telegram Bot & Menu Button Sync'}</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </h3>
              <p className="text-[11px] text-cyan-200/80">
                Bot: <code className="text-cyan-300">@{TELEGRAM_BOT_CONFIG.botUsername}</code>
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

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-2xl border border-cyan-500/20 text-xs font-bold text-center">
          <button
            onClick={() => setActiveTab('quick_fix')}
            className={`py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'quick_fix'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-extrabold shadow'
                : 'text-cyan-200/70 hover:text-white'
            }`}
          >
            {language === 'hi' ? '⚡ 1-क्लिक समाधान' : '⚡ 1-Click Fix'}
          </button>
          <button
            onClick={() => setActiveTab('botfather_guide')}
            className={`py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'botfather_guide'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-extrabold shadow'
                : 'text-cyan-200/70 hover:text-white'
            }`}
          >
            {language === 'hi' ? '🤖 BotFather गाइड' : '🤖 BotFather'}
          </button>
          <button
            onClick={() => setActiveTab('cache_guide')}
            className={`py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'cache_guide'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-extrabold shadow'
                : 'text-cyan-200/70 hover:text-white'
            }`}
          >
            {language === 'hi' ? '📱 कैश हटाएं' : '📱 Clear Cache'}
          </button>
        </div>

        {activeTab === 'quick_fix' && (
          <div className="flex flex-col gap-3">
            {/* Context Box */}
            <div className="rounded-2xl bg-cyan-950/40 border border-cyan-400/30 p-3 text-xs leading-relaxed text-cyan-100 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  {language === 'hi'
                    ? 'नीचे वाला "Play Mimi" बटन क्यों पुराना ऐप खोलता है?'
                    : 'Why does the bottom "Play Mimi" button open the old app?'}
                </span>
              </div>
              <p className="text-[11px] text-cyan-200/80">
                {language === 'hi'
                  ? 'टेलीग्राम में 2 अलग-अलग बटन होते हैं: (1) प्रोफाइल/डिस्क्रिप्शन वाला ऐप बटन (जो नया खुल रहा है), और (2) नीचे चैट बार का "Play Mimi" मेनू बटन (जिसमें पुराना लिंक फंसा है)। नीचे दिए बटन से आप नीचे वाले मेनू बटन को तुरंत नए ताज़ा URL से बदल सकते हैं!'
                  : 'Telegram has 2 separate buttons: the profile Mini App button and the bottom chat Menu Button. Use the action below to update the bottom Menu Button globally!'}
              </p>
            </div>

            {/* Target URL Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-cyan-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  {language === 'hi' ? 'ताज़ा ऐप URL (Fresh Deployment URL)' : 'Fresh App URL'}
                </span>
                <span className="text-[10px] text-emerald-300 font-normal">Active Link</span>
              </label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://my-project-six-coral-29.vercel.app"
                className="w-full rounded-xl bg-black/50 border border-cyan-400/40 px-3 py-2 text-xs font-mono text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-300"
              />
            </div>

            {/* Bot Token Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-cyan-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-amber-400" />
                  {language === 'hi' ? 'Bot Token (यदि Vercel पर सेट नहीं है)' : 'Bot Token (if not in Vercel env)'}
                </span>
                <span className="text-[10px] text-amber-300 font-normal">BotFather टोकन</span>
              </label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                className="w-full rounded-xl bg-black/50 border border-cyan-400/40 px-3 py-2 text-xs font-mono text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-amber-300"
              />
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {/* Button 1: Update Bottom Menu Button */}
              <button
                onClick={handleUpdateMenuButtonOnly}
                disabled={isLoading || !targetUrl}
                className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>{language === 'hi' ? '🔄 नीचे वाला Play Mimi बटन बदलें' : '🔄 Update Bottom Menu Button'}</span>
              </button>

              {/* Button 2: Sync All (Webhook + Menu) */}
              <button
                onClick={handleSyncAll}
                disabled={isLoading || !targetUrl}
                className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(0,210,255,0.5)] flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{language === 'hi' ? '⚡ पूरा सिस्टम सिंक करें (दोनों)' : '⚡ Sync Webhook + Menu Both'}</span>
              </button>
            </div>

            {/* Reset Button */}
            <div className="flex justify-end pt-1">
              <button
                onClick={handleResetMenuButton}
                disabled={isLoading}
                className="text-[11px] text-rose-300/80 hover:text-rose-200 flex items-center gap-1 underline cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>{language === 'hi' ? 'पुराना मेनू बटन हटाएं (Reset to Default)' : 'Reset Menu Button to Default'}</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'botfather_guide' && (
          <div className="rounded-2xl bg-cyan-950/40 border border-cyan-400/30 p-3.5 text-xs text-cyan-100 flex flex-col gap-2.5">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              <Bot className="w-4 h-4" />
              <span>{language === 'hi' ? 'BotFather में मेनू बटन ठीक करने के 3 आसान कदम:' : '3 Easy Steps in BotFather:'}</span>
            </h4>
            <ol className="list-decimal pl-4 space-y-2 text-[11px] text-cyan-200/90 leading-relaxed">
              <li>
                Telegram में <b>@BotFather</b> चैट खोलें और कमांड भेजें: <code className="bg-black/60 px-1.5 py-0.5 rounded text-amber-300 font-mono font-bold">/setmenubutton</code>
              </li>
              <li>
                अपनी बॉट लिस्ट में से <b>@{TELEGRAM_BOT_CONFIG.botUsername}</b> पर क्लिक करें।
              </li>
              <li>
                BotFather पूछेगा URL: अपना नया लिंक भेजें:<br />
                <code className="bg-black/60 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-[10px] break-all">{TELEGRAM_BOT_CONFIG.defaultVercelUrl}</code>
              </li>
              <li>
                BotFather पूछेगा:<br />
                <i>"Send me the title to be displayed on the button instead of 'Menu'..."</i><br />
                ⚠️ <b>यहाँ ध्यान दें:</b> <u>Title का मतलब ही बटन का 'नाम' है!</u> यहाँ लिंक नहीं भेजना, बस यह नाम टाइप करके भेजें:<br />
                <code className="bg-black/60 px-1.5 py-0.5 rounded text-amber-300 font-mono font-bold">🐱 Play Mimi 🎧</code> (या <code className="text-amber-300">Play Mimi</code>)
              </li>
              <li>
                ✅ BotFather बोलेगा: <b>Success! Menu button updated.</b>
              </li>
            </ol>
            <div className="mt-1 pt-2 border-t border-cyan-500/20 text-[11px] text-cyan-300/80">
              💡 <b>या फिर:</b> @BotFather में <code className="text-amber-300">/mybots</code> ➔ Select Bot ➔ <b>Bot Settings</b> ➔ <b>Menu Button</b> ➔ <b>Configure menu button</b> दबाकर भी बदल सकते हैं।
            </div>
            <div className="mt-0.5 text-[11px] text-rose-300/90">
              🗑️ <b>अगर सिर्फ पुराना बटन हटाना है:</b> @BotFather में <code className="text-amber-300">/mybots</code> ➔ Select Bot ➔ <b>Bot Settings</b> ➔ <b>Menu Button</b> ➔ <b>Configure menu button</b> दबाकर रीसेट कर सकते हैं।
            </div>
          </div>
        )}

        {activeTab === 'cache_guide' && (
          <div className="rounded-2xl bg-cyan-950/40 border border-cyan-400/30 p-3.5 text-xs text-cyan-100 flex flex-col gap-2.5">
            <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" />
              <span>{language === 'hi' ? 'Telegram की पुरानी मेमोरी (Cache) कैसे हटाएं?' : 'How to Clear Telegram WebApp Cache'}</span>
            </h4>
            <p className="text-[11px] text-cyan-200/80">
              {language === 'hi'
                ? 'कई बार लिंक बदलने के बाद भी फोन का टेलीग्राम पुराने ऐप की फाइल्स को मेमोरी में सेव रखता है। इसे 2 सेकंड में साफ करने का तरीका:'
                : 'Telegram frequently caches old Mini App HTML/JS files in local storage. Clear it in 2 seconds:'}
            </p>
            <div className="space-y-2 text-[11px] text-cyan-200/90 bg-black/40 p-2.5 rounded-xl border border-cyan-500/20">
              <p><b>तरीका 1 (सबसे तेज़):</b> टेलीग्राम में जब मिनी ऐप खुला हो, ऊपर कोने में <b>3 डॉट्स (⋮)</b> दबाएं और <b>"Reload Page"</b> (या "Clear Cache") पर क्लिक करें।</p>
              <p><b>तरीका 2:</b> Telegram Settings ➔ Data and Storage ➔ <b>Storage Usage</b> ➔ <b>Clear Telegram Cache</b> दबाएं।</p>
            </div>
          </div>
        )}

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
        <div className="flex items-center justify-between text-xs pt-1 border-t border-cyan-500/20">
          <a
            href={`https://t.me/${TELEGRAM_BOT_CONFIG.botUsername}?start=mimi`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-cyan-300 hover:text-white font-bold underline transition-colors"
          >
            <span>{language === 'hi' ? '📲 टेलीग्राम में बॉट खोलकर टेस्ट करें' : '📲 Test Bot in Telegram'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={handleFetchStatus}
            className="text-[11px] text-cyan-300/80 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{language === 'hi' ? 'लाइव स्टेटस जांचें' : 'Check Live Status'}</span>
          </button>
        </div>

        {botInfo && (
          <div className="bg-black/50 p-2.5 rounded-xl border border-cyan-400/20 text-[10px] font-mono text-cyan-200/90 overflow-x-auto max-h-28">
            <p className="text-cyan-400 font-bold mb-1">Telegram Server Response:</p>
            <pre>{JSON.stringify(botInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
