import React, { useState } from 'react';
import { Room } from '../../types';
import { Shield, Key, Lock, Copy, Check, Info, RefreshCw, X } from 'lucide-react';
import { generateRandomSecret, generateSafetyNumber } from '../../crypto/e2ee';

interface SecurityModalProps {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePassphrase: (newPassphrase: string) => Promise<void>;
  themeStyles: any;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  room,
  isOpen,
  onClose,
  onUpdatePassphrase,
  themeStyles,
}) => {
  const [copiedSafety, setCopiedSafety] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [customPass, setCustomPass] = useState(room.secretPassphrase || '');
  const [isEditingPass, setIsEditingPass] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleCopySafety = () => {
    if (room.safetyNumber) {
      navigator.clipboard.writeText(room.safetyNumber);
      setCopiedSafety(true);
      setTimeout(() => setCopiedSafety(false), 2000);
    }
  };

  const handleCopyPass = () => {
    if (room.secretPassphrase) {
      navigator.clipboard.writeText(room.secretPassphrase);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const handleSavePassphrase = async () => {
    if (!customPass.trim()) return;
    setIsSaving(true);
    try {
      await onUpdatePassphrase(customPass.trim());
      setIsEditingPass(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateRandomPass = async () => {
    const randomKey = generateRandomSecret();
    setCustomPass(randomKey);
  };

  // Generate deterministic pattern for visual fingerprint
  const seedString = (room.safetyNumber || room.name) + 'aegis';
  const gridCells = Array.from({ length: 64 }, (_, i) => {
    const charCode = seedString.charCodeAt(i % seedString.length) + i * 7;
    return charCode % 2 === 0;
  });

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
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Seguridad & Cifrado E2EE
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                AES-GCM 256
              </span>
            </h3>
            <p className={`text-xs ${themeStyles.textSecondary}`}>
              Sala: <strong className="text-white">{room.name}</strong>
            </p>
          </div>
        </div>

        {/* Explanation Banner */}
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/30 text-xs text-emerald-200/90 flex gap-3">
          <Info size={20} className="shrink-0 text-emerald-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-emerald-300">
              ¿Cómo se guardan y protegen tus mensajes y archivos sin servidor?
            </p>
            <p className="leading-relaxed opacity-90">
              Esta app opera bajo el modelo <strong>Local-First y Serverless</strong>: los mensajes y archivos adjuntos se cifran en tu navegador con la Web Crypto API (AES-GCM de 256 bits y PBKDF2) antes de almacenarse en la base de datos local <strong>IndexedDB</strong> de tu propio dispositivo. Ningún servidor central recibe ni guarda tus conversaciones en texto claro.
            </p>
          </div>
        </div>

        {/* Safety Number & Visual Fingerprint */}
        <div className="mb-6 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Lock size={14} className="text-emerald-400" />
              Código de Seguridad (Safety Number)
            </span>
            <button
              onClick={handleCopySafety}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition"
            >
              {copiedSafety ? <Check size={13} /> : <Copy size={13} />}
              {copiedSafety ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Visual Cryptographic Matrix */}
            <div className="shrink-0 p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg shadow-inner">
              <div className="grid grid-cols-8 gap-1 w-24 h-24">
                {gridCells.map((active, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xs transition-colors ${
                      active ? 'bg-emerald-400' : 'bg-neutral-800/60'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Numeric Digits */}
            <div className="grow">
              <p className="font-mono text-sm tracking-widest text-emerald-300/90 leading-relaxed break-all bg-neutral-950/70 p-3 rounded-lg border border-neutral-800">
                {room.safetyNumber || 'No generado'}
              </p>
              <p className="text-[11px] text-neutral-500 mt-2">
                Compara estos números con tu contacto para confirmar que nadie puede interceptar la conversación.
              </p>
            </div>
          </div>
        </div>

        {/* Passphrase Configuration */}
        <div className="mb-6 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Key size={14} className="text-emerald-400" />
              Clave Secreta de la Sala (Passphrase)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="text-xs text-neutral-400 hover:text-white transition"
              >
                {showPassphrase ? 'Ocultar' : 'Mostrar'}
              </button>
              <button
                onClick={handleCopyPass}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition"
              >
                {copiedPass ? <Check size={13} /> : <Copy size={13} />}
                {copiedPass ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          {isEditingPass ? (
            <div className="space-y-3 mt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPass}
                  onChange={(e) => setCustomPass(e.target.value)}
                  placeholder="Introduce nueva clave secreta compartida..."
                  className="grow px-3 py-2 text-xs font-mono rounded-lg bg-neutral-950 border border-neutral-700 text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleGenerateRandomPass}
                  title="Generar clave aleatoria"
                  className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setCustomPass(room.secretPassphrase || '');
                    setIsEditingPass(false);
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg text-neutral-400 hover:bg-neutral-800 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePassphrase}
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Aplicar Clave'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 mt-2 bg-neutral-950/70 p-3 rounded-lg border border-neutral-800">
              <span className="font-mono text-xs text-neutral-200 truncate">
                {showPassphrase
                  ? room.secretPassphrase || 'Sin clave configurada'
                  : '••••••••••••••••••••••••••••••••'}
              </span>
              <button
                onClick={() => setIsEditingPass(true)}
                className="text-xs px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 shrink-0 transition"
              >
                Cambiar Clave
              </button>
            </div>
          )}
          <p className="text-[11px] text-neutral-500 mt-2">
            Ambos participantes deben tener la misma clave secreta en esta sala para descifrar los mensajes mutuamente.
          </p>
        </div>

        {/* Cryptographic Technical Specs */}
        <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-800/80 text-[11px] font-mono text-neutral-400 space-y-1">
          <div className="flex justify-between">
            <span>Cifrado Simétrico:</span>
            <span className="text-neutral-200">AES-GCM (256 bits, IV de 96 bits)</span>
          </div>
          <div className="flex justify-between">
            <span>Derivación de Clave:</span>
            <span className="text-neutral-200">PBKDF2-HMAC-SHA256 (100,000 iteraciones)</span>
          </div>
          <div className="flex justify-between">
            <span>Almacenamiento Local:</span>
            <span className="text-neutral-200">IndexedDB nativo (Cifrado local / Offline-first)</span>
          </div>
          <div className="flex justify-between">
            <span>Canal P2P:</span>
            <span className="text-neutral-200">BroadcastChannel / WebRTC DataChannel</span>
          </div>
        </div>

        {/* Close */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
