import React, { useState, useEffect } from 'react';
import {
  X,
  Bot,
  Check,
  AlertCircle,
  RefreshCw,
  Send,
  ExternalLink,
  Globe,
  Trash2,
  Smartphone,
  ShieldCheck,
  Sparkles,
  Radio,
  Share2,
  Eye,
  Megaphone,
} from 'lucide-react';
import {
  TELEGRAM_BOT_CONFIG,
  syncTelegramWebhook,
  checkTelegramWebhookStatus,
  updateTelegramMenuButton,
  resetTelegramMenuButton,
  sendChannelBroadcast,
  buildOfficialReleaseHtml,
} from '../utils/telegramBot.ts';
import { playClaimRewardSound, playTapSound } from '../utils/audioEngine.ts';
import { Language } from '../types/airdrop.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  initialTab?: 'broadcast' | 'quick_fix' | 'botfather_guide' | 'cache_guide';
}

export const TelegramBotSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  language,
  initialTab = 'broadcast',
}) => {
  const [targetUrl, setTargetUrl] = useState<string>('https://my-project-six-coral-29.vercel.app');
  const [botToken, setBotToken] = useState<string>(() => {
    try {
      return localStorage.getItem('mimi_telegram_bot_token') || '';
    } catch {
      return '';
    }
  });
  const [channelUsername, setChannelUsername] = useState<string>('@ApernaAIOfficial');
  const [broadcastNotes, setBroadcastNotes] = useState<string>(
    '• 🎬 New YouTube Bounty Tasks: Watch, Like, Comment & Subscribe for instant $MIMI!\n• 📸 Follow @ApernaAIOfficial & @Hashmi_Crypto on Telegram & Instagram\n• 🎁 Free 1,000 $APERNA Tokens on Genesis NFT Portal Mint'
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [botInfo, setBotInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'broadcast' | 'quick_fix' | 'botfather_guide' | 'cache_guide'>(initialTab);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')) {
      setTargetUrl(window.location.origin);
    }
  }, []);

  const handleSaveToken = (val: string) => {
    setBotToken(val);
    try {
      localStorage.setItem('mimi_telegram_bot_token', val.trim());
    } catch {}
  };

  const handleFetchStatus = async () => {
    setIsLoading(true);
    const data = await checkTelegramWebhookStatus();
    setBotInfo(data);
    setIsLoading(false);
  };

  // Broadcast to @ApernaAIOfficial channel
  const handleSendBroadcast = async () => {
    playTapSound();
    setIsLoading(true);
    setStatusMessage(null);
    setIsSuccess(null);

    const result = await sendChannelBroadcast({
      botToken: botToken.trim(),
      channel: channelUsername.trim(),
      notes: broadcastNotes.trim(),
      customUrl: targetUrl,
    });

    setIsLoading(false);

    if (result.ok) {
      playClaimRewardSound();
      setIsSuccess(true);
      setStatusMessage(
        language === 'hi'
          ? `🎉 डिज़ाइनदार अपडेट सफलतापूर्वक आपके कम्युनिटी चैनल ${channelUsername} पर पोस्ट हो गया! (Message ID: #${result.messageId || 'Live'})`
          : `🎉 Stylish design update broadcast successfully posted to ${channelUsername}! (Message ID: #${result.messageId || 'Live'})`
      );
    } else {
      setIsSuccess(false);
      const errMsg = result.description || result.error || 'Broadcast failed';
      setStatusMessage(
        language === 'hi'
          ? `⚠️ चैनल पर मैसेज नहीं जा सका: ${errMsg}\n\n👉 समाधान:\n1. सुनिश्चित करें कि Bot @${TELEGRAM_BOT_CONFIG.botUsername} चैनल "${channelUsername}" में Admin है।\n2. Admin Permissions में "Post Messages" को ON करें।\n3. ऊपर सही BotFather Bot Token डालें।`
          : `⚠️ Broadcast failed: ${errMsg}. Ensure bot is an Admin in ${channelUsername} with "Post Messages" permission, and a valid Bot Token is provided.`
      );
    }
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
      setStatusMessage(
        language === 'hi'
          ? '✅ Telegram Bot Webhook और नीचे का "Play Mimi" मेनू बटन दोनों नए URL पर अपडेट हो गए!'
          : '✅ Both Webhook and bottom "Play Mimi" menu button updated to the fresh URL!'
      );
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
      setStatusMessage(
        language === 'hi'
          ? '✅ नीचे वाला "Play Mimi" बटन Telegram सर्वर पर तुरंत नए ताज़ा URL से बदल दिया गया!'
          : '✅ Bottom "Play Mimi" button globally updated to the new app URL on Telegram servers!'
      );
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
      setStatusMessage(
        language === 'hi'
          ? '🗑️ पुराना मेनू बटन हटा दिया गया है (Default पर रीसेट हो गया)।'
          : '🗑️ Custom menu button cleared and reset to default.'
      );
      handleFetchStatus();
    } else {
      setIsSuccess(false);
      setStatusMessage(result.error || 'Failed to reset menu button.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel-blue p-4 sm:p-6 border border-cyan-400/40 shadow-[0_0_50px_rgba(0,210,255,0.35)] flex flex-col gap-4 text-white my-auto max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-md">
              <Megaphone className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <span>{language === 'hi' ? 'कम्युनिटी चैनल व बॉट सेंटर' : 'Community Broadcast & Bot Sync'}</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </h3>
              <p className="text-[11px] text-cyan-200/80">
                Channel: <code className="text-cyan-300 font-bold">{channelUsername}</code>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-400/30 flex items-center justify-center text-cyan-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-black/40 rounded-2xl border border-cyan-500/20 text-xs font-bold text-center">
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`py-1.5 px-1 rounded-xl transition-all cursor-pointer text-[11px] leading-tight ${
              activeTab === 'broadcast'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'text-amber-300/80 hover:text-amber-200'
            }`}
          >
            {language === 'hi' ? '📢 ब्रॉडकास्ट' : '📢 Broadcast'}
          </button>
          <button
            onClick={() => setActiveTab('quick_fix')}
            className={`py-1.5 px-1 rounded-xl transition-all cursor-pointer text-[11px] leading-tight ${
              activeTab === 'quick_fix'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-extrabold shadow'
                : 'text-cyan-200/70 hover:text-white'
            }`}
          >
            {language === 'hi' ? '⚡ बॉट मेनू' : '⚡ Bot Menu'}
          </button>
          <button
            onClick={() => setActiveTab('botfather_guide')}
            className={`py-1.5 px-1 rounded-xl transition-all cursor-pointer text-[11px] leading-tight ${
              activeTab === 'botfather_guide'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-extrabold shadow'
                : 'text-cyan-200/70 hover:text-white'
            }`}
          >
            {language === 'hi' ? '🤖 गाइड' : '🤖 Guide'}
          </button>
          <button
            onClick={() => setActiveTab('cache_guide')}
            className={`py-1.5 px-1 rounded-xl transition-all cursor-pointer text-[11px] leading-tight ${
              activeTab === 'cache_guide'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-extrabold shadow'
                : 'text-cyan-200/70 hover:text-white'
            }`}
          >
            {language === 'hi' ? '📱 कैश साफ' : '📱 Clear'}
          </button>
        </div>

        {/* TAB 1: BROADCAST TO @ApernaAIOfficial */}
        {activeTab === 'broadcast' && (
          <div className="flex flex-col gap-3">
            {/* Context Box */}
            <div className="rounded-2xl bg-amber-950/30 border border-amber-400/40 p-3 text-xs leading-relaxed text-amber-100 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Megaphone className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  {language === 'hi'
                    ? 'चैनल पर डिज़ाइनदार अपडेट क्यों नहीं आ रहा था?'
                    : 'Why were updates not appearing on the channel?'}
                </span>
              </div>
              <p className="text-[11px] text-amber-200/90">
                {language === 'hi'
                  ? 'टेलीग्राम में बॉट को चैनल का Admin बनाने पर वो अपने आप मैसेज नहीं भेजता — उसे Bot Token के साथ ट्रिगर करना पड़ता है! यहाँ से आप 1-क्लिक में नया YouTube/Instagram टास्क और ताज़ा रिलीज़ का डिज़ाइनदार मैसेज अपने चैनल पर पोस्ट कर सकते हैं!'
                  : 'Making a bot an admin in Telegram does not automatically post updates — it requires an API broadcast call. Use this tool to send a styled release with inline launch buttons directly to your community!'}
              </p>
            </div>

            {/* Target Channel Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-cyan-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                  {language === 'hi' ? 'टारगेट चैनल (Target Channel):' : 'Target Channel:'}
                </span>
                <a
                  href={`https://t.me/${channelUsername.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-cyan-300 font-semibold underline flex items-center gap-0.5"
                >
                  <span>Open Channel</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </label>
              <input
                type="text"
                value={channelUsername}
                onChange={(e) => setChannelUsername(e.target.value)}
                placeholder="@ApernaAIOfficial"
                className="w-full rounded-xl bg-black/50 border border-cyan-400/40 px-3 py-2 text-xs font-mono text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-300 font-bold"
              />
            </div>

            {/* Bot Token Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-cyan-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-amber-400" />
                  {language === 'hi' ? 'Bot Token (BotFather से प्राप्त):' : 'Bot Token (from BotFather):'}
                </span>
                <span className="text-[10px] text-amber-300 font-normal">आवश्यक (Required)</span>
              </label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => handleSaveToken(e.target.value)}
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                className="w-full rounded-xl bg-black/50 border border-amber-400/50 px-3 py-2 text-xs font-mono text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-amber-300"
              />
              <p className="text-[10px] text-slate-400">
                💡 टोकन सुरक्षित रूप से लोकल ब्राउज़र में सेव रहेगा ताकि बार-बार न डालना पड़े।
              </p>
            </div>

            {/* Custom Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-cyan-200 flex items-center justify-between">
                <span>{language === 'hi' ? '📝 अपडेट घोषणा संदेश (Custom Notes):' : '📝 Custom Announcement:'}</span>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(!previewOpen)}
                  className="text-[10px] text-cyan-300 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>{previewOpen ? 'Hide Preview' : 'Show Preview'}</span>
                </button>
              </label>
              <textarea
                value={broadcastNotes}
                onChange={(e) => setBroadcastNotes(e.target.value)}
                rows={3}
                placeholder="e.g. • Naye YouTube Tasks add ho gaye&#10;• +15 $MIMI token reward claim karein"
                className="w-full rounded-xl bg-black/50 border border-cyan-400/40 px-3 py-2 text-xs text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-300 resize-none font-sans"
              />
            </div>

            {/* Preview Box */}
            {previewOpen && (
              <div className="rounded-2xl bg-black/70 border border-cyan-500/30 p-3 text-[11px] leading-relaxed text-cyan-200/90 max-h-48 overflow-y-auto space-y-1.5 shadow-inner">
                <p className="font-bold text-amber-300">📱 Telegram Channel Preview:</p>
                <div className="p-2.5 rounded-xl bg-[#0e1d38] border border-cyan-500/40 text-slate-200 text-[10.5px]">
                  <p className="font-bold text-cyan-300">🚀 APERNA AI &amp; MUSIC MIMI ($MIMI) — OFFICIAL ECOSYSTEM UPDATE 🐱✨</p>
                  <p className="text-slate-400">━━━━━━━━━━━━━━━━━━━━━</p>
                  <p className="font-semibold text-white mt-1">🔥 Community Alert &amp; Release Notes:</p>
                  <p className="whitespace-pre-line text-cyan-100 text-[10px] my-1">{broadcastNotes}</p>
                  <p className="font-semibold text-white mt-1">🎬 Active Bounty Tasks:</p>
                  <p className="text-slate-300 text-[10px]">• Watch, Like &amp; Comment on YouTube Videos (+15 $MIMI)</p>
                  <p className="text-slate-300 text-[10px]">• Subscribe @hashmicrypto1 YouTube Channel</p>
                  <p className="text-slate-300 text-[10px]">• Join @Hashmi_Crypto &amp; @ApernaAIOfficial</p>
                  <p className="text-slate-300 text-[10px]">• Free 1,000 $APERNA Tokens Genesis Bonus</p>
                  <div className="mt-2 pt-2 border-t border-cyan-500/20 grid grid-cols-2 gap-1 text-center">
                    <div className="py-1 bg-cyan-600/40 rounded text-[9px] text-cyan-200 font-bold">🚀 Launch App</div>
                    <div className="py-1 bg-cyan-600/40 rounded text-[9px] text-cyan-200 font-bold">👑 Genesis NFT</div>
                    <div className="py-1 bg-cyan-600/40 rounded text-[9px] text-cyan-200 font-bold">▶️ YouTube Bounty</div>
                    <div className="py-1 bg-cyan-600/40 rounded text-[9px] text-cyan-200 font-bold">👥 @ApernaAIOfficial</div>
                  </div>
                </div>
              </div>
            )}

            {/* Broadcast Action Button */}
            <button
              onClick={handleSendBroadcast}
              disabled={isLoading || !channelUsername.trim()}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <Send className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>
                {isLoading
                  ? language === 'hi'
                    ? '📢 चैनल पर भेजा जा रहा है...'
                    : '📢 Broadcasting to Channel...'
                  : language === 'hi'
                  ? `📢 ${channelUsername} पर डिज़ाइनदार अपडेट भेजें`
                  : `📢 Send Styled Broadcast to ${channelUsername}`}
              </span>
            </button>

            {/* Telegram Channel Admin Verification Checklist */}
            <div className="rounded-2xl bg-cyan-950/30 border border-cyan-500/20 p-2.5 text-[10.5px] text-cyan-200/80 space-y-1">
              <p className="font-bold text-cyan-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>3 ज़रूरी स्टेप्स (Must-Check):</span>
              </p>
              <p>1. Telegram में <b>{channelUsername}</b> खोलें ➔ Channel Info ➔ <b>Administrators</b> पर जाएं।</p>
              <p>2. अपने Bot (<b>@{TELEGRAM_BOT_CONFIG.botUsername}</b>) को <b>Add Admin</b> करें।</p>
              <p>3. <b>"Post Messages"</b> की परमिशन Allow/ON रखें, फिर ऊपर बटन दबाएं!</p>
            </div>
          </div>
        )}

        {/* TAB 2: QUICK FIX FOR MENU BUTTON */}
        {activeTab === 'quick_fix' && (
          <div className="flex flex-col gap-3">
            {/* Context Box */}
            <div className="rounded-2xl bg-cyan-950/40 border border-cyan-400/30 p-3 text-xs leading-relaxed text-cyan-100 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  {language === 'hi'
                    ? 'नीचे वाला "Play Mimi" बटन कैसे अपडेट करें?'
                    : 'How to update the bottom chat Menu Button?'}
                </span>
              </div>
              <p className="text-[11px] text-cyan-200/80">
                {language === 'hi'
                  ? 'निचला "Play Mimi" बटन Telegram सर्वर पर स्टोर होता है। नीचे दिए बटन से आप 1-सेकंड में इसे नए ताज़ा URL से बदल सकते हैं!'
                  : 'The bottom chat Menu Button is registered globally on Telegram servers. Click below to update it instantly!'}
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
                onChange={(e) => handleSaveToken(e.target.value)}
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                className="w-full rounded-xl bg-black/50 border border-cyan-400/40 px-3 py-2 text-xs font-mono text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-amber-300"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={handleUpdateMenuButtonOnly}
                disabled={isLoading}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {language === 'hi'
                    ? '✨ 1. केवल नीचे वाला "Play Mimi" बटन नया करें'
                    : '✨ 1. Update Bottom Menu Button Only'}
                </span>
              </button>

              <button
                onClick={handleSyncAll}
                disabled={isLoading}
                className="w-full py-2 px-3 rounded-2xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/40 text-cyan-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>
                  {language === 'hi'
                    ? '🔄 2. Webhook + Menu Button दोनों सिंक करें'
                    : '🔄 2. Sync Webhook & Menu Button'}
                </span>
              </button>

              <button
                onClick={handleResetMenuButton}
                disabled={isLoading}
                className="w-full py-1.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>
                  {language === 'hi'
                    ? '🗑️ पुराना मेनू बटन हटाएं (Reset Menu Button)'
                    : '🗑️ Reset Menu Button to Default'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: BOTFATHER GUIDE */}
        {activeTab === 'botfather_guide' && (
          <div className="flex flex-col gap-2.5 text-xs text-cyan-100">
            <h4 className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-amber-300" />
              <span>{language === 'hi' ? 'BotFather से मेनू बटन कैसे बदलें:' : 'How to set Menu Button via BotFather:'}</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-cyan-200/90 bg-black/40 p-3 rounded-2xl border border-cyan-500/20">
              <li>Telegram में <b>@BotFather</b> खोलें।</li>
              <li>कमांड भेजें: <code>/mybots</code> और अपने बॉट (<code>@{TELEGRAM_BOT_CONFIG.botUsername}</code>) को चुनें।</li>
              <li><b>Bot Settings</b> ➔ <b>Menu Button</b> ➔ <b>Configure menu button</b> दबाएं।</li>
              <li>अपना ताज़ा URL भेजें: <br/><code className="text-emerald-300 select-all">{targetUrl}</code></li>
              <li>बटन का नाम दें: <code className="text-cyan-300">Play Mimi</code></li>
            </ol>
          </div>
        )}

        {/* TAB 4: CLEAR TELEGRAM CACHE GUIDE */}
        {activeTab === 'cache_guide' && (
          <div className="flex flex-col gap-2 text-xs text-cyan-100">
            <h4 className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-300" />
              <span>{language === 'hi' ? 'टेलीग्राम का पुराना कैश साफ करने का तरीका:' : 'How to clear Telegram Mini App cache:'}</span>
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
            className={`p-3 rounded-2xl text-xs flex items-start gap-2 whitespace-pre-line ${
              isSuccess
                ? 'bg-emerald-950/70 border border-emerald-400/60 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-rose-950/70 border border-rose-400/60 text-rose-200'
            }`}
          >
            {isSuccess ? (
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed font-sans">{statusMessage}</span>
          </div>
        )}

        {/* Action Links */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-cyan-500/20">
          <a
            href={`https://t.me/${channelUsername.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-amber-300 hover:text-white font-bold underline transition-colors"
          >
            <span>{language === 'hi' ? '📢 चैनल @ApernaAIOfficial खोलें' : '📢 Open @ApernaAIOfficial'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={handleFetchStatus}
            className="text-[11px] text-cyan-300/80 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{language === 'hi' ? 'लाइव स्टेटस' : 'Live Status'}</span>
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
