/**
 * AegisCrypt P2P Network Engine
 * Handles real-time multi-tab local mesh communication (BroadcastChannel)
 * and direct WebRTC DataChannel signaling for serverless messaging.
 */

import { Message } from '../types';

export interface P2PEventMessage {
  type: 'CHAT_MESSAGE' | 'PRESENCE_PING' | 'PRESENCE_PONG' | 'TYPING' | 'WEBRTC_SIGNAL';
  roomId: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  payload?: any;
}

export type P2PMessageHandler = (event: P2PEventMessage) => void;

class P2PNetworkManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<P2PMessageHandler> = new Set();
  private peerCount: number = 0;
  private currentUserId: string = '';
  private currentUserName: string = '';
  private pingInterval: any = null;

  init(userId: string, userName: string) {
    this.currentUserId = userId;
    this.currentUserName = userName;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('aegis_e2ee_bus_channel');
        this.channel.onmessage = (event) => {
          this.handleIncomingEvent(event.data);
        };

        // Broadcast presence
        this.broadcastPresence('PRESENCE_PING');

        // Periodic presence heartbeat
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          this.broadcastPresence('PRESENCE_PING');
        }, 8000);
      } catch (e) {
        console.warn('BroadcastChannel not supported or restricted:', e);
      }
    }
  }

  private handleIncomingEvent(data: P2PEventMessage) {
    if (!data || data.senderId === this.currentUserId) return;

    if (data.type === 'PRESENCE_PING') {
      this.broadcastPresence('PRESENCE_PONG');
      this.peerCount = Math.max(1, this.peerCount);
    } else if (data.type === 'PRESENCE_PONG') {
      this.peerCount = Math.max(1, this.peerCount);
    }

    // Notify registered UI listeners
    for (const listener of this.listeners) {
      try {
        listener(data);
      } catch (err) {
        console.error('Error in P2P event listener:', err);
      }
    }
  }

  public subscribe(handler: P2PMessageHandler): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  public broadcastMessage(roomId: string, message: Message) {
    if (!this.channel) return;
    const event: P2PEventMessage = {
      type: 'CHAT_MESSAGE',
      roomId,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      timestamp: Date.now(),
      payload: message,
    };
    this.channel.postMessage(event);
  }

  public broadcastTyping(roomId: string, isTyping: boolean) {
    if (!this.channel) return;
    const event: P2PEventMessage = {
      type: 'TYPING',
      roomId,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      timestamp: Date.now(),
      payload: { isTyping },
    };
    this.channel.postMessage(event);
  }

  private broadcastPresence(type: 'PRESENCE_PING' | 'PRESENCE_PONG') {
    if (!this.channel) return;
    const event: P2PEventMessage = {
      type,
      roomId: 'global',
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      timestamp: Date.now(),
    };
    this.channel.postMessage(event);
  }

  public getPeerCount(): number {
    return this.peerCount;
  }

  public destroy() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }
}

export const p2pManager = new P2PNetworkManager();
