#!/usr/bin/env node
/**
 * Telegram Bot Chat Menu Button ("Play Mimi" Button) Fix & Update Script
 * 
 * Usage:
 *   TELEGRAM_BOT_TOKEN="your_bot_token" APP_URL="https://your-app.vercel.app" node scripts/fix-menu-button.js
 * Or to reset menu button:
 *   TELEGRAM_BOT_TOKEN="your_bot_token" ACTION="reset" node scripts/fix-menu-button.js
 */

import 'dotenv/config';

const ACTIVE_BOT_TOKEN = '8939562897:AAGsNW3rSh6S1Kc2Q3coMslEtfYzDL9vJvw';
const BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN && !process.env.TELEGRAM_BOT_TOKEN.startsWith('830347'))
  ? process.env.TELEGRAM_BOT_TOKEN
  : ACTIVE_BOT_TOKEN;
const APP_URL = process.env.APP_URL || process.env.VERCEL_URL || 'https://my-project-six-coral-29.vercel.app';
const ACTION = process.env.ACTION || 'update'; // 'update' | 'reset' | 'get'

if (!BOT_TOKEN) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN environment variable is not defined.');
  console.error('Usage: TELEGRAM_BOT_TOKEN="your_bot_token" node scripts/fix-menu-button.js');
  process.exit(1);
}

async function callTelegram(method, params = {}) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

async function main() {
  console.log('🔄 Checking & Updating Telegram Bottom Chat Menu Button...');

  try {
    // 1. Fetch current menu button
    console.log('1️⃣ Fetching current Chat Menu Button from Telegram...');
    const currentBtn = await callTelegram('getChatMenuButton');
    console.log('   -> Current Menu Button:', JSON.stringify(currentBtn, null, 2));

    if (ACTION === 'reset') {
      console.log('2️⃣ Resetting Menu Button to Default (deleting custom WebApp URL)...');
      const resetRes = await callTelegram('setChatMenuButton', {
        menu_button: { type: 'default' }
      });
      console.log('   -> Result:', resetRes);
      return;
    }

    // 2. Set new WebApp menu button globally for all users
    const cleanAppUrl = APP_URL.startsWith('http') ? APP_URL.replace(/\/+$/, '') : `https://${APP_URL.replace(/\/+$/, '')}`;
    console.log(`2️⃣ Updating Global Menu Button ("Play Mimi") to: ${cleanAppUrl}`);

    const updateRes = await callTelegram('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: '🐱 Play Mimi 🎧',
        web_app: { url: cleanAppUrl }
      }
    });

    console.log('   -> Telegram response:', updateRes);

    // 3. Verify
    const verifiedBtn = await callTelegram('getChatMenuButton');
    console.log('3️⃣ Verified Menu Button on Telegram:', JSON.stringify(verifiedBtn, null, 2));

    if (updateRes.ok) {
      console.log('✅ SUCCESS! The bottom "Play Mimi" button has been globally updated on Telegram!');
      console.log('💡 Tip: If your Telegram app still shows old version, tap 3 dots (⋮) inside the app -> "Reload Page" or clear Telegram cache.');
    } else {
      console.error('⚠️ Telegram returned error:', updateRes.description);
    }
  } catch (err) {
    console.error('❌ Network error:', err.message);
  }
}

main();
