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
const CHANNEL = process.env.CHANNEL || process.env.TELEGRAM_CHANNEL || '@ApernaAIOfficial';
const APP_URL = (process.env.APP_URL || 'https://my-project-six-coral-29.vercel.app').replace(/\/+$/, '');
const NOTES = process.env.NOTES || '';

async function main() {
  console.log('🚀 Starting Aperna AI Official Telegram Channel Broadcast...');
  console.log(`🤖 Bot: @Musicmimi_bot`);
  console.log(`📢 Target Channel: ${CHANNEL}`);
  console.log(`🌐 Mini App URL: ${APP_URL}`);

  const messageText = `🚀 <b>APERNA AI &amp; MUSIC MIMI ($MIMI) — OFFICIAL ECOSYSTEM UPDATE</b> 🐱✨
━━━━━━━━━━━━━━━━━━━━━

🔥 <b>Community Alert &amp; Release Notes:</b>
Aperna AI Community ke sabhi members ke liye ek fresh high-speed update live kar diya gaya hai!

🎬 <b>1. NEW YOUTUBE &amp; SOCIAL BOUNTY TASKS</b>
• <b>Watch, Like &amp; Comment:</b> YouTube videos dekhne aur engage karne par instant $MIMI rewards!
• <b>Channel Subscribe:</b> Official @hashmicrypto1 channel subscribe karein aur bell icon on karein.
• <b>Telegram &amp; Instagram:</b> @ApernaAIOfficial &amp; @Hashmi_Crypto follow bounty tasks active.

👑 <b>2. APERNA AI GENESIS MEMORIAL SAGA (NFT PORTAL)</b>
• <b>Live on Polygon PoS Mainnet:</b> Sovereign ERC-721 + EIP-2981 Web3 collection.
• <b>Contract:</b> <code>0x8EAA10c5Cb32b585AE397878F64CF6d3F3b3D348</code>
• 🎁 <b>Free 1st Mint Bonus:</b> <b>+1,000 $APERNA Tokens</b> credited directly to balance!
• 💎 <b>Marketplace Listing Reward:</b> <b>+500 $APERNA Tokens</b> when you list on OpenSea &amp; MagicEden!

🎧 <b>3. PROCEDURAL BEAT ENGINE &amp; 8-HR LOOP MINER</b>
• High-performance neural stems &amp; real-time audio merge engine.
• Active 8-Hour looping with automated claim multipliers.

💳 <b>4. TON BLOCKCHAIN &amp; METAMASK DUAL CONNECTIVITY</b>
• TON Connect integration for Telegram @wallet and Tonkeeper.
• Direct MetaMask mobile deep-linking for on-chain Polygon minting.

${NOTES ? `📌 <b>Important Announcement:</b>\n${NOTES}\n\n` : ''}━━━━━━━━━━━━━━━━━━━━━
👇 <b>Niche button dabakar turant Mini App kholein:</b>`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: '🚀 Launch Aperna Mini App 🎧',
          web_app: { url: APP_URL },
        },
      ],
      [
        {
          text: '👑 Genesis NFT Portal',
          web_app: { url: `${APP_URL}/?tab=nft` },
        },
        {
          text: '💎 Connect TON Vault',
          web_app: { url: `${APP_URL}/?tab=vault` },
        },
      ],
      [
        {
          text: '▶️ Hashmi Crypto YouTube',
          url: 'https://youtube.com/@hashmicrypto1?si=p8615mTtahK5bA_o',
        },
        {
          text: '👥 Join @ApernaAIOfficial',
          url: 'https://t.me/ApernaAIOfficial',
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
