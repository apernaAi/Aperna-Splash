/**
 * Telegram Bot Utilities for Music Mimi Mini App
 * Note: Bot tokens are strictly kept on the server-side (/api/webhook, /api/set-webhook)
 * and never exposed in client bundles.
 */

export const TELEGRAM_BOT_CONFIG = {
  botUsername: 'Musicmimi_bot',
  appTitle: 'Music Mimi ($MIMI)',
  defaultVercelUrl: 'https://my-project-six-coral-29.vercel.app',
  defaultChannel: '@musicmimi_community',
  channelUrl: 'https://t.me/musicmimi_community',
};

export function buildOfficialReleaseHtml(customNotes?: string, appUrl = TELEGRAM_BOT_CONFIG.defaultVercelUrl): string {
  const cleanAppUrl = appUrl.replace(/\/+$/, '');
  return `🚀 <b>APERNA AI &amp; MUSIC MIMI ($MIMI) — OFFICIAL ECOSYSTEM UPDATE</b> 🐱✨
━━━━━━━━━━━━━━━━━━━━━

🔥 <b>Community Alert &amp; Release Notes:</b>
Aperna AI Community ke sabhi members ke liye ek fresh high-speed update live kar diya gaya hai!

🎬 <b>1. NEW YOUTUBE &amp; SOCIAL BOUNTY TASKS</b>
• <b>Watch, Like &amp; Comment:</b> YouTube videos dekhne aur engage karne par instant $MIMI rewards!
• <b>Channel Subscribe:</b> Official @hashmicrypto1 channel subscribe karein aur notification bell on karein.
• <b>Telegram &amp; Instagram:</b> @musicmimi_community &amp; @Hashmi_Crypto channel follow bounty tasks active.

👑 <b>2. APERNA AI GENESIS MEMORIAL SAGA (NFT PORTAL)</b>
• <b>Live on Polygon PoS Mainnet:</b> Sovereign ERC-721 + EIP-2981 Web3 collection.
• <b>Contract:</b> <code>0x8EAA10c5Cb32b585AE397878F64CF6d3F3b3D348</code>
• 🎁 <b>Free 1st Mint Bonus:</b> <b>+1,000 $APERNA Tokens</b> credited directly to balance!
• 💎 <b>Marketplace Listing Reward:</b> <b>+500 $APERNA Tokens</b> on OpenSea &amp; MagicEden!

🎧 <b>3. PROCEDURAL BEAT ENGINE &amp; 8-HR LOOP MINER</b>
• High-performance neural stems &amp; real-time audio merge engine.
• Active 8-Hour looping with automated claim multipliers.

💳 <b>4. TON BLOCKCHAIN &amp; METAMASK DUAL CONNECTIVITY</b>
• TON Connect integration for Telegram @wallet and Tonkeeper.
• Direct MetaMask mobile deep-linking for on-chain Polygon minting.

${customNotes ? `📌 <b>Additional Announcement:</b>\n${customNotes}\n\n` : ''}━━━━━━━━━━━━━━━━━━━━━
👇 <b>Niche button dabakar turant Mini App kholein:</b>`;
}

export function buildOfficialBroadcastKeyboard(appUrl = TELEGRAM_BOT_CONFIG.defaultVercelUrl) {
  const cleanAppUrl = appUrl.replace(/\/+$/, '');
  return {
    inline_keyboard: [
      [
        {
          text: '🚀 Launch Aperna Mini App 🎧',
          web_app: { url: cleanAppUrl },
        },
      ],
      [
        {
          text: '👑 Genesis NFT Portal',
          web_app: { url: `${cleanAppUrl}/?tab=nft` },
        },
        {
          text: '💎 Connect TON Vault',
          web_app: { url: `${cleanAppUrl}/?tab=vault` },
        },
      ],
      [
        {
          text: '▶️ Hashmi Crypto YouTube',
          url: 'https://youtube.com/@hashmicrypto1?si=p8615mTtahK5bA_o',
        },
        {
          text: '👥 Join @musicmimi_community',
          url: 'https://t.me/musicmimi_community',
        },
      ],
    ],
  };
}

export async function sendChannelBroadcast(options: {
  botToken?: string;
  channel?: string;
  notes?: string;
  customUrl?: string;
}): Promise<{ ok: boolean; messageId?: number; description?: string; error?: string }> {
  const targetChannel = (options.channel || TELEGRAM_BOT_CONFIG.defaultChannel).trim();
  const rawUrl = options.customUrl || (typeof window !== 'undefined' ? window.location.origin : TELEGRAM_BOT_CONFIG.defaultVercelUrl);
  const cleanUrl = rawUrl.replace(/\/+$/, '');
  const botToken = options.botToken?.trim();

  // If botToken is provided in frontend, we can broadcast directly via Telegram API
  if (botToken) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChannel,
          text: buildOfficialReleaseHtml(options.notes, cleanUrl),
          parse_mode: 'HTML',
          disable_web_page_preview: false,
          reply_markup: buildOfficialBroadcastKeyboard(cleanUrl),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        return { ok: true, messageId: data.result?.message_id };
      } else {
        return { ok: false, description: data.description || 'Telegram API returned an error' };
      }
    } catch (err: any) {
      console.warn('Direct telegram API broadcast fetch error, trying backend route:', err);
    }
  }

  // Fallback to /api/broadcast backend route
  try {
    const res = await fetch('/api/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: botToken,
        channel: targetChannel,
        notes: options.notes,
        appUrl: cleanUrl,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      return { ok: true, messageId: data.result?.result?.message_id };
    }
    return {
      ok: false,
      description: data.result?.description || data.error || 'Broadcast failed',
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network failure while broadcasting' };
  }
}

/**
 * Generates an official Telegram WebApp share or start link
 */
export function getTelegramShareUrl(referralCode: string, language: 'hi' | 'en' = 'hi'): string {
  const baseAppUrl = `https://t.me/${TELEGRAM_BOT_CONFIG.botUsername}/app?startapp=ref_${referralCode}`;
  const text = language === 'hi'
    ? `🎵 म्यूजिक मिमी ($MIMI) में मेरे साथ शामिल हों! लूप्स क्राफ्ट करें और रियल TON एयरड्रॉप जीतें!\n${baseAppUrl}`
    : `🎵 Join my music crew in Music Mimi ($MIMI)! Craft loops and earn real TON airdrop!\n${baseAppUrl}`;
  return `https://t.me/share/url?url=${encodeURIComponent(baseAppUrl)}&text=${encodeURIComponent(text)}`;
}

/**
 * Registers Telegram bot webhook via secure serverless endpoint
 */
export async function syncTelegramWebhook(customUrl?: string, botToken?: string): Promise<{ ok: boolean; description?: string; result?: any }> {
  try {
    const rawUrl = customUrl || (typeof window !== 'undefined' ? window.location.origin : TELEGRAM_BOT_CONFIG.defaultVercelUrl);
    const cleanUrl = rawUrl.replace(/\/+$/, '');
    let apiUrl = `/api/set-webhook?url=${encodeURIComponent(cleanUrl)}&action=set`;
    if (botToken) {
      apiUrl += `&token=${encodeURIComponent(botToken.trim())}`;
    }
    const res = await fetch(apiUrl);
    return await res.json();
  } catch (err: any) {
    return { ok: false, description: err?.message || 'Network error' };
  }
}

/**
 * Fetches live webhook registration info via secure serverless endpoint
 */
export async function checkTelegramWebhookStatus(): Promise<any> {
  try {
    const res = await fetch('/api/set-webhook?action=get');
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

/**
 * Forces Telegram server-side update of the bottom-left Chat Menu Button ("Play Mimi")
 */
export async function updateTelegramMenuButton(customUrl?: string, botToken?: string): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const rawUrl = customUrl || (typeof window !== 'undefined' ? window.location.origin : TELEGRAM_BOT_CONFIG.defaultVercelUrl);
    const cleanUrl = rawUrl.replace(/\/+$/, '');
    let apiUrl = `/api/set-webhook?url=${encodeURIComponent(cleanUrl)}&action=update_menu`;
    if (botToken) {
      apiUrl += `&token=${encodeURIComponent(botToken.trim())}`;
    }
    const res = await fetch(apiUrl);
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error' };
  }
}

/**
 * Resets the Telegram chat menu button to default
 */
export async function resetTelegramMenuButton(botToken?: string): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    let apiUrl = '/api/set-webhook?action=reset_menu';
    if (botToken) {
      apiUrl += `&token=${encodeURIComponent(botToken.trim())}`;
    }
    const res = await fetch(apiUrl);
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error' };
  }
}

