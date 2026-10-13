import {createRoot} from 'react-dom/client';
import {TonConnectUIProvider} from '@tonconnect/ui-react';
import App from './App.tsx';
import './index.css';

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
