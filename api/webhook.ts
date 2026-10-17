/**
 * Telegram Bot Webhook Serverless Function for Vercel
 * Handles /start command and sends:
 * 1. Rich welcome message with an Inline Keyboard containing the web_app launch button
 * 2. Persistent Reply Keyboard with the web_app launch button pinned at the chat bottom
 * 3. Chat Menu button initialization for the user
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const DEFAULT_APP_URL = process.env.APP_URL || 'https://my-project-six-coral-29.vercel.app';
const TELEGRAM_SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN;

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number | string;
      type: string;
      first_name?: string;
      username?: string;
    };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    message?: {
      chat: {
        id: number | string;
      };
    };
    data?: string;
  };
}

async function sendTelegramRequest(method: string, body: Record<string, unknown>) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`Telegram API request error for ${method}:`, err);
    return { ok: false, error: String(err) };
  }
}

// Resilient body parsing supporting objects, raw JSON strings, Buffers, or readable streams
async function parseRequestBody(req: any): Promise<any> {
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    if (Buffer.isBuffer(req.body)) {
      try {
        return JSON.parse(req.body.toString('utf-8'));
      } catch {
        return {};
      }
    }
    return req.body;
  }

  // If body is a stream
  if (req.readable) {
    return new Promise((resolve) => {
      let raw = '';
      req.on('data', (chunk: any) => {
        raw += chunk;
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          resolve({});
        }
      });
      req.on('error', () => resolve({}));
    });
  }

  return {};
}

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check endpoint
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      bot: 'Music Mimi ($MIMI) Bot',
      handler: '/start command with WebApp buttons active',
      app_url: DEFAULT_APP_URL,
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security Verification: Match Telegram webhook secret token if configured
  if (TELEGRAM_SECRET_TOKEN) {
    const headerSecret = req.headers?.['x-telegram-bot-api-secret-token'];
    if (headerSecret !== TELEGRAM_SECRET_TOKEN) {
      console.warn('Unauthorized webhook request: secret token mismatch');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // Ensure bot token exists before processing
  if (!BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN environment variable is not configured');
    return res.status(500).json({ error: 'Bot token not configured' });
  }

  try {
    const update: TelegramUpdate = await parseRequestBody(req);

    // Extract chat ID and message content
    let chatId: number | string | undefined;
    let text = '';
    let firstName = 'Mimi Hunter';

    if (update.message && update.message.chat) {
      chatId = update.message.chat.id;
      text = (update.message.text || '').trim();
      firstName = update.message.from?.first_name || update.message.chat.first_name || 'Mimi Hunter';
    } else if (update.callback_query) {
      chatId = update.callback_query.message?.chat?.id || update.callback_query.from.id;
      text = update.callback_query.data || '';
      firstName = update.callback_query.from.first_name || 'Mimi Hunter';

      // Answer callback query quickly
      sendTelegramRequest('answerCallbackQuery', {
        callback_query_id: update.callback_query.id,
      }).catch(() => {});
    }

    if (!chatId) {
      return res.status(200).json({ ok: true, note: 'No target chat identified in update' });
    }

    // Determine target App URL (detect Vercel domain dynamically or fallback)
    let appUrl = DEFAULT_APP_URL;
    if (req.headers && req.headers['x-forwarded-host']) {
      const proto = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['x-forwarded-host'];
      if (host && !host.includes('localhost')) {
        appUrl = `${proto}://${host}`;
      }
    }

    const cleanAppUrl = appUrl.replace(/\/+$/, '');
    const targetChannel = process.env.TELEGRAM_CHANNEL || '@ApernaAIOfficial';

    // Broadcast command for admin: /broadcast <notes> or /announce <notes>
    if (text.startsWith('/broadcast') || text.startsWith('/announce') || text.startsWith('/post')) {
      const customNotes = text.replace(/^\/(broadcast|announce|post)\s*/i, '').trim();
      const broadcastMsg = `🚀 <b>APERNA AI &amp; MUSIC MIMI ($MIMI) — COMMUNITY UPDATE</b> 🐱✨
━━━━━━━━━━━━━━━━━━━━━

🔥 <b>Official Announcement:</b>
${customNotes || 'A fresh high-speed update has been pushed with new YouTube Video &amp; Social tasks! Complete them to earn bonus $MIMI.'}

🎬 <b>Active Bounty Tasks:</b>
• Watch, Like &amp; Comment on YouTube Videos
• Subscribe @hashmicrypto1 on YouTube
• Follow @ApernaAIOfficial &amp; @Hashmi_Crypto on Telegram &amp; Instagram
• Claim +1,000 $APERNA NFT Genesis Bonus

━━━━━━━━━━━━━━━━━━━━━
👇 <b>Tap below to launch the Mini App immediately:</b>`;

      const broadcastRes = await sendTelegramRequest('sendMessage', {
        chat_id: targetChannel,
        text: broadcastMsg,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🚀 Launch Aperna Mini App 🎧', web_app: { url: cleanAppUrl } },
            ],
            [
              { text: '▶️ Hashmi Crypto YouTube', url: 'https://youtube.com/@hashmicrypto1?si=p8615mTtahK5bA_o' },
              { text: '👥 Join @ApernaAIOfficial', url: 'https://t.me/ApernaAIOfficial' },
            ],
          ],
        },
      });

      if (broadcastRes.ok) {
        await sendTelegramRequest('sendMessage', {
          chat_id: chatId,
          text: `✅ <b>Broadcast Successfully Sent!</b>\n\n📢 Channel: <code>${targetChannel}</code>\n🆔 Message ID: <code>${broadcastRes.result?.message_id}</code>\n\n<i>Aapka update channel par live publish ho gaya hai!</i>`,
          parse_mode: 'HTML',
        });
      } else {
        await sendTelegramRequest('sendMessage', {
          chat_id: chatId,
          text: `❌ <b>Broadcast Failed!</b>\n\nTarget Channel: <code>${targetChannel}</code>\nReason: <code>${broadcastRes.description || 'Unknown error'}</code>\n\n💡 <b>Tip:</b> Make sure your bot is an Admin in <code>${targetChannel}</code> with <b>Post Messages</b> permission enabled!`,
          parse_mode: 'HTML',
        });
      }

      return res.status(200).json({ ok: true, broadcast: broadcastRes });
    }

    // Welcome copy with rich Telegram HTML formatting
    const welcomeText = `🎧 <b>Welcome to Music Mimi ($MIMI) Official Airdrop!</b> 🐱✨

Hey <b>${firstName}</b>! Welcome to the Web3 procedural music protocol on TON.

💎 <b>What is Music Mimi ($MIMI)?</b>
• 🎵 <b>Mimi Making:</b> Run 8-Hour music loops to generate exclusive beats
• 🔄 <b>Merge Loops:</b> Combine loops to unlock high-tier tracks and level up
• 💳 <b>TON Wallet Gate:</b> Connect Tonkeeper or Telegram Wallet to verify
• 🚀 <b>Token Airdrop:</b> Real on-chain $MIMI token rewards for active hunters!

👇 <b>Tap below to launch the Mini App inside Telegram:</b>`;

    // 1. Inline Keyboard with WebApp button
    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: '🐱 Launch Music Mimi App 🎧',
            web_app: { url: cleanAppUrl },
          },
        ],
        [
          {
            text: '💎 Connect TON Wallet',
            web_app: { url: `${cleanAppUrl}/?tab=vault` },
          },
          {
            text: '🎵 Music Library',
            web_app: { url: `${cleanAppUrl}/?tab=beats` },
          },
        ],
        [
          {
            text: '🏆 Task (Dolicash Offer) 💰',
            url: 'https://www.fastrsrvr.com/view.php?id=5547102&pub=3366972',
          },
          {
            text: '👥 Invite Friends',
            web_app: { url: `${cleanAppUrl}/?tab=profile` },
          },
        ],
      ],
    };

    // 2. Persistent Reply Keyboard
    const replyKeyboard = {
      keyboard: [
        [
          {
            text: '🐱 Open Mimi App 🎧',
            web_app: { url: cleanAppUrl },
          },
        ],
      ],
      resize_keyboard: true,
      is_persistent: true,
    };

    // Send primary welcome message with Inline WebApp button
    const sendResult = await sendTelegramRequest('sendMessage', {
      chat_id: chatId,
      text: welcomeText,
      parse_mode: 'HTML',
      reply_markup: inlineKeyboard,
    });

    // Send persistent reply keyboard so launcher is always pinned at the bottom
    await sendTelegramRequest('sendMessage', {
      chat_id: chatId,
      text: '⚡ <i>Launch shortcut pinned below for instant 1-tap access anytime!</i>',
      parse_mode: 'HTML',
      reply_markup: replyKeyboard,
    });

    // Configure chat menu button for this chat
    await sendTelegramRequest('setChatMenuButton', {
      chat_id: chatId,
      menu_button: {
        type: 'web_app',
        text: '🐱 Play Mimi 🎧',
        web_app: { url: cleanAppUrl },
      },
    });

    return res.status(200).json({
      ok: true,
      handled: true,
      chat_id: chatId,
      telegram_status: sendResult,
    });
  } catch (error: any) {
    console.error('Error handling Telegram webhook:', error);
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Internal Server Error',
    });
  }
}
