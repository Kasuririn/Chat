import React, { useState } from 'react';
import { Room, UserProfile } from '../types';
import {
  Shield,
  Plus,
  Search,
  Bot,
  Lock,
  HardDrive,
  Palette,
  Settings,
  Trash2,
  Radio,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  rooms: Room[];
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onOpenNewRoomModal: () => void;
  onOpenCustomizationModal: () => void;
  onOpenStorageModal: () => void;
  onOpenAIConfigModal: () => void;
  onDeleteRoom: (roomId: string) => void;
  profile: UserProfile;
  peerCount: number;
  themeStyles: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  rooms,
  activeRoomId,
  onSelectRoom,
  onOpenNewRoomModal,
  onOpenCustomizationModal,
  onOpenStorageModal,
  onOpenAIConfigModal,
  onDeleteRoom,
  profile,
  peerCount,
  themeStyles,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'p2p' | 'ai' | 'notes'>('all');

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.lastMessage && r.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeFilter === 'all') return true;
    if (activeFilter === 'p2p') return r.type === 'direct' || r.type === 'group';
    if (activeFilter === 'ai') return r.type === 'ai';
    if (activeFilter === 'notes') return r.type === 'notes';
    return true;
  });

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <aside
      className={`w-80 md:w-88 shrink-0 flex flex-col h-full border-r ${themeStyles.sidebarBg} ${themeStyles.border} select-none transition-colors duration-200`}
    >
      {/* Brand Header */}
      <div className={`p-4 border-b ${themeStyles.border} flex items-center justify-between`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-950/40">
            <Shield size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">AegisCrypt</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                E2EE
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sin Servidor • Local-First</span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenNewRoomModal}
          title="Crear Nueva Sala Cifrada"
          className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 hover:text-white transition shadow-xs"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Network / P2P Status banner */}
      <div className="px-4 py-2 border-b border-neutral-800/60 bg-neutral-950/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-neutral-400">
          <Radio size={13} className={peerCount > 0 ? 'text-emerald-400' : 'text-neutral-500'} />
          <span className="text-[11px]">
            {peerCount > 0
              ? `${peerCount} pares P2P conectados`
              : 'Mesh P2P activo (multi-pestaña)'}
          </span>
        </div>
        <button
          onClick={onOpenAIConfigModal}
          className="text-[11px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
        >
          <Sparkles size={11} />
          Agente IA
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="p-3 space-y-2 border-b border-neutral-800/40">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar salas y mensajes cifrados..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {(
            [
              { id: 'all', label: 'Todas' },
              { id: 'p2p', label: 'P2P / Grupos' },
              { id: 'ai', label: 'IA Copilot' },
              { id: 'notes', label: 'Bóveda' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-2.5 py-1 text-[11px] rounded-lg transition whitespace-nowrap ${
                activeFilter === f.id
                  ? 'bg-neutral-800 text-white font-medium shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Room List */}
      <div className="grow overflow-y-auto p-2 space-y-1">
        {filteredRooms.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            No se encontraron salas con esa búsqueda.
          </div>
        ) : (
          filteredRooms.map((room) => {
            const isActive = room.id === activeRoomId;
            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={`group relative flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                  isActive
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'hover:bg-neutral-900/80 text-neutral-300'
                }`}
              >
                {/* Room Avatar */}
                <div className="relative shrink-0 w-10 h-10 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-center text-lg shadow-inner">
                  {room.avatar || '💬'}
                  {room.type === 'ai' ? (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-[9px] flex items-center justify-center text-white border border-neutral-900">
                      <Bot size={10} />
                    </span>
                  ) : room.type === 'notes' ? (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-600 text-[9px] flex items-center justify-center text-white border border-neutral-900">
                      <Lock size={9} />
                    </span>
                  ) : (
                    <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-neutral-900" />
                  )}
                </div>

                {/* Info */}
                <div className="grow min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-xs truncate max-w-[150px]">
                      {room.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                      {formatTime(room.lastMessageTime || room.updatedAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate opacity-80">
                    {room.lastMessage || 'Sin mensajes aún'}
                  </p>
                </div>

                {/* Delete button (hidden unless hover & not default room) */}
                {room.id !== 'room_ai_assistant' && room.id !== 'room_private_vault' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`¿Eliminar la sala "${room.name}" y sus mensajes locales?`)) {
                        onDeleteRoom(room.id);
                      }
                    }}
                    title="Eliminar sala"
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-900 transition shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* User Bottom Bar */}
      <div className={`p-3 border-t ${themeStyles.border} bg-neutral-950/60 flex items-center justify-between`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-base shrink-0">
            {profile.avatar}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-white block truncate">
              {profile.name}
            </span>
            <span className="text-[10px] text-neutral-400 font-mono block truncate opacity-70">
              {profile.fingerprint.slice(0, 14)}...
            </span>
          </div>
        </div>

        {/* Quick Config Icons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpenCustomizationModal}
            title="Personalizar Tema e Interfaz"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <Palette size={16} />
          </button>
          <button
            onClick={onOpenStorageModal}
            title="Almacenamiento Local (IndexedDB)"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <HardDrive size={16} />
          </button>
          <button
            onClick={onOpenAIConfigModal}
            title="Configuración de Agente IA"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <Bot size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
