import React, { useState } from 'react';
import { Message } from '../../types';
import { ShieldCheck, Copy, Check, X, FileText, Binary } from 'lucide-react';

interface CipherInspectorModalProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
  themeStyles: any;
}

export const CipherInspectorModal: React.FC<CipherInspectorModalProps> = ({
  message,
  isOpen,
  onClose,
  themeStyles,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !message) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const payload = message.encryptedPayload;

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
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Inspector Criptográfico E2EE
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Verificación de Cifrado
              </span>
            </h3>
            <p className={`text-xs ${themeStyles.textSecondary}`}>
              Inspecciona los paquetes de datos criptográficos tal como se procesan.
            </p>
          </div>
        </div>

        {/* Plaintext representation */}
        <div className="mb-4 p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
            <FileText size={13} className="text-emerald-400" />
            Texto en Claro (Descifrado en Memoria Local)
          </span>
          <div className="p-2.5 rounded-lg bg-neutral-950 text-xs text-neutral-100 font-sans leading-relaxed">
            {message.text || (message.attachment ? `[Archivo adjunto: ${message.attachment.name}]` : 'Sin contenido de texto')}
          </div>
        </div>

        {/* Ciphertext representation */}
        <div className="mb-4 p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Binary size={13} className="text-emerald-400" />
              Criptograma / Ciphertext (Base64)
            </span>
            <button
              onClick={() => copyToClipboard(payload?.ciphertext || message.text, 'cipher')}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
            >
              {copiedKey === 'cipher' ? <Check size={12} /> : <Copy size={12} />}
              {copiedKey === 'cipher' ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <div className="p-2.5 rounded-lg bg-neutral-950 font-mono text-[11px] text-emerald-400/90 break-all leading-tight max-h-28 overflow-y-auto">
            {payload?.ciphertext || 'Cifrado local generado dinámicamente'}
          </div>
        </div>

        {/* Cryptographic Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                Vector Inicial (IV - 96 bits)
              </span>
              <button
                onClick={() => copyToClipboard(payload?.iv || '', 'iv')}
                className="text-[10px] text-emerald-400 hover:underline"
              >
                {copiedKey === 'iv' ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="p-2 rounded-md bg-neutral-950 font-mono text-[10px] text-neutral-300 break-all">
              {payload?.iv || 'Random WebCrypto IV'}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                Salt Criptográfico (128 bits)
              </span>
              <button
                onClick={() => copyToClipboard(payload?.salt || '', 'salt')}
                className="text-[10px] text-emerald-400 hover:underline"
              >
                {copiedKey === 'salt' ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="p-2 rounded-md bg-neutral-950 font-mono text-[10px] text-neutral-300 break-all">
              {payload?.salt || 'PBKDF2 SHA-256 Salt'}
            </div>
          </div>
        </div>

        {/* Audit explanation */}
        <p className="text-[11px] text-neutral-400 leading-relaxed mb-6">
          🛡️ <strong>Garantía de Cifrado Auténtico:</strong> Gracias a AES-GCM (Galois/Counter Mode), cada mensaje incluye un código de autenticación de mensajes (MAC) que previene cualquier alteración silenciosa del mensaje en tránsito o en disco.
        </p>

        {/* Close */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition"
          >
            Cerrar Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
