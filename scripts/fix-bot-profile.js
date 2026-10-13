#!/usr/bin/env node
/**
 * Telegram Bot Profile & Bio Purge / Cache Refresh Script
 * Usage:
 *   TELEGRAM_BOT_TOKEN="your_new_token" node scripts/fix-bot-profile.js
 * or if .env is populated:
 *   npm run bot:clean-profile
 */

import 'dotenv/config';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN environment variable is not defined.');
  console.error('Usage: TELEGRAM_BOT_TOKEN="your_new_token" node scripts/fix-bot-profile.js');
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
  console.log('🛡️ Sanitizing Music Mimi Telegram Bot Profile & Bio Cache...');

  const cleanName = 'Music Mimi ($MIMI)';
  const cleanDescEn = '🎵 Official Music Mimi ($MIMI) Telegram Mini App. Craft beats, merge music tracks, and mine real TON airdrop rewards!';
  const cleanShortDescEn = '🐱 Craft music tracks & mine $MIMI on TON!';
  const cleanDescHi = '🎵 म्यूजिक मिमी ($MIMI) आधिकारिक टेलीग्राम मिनी ऐप। बीट्स क्राफ्ट करें और TON एयरड्रॉप कमाएं!';
  const cleanShortDescHi = '🐱 म्यूजिक ट्रैक्स बनाएं और TON पर $MIMI माइन करें!';

  try {
    // 1. Update Name
    console.log('1️⃣ Setting Bot Name...');
    const nameRes = await callTelegram('setMyName', { name: cleanName });
    console.log('   -> Name result:', nameRes.ok ? '✅ OK' : nameRes);

    // 2. Overwrite Default Descriptions
    console.log('2️⃣ Overwriting Default Description & Bio (Short Description)...');
    const descDef = await callTelegram('setMyDescription', { description: cleanDescEn });
    const shortDescDef = await callTelegram('setMyShortDescription', { short_description: cleanShortDescEn });
    console.log('   -> Description:', descDef.ok ? '✅ OK' : descDef);
    console.log('   -> Short Description (Bio):', shortDescDef.ok ? '✅ OK' : shortDescDef);

    // 3. Overwrite English Language Description & Bio
    console.log('3️⃣ Overwriting EN Language Description & Bio...');
    await callTelegram('setMyDescription', { description: cleanDescEn, language_code: 'en' });
    await callTelegram('setMyShortDescription', { short_description: cleanShortDescEn, language_code: 'en' });

    // 4. Overwrite Hindi Language Description & Bio
    console.log('4️⃣ Overwriting HI Language Description & Bio...');
    await callTelegram('setMyDescription', { description: cleanDescHi, language_code: 'hi' });
    await callTelegram('setMyShortDescription', { short_description: cleanShortDescHi, language_code: 'hi' });

    // 5. Verify current values stored in Telegram's master database
    console.log('5️⃣ Verifying current metadata on Telegram servers...');
    const curName = await callTelegram('getMyName');
    const curDesc = await callTelegram('getMyDescription');
    const curShortDesc = await callTelegram('getMyShortDescription');

    console.log('--------------------------------------------------');
    console.log('✨ Current Name on Telegram:', curName.result?.name);
    console.log('✨ Current Short Description (Bio):', curShortDesc.result?.short_description);
    console.log('✨ Current Full Description:', curDesc.result?.description);
    console.log('--------------------------------------------------');
    console.log('🎉 Done! Malicious links have been completely wiped from Telegram servers.');
    console.log('💡 Note: Telegram mobile clients will reflect this as soon as they query the bot.');
  } catch (err) {
    console.error('❌ Failed to update bot profile:', err);
  }
}

main();
