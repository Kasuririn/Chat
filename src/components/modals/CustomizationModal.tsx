import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { Palette, Volume2, VolumeX, Type, MessageSquare, Check, X, Sparkles, User } from 'lucide-react';
import { sound } from '../../utils/audio';

interface CustomizationModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile: (newProfile: UserProfile) => Promise<void>;
  themeStyles: any;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  profile,
  isOpen,
  onClose,
  onUpdateProfile,
  themeStyles,
}) => {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [statusBio, setStatusBio] = useState(profile.statusBio);
  const [theme, setTheme] = useState(profile.theme);
  const [bubbleStyle, setBubbleStyle] = useState(profile.bubbleStyle);
  const [chatWallpaper, setChatWallpaper] = useState(profile.chatWallpaper);
  const [fontSize, setFontSize] = useState(profile.fontSize);
  const [soundEnabled, setSoundEnabled] = useState(profile.soundEnabled);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const themesList: Array<{ id: UserProfile['theme']; name: string; icon: string; previewColor: string }> = [
    { id: 'cyber-dark', name: 'Dark OLED', icon: '🌑', previewColor: 'bg-neutral-900 border-emerald-500' },
    { id: 'emerald-stealth', name: 'Esmeralda Sigilo', icon: '🌲', previewColor: 'bg-[#081811] border-emerald-400' },
    { id: 'midnight-violet', name: 'Violeta Cósmico', icon: '🔮', previewColor: 'bg-[#0f0c24] border-violet-400' },
    { id: 'amber-terminal', name: 'Ámbar Cyber', icon: '⚡', previewColor: 'bg-[#14120f] border-amber-400' },
    { id: 'clean-light', name: 'Luz Nórdica', icon: '☀️', previewColor: 'bg-slate-100 border-blue-500' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated: UserProfile = {
        ...profile,
        name,
        avatar,
        statusBio,
        theme,
        bubbleStyle,
        chatWallpaper,
        fontSize,
        soundEnabled,
      };
      await onUpdateProfile(updated);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSound = () => {
    sound.playReceive();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border ${themeStyles.cardBg} ${themeStyles.border} p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <Palette size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Personalización de la Interfaz
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Temas & Estilos
              </span>
            </h3>
            <p className={`text-xs ${themeStyles.textSecondary}`}>
              Adapta la apariencia visual, burbujas de chat, sonidos y tu perfil anónimo.
            </p>
          </div>
        </div>

        {/* Profile Details */}
        <div className="mb-6 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <User size={14} className="text-pink-400" />
            Identidad Local
          </span>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Avatar</label>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full text-center px-2 py-2 text-xl rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div className="col-span-3">
              <label className="text-[11px] text-neutral-400 block mb-1">Nombre Visible (Seudónimo)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-neutral-400 block mb-1">Estado / Biografía</label>
            <input
              type="text"
              value={statusBio}
              onChange={(e) => setStatusBio(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* Color Themes */}
        <div className="mb-6">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2.5 block">
            Tema de Color Principal
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {themesList.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-pink-500 bg-pink-950/30 text-white shadow-xs'
                      : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  <div className="grow min-w-0">
                    <span className="text-xs font-medium block truncate">{t.name}</span>
                  </div>
                  {isSelected && <Check size={14} className="text-pink-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bubble Style & Wallpaper */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block flex items-center gap-1.5">
              <MessageSquare size={13} className="text-pink-400" />
              Estilo de Burbuja
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['modern', 'sharp', 'minimal'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setBubbleStyle(style)}
                  className={`px-3 py-2 text-xs capitalize rounded-lg border text-center transition ${
                    bubbleStyle === style
                      ? 'border-pink-500 bg-pink-950/40 text-white font-medium'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  {style === 'modern' ? 'Moderna' : style === 'sharp' ? 'Afilada' : 'Mínima'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block flex items-center gap-1.5">
              <Sparkles size={13} className="text-pink-400" />
              Fondo de Chat
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['dots', 'grid', 'crosses', 'none'] as const).map((pattern) => (
                <button
                  key={pattern}
                  onClick={() => setChatWallpaper(pattern)}
                  className={`px-2 py-2 text-[11px] capitalize rounded-lg border text-center transition ${
                    chatWallpaper === pattern
                      ? 'border-pink-500 bg-pink-950/40 text-white font-medium'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  {pattern === 'dots'
                    ? 'Puntos'
                    : pattern === 'grid'
                    ? 'Malla'
                    : pattern === 'crosses'
                    ? 'Cruces'
                    : 'Liso'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Font Size & Sounds */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block flex items-center gap-1.5">
              <Type size={13} className="text-pink-400" />
              Tamaño de Letra
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['sm', 'md', 'lg'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-3 py-2 text-xs uppercase rounded-lg border text-center transition ${
                    fontSize === size
                      ? 'border-pink-500 bg-pink-950/40 text-white font-medium'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  {size === 'sm' ? 'Chica' : size === 'md' ? 'Media' : 'Grande'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                {soundEnabled ? <Volume2 size={13} className="text-pink-400" /> : <VolumeX size={13} className="text-neutral-500" />}
                Efectos de Sonido
              </span>
              <button
                type="button"
                onClick={handleTestSound}
                className="text-[10px] text-pink-400 hover:underline"
              >
                Probar
              </button>
            </label>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition ${
                soundEnabled
                  ? 'border-pink-500/50 bg-pink-950/20 text-white'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-400'
              }`}
            >
              <span className="text-xs">{soundEnabled ? 'Sonidos activados' : 'Silencio completo'}</span>
              <div
                className={`w-8 h-4 rounded-full transition-colors relative ${
                  soundEnabled ? 'bg-pink-500' : 'bg-neutral-700'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                    soundEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="mb-6 p-3 rounded-xl border border-neutral-800 bg-neutral-950/70">
          <span className="text-[11px] text-neutral-500 uppercase tracking-wider block mb-2 font-mono">
            Vista Previa de Burbuja
          </span>
          <div className="flex flex-col gap-2">
            <div className="flex justify-start">
              <div
                className={`max-w-[75%] px-3 py-2 text-xs ${
                  bubbleStyle === 'modern' ? 'rounded-2xl rounded-bl-xs' : bubbleStyle === 'sharp' ? 'rounded-md' : 'rounded-none border-l-2 border-emerald-500 pl-2'
                } bg-neutral-800 text-neutral-200`}
              >
                ¡Hola! Esta es la vista previa de un mensaje recibido.
              </div>
            </div>
            <div className="flex justify-end">
              <div
                className={`max-w-[75%] px-3 py-2 text-xs ${
                  bubbleStyle === 'modern' ? 'rounded-2xl rounded-br-xs' : bubbleStyle === 'sharp' ? 'rounded-md' : 'rounded-none border-r-2 border-pink-500 pr-2'
                } bg-emerald-600 text-white font-medium`}
              >
                🔒 Perfecto, todo se adapta a tu gusto en tiempo real.
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl text-neutral-400 hover:bg-neutral-800 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-medium rounded-xl bg-pink-600 hover:bg-pink-500 text-white transition shadow-sm disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Aplicar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};
