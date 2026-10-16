/**
 * Telegram Bot Utilities for Music Mimi Mini App
 * Note: Bot tokens are strictly kept on the server-side (/api/webhook, /api/set-webhook)
 * and never exposed in client bundles.
 */

export const TELEGRAM_BOT_CONFIG = {
  botUsername: 'Musicmimi_bot',
  appTitle: 'Music Mimi ($MIMI)',
  defaultVercelUrl: 'https://my-project-six-coral-29.vercel.app',
};

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

