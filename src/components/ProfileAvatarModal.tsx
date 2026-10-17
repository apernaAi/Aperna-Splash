/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  X, Camera, Upload, Check, Sparkles, Image as ImageIcon, 
  User, AtSign, RefreshCw, AlertCircle, ShieldCheck
} from 'lucide-react';
import { ASSETS } from '../assets/assetRegistry.ts';
import { TelegramIcon } from './TelegramIcon.tsx';
import { playTapSound, triggerHaptic } from '../utils/audioEngine.ts';
import { updateUserProfileData } from '../utils/referralCloudService.ts';

// Preset avatar options with rich icons & badges
export const PRESET_AVATARS = [
  {
    id: 'mimi-mascot',
    name: 'DJ Mimi',
    url: ASSETS.minerCharacter,
    badge: '🎧 DJ',
  },
  {
    id: 'vinyl-gold',
    name: 'गोल्ड विनाइल',
    url: ASSETS.mimiVinylBadge,
    badge: '🎵 Vinyl',
  },
  {
    id: 'mimi-token',
    name: '$MIMI टोकन',
    url: ASSETS.mimiTokenCoin,
    badge: '🪙 Token',
  },
  {
    id: 'gold-mine',
    name: 'गोल्ड माइन',
    url: ASSETS.goldMine,
    badge: '⛏️ Mine',
  },
  {
    id: 'aperna-diamond',
    name: 'Aperna AI',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    badge: '💎 Aperna',
  },
  {
    id: 'cyber-music',
    name: 'साइबर बीट्स',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
    badge: '⚡ Beats',
  },
  {
    id: 'neon-cat',
    name: 'नियॉन कैट',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80',
    badge: '🐱 Mimi',
  },
  {
    id: 'sound-wave',
    name: 'ऑडियो वेव',
    url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&auto=format&fit=crop&q=80',
    badge: '🎚️ Sound',
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentName: string;
  currentUsername: string;
  currentAvatarUrl?: string;
  onSave: (updated: { name: string; username: string; avatarUrl?: string }) => void;
  language: 'hi' | 'en';
}

export const ProfileAvatarModal: React.FC<Props> = ({
  isOpen,
  onClose,
  userId,
  currentName,
  currentUsername,
  currentAvatarUrl,
  onSave,
  language,
}) => {
  const [name, setName] = useState(currentName || '');
  const [username, setUsername] = useState(currentUsername || '');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatarUrl || ASSETS.minerCharacter);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle local file upload and compress to lightweight base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage(language === 'hi' ? 'कृपया केवल इमेज फाइल चुनें!' : 'Please select a valid image file!');
      return;
    }

    setErrorMessage(null);
    playTapSound();

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress using offscreen canvas to 160x160 max
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 160;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setSelectedAvatar(compressedDataUrl);
          triggerHaptic('light');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!customUrlInput.trim()) return;
    playTapSound();
    setSelectedAvatar(customUrlInput.trim());
    setShowUrlInput(false);
  };

  const handleSave = async () => {
    const cleanName = name.trim() || currentName || 'Mimi Artist';
    let cleanHandle = username.trim() || currentUsername || '@mimi_user';
    if (!cleanHandle.startsWith('@')) {
      cleanHandle = `@${cleanHandle}`;
    }

    setIsSaving(true);
    setErrorMessage(null);
    playTapSound();
    triggerHaptic('medium');

    try {
      // 1. Save to dedicated permanent localStorage keys so updates NEVER wipe this data
      if (typeof window !== 'undefined') {
        localStorage.setItem('mimi_permanent_user_name', cleanName);
        localStorage.setItem('mimi_permanent_user_username', cleanHandle);
        localStorage.setItem('music_mimi_tg_name', cleanName);
        localStorage.setItem('music_mimi_tg_username', cleanHandle);
        if (selectedAvatar) {
          localStorage.setItem('mimi_permanent_avatar_url', selectedAvatar);
        }
      }

      // 2. Persist permanently to Cloud Firestore
      await updateUserProfileData(userId, {
        name: cleanName,
        telegramUsername: cleanHandle,
        avatarUrl: selectedAvatar,
      });

      // 3. Update React parent state
      onSave({
        name: cleanName,
        username: cleanHandle,
        avatarUrl: selectedAvatar,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setErrorMessage(language === 'hi' ? 'सेव करने में समस्या आई, कृपया पुनः प्रयास करें' : 'Failed to save, please retry');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0c2456] via-[#07173b] to-[#040e24] border border-cyan-400/40 p-5 shadow-[0_0_50px_rgba(0,210,255,0.4)] text-white overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Glow ambient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight">
                {language === 'hi' ? 'प्रोफाइल व लोगो बदलें' : 'Edit Profile & Logo'}
              </h3>
              <p className="text-[10px] text-cyan-300 font-mono">
                {language === 'hi' ? 'परमानेंट क्लाउड सेविंग' : 'Permanent Cloud Sync'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1 relative z-10 custom-scrollbar">
          
          {/* Active Avatar Preview with Level Badge */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-cyan-400 via-sky-300 to-amber-300 shadow-[0_0_25px_rgba(0,210,255,0.6)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#05173e] flex items-center justify-center">
                  {selectedAvatar ? (
                    <img 
                      src={selectedAvatar} 
                      alt="Profile Avatar" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = ASSETS.minerCharacter;
                      }}
                    />
                  ) : (
                    <span className="font-black text-2xl text-white">
                      {name ? name.slice(0, 2).toUpperCase() : 'MM'}
                    </span>
                  )}
                </div>
              </div>

              {/* Upload trigger overlay button */}
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  fileInputRef.current?.click();
                }}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-lg border-2 border-white transition-all active:scale-95 cursor-pointer"
                title="फोटो या लोगो अपलोड करें"
              >
                <Upload className="w-3.5 h-3.5 text-slate-950" />
              </button>
            </div>

            <span className="text-[11px] text-cyan-200 font-bold mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              {language === 'hi' ? 'लाइव लोगो प्रिव्यू' : 'Live Logo Preview'}
            </span>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Upload Button & URL Option */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                fileInputRef.current?.click();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-400/40 text-cyan-200 text-xs font-black transition-all active:scale-95 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-300" />
              <span>{language === 'hi' ? 'गैलरी / फाइल' : 'Upload Image'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playTapSound();
                setShowUrlInput(!showUrlInput);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-400/40 text-sky-200 text-xs font-black transition-all active:scale-95 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-sky-300" />
              <span>{language === 'hi' ? 'इमेज लिंक' : 'Image URL'}</span>
            </button>
          </div>

          {/* Optional Direct URL Input Field */}
          {showUrlInput && (
            <div className="p-2.5 rounded-xl bg-black/50 border border-cyan-400/30 space-y-2 animate-fadeIn">
              <span className="text-[10px] text-cyan-300 font-bold">
                {language === 'hi' ? 'इमेज का डायरेक्ट URL पेस्ट करें:' : 'Paste direct image URL:'}
              </span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="https://... (jpg, png, webp)"
                  className="flex-1 bg-[#040e24] text-white text-xs px-2.5 py-1.5 rounded-lg border border-cyan-500/30 outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3 py-1.5 rounded-lg bg-cyan-400 text-slate-950 text-xs font-black cursor-pointer hover:bg-cyan-300 transition-all"
                >
                  {language === 'hi' ? 'लागू करें' : 'Apply'}
                </button>
              </div>
            </div>
          )}

          {/* Preset Web3 Music & Crypto Logos */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <span>{language === 'hi' ? '🎯 चुने हुए वेब3 लोगो:' : '🎯 Pick a Curated Logo:'}</span>
            </span>

            <div className="grid grid-cols-4 gap-2">
              {PRESET_AVATARS.map((item) => {
                const isSelected = selectedAvatar === item.url;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setSelectedAvatar(item.url);
                    }}
                    className={`relative flex flex-col items-center p-1.5 rounded-2xl border transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/30 border-cyan-400 shadow-[0_0_12px_rgba(0,210,255,0.6)] ring-1 ring-cyan-300'
                        : 'bg-[#081a42]/60 hover:bg-[#0c2763] border-cyan-500/20'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-black/40 border border-cyan-300/30 p-0.5">
                      <img 
                        src={item.url} 
                        alt={item.name} 
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = ASSETS.minerCharacter;
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-slate-200 mt-1 truncate max-w-full text-center">
                      {item.badge}
                    </span>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center text-[10px] font-black shadow">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name & Telegram Username Inputs */}
          <div className="space-y-3 pt-2 border-t border-cyan-500/20">
            <div>
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1">
                <User className="w-3.5 h-3.5 text-cyan-300" />
                <span>{language === 'hi' ? 'आपका नाम (Display Name):' : 'Your Display Name:'}</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'hi' ? 'उदा. Mohammad' : 'e.g. Mohammad'}
                maxLength={30}
                className="w-full bg-[#040e24] text-white font-bold text-sm px-3 py-2 rounded-xl border border-cyan-500/40 focus:border-cyan-300 outline-none transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1">
                <TelegramIcon className="w-3.5 h-3.5 text-[#24A1DE]" />
                <span>{language === 'hi' ? 'टेलीग्राम यूजरनेम:' : 'Telegram Username:'}</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@your_username"
                  maxLength={35}
                  className="w-full bg-[#040e24] text-cyan-200 font-mono font-bold text-sm px-3 py-2 rounded-xl border border-cyan-500/40 focus:border-cyan-300 outline-none transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {saveSuccess && (
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{language === 'hi' ? '✓ प्रोफाइल और लोगो सफलतापूर्वक सुरक्षित हो गया!' : '✓ Profile & logo saved permanently!'}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-cyan-500/20 flex items-center gap-2 relative z-10">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onClose();
            }}
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {language === 'hi' ? 'रद्द करें' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs transition-all shadow-[0_0_15px_rgba(0,210,255,0.6)] active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                <span>{language === 'hi' ? 'सुरक्षित हो रहा है...' : 'Saving...'}</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-slate-950" />
                <span>{language === 'hi' ? 'सुरक्षित हुआ!' : 'Saved!'}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                <span>{language === 'hi' ? 'परमानेंट सुरक्षित करें' : 'Save & Protect'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
