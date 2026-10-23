import {createRoot} from 'react-dom/client';
import {TonConnectUIProvider} from '@tonconnect/ui-react';
import App from './App.tsx';
import './index.css';

// Suppress unhandled Adsgram launch parameter errors when testing in browser preview outside Telegram
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || String(reason || '');
    if (
      msg.includes('AdsgramError') ||
      msg.includes('launch parameters') ||
      msg.includes('Telegram environment') ||
      msg.includes('sad.adsgram.ai') ||
      msg.includes('Clause 11')
    ) {
      event.preventDefault();
      console.warn('[Adsgram] Suppressed preview environment notice:', msg);
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.includes('AdsgramError') ||
      msg.includes('launch parameters') ||
      msg.includes('Telegram environment') ||
      msg.includes('sad.adsgram.ai')
    ) {
      event.preventDefault();
      console.warn('[Adsgram] Suppressed window error:', msg);
    }
  });
}

const manifestUrl = typeof window !== 'undefined'
  ? `${window.location.origin}/tonconnect-manifest.json`
  : '/tonconnect-manifest.json';

createRoot(document.getElementById('root')!).render(
  <TonConnectUIProvider
    manifestUrl={manifestUrl}
    actionsConfiguration={{
      twaReturnUrl: 'https://t.me/Musicmimi_bot/app'
    }}
  >
    <App />
  </TonConnectUIProvider>
);
