/**
 * Standalone Telegram Bot Long-Polling Daemon for Music Mimi ($MIMI)
 * Run with: node scripts/bot-polling.js or npm run bot
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8939562897:AAGsNW3rSh6S1Kc2Q3coMslEtfYzDL9vJvw';
const APP_URL = (process.env.APP_URL || 'https://my-project-six-coral-29.vercel.app').replace(/\/+$/, '');

console.log('--------------------------------------------------');
console.log('🐱 Starting Music Mimi Telegram Bot Daemon...');
console.log(`🔗 Target WebApp URL: ${APP_URL}`);
console.log('--------------------------------------------------');

async function callTelegram(method, params = {}) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

async function handleMessage(msg) {
  if (!msg || !msg.chat) return;
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const firstName = msg.from?.first_name || 'Music Lover';

  console.log(`📩 Received message from [${chatId} | ${firstName}]: "${text}"`);

  const welcomeText = `🎧 <b>Welcome to Music Mimi ($MIMI) Airdrop!</b> 🐱✨

Hey <b>${firstName}</b>! Welcome to the decentralized beat-crafting game on TON!

💎 <b>Game Rules:</b>
• 🎵 <b>Mimi Making:</b> Craft 8-hour loops to create procedural music tracks
• 🔄 <b>Merge Loops:</b> Combine loops to level up and earn unlocked audio tracks
• 💳 <b>TON Wallet Gate:</b> Connect Tonkeeper or Telegram Wallet to verify eligibility
• 🚀 <b>$MIMI Rewards:</b> Harvest token allocations before the TGE snapshot!

👇 <b>Tap the button below to launch the Mini App inside Telegram:</b>`;

  // 1. Inline Keyboard
  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: '🐱 Launch Music Mimi App 🎧',
          web_app: { url: APP_URL },
        },
      ],
      [
        {
          text: '💎 Connect TON Wallet',
          web_app: { url: `${APP_URL}/?tab=wallet` },
        },
        {
          text: '🎵 Music Library',
          web_app: { url: `${APP_URL}/?tab=beats` },
        },
      ],
      [
        {
          text: '🏆 Task (Dolicash Offer) 💰',
          url: 'https://www.fastrsrvr.com/view.php?id=5547102&pub=3366972',
        },
      ],
      [
        {
          text: '📢 Official Channel',
          url: 'https://t.me/MusicMimiAirdrop',
        },
      ],
    ],
  };

  // 2. Persistent Reply Keyboard
  const replyKeyboard = {
    keyboard: [
      [
        {
          text: '🐱 Play Music Mimi ($MIMI) 🎧',
          web_app: { url: APP_URL },
        },
      ],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };

  try {
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: welcomeText,
      parse_mode: 'HTML',
      reply_markup: inlineKeyboard,
    });

    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: '⚡ <i>Launch shortcut pinned below for instant 1-tap play!</i>',
      parse_mode: 'HTML',
      reply_markup: replyKeyboard,
    });
    console.log(`✅ Welcome reply with WebApp buttons sent to ${chatId}`);
  } catch (err) {
    console.error('Failed to send message:', err);
  }
}

async function startPolling() {
  // Delete existing webhook so polling works
  await callTelegram('deleteWebhook', { drop_pending_updates: false });
  console.log('🤖 Telegram long polling loop initiated. Listening for /start...');

  let offset = 0;

  while (true) {
    try {
      const data = await callTelegram('getUpdates', {
        offset,
        timeout: 30,
        allowed_updates: ['message', 'callback_query'],
      });

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          if (update.message) {
            await handleMessage(update.message);
          }
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

startPolling();
