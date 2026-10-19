export interface Room {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'ai' | 'notes';
  avatar?: string;
  description?: string;
  secretPassphrase?: string; // used for shared AES-GCM room key derivation
  safetyNumber?: string;
  isP2P?: boolean;
  peerConnected?: boolean;
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Attachment {
  id: string;
  name: string;
  type: string; // e.g. 'image/jpeg', 'audio/webm', 'application/pdf'
  size: number;
  dataUrl: string; // base64 or blob URL
  isVoiceNote?: boolean;
  duration?: number; // for audio voice notes in seconds
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isAi?: boolean;
  isSelf?: boolean;
  encryptedPayload?: {
    ciphertext: string;
    iv: string;
    salt?: string;
    algorithm: string;
  };
  attachment?: Attachment;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  statusBio: string;
  fingerprint: string;
  theme: 'cyber-dark' | 'emerald-stealth' | 'midnight-violet' | 'amber-terminal' | 'clean-light';
  bubbleStyle: 'modern' | 'sharp' | 'minimal';
  chatWallpaper: 'dots' | 'grid' | 'crosses' | 'none';
  fontSize: 'sm' | 'md' | 'lg';
  soundEnabled: boolean;
}

export interface AIPersona {
  id: string;
  name: string;
  avatar: string;
  tagline: string;
  systemPrompt: string;
  temperature: number;
}

export interface StorageStats {
  usedBytes: number;
  totalRooms: number;
  totalMessages: number;
  totalAttachments: number;
  isPersisted: boolean;
}
