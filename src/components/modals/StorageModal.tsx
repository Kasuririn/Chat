import React, { useState, useEffect } from 'react';
import { StorageStats } from '../../types';
import {
  getStorageStats,
  exportEncryptedBackup,
  importBackup,
  wipeAllData,
} from '../../storage/db';
import {
  Database,
  HardDrive,
  Download,
  Upload,
  Trash2,
  Check,
  AlertTriangle,
  X,
  FileCheck,
} from 'lucide-react';

interface StorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset: () => void;
  themeStyles: any;
}

export const StorageModal: React.FC<StorageModalProps> = ({
  isOpen,
  onClose,
  onDataReset,
  themeStyles,
}) => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showConfirmWipe, setShowConfirmWipe] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const s = await getStorageStats();
      setStats(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStats();
      setMessage(null);
      setShowConfirmWipe(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleExport = async () => {
    try {
      const json = await exportEncryptedBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AegisCrypt_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ text: 'Copia de seguridad descargada exitosamente.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'Error al exportar: ' + err.message, type: 'error' });
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const success = await importBackup(text);
      if (success) {
        setMessage({ text: 'Copia de seguridad restaurada correctamente.', type: 'success' });
        await loadStats();
        setTimeout(() => {
          onDataReset();
          onClose();
        }, 1200);
      } else {
        setMessage({ text: 'El archivo no tiene el formato correcto.', type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const handleWipe = async () => {
    await wipeAllData();
    setMessage({ text: 'Todos los datos locales han sido borrados de forma segura.', type: 'success' });
    setTimeout(() => {
      onDataReset();
      onClose();
    }, 1000);
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
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Database size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Gestión de Almacenamiento Local
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                IndexedDB
              </span>
            </h3>
            <p className={`text-xs ${themeStyles.textSecondary}`}>
              Persistencia segura en tu navegador sin depender de un servidor central.
            </p>
          </div>
        </div>

        {/* Alert / Notification banner */}
        {message && (
          <div
            className={`mb-5 p-3 rounded-xl text-xs flex items-center gap-2 border ${
              message.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-red-950/40 border-red-800 text-red-300'
            }`}
          >
            {message.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Educational Architecture Explanation */}
        <div className="mb-6 p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-xs text-cyan-200/90 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-cyan-300">
            <HardDrive size={15} />
            ¿Cómo se almacenan los mensajes y archivos sin servidor?
          </div>
          <p className="leading-relaxed opacity-90 text-[11px]">
            Los navegadores modernos disponen de <strong>IndexedDB</strong>, una base de datos local capaz de almacenar cientos de megabytes de texto cifrado, imágenes y notas de voz en tu propio disco duro. Al no haber servidor central, los datos nunca viajan desencriptados por la red ni quedan registrados en bases de datos externas.
          </p>
          <div className="text-[11px] text-cyan-300/80 pt-1 border-t border-cyan-900/40 flex items-center gap-1.5">
            <FileCheck size={13} />
            Para migrar tus chats a otro dispositivo, puedes <strong>Exportar una copia de seguridad</strong> en archivo JSON.
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 text-center">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Espacio Usado</span>
            <span className="text-base font-bold font-mono text-cyan-400 mt-1 block">
              {stats ? formatBytes(stats.usedBytes) : '...'}
            </span>
          </div>
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 text-center">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Salas de Chat</span>
            <span className="text-base font-bold font-mono text-white mt-1 block">
              {stats ? stats.totalRooms : 0}
            </span>
          </div>
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 text-center">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Mensajes</span>
            <span className="text-base font-bold font-mono text-white mt-1 block">
              {stats ? stats.totalMessages : 0}
            </span>
          </div>
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 text-center">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Archivos/Audios</span>
            <span className="text-base font-bold font-mono text-white mt-1 block">
              {stats ? stats.totalAttachments : 0}
            </span>
          </div>
        </div>

        {/* Backup and Restore Actions */}
        <div className="space-y-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExport}
              className="grow flex items-center justify-center gap-2 p-3 text-xs font-medium rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white transition shadow-xs"
            >
              <Download size={15} className="text-cyan-400" />
              Exportar Copia de Seguridad (.json)
            </button>

            <label className="grow flex items-center justify-center gap-2 p-3 text-xs font-medium rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white cursor-pointer transition shadow-xs">
              <Upload size={15} className="text-cyan-400" />
              Restaurar Copia de Seguridad
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Destructive Actions */}
        <div className="p-4 rounded-xl border border-red-950/60 bg-red-950/10">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-red-400 block">
                Borrado Seguro de Datos (Wipe)
              </span>
              <span className="text-[11px] text-neutral-400 block mt-0.5">
                Elimina permanentemente todos los chats, claves y archivos de IndexedDB.
              </span>
            </div>
            {!showConfirmWipe ? (
              <button
                onClick={() => setShowConfirmWipe(true)}
                className="px-3 py-1.5 text-xs rounded-lg border border-red-800/60 bg-red-950/40 hover:bg-red-900/60 text-red-300 transition"
              >
                Borrar Todo
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConfirmWipe(false)}
                  className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleWipe}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center gap-1 shadow-xs"
                >
                  <Trash2 size={13} />
                  Confirmar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Close */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
