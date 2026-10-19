/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Room, Message, UserProfile, AIPersona, Attachment } from './types';
import {
  initializeDatabase,
  getAllRooms,
  getMessagesByRoom,
  saveMessage,
  saveRoom,
  deleteRoom,
  setSetting,
  getSetting,
} from './storage/db';
import { encryptText, decryptText, generateSafetyNumber } from './crypto/e2ee';
import { p2pManager } from './network/p2p';
import { DEFAULT_PERSONAS, askAIAgent } from './ai/agent';
import { sound } from './utils/audio';
import { getThemeStyles } from './utils/theme';

import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SecurityModal } from './components/modals/SecurityModal';
import { AIConfigModal } from './components/modals/AIConfigModal';
import { CustomizationModal } from './components/modals/CustomizationModal';
import { StorageModal } from './components/modals/StorageModal';
import { CipherInspectorModal } from './components/modals/CipherInspectorModal';
import { NewRoomModal } from './components/modals/NewRoomModal';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiPersona, setAiPersona] = useState<AIPersona>(DEFAULT_PERSONAS[0]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [peerCount, setPeerCount] = useState(0);

  // Modals state
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isAIConfigModalOpen, setIsAIConfigModalOpen] = useState(false);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isNewRoomModalOpen, setIsNewRoomModalOpen] = useState(false);
  const [inspectorMessage, setInspectorMessage] = useState<Message | null>(null);

  // Mobile sidebar toggle
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Initialize DB and Profile
  const loadInitialData = useCallback(async () => {
    try {
      const { profile: loadedProfile, rooms: loadedRooms } = await initializeDatabase();
      setProfile(loadedProfile);
      setRooms(loadedRooms);

      // Load AI Persona
      const savedPersona = await getSetting<AIPersona>('ai_persona');
      if (savedPersona) {
        setAiPersona(savedPersona);
      }

      // Default active room
      if (loadedRooms.length > 0) {
        setActiveRoomId(loadedRooms[0].id);
      }

      // Init P2P network
      p2pManager.init(loadedProfile.id, loadedProfile.name);
    } catch (err) {
      console.error('Error initializing app database:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load messages whenever activeRoomId changes
  useEffect(() => {
    if (!activeRoomId) return;
    getMessagesByRoom(activeRoomId).then((msgs) => {
      setMessages(msgs);
    });
  }, [activeRoomId]);

  // P2P Event Listener
  useEffect(() => {
    const unsubscribe = p2pManager.subscribe(async (event) => {
      if (event.type === 'CHAT_MESSAGE' && event.payload) {
        const incomingMsg: Message = event.payload;

        // Check if message belongs to one of user's rooms
        const currentRooms = await getAllRooms();
        const room = currentRooms.find((r) => r.id === event.roomId);

        if (room) {
          if (incomingMsg.encryptedPayload && incomingMsg.encryptedPayload.salt && room.secretPassphrase) {
            try {
              incomingMsg.text = await decryptText(
                {
                  ciphertext: incomingMsg.encryptedPayload.ciphertext,
                  iv: incomingMsg.encryptedPayload.iv,
                  salt: incomingMsg.encryptedPayload.salt,
                },
                room.secretPassphrase
              );
            } catch (decErr) {
              console.warn('Could not decrypt incoming message with local key:', decErr);
            }
          }

          // Save locally in IndexedDB
          await saveMessage(incomingMsg);

          // Update messages state if currently viewing this room
          if (event.roomId === activeRoomId) {
            setMessages((prev) => [...prev, incomingMsg]);
          }

          // Update room list
          const updatedRooms = await getAllRooms();
          setRooms(updatedRooms);

          // Play sound chime if sound enabled
          if (profile?.soundEnabled) {
            sound.playReceive();
          }
        }
      }

      // Update peer counter
      setPeerCount(p2pManager.getPeerCount());
    });

    return () => {
      unsubscribe();
    };
  }, [activeRoomId, profile]);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0];
  const themeStyles = getThemeStyles(profile?.theme || 'cyber-dark');

  // Send Message Handler
  const handleSendMessage = async (text: string, attachment?: Attachment) => {
    if (!activeRoom || !profile) return;

    const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const passphrase = activeRoom.secretPassphrase || 'aegis-fallback-pass';

    // Encrypt payload with AES-GCM
    let encryptedPayload = undefined;
    try {
      encryptedPayload = await encryptText(text || (attachment?.name || ''), passphrase);
    } catch (e) {
      console.error('Encryption error:', e);
    }

    const newMessage: Message = {
      id: msgId,
      roomId: activeRoom.id,
      senderId: profile.id,
      senderName: profile.name,
      text,
      timestamp: Date.now(),
      isSelf: true,
      attachment,
      encryptedPayload,
      status: 'sent',
    };

    // Save locally
    await saveMessage(newMessage);
    setMessages((prev) => [...prev, newMessage]);

    // Update rooms list
    const updatedRooms = await getAllRooms();
    setRooms(updatedRooms);

    // Broadcast over P2P mesh
    p2pManager.broadcastMessage(activeRoom.id, newMessage);

    // Audio cue
    if (profile.soundEnabled) {
      sound.playSend();
    }

    // Trigger AI response if room is AI type OR text mentions @IA
    const isAiChat = activeRoom.type === 'ai';
    const hasAiMention = /@(ia|ai|asistente)/i.test(text);

    if (isAiChat || hasAiMention) {
      handleTriggerAIResponse(text, activeRoom, newMessage);
    }
  };

  // AI Response Generator
  const handleTriggerAIResponse = async (
    prompt: string,
    targetRoom: Room,
    triggeringMessage?: Message
  ) => {
    setIsAiResponding(true);
    try {
      // Clean prompt of mention
      const cleanPrompt = prompt.replace(/@(ia|ai|asistente)/gi, '').trim() || prompt;

      const aiReplyText = await askAIAgent({
        message: cleanPrompt,
        history: messages,
        persona: aiPersona,
        context: triggeringMessage?.attachment ? `El usuario adjuntó un archivo: ${triggeringMessage.attachment.name}` : undefined,
      });

      const aiMsgId = 'msg_ai_' + Date.now();
      const passphrase = targetRoom.secretPassphrase || 'aegis-fallback-pass';
      const encryptedPayload = await encryptText(aiReplyText, passphrase);

      const aiMessage: Message = {
        id: aiMsgId,
        roomId: targetRoom.id,
        senderId: 'ai_copilot',
        senderName: aiPersona.name,
        text: aiReplyText,
        timestamp: Date.now(),
        isAi: true,
        encryptedPayload,
        status: 'delivered',
      };

      await saveMessage(aiMessage);

      if (targetRoom.id === activeRoomId) {
        setMessages((prev) => [...prev, aiMessage]);
      }

      const updatedRooms = await getAllRooms();
      setRooms(updatedRooms);

      if (profile?.soundEnabled) {
        sound.playReceive();
      }
    } catch (err) {
      console.error('Error invoking AI:', err);
    } finally {
      setIsAiResponding(false);
    }
  };

  // Direct Invoke AI prompt
  const handleInvokeAI = async (prompt: string, contextMessage?: Message) => {
    if (!activeRoom) return;
    await handleTriggerAIResponse(prompt, activeRoom, contextMessage);
  };

  // Passphrase update for room
  const handleUpdateRoomPassphrase = async (newPassphrase: string) => {
    if (!activeRoom) return;
    const safety = await generateSafetyNumber(newPassphrase, activeRoom.id);
    const updated: Room = {
      ...activeRoom,
      secretPassphrase: newPassphrase,
      safetyNumber: safety,
      updatedAt: Date.now(),
    };
    await saveRoom(updated);
    const all = await getAllRooms();
    setRooms(all);
  };

  // Create Room
  const handleCreateRoom = async (newRoom: Room) => {
    await saveRoom(newRoom);
    const all = await getAllRooms();
    setRooms(all);
    setActiveRoomId(newRoom.id);
  };

  // Delete Room
  const handleDeleteRoom = async (roomId: string) => {
    await deleteRoom(roomId);
    const all = await getAllRooms();
    setRooms(all);
    if (activeRoomId === roomId && all.length > 0) {
      setActiveRoomId(all[0].id);
    }
  };

  // Update Profile
  const handleUpdateProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    await setSetting('user_profile', newProfile);
  };

  // Save AI Persona
  const handleSaveAIPersona = async (newPersona: AIPersona) => {
    setAiPersona(newPersona);
    await setSetting('ai_persona', newPersona);
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-white">
        <div className="flex items-center gap-3">
          <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-mono">Iniciando bóveda criptográfica local...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden ${themeStyles.appBg} ${themeStyles.textPrimary} font-sans antialiased`}
    >
      {/* Mobile Sidebar Toggle Button */}
      <button
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        className="md:hidden fixed top-3 left-3 z-30 p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white shadow-lg"
      >
        <span className="text-base">{isMobileSidebarOpen ? '✕' : '☰'}</span>
      </button>

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <div
        className={`${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } fixed md:static inset-y-0 left-0 z-20 transition-transform duration-200 ease-in-out md:flex`}
      >
        <Sidebar
          rooms={rooms}
          activeRoomId={activeRoomId}
          onSelectRoom={(id) => {
            setActiveRoomId(id);
            setIsMobileSidebarOpen(false);
          }}
          onOpenNewRoomModal={() => setIsNewRoomModalOpen(true)}
          onOpenCustomizationModal={() => setIsCustomizationModalOpen(true)}
          onOpenStorageModal={() => setIsStorageModalOpen(true)}
          onOpenAIConfigModal={() => setIsAIConfigModalOpen(true)}
          onDeleteRoom={handleDeleteRoom}
          profile={profile}
          peerCount={peerCount}
          themeStyles={themeStyles}
        />
      </div>

      {/* Main Chat Area */}
      {activeRoom ? (
        <ChatArea
          room={activeRoom}
          messages={messages}
          onSendMessage={handleSendMessage}
          onInvokeAI={handleInvokeAI}
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
          onOpenCipherInspector={(msg) => setInspectorMessage(msg)}
          isAiResponding={isAiResponding}
          profile={profile}
          themeStyles={themeStyles}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
          Selecciona o crea una sala para comenzar a chatear con cifrado E2EE.
        </div>
      )}

      {/* Modals */}
      {activeRoom && (
        <SecurityModal
          room={activeRoom}
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
          onUpdatePassphrase={handleUpdateRoomPassphrase}
          themeStyles={themeStyles}
        />
      )}

      <AIConfigModal
        currentPersona={aiPersona}
        isOpen={isAIConfigModalOpen}
        onClose={() => setIsAIConfigModalOpen(false)}
        onSavePersona={handleSaveAIPersona}
        themeStyles={themeStyles}
      />

      <CustomizationModal
        profile={profile}
        isOpen={isCustomizationModalOpen}
        onClose={() => setIsCustomizationModalOpen(false)}
        onUpdateProfile={handleUpdateProfile}
        themeStyles={themeStyles}
      />

      <StorageModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        onDataReset={loadInitialData}
        themeStyles={themeStyles}
      />

      <CipherInspectorModal
        message={inspectorMessage}
        isOpen={!!inspectorMessage}
        onClose={() => setInspectorMessage(null)}
        themeStyles={themeStyles}
      />

      <NewRoomModal
        isOpen={isNewRoomModalOpen}
        onClose={() => setIsNewRoomModalOpen(false)}
        onCreateRoom={handleCreateRoom}
        themeStyles={themeStyles}
      />
    </div>
  );
}
