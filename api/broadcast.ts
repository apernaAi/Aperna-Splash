/**
 * Telegram Channel Official Update Broadcaster for Music Mimi ($MIMI)
 * Endpoint: /api/broadcast
 * 
 * Allows sending formatted, professional release & changelog updates
 * to @mimi_official_community (or configured channel chat ID).
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const DEFAULT_CHANNEL = process.env.TELEGRAM_CHANNEL || '@musicmimi_community';
const DEFAULT_APP_URL = process.env.APP_URL || 'https://my-project-six-coral-29.vercel.app';
const ADMIN_SECRET = process.env.ADMIN_SECRET;

export function buildOfficialReleaseMessage(customNotes?: string, appUrl = DEFAULT_APP_URL): string {
  const cleanAppUrl = appUrl.replace(/\/+$/, '');
  
  return `🚀 <b>APERNA AI &amp; MUSIC MIMI ($MIMI) — OFFICIAL ECOSYSTEM UPDATE</b> 🐱✨
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

${customNotes ? `📌 <b>Important Announcement:</b>\n${customNotes}\n\n` : ''}━━━━━━━━━━━━━━━━━━━━━
👇 <b>Tap below to launch the updated Mini App immediately:</b>`;
}

export function buildBroadcastKeyboard(appUrl = DEFAULT_APP_URL) {
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

export async function sendTelegramBroadcast(params: {
  token?: string;
  channel?: string;
  customNotes?: string;
  appUrl?: string;
}) {
  const token = params.token || BOT_TOKEN;
  const channel = params.channel || DEFAULT_CHANNEL;
  const appUrl = params.appUrl || DEFAULT_APP_URL;

  const messageText = buildOfficialReleaseMessage(params.customNotes, appUrl);
  const replyMarkup = buildBroadcastKeyboard(appUrl);

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: channel,
      text: messageText,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
      reply_markup: replyMarkup,
    }),
  });

  return res.json();
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Security verification if ADMIN_SECRET is configured
  if (ADMIN_SECRET) {
    const providedSecret = req.query?.secret || req.headers?.['x-admin-secret'];
    if (providedSecret !== ADMIN_SECRET) {
      return res.status(401).json({ ok: false, error: 'Unauthorized: Invalid admin secret' });
    }
  }

  const queryToken = (req.query?.token || req.body?.token || BOT_TOKEN || '').toString().trim();
  const queryChannel = (req.query?.channel || req.body?.channel || DEFAULT_CHANNEL || '').toString().trim();
  const customNotes = req.query?.notes || req.body?.notes || '';

  // Determine App URL
  let appUrl = DEFAULT_APP_URL;
  if (req.headers && req.headers['x-forwarded-host']) {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'];
    if (host && !host.includes('localhost')) {
      appUrl = `${proto}://${host}`;
    }
  }

  // If user opened this in browser via GET without action=send, show a neat dashboard UI
  const isHtml = (req.headers?.accept || '').includes('text/html');
  const action = req.query?.action || (req.method === 'POST' ? 'send' : 'view');

  if (action === 'view' && isHtml) {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Music Mimi — Telegram Channel Broadcast Center</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #030d22; color: #e2f4ff; padding: 2rem 1rem; max-width: 680px; margin: 0 auto; line-height: 1.6; }
          .card { background: rgba(5,23,62,0.95); border: 1px solid rgba(0,210,255,0.3); border-radius: 20px; padding: 1.8rem; box-shadow: 0 10px 40px rgba(0,0,0,0.6); }
          h1 { color: #00d2ff; font-size: 1.5rem; margin-top: 0; display: flex; align-items: center; gap: 8px; }
          label { font-size: 0.85rem; font-weight: 700; color: #7dd3fc; display: block; margin-top: 14px; margin-bottom: 4px; }
          input, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #1e3a8a; background: #020817; color: #fff; box-sizing: border-box; font-size: 14px; }
          textarea { height: 90px; resize: vertical; }
          .btn-primary { background: linear-gradient(135deg, #0284c7, #2563eb); color: white; border: none; padding: 14px 24px; border-radius: 12px; font-weight: 800; cursor: pointer; font-size: 15px; width: 100%; margin-top: 20px; transition: all 0.2s; box-shadow: 0 4px 20px rgba(2,132,199,0.4); }
          .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 25px rgba(2,132,199,0.6); }
          .tip-box { background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.3); border-radius: 12px; padding: 12px 16px; margin-top: 18px; font-size: 13px; color: #fde68a; }
          .preview-box { background: #01040f; border: 1px dashed rgba(255,255,255,0.2); border-radius: 12px; padding: 14px; margin-top: 18px; font-size: 12px; color: #94a3b8; white-space: pre-wrap; word-break: break-word; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>📢 Music Mimi Official Channel Broadcast</h1>
          <p style="color: #94a3b8; font-size: 13.5px; margin-top: -6px;">
            Publish professional release notifications with inline launch buttons directly to your Telegram channel.
          </p>

          <form method="POST" action="/api/broadcast">
            <!-- Server automatically reads TELEGRAM_BOT_TOKEN from environment if not explicitly provided -->
            <input type="hidden" name="token" value="${req.query?.token || req.body?.token || ''}" />
            
            <label>🎯 Target Channel (Username or Chat ID):</label>
            <input type="text" name="channel" value="${queryChannel}" placeholder="@musicmimi_community or -100..." required />

            <label>📝 Optional Custom Announcement Notes:</label>
            <textarea name="notes" placeholder="e.g. • Naye YouTube Task &amp; Instagram Task add ho gaye!&#10;• Video like/comment/subscribe par Free $MIMI claim karein&#10;• Instant 1,000 $APERNA airdrop reward"></textarea>

            <button type="submit" class="btn-primary">
              🚀 Send Professional Update to Channel
            </button>
          </form>

          <div class="tip-box">
            💡 <strong>Channel Requirements:</strong><br/>
            1. Ensure your Bot is added as an <b>Admin</b> in <b>@musicmimi_community</b> with <b>Post Messages</b> permission.<br/>
            2. For public channel: use <code>@musicmimi_community</code>.<br/>
            3. For private channel: use its numerical chat_id (starts with <code>-100...</code>).
          </div>

          <div class="preview-box">
            <strong>📋 Preview of Broadcast Message:</strong>
            ${buildOfficialReleaseMessage('• New Feature updates deployed live', appUrl)}
          </div>
        </div>
      </body>
      </html>
    `);
  }

  // Handle Send action (via POST or GET ?action=send)
  try {
    const telegramResult = await sendTelegramBroadcast({
      token: queryToken,
      channel: queryChannel,
      customNotes,
      appUrl,
    });

    if (isHtml) {
      const isSuccess = telegramResult.ok;
      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Broadcast Status</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #030d22; color: #e2f4ff; padding: 2rem; max-width: 600px; margin: 0 auto; text-align: center; }
            .card { background: rgba(5,23,62,0.95); border: 1px solid ${isSuccess ? '#10b981' : '#ef4444'}; border-radius: 20px; padding: 2rem; }
            pre { background: #01040f; padding: 14px; border-radius: 10px; color: ${isSuccess ? '#6ee7b7' : '#fca5a5'}; text-align: left; font-size: 13px; overflow-x: auto; }
            a { color: #38bdf8; font-weight: bold; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>${isSuccess ? '✅ Telegram Channel Update Sent!' : '⚠️ Telegram API Response'}</h2>
            <p>${isSuccess ? `Successfully posted release announcement to <b>${queryChannel}</b>!` : 'Telegram returned an error. See details below:'}</p>
            <pre>${JSON.stringify(telegramResult, null, 2)}</pre>
            ${!isSuccess ? `
              <p style="color:#fde68a; font-size:13px; text-align:left; line-height:1.5;">
                👉 <b>If error says 'chat not found':</b><br/>
                1. Make sure your channel is set to <b>Public</b> with username <code>${queryChannel.replace('@', '')}</code> in Telegram Channel Settings.<br/>
                2. Or if it is Private, get the channel's numeric ID (e.g. <code>-100238...</code>) and use that.<br/>
                3. Ensure <b>@Musicmimi_bot</b> is an Admin with <b>Post Messages</b> enabled.
              </p>
            ` : ''}
            <p style="margin-top:20px;"><a href="/api/broadcast">← Back to Broadcast Center</a></p>
          </div>
        </body>
        </html>
      `);
    }

    return res.status(200).json({
      ok: telegramResult.ok,
      channel: queryChannel,
      result: telegramResult,
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Failed to send broadcast',
    });
  }
}
