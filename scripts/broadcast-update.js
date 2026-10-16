#!/usr/bin/env node
/**
 * CLI Script: Broadcast Official App Updates to Telegram Channel
 * 
 * Usage:
 *   node scripts/broadcast-update.js
 * 
 * Or with custom options:
 *   CHANNEL="@mimi_official_community" NOTES="Added MetaMask fix and 1000 token bonus" node scripts/broadcast-update.js
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN environment variable is not defined.');
  console.error('Usage: TELEGRAM_BOT_TOKEN="your_bot_token" node scripts/broadcast-update.js');
  process.exit(1);
}
const CHANNEL = process.env.CHANNEL || process.env.TELEGRAM_CHANNEL || '@mimi_official_community';
const APP_URL = (process.env.APP_URL || 'https://my-project-six-coral-29.vercel.app').replace(/\/+$/, '');
const NOTES = process.env.NOTES || '';

async function main() {
  console.log('🚀 Starting Music Mimi Official Telegram Channel Broadcast...');
  console.log(`🤖 Bot: @Musicmimi_bot`);
  console.log(`📢 Target Channel: ${CHANNEL}`);
  console.log(`🌐 Mini App URL: ${APP_URL}`);

  const messageText = `🚀 <b>MUSIC MIMI ($MIMI) — OFFICIAL ECOSYSTEM UPDATE</b> 🐱✨
━━━━━━━━━━━━━━━━━━━━━

🔥 <b>Community Alert & Release Notes:</b>
We have just pushed a fresh, high-speed update to the <b>Music Mimi Web3 Mini App</b>!

👑 <b>1. APERNA AI GENESIS MEMORIAL SAGA (NFT PORTAL)</b>
• <b>Live on Polygon PoS Mainnet:</b> Sovereign ERC-721 + EIP-2981 Web3 collection.
• <b>Contract:</b> <code>0x8EAA10c5Cb32b585AE397878F64CF6d3F3b3D348</code>
• <b>Exclusive Chapter Pricing:</b> Only $0.50 USD (~1.25 POL) per chapter.
• 🎁 <b>Free 1st Mint Bonus:</b> <b>+1,000 $APERNA Tokens</b> credited directly to your in-app balance!
• 💎 <b>Marketplace Listing Reward:</b> <b>+500 $APERNA Tokens</b> on OpenSea, MagicEden, or Polygon DEX!

🎧 <b>2. PROCEDURAL BEAT ENGINE & 8-HR LOOP MINER</b>
• High-performance neural stems & real-time audio merge engine.
• Active 8-Hour looping with automated claim multipliers.

💳 <b>3. TON BLOCKCHAIN & METAMASK DUAL CONNECTIVITY</b>
• TON Connect integration for Telegram @wallet and Tonkeeper.
• Direct MetaMask mobile deep-linking for on-chain Polygon minting.

${NOTES ? `📌 <b>Additional Highlights:</b>\n${NOTES}\n\n` : ''}━━━━━━━━━━━━━━━━━━━━━
👇 <b>Tap below to launch the updated Mini App immediately:</b>`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: '🚀 Launch Updated Mimi App 🎧',
          web_app: { url: APP_URL },
        },
      ],
      [
        {
          text: '👑 Open Genesis NFT Portal',
          web_app: { url: `${APP_URL}/?tab=nft` },
        },
        {
          text: '💎 Connect TON Vault',
          web_app: { url: `${APP_URL}/?tab=vault` },
        },
      ],
      [
        {
          text: '🌐 View OpenSea Collection',
          url: 'https://opensea.io/collection/aperna-ai-genesis-memorial-saga',
        },
        {
          text: '👥 Official Community',
          url: 'https://t.me/mimi_official_community',
        },
      ],
    ],
  };

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHANNEL,
        text: messageText,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        reply_markup: inlineKeyboard,
      }),
    });

    const data = await res.json();
    if (data.ok) {
      console.log('✅ Broadcast successfully posted to Telegram Channel!');
      console.log('Message ID:', data.result.message_id);
    } else {
      console.error('❌ Failed to post broadcast:', JSON.stringify(data, null, 2));
      if (data.description?.includes('chat not found')) {
        console.log('\n💡 IMPORTANT TROUBLESHOOTING TIP:');
        console.log(`Telegram returned "chat not found" for "${CHANNEL}".`);
        console.log('1. If the channel is Public: In Telegram go to Channel Settings -> Channel Type -> Public, and set public link to "mimi_official_community".');
        console.log('2. If the channel is Private: Find its numeric ID (e.g. -100...) by forwarding a post to @userinfobot, then run:');
        console.log('   CHANNEL="-100xxxxxxxxxx" node scripts/broadcast-update.js');
        console.log('3. Ensure @Musicmimi_bot is an Admin with "Post Messages" permission.');
      }
    }
  } catch (err) {
    console.error('Network error during broadcast:', err);
  }
}

main();
