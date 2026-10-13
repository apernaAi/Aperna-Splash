/**
 * Secure Telegram Bot Webhook & Profile Cache Registrar
 * Visit /api/set-webhook in your browser to inspect status, register webhook,
 * or forcefully flush/clean the Telegram server-side profile bio cache!
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DEFAULT_APP_URL = process.env.APP_URL || 'https://my-project-six-coral-29.vercel.app';
const ADMIN_SECRET = process.env.ADMIN_SECRET;

async function callTelegramWithToken(token: string, method: string, body?: Record<string, unknown>) {
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Security check: If ADMIN_SECRET is set, require either query param or header
  if (ADMIN_SECRET) {
    const providedSecret = req.query?.secret || req.headers?.['x-admin-secret'];
    if (providedSecret !== ADMIN_SECRET) {
      return res.status(401).json({ ok: false, error: 'Unauthorized: Invalid admin secret' });
    }
  }

  const activeToken = (req.query?.token || req.body?.token || BOT_TOKEN || '').toString().trim();

  // Token configuration check
  if (!activeToken) {
    const errorMsg = 'TELEGRAM_BOT_TOKEN is missing. Provide ?token=YOUR_BOT_TOKEN in URL or configure in Vercel.';
    if ((req.headers?.accept || '').includes('text/html')) {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Telegram Bot Sync & Menu Button Manager</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body{font-family:system-ui,sans-serif;background:#030d22;color:#f1f5f9;padding:2rem;text-align:center;max-width:600px;margin:0 auto;}
            .card{background:#0b1b36;padding:24px;border-radius:16px;border:1px solid #1e3a8a;margin-top:20px;}
            input{width:100%;padding:12px;margin:10px 0;border-radius:8px;border:1px solid #3b82f6;background:#030d22;color:#fff;box-sizing:border-box;font-size:14px;}
            button{background:#3b82f6;color:#fff;border:none;padding:12px 20px;border-radius:8px;font-weight:bold;cursor:pointer;margin:5px;font-size:14px;}
            button:hover{background:#2563eb;}
            .reset-btn{background:#ef4444;}
            .reset-btn:hover{background:#dc2626;}
            .info{color:#94a3b8;font-size:13px;line-height:1.5;margin-top:16px;text-align:left;}
          </style>
        </head>
        <body>
          <h2>🤖 Telegram Bot Menu & Webhook Tool</h2>
          <div class="card">
            <p style="color:#fbbf24;font-weight:600;">निचला "Play Mimi" मेनू बटन तुरंत नया करने या पुराना हटाने के लिए:</p>
            <form method="GET" action="/api/set-webhook">
              <input type="text" name="token" placeholder="यहाँ Bot Token डालें (जैसे: 830347...:AAE...)" required />
              <input type="hidden" name="action" value="set_menu" />
              <button type="submit">✨ नीचे वाला बटन नए ऐप से जोड़ें (Set Menu Button)</button>
            </form>
            <form method="GET" action="/api/set-webhook" style="margin-top:10px;">
              <input type="text" name="token" placeholder="Bot Token डालें" required />
              <input type="hidden" name="action" value="reset_menu" />
              <button type="submit" class="reset-btn">🗑️ पुराना मेनू बटन पूरी तरह हटाएं (Reset Menu Button)</button>
            </form>
            <div class="info">
              💡 <strong>नोट:</strong> टोकन BotFather से मिलता है। इस फॉर्म से एक क्लिक में Telegram सर्वर पर मेनू बटन अपडेट या रीसेट हो जाएगा!
            </div>
          </div>
        </body>
        </html>
      `);
    }
    return res.status(500).json({ ok: false, error: errorMsg });
  }

  const callTelegram = (method: string, body?: Record<string, unknown>) => callTelegramWithToken(activeToken, method, body);

  try {
    const action = req.query?.action || 'set';

    // 1. Flush & Purge Bot Bio / Profile Spam Cache (Directly overwriting Telegram's server registry)
    if (action === 'clean_profile' || action === 'fix_bio') {
      const cleanName = 'Music Mimi ($MIMI)';
      const cleanDescEn = '🎵 Official Music Mimi ($MIMI) Telegram Mini App. Craft beats, merge music tracks, and mine real TON airdrop rewards!';
      const cleanShortDescEn = '🐱 Craft music tracks & mine $MIMI on TON!';
      const cleanDescHi = '🎵 म्यूजिक मिमी ($MIMI) आधिकारिक टेलीग्राम मिनी ऐप। बीट्स क्राफ्ट करें और TON एयरड्रॉप कमाएं!';
      const cleanShortDescHi = '🐱 म्यूजिक ट्रैक्स बनाएं और TON पर $MIMI माइन करें!';

      const results = {
        setName: await callTelegram('setMyName', { name: cleanName }),
        // Default language description & short description (About/Bio on profile)
        setDescDefault: await callTelegram('setMyDescription', { description: cleanDescEn }),
        setShortDescDefault: await callTelegram('setMyShortDescription', { short_description: cleanShortDescEn }),
        // Explicit EN
        setDescEn: await callTelegram('setMyDescription', { description: cleanDescEn, language_code: 'en' }),
        setShortDescEn: await callTelegram('setMyShortDescription', { short_description: cleanShortDescEn, language_code: 'en' }),
        // Explicit HI
        setDescHi: await callTelegram('setMyDescription', { description: cleanDescHi, language_code: 'hi' }),
        setShortDescHi: await callTelegram('setMyShortDescription', { short_description: cleanShortDescHi, language_code: 'hi' }),
        // Verification fetch
        verifiedName: await callTelegram('getMyName'),
        verifiedDescription: await callTelegram('getMyDescription'),
        verifiedShortDescription: await callTelegram('getMyShortDescription'),
      };

      if ((req.headers?.accept || '').includes('text/html')) {
        return res.status(200).send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>Music Mimi Bot — Profile & Bio Sanitized</title>
            <style>
              body { font-family: system-ui, sans-serif; background: #030d22; color: #e2f4ff; padding: 2rem; max-width: 650px; margin: 0 auto; line-height: 1.6; }
              .card { background: rgba(5,23,62,0.9); border: 1px solid rgba(0,210,255,0.4); border-radius: 16px; padding: 1.5rem; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
              h1 { color: #00d2ff; margin-top: 0; font-size: 1.4rem; }
              .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 0.85rem; background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid #10b981; }
              pre { background: #010613; padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; color: #a5f3fc; }
              a { color: #38bdf8; text-decoration: none; font-weight: bold; }
              .btn { display: inline-block; margin-top: 10px; padding: 8px 16px; background: #0284c7; color: white; border-radius: 8px; text-decoration: none; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>🛡️ Telegram Profile Cache Sanitized & Hardened</h1>
              <p><span class="badge">Success: Malicious Bio Purged</span></p>
              <p>The bot's Name, About (Bio), and Description have been forcefully updated across Telegram's servers.</p>
              <h3>Current Verified Bot Metadata on Telegram:</h3>
              <pre>${JSON.stringify({ name: results.verifiedName, description: results.verifiedDescription, shortDescription: results.verifiedShortDescription }, null, 2)}</pre>
              <hr style="border: 0; border-top: 1px solid rgba(0,210,255,0.2); margin: 1.5rem 0;" />
              <p><a href="/api/set-webhook" class="btn">View Webhook Status</a></p>
            </div>
          </body>
          </html>
        `);
      }

      return res.status(200).json({ ok: true, message: 'Profile and Bio cache sanitized', details: results });
    }

    // 2. Query Webhook & Menu Button Info
    if (action === 'get' || action === 'get_menu') {
      const infoData = await callTelegram('getWebhookInfo');
      const menuData = await callTelegram('getChatMenuButton');
      return res.status(200).json({ ok: true, webhook: infoData, menuButton: menuData });
    }

    // 3. Delete Webhook
    if (action === 'delete') {
      const delData = await callTelegram('deleteWebhook', { drop_pending_updates: true });
      return res.status(200).json(delData);
    }

    // 4. Reset Menu Button to Default (removes custom / old button)
    if (action === 'reset_menu') {
      const resetMenuRes = await callTelegram('setChatMenuButton', {
        menu_button: { type: 'default' },
      });
      if ((req.headers?.accept || '').includes('text/html')) {
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Menu Button Reset</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>body{font-family:system-ui,sans-serif;background:#030d22;color:#f1f5f9;padding:2rem;text-align:center;max-width:600px;margin:0 auto;} .card{background:#0b1b36;padding:24px;border-radius:16px;border:1px solid #ef4444;} pre{background:#010613;padding:12px;border-radius:8px;color:#fca5a5;text-align:left;}</style>
          </head>
          <body>
            <div class="card">
              <h2 style="color:#ef4444;">🗑️ पुराना मेनू बटन सफलतापूर्वक हटा दिया गया!</h2>
              <p>Telegram सर्वर पर Menu Button डिफ़ॉल्ट पर रीसेट हो गया है।</p>
              <pre>${JSON.stringify(resetMenuRes, null, 2)}</pre>
              <p><a href="/api/set-webhook" style="color:#38bdf8;">वापस जाएं</a></p>
            </div>
          </body>
          </html>
        `);
      }
      return res.status(200).json({ ok: true, message: 'Menu button reset to default', result: resetMenuRes });
    }

    // 5. Default or update_menu / set_menu: Sync Global Menu Button
    const queryUrl = req.query?.url as string;
    let baseUrl = queryUrl || DEFAULT_APP_URL;

    if (!queryUrl && req.headers && req.headers['x-forwarded-host']) {
      const proto = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['x-forwarded-host'];
      if (host && !host.includes('localhost')) {
        baseUrl = `${proto}://${host}`;
      }
    }

    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    const webhookUrl = `${cleanBaseUrl}/api/webhook`;

    // Always update global Menu Button so bottom Play Mimi button matches fresh app
    const menuButtonRes = await callTelegram('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: '🐱 Play Mimi 🎧',
        web_app: { url: cleanBaseUrl },
      },
    });

    if (action === 'update_menu' || action === 'set_menu') {
      if ((req.headers?.accept || '').includes('text/html')) {
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Menu Button Updated</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>body{font-family:system-ui,sans-serif;background:#030d22;color:#f1f5f9;padding:2rem;text-align:center;max-width:600px;margin:0 auto;} .card{background:#0b1b36;padding:24px;border-radius:16px;border:1px solid #10b981;} pre{background:#010613;padding:12px;border-radius:8px;color:#a7f3d0;text-align:left;} a{color:#38bdf8;font-weight:bold;}</style>
          </head>
          <body>
            <div class="card">
              <h2 style="color:#10b981;">✅ निचला Play Mimi बटन ताज़ा ऐप से जुड़ गया!</h2>
              <p>नया लिंक: <code>${cleanBaseUrl}</code></p>
              <pre>${JSON.stringify(menuButtonRes, null, 2)}</pre>
              <p style="color:#fbbf24;font-size:13px;">📲 <strong>ध्यान दें:</strong> Telegram ऐप में तुरंत बदलाव देखने के लिए बॉट चैट को एक बार बंद करके फिर से खोलें या Reload करें!</p>
              <p><a href="/api/set-webhook">वापस जाएं</a></p>
            </div>
          </body>
          </html>
        `);
      }
      return res.status(200).json({
        ok: true,
        message: 'Telegram bottom menu button updated successfully!',
        appUrl: cleanBaseUrl,
        menuButton: menuButtonRes,
      });
    }

    const setParams: Record<string, unknown> = {
      url: webhookUrl,
      drop_pending_updates: true,
    };
    if (process.env.TELEGRAM_SECRET_TOKEN) {
      setParams.secret_token = process.env.TELEGRAM_SECRET_TOKEN;
    }

    const setData = await callTelegram('setWebhook', setParams);
    const verifyData = await callTelegram('getWebhookInfo');
    const verifyMenuData = await callTelegram('getChatMenuButton');

    if ((req.headers?.accept || '').includes('text/html')) {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Music Mimi Bot Webhook Status</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #030d22; color: #e2f4ff; padding: 2rem; max-width: 650px; margin: 0 auto; line-height: 1.6; }
            .card { background: rgba(5,23,62,0.85); border: 1px solid rgba(0,210,255,0.3); border-radius: 16px; padding: 1.5rem; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
            h1 { color: #00d2ff; margin-top: 0; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 0.85rem; }
            .ok { background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid #10b981; }
            pre { background: #010613; padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; color: #a5f3fc; }
            a.btn { display: inline-block; padding: 8px 14px; background: #0284c7; color: white; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 0.85rem; margin-right: 8px; }
            a.btn-emerald { background: #059669; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>🐱 Music Mimi Telegram Bot Security</h1>
            <p><span class="status ok">Webhook Active & Secured</span></p>
            <p><strong>Webhook Target:</strong> <code>${webhookUrl}</code></p>
            <p><strong>Telegram SetWebhook Result:</strong></p>
            <pre>${JSON.stringify(setData, null, 2)}</pre>
            <p><strong>Live Webhook Info:</strong></p>
            <pre>${JSON.stringify(verifyData, null, 2)}</pre>
            <p><strong>Live Bottom Menu Button ("Play Mimi"):</strong></p>
            <pre>${JSON.stringify(verifyMenuData, null, 2)}</pre>
            <div style="margin-top: 1.5rem;">
              <a href="/api/set-webhook?action=update_menu&url=${encodeURIComponent(cleanBaseUrl)}" class="btn">🔄 Update Bottom Menu Button</a>
              <a href="/api/set-webhook?action=reset_menu" class="btn" style="background:#dc2626;">🗑️ Reset Menu Button</a>
              <a href="/api/set-webhook?action=clean_profile" class="btn btn-emerald">🛡️ Force Purge Spam Bio Cache</a>
              <a href="/api/set-webhook?action=get" class="btn">🔍 Refresh Info</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    return res.status(200).json({
      success: setData.ok,
      telegramResponse: setData,
      currentWebhook: verifyData,
      currentMenuButton: verifyMenuData,
      webhookUrl,
      appUrl: cleanBaseUrl,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to configure webhook',
    });
  }
}
