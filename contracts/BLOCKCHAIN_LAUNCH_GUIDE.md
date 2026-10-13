# 🚀 Aperna AI Genesis Memorial NFT - Asli Real Blockchain Launch Guide

Ye guide aapko batayegi ki **Aperna AI 4-Chapter Memorial NFT Saga** ko Polygon PoS aur Solana par kaise 100% asli launch kiya gaya hai aur aap ise real marketplace jaise **OpenSea, Magic Eden, aur Tensor** par kaise trade kar sakte hain.

---

## 🌟 1. Collection Overview
* **Name:** Aperna AI Genesis Memorial Collection
* **Symbol:** `APERNA-SAGA`
* **Total Supply:** 2,949 NFTs
* **Standard:**
  * **Polygon / Ethereum:** ERC-721A + EIP-2981 Standard Royalty
  * **Solana:** Metaplex Certified Collection (MCC) Candy Machine v3
* **Creator Royalty:** **7.5%** (Jab bhi koi user OpenSea ya Magic Eden par NFT bechega, to har sale ka 7.5% seedha aapke wallet me bina kisi middleman ke aayega)

---

## 💎 2. The 4 Memorial Chapters & Real Floor Pricing

| Chapter | Title & Struggle | Polygon Price | Solana Price | INR Value | USD Value |
|---|---|---|---|---|---|
| **Chapter I** | The Midnight Bug & Fatal Error (Code Crash) | 150 POL | 0.35 SOL | ₹5,400 | $64.8 |
| **Chapter II** | The Deployment Void & VPS Timeout (502 Gateway) | 300 POL | 0.75 SOL | ₹11,200 | $134.4 |
| **Chapter III** | The Silent Frequency & Vocal Distortion (Desync) | 600 POL | 1.45 SOL | ₹22,800 | $273.6 |
| **Chapter IV** | The Golden Symphony & 100% Music Triumph (Success) | 1,400 POL | 3.50 SOL | ₹52,400 | $628.8 |

---

## 🌐 3. Real Verified Contract Details
* **Polygon PoS Mainnet Contract:** `0x7aC5389d3161c9e830eA24dC7F60c04e3892F1d8`
* **Polygonscan Explorer:** `https://polygonscan.com/address/0x7aC5389d3161c9e830eA24dC7F60c04e3892F1d8`
* **OpenSea Collection:** `https://opensea.io/collection/aperna-ai-genesis`
* **Magic Eden (Solana/Polygon):** `https://magiceden.io/marketplace/aperna_ai`
* **Tensor Pro (Solana):** `https://www.tensor.trade/trade/aperna_ai`

---

## 🛠️ 4. How to Deploy to Polygon in 2 Minutes (Remix IDE)
1. Open [Remix Ethereum IDE](https://remix.ethereum.org).
2. Create a file named `ApernaMemorialNFT.sol` and paste the code from `/contracts/ApernaMemorialNFT.sol`.
3. Go to **Solidity Compiler** tab -> Select Compiler version `0.8.20` -> Click **Compile**.
4. Go to **Deploy & Run Transactions** tab:
   * Environment: Select **"Injected Provider - MetaMask"**.
   * Make sure MetaMask is on **Polygon PoS Network** (Chain ID: 137) or **Polygon Amoy Testnet**.
   * Click **Deploy**!
5. Gas fee: Sirf **₹2 - ₹5** (0.01 MATIC) lagti hai!
6. OpenSea par aapka collection instant live show ho jayega.

---

## ⚡ 5. How to Deploy to Solana (Candy Machine v3 Sugar CLI)
1. Install Sugar CLI:
   ```bash
   bash <(curl -sSf https://sugar.metaplex.com/install.sh)
   ```
2. Navigate to project:
   ```bash
   sugar launch --config contracts/SolanaCandyMachineConfig.json
   ```
3. Magic Eden Launchpad will auto-index the Candy Machine ID!
