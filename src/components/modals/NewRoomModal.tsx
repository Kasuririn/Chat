import React, { useState } from 'react';
import { Room } from '../../types';
import { MessageSquare, Users, Shield, Bot, Key, Sparkles, X } from 'lucide-react';
import { generateRandomSecret, generateSafetyNumber } from '../../crypto/e2ee';

interface NewRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (room: Room) => Promise<void>;
  themeStyles: any;
}

export const NewRoomModal: React.FC<NewRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  themeStyles,
}) => {
  const [type, setType] = useState<Room['type']>('direct');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('💬');
  const [description, setDescription] = useState('');
  const [passphrase, setPassphrase] = useState(generateRandomSecret());
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const roomTypes: Array<{ type: Room['type']; label: string; icon: any; defaultAvatar: string; desc: string }> = [
    { type: 'direct', label: 'Chat Directo P2P', icon: MessageSquare, defaultAvatar: '👤', desc: 'Canal cifrado punto a punto entre dos personas.' },
    { type: 'group', label: 'Grupo Privado', icon: Users, defaultAvatar: '👥', desc: 'Conversación grupal compartiendo la misma clave secreta.' },
    { type: 'notes', label: 'Bóveda de Notas', icon: Shield, defaultAvatar: '🔐', desc: 'Espacio personal cifrado para guardar notas y archivos.' },
    { type: 'ai', label: 'Canal de Asistente IA', icon: Bot, defaultAvatar: '🤖', desc: 'Sala dedicada para consultar al agente de IA con API.' },
  ];

  const handleSelectType = (selected: Room['type']) => {
    setType(selected);
    const item = roomTypes.find((r) => r.type === selected);
    if (item) {
      setAvatar(item.defaultAvatar);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      const roomId = 'room_' + Math.random().toString(36).substring(2, 9);
      const secret = passphrase.trim() || generateRandomSecret();
      const safety = await generateSafetyNumber(secret, roomId);

      const newRoom: Room = {
        id: roomId,
        name: name.trim(),
        type,
        avatar,
        description: description.trim() || undefined,
        secretPassphrase: secret,
        safetyNumber: safety,
        isP2P: type === 'direct' || type === 'group',
        peerConnected: type === 'direct' || type === 'group',
        unreadCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastMessage: 'Sala cifrada creada.',
        lastMessageTime: Date.now(),
      };

      await onCreateRoom(newRoom);
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border ${themeStyles.cardBg} ${themeStyles.border} p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200`}
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
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white">Nueva Sala Cifrada</h3>
            <p className={`text-xs ${themeStyles.textSecondary}`}>
              Crea un espacio de comunicación seguro con cifrado AES-256 de extremo a extremo.
            </p>
          </div>
        </div>

        {/* Type Selection */}
        <div className="mb-6">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block">
            Tipo de Sala
          </label>
          <div className="grid grid-cols-2 gap-2">
            {roomTypes.map((rt) => {
              const isSelected = type === rt.type;
              const Icon = rt.icon;
              return (
                <button
                  key={rt.type}
                  onClick={() => handleSelectType(rt.type)}
                  className={`p-3 rounded-xl border text-left transition ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-xs'
                      : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} className={isSelected ? 'text-emerald-400' : 'text-neutral-400'} />
                    <span className="text-xs font-semibold">{rt.label}</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 line-clamp-2">{rt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Name and Avatar */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Icono</label>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full text-center px-2 py-2 text-xl rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="col-span-3">
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Nombre de la Sala</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Proyecto Alpha, Familia, Notas Seguras..."
                className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1 block">
              Descripción (Opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve propósito de esta sala..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {type !== 'ai' && (
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key size={13} className="text-emerald-400" />
                  Clave Secreta Compartida (AES-GCM Passphrase)
                </span>
                <button
                  type="button"
                  onClick={() => setPassphrase(generateRandomSecret())}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Generar Otra
                </button>
              </label>
              <input
                type="text"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full px-3 py-2 font-mono text-xs rounded-lg bg-neutral-950 border border-neutral-800 text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                Comparte esta clave de forma segura con quien se una a la conversación para que pueda descifrar los mensajes.
              </p>
            </div>
          )}
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
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="px-5 py-2 text-xs font-medium rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm disabled:opacity-50"
          >
            {isCreating ? 'Creando...' : 'Crear Sala'}
          </button>
        </div>
      </div>
    </div>
  );
};
