// Real TON Network & Cryptographic Address Service

export const TON_CONFIG = {
  // Official Jetton Master (Contract) Address
  jettonMasterAddress: 'EQBg0xtMMpjfESU4tENRzkrBfk4zi2kXd2bHVvHOcYWSv3Be',
  // Official Admin / Airdrop Pool Address
  adminAirdropPoolAddress: 'UQCq-PboNEs9iF9VaUIGt2PxVuUXcykeq0R0zcBg1nchEXAF',
  // Connected Jetton Wallet Address (Contract / Distributor)
  connectedJettonWalletAddress: 'UQCq-PboNEs9iF9VaUIGt2PxVuUXcykeq0R0zcBg1nchEXAF',
  tokenSymbol: '$MIMI',
  tokenName: 'Music Mimi',
  standard: 'TEP-74 Jetton',
  decimals: 9,
  dexListingPartners: ['DeDust', 'STON.fi'] as const,
  // Required official notice
  dexListingNotice: 'Every $MIMI token you earn by completing tasks is yours. Your hard-earned tokens will be directly claimable to your connected TON wallet once the $MIMI token is listed on DEX (DeDust / STON.fi).',
  dexListingNoticeHi: 'टास्क पूरे करके आपके द्वारा कमाया गया हर $MIMI टोकन 100% आपका है। जैसे ही $MIMI टोकन DEX (DeDust / STON.fi) पर लिस्ट होगा, आपके टोकन सीधे आपके कनेक्टेड TON वॉलेट में क्लेम करने योग्य हो जाएंगे।',
  // Trust message
  trustMessage: 'Tokens earned through community tasks, sound loops, and musical quests are 100% real on-chain $MIMI Jetton tokens that belong directly to you.',
  trustMessageHi: 'टास्क और म्यूजिक लूप्स से कमाए गए सभी टोकन 100% असली ऑन-चेन $MIMI जेटन टोकन हैं जो सीधे आपके मालिकाना अधिकार में हैं।',
};

export function getTonscanAddressUrl(address: string): string {
  return `https://tonscan.org/address/${encodeURIComponent(address)}`;
}

export function getTonviewerAddressUrl(address: string): string {
  return `https://tonviewer.com/${encodeURIComponent(address)}`;
}

export function getTonscanTxUrl(txHash: string): string {
  return `https://tonscan.org/tx/${encodeURIComponent(txHash)}`;
}

export function shortenAddress(address: string | null | undefined, chars = 4): string {
  if (!address) return '';
  const trimmed = address.trim();
  if (trimmed.length <= chars * 2 + 2) return trimmed;
  return `${trimmed.slice(0, chars)}...${trimmed.slice(-chars)}`;
}

export interface TonMasterchainInfo {
  blockNumber: number;
  workchain: number;
  shard: string;
  timestamp: number;
}

// Fetch real live Masterchain block height from public TonCenter Mainnet API
export async function fetchLiveTonBlock(): Promise<number | null> {
  try {
    const res = await fetch('https://toncenter.com/api/v2/getMasterchainInfo');
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.ok && data.result && data.result.last) {
      return data.result.last.seqno;
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch TON block height', err);
    return null;
  }
}

// Real TON User-Friendly Address Validator (Bounceable EQ... & Non-Bounceable UQ...)
// Standard TON addresses are 48 base64url characters:
// 1 byte flags + 1 byte workchain ID (-1 or 0) + 32 bytes account ID + 2 bytes CRC16 checksum
export function validateTonAddress(address: string): { isValid: boolean; error?: string } {
  const trimmed = address.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Address cannot be empty.' };
  }

  // Must start with EQ (bounceable) or UQ (non-bounceable) for workchain 0, or Ef/Uf for workchain -1
  const validPrefixes = ['EQ', 'UQ', 'Ef', 'Uf', 'kQ', '0:'];
  const hasValidPrefix = validPrefixes.some(p => trimmed.startsWith(p));

  if (!hasValidPrefix) {
    return {
      isValid: false,
      error: 'Invalid TON address prefix. Standard TON addresses start with "EQ" or "UQ".'
    };
  }

  // Standard raw hex or user-friendly base64url length
  if (trimmed.startsWith('0:')) {
    if (trimmed.length !== 66) {
      return { isValid: false, error: 'Raw hex address must be "0:" followed by 64 hex characters.' };
    }
  } else {
    if (trimmed.length !== 48) {
      return {
        isValid: false,
        error: `Invalid length (${trimmed.length} characters). Standard TON user-friendly addresses are exactly 48 characters.`
      };
    }

    // Check base64 / base64url character set
    const base64Regex = /^[A-Za-z0-9_-]{48}$/;
    if (!base64Regex.test(trimmed)) {
      return {
        isValid: false,
        error: 'Address contains invalid characters. Only Base64 / Base64URL characters (A-Z, a-z, 0-9, -, _) are permitted.'
      };
    }
  }

  return { isValid: true };
}
