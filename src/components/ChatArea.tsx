import React, { useState, useRef, useEffect } from 'react';
import { Room, Message, UserProfile, Attachment } from '../types';
import {
  Shield,
  ShieldCheck,
  Lock,
  Send,
  Paperclip,
  Mic,
  MicOff,
  Bot,
  Sparkles,
  FileText,
  Download,
  Play,
  Pause,
  Copy,
  Binary,
  Radio,
  X,
  Languages,
} from 'lucide-react';
import { VoiceRecorder } from '../utils/audio';

interface ChatAreaProps {
  room: Room;
  messages: Message[];
  onSendMessage: (text: string, attachment?: Attachment) => Promise<void>;
  onInvokeAI: (prompt: string, contextMessage?: Message) => Promise<void>;
  onOpenSecurityModal: () => void;
  onOpenCipherInspector: (message: Message) => void;
  isAiResponding: boolean;
  profile: UserProfile;
  themeStyles: any;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  room,
  messages,
  onSendMessage,
  onInvokeAI,
  onOpenSecurityModal,
  onOpenCipherInspector,
  isAiResponding,
  profile,
  themeStyles,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ file: File; dataUrl: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null);
  const recordTimerRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiResponding]);

  // Handle Voice Recording
  const handleStartRecording = async () => {
    try {
      if (!voiceRecorderRef.current) {
        voiceRecorderRef.current = new VoiceRecorder();
      }
      await voiceRecorderRef.current.start();
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      alert('No se pudo acceder al micrófono: ' + (err.message || 'Permiso denegado'));
    }
  };

  const handleStopAndSendRecording = async () => {
    if (!voiceRecorderRef.current || !isRecording) return;
    clearInterval(recordTimerRef.current);
    try {
      const { dataUrl, duration } = await voiceRecorderRef.current.stop();
      setIsRecording(false);

      const attachment: Attachment = {
        id: 'voice_' + Date.now(),
        name: `Nota de Voz (${duration}s)`,
        type: 'audio/webm',
        size: dataUrl.length,
        dataUrl,
        isVoiceNote: true,
        duration,
      };

      await onSendMessage('', attachment);
    } catch (e) {
      console.error('Error stopping recording:', e);
      setIsRecording(false);
    }
  };

  const handleCancelRecording = () => {
    if (voiceRecorderRef.current) {
      voiceRecorderRef.current.cancel();
    }
    clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setRecordSeconds(0);
  };

  // Play/Pause Audio voice note
  const togglePlayAudio = (id: string, dataUrl: string) => {
    if (playingAudioId === id) {
      currentAudioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      const audio = new Audio(dataUrl);
      currentAudioRef.current = audio;
      audio.onended = () => setPlayingAudioId(null);
      audio.play();
      setPlayingAudioId(id);
    }
  };

  // File picking
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        file,
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text && !selectedFile) return;

    let attachment: Attachment | undefined = undefined;
    if (selectedFile) {
      attachment = {
        id: 'file_' + Date.now(),
        name: selectedFile.file.name,
        type: selectedFile.file.type || 'application/octet-stream',
        size: selectedFile.file.size,
        dataUrl: selectedFile.dataUrl,
      };
    }

    setInputText('');
    setSelectedFile(null);

    await onSendMessage(text, attachment);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick AI Assistant Prompt
  const handleQuickAIPrompt = (action: 'summary' | 'translate' | 'explain', msg: Message) => {
    let prompt = '';
    if (action === 'summary') {
      prompt = `Por favor resume de manera concisa y clara este mensaje: "${msg.text}"`;
    } else if (action === 'translate') {
      prompt = `Traduce este mensaje al inglés y explica si hay modismos: "${msg.text}"`;
    } else if (action === 'explain') {
      prompt = `Analiza o explica técnicamente este mensaje: "${msg.text}"`;
    }
    onInvokeAI(prompt, msg);
  };

  // Apply Wallpaper Pattern
  const wallpaperClass =
    profile.chatWallpaper === 'dots'
      ? 'bg-pattern-dots'
      : profile.chatWallpaper === 'grid'
      ? 'bg-pattern-grid'
      : profile.chatWallpaper === 'crosses'
      ? 'bg-pattern-crosses'
      : '';

  return (
    <main className={`flex-1 flex flex-col h-full ${themeStyles.chatBg} relative select-text`}>
      {/* Header */}
      <header
        className={`px-5 py-3.5 border-b ${themeStyles.border} ${themeStyles.sidebarBg} flex items-center justify-between shrink-0 z-10 shadow-xs`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-center text-xl shrink-0 shadow-inner">
            {room.avatar || '💬'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white truncate">{room.name}</h2>
              {/* E2EE Lock badge */}
              <button
                onClick={onOpenSecurityModal}
                title="Inspeccionar Cifrado de la Sala (AES-GCM 256)"
                className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition shrink-0"
              >
                <Lock size={10} />
                <span>E2EE Verificado</span>
              </button>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5 truncate">
              {room.type === 'ai' ? (
                <span className="text-indigo-400 flex items-center gap-1">
                  <Bot size={12} />
                  Agente Gemini 3.8 Flash • Soporte Activo
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Almacenamiento Local (IndexedDB) • {room.isP2P ? 'P2P Directo' : 'Bóveda Privada'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Summon AI button */}
          <button
            onClick={() => {
              const prompt = window.prompt(
                'Escribe una consulta para el Agente de IA (ej: "¿Puedes resumirme este chat o darme sugerencias?"):',
                '¿Podrías darme un resumen de los puntos clave tratados en esta sala?'
              );
              if (prompt) onInvokeAI(prompt);
            }}
            title="Consultar al Agente de IA"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-indigo-950/40 border border-indigo-700/40 text-indigo-300 hover:bg-indigo-900/40 hover:text-white transition shadow-xs"
          >
            <Sparkles size={13} className="text-indigo-400" />
            <span>Consultar IA</span>
          </button>

          {/* Security & Key button */}
          <button
            onClick={onOpenSecurityModal}
            title="Seguridad y Clave Secreta"
            className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
          >
            <ShieldCheck size={18} className="text-emerald-400" />
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className={`grow overflow-y-auto p-4 md:p-6 space-y-4 ${wallpaperClass}`}>
        {/* Intro banner */}
        <div className="mx-auto max-w-md p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 text-center shadow-sm">
          <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Lock size={16} />
          </div>
          <h4 className="text-xs font-semibold text-white">Canal Cifrado de Extremo a Extremo</h4>
          <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
            Los mensajes y archivos se cifran localmente con AES-GCM (256 bits). La clave de esta sala se almacena solo en tu dispositivo dentro de IndexedDB.
          </p>
          <div className="mt-2.5 flex items-center justify-center gap-2 text-[10px] text-emerald-400/80 font-mono">
            <span>Huella: {room.safetyNumber?.slice(0, 17)}...</span>
          </div>
        </div>

        {/* Message Items */}
        {messages.map((msg) => {
          const isSelf = msg.isSelf || msg.senderId === profile.id;
          const isAi = msg.isAi;

          // Bubble styling
          let bubbleShape = 'rounded-2xl';
          if (profile.bubbleStyle === 'sharp') bubbleShape = 'rounded-md';
          else if (profile.bubbleStyle === 'minimal') bubbleShape = 'rounded-sm';

          return (
            <div
              key={msg.id}
              className={`group flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-full`}
            >
              {/* Sender Name */}
              {!isSelf && (
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-semibold text-neutral-300">
                    {msg.senderName}
                  </span>
                  {isAi && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                      <Bot size={10} />
                      IA
                    </span>
                  )}
                </div>
              )}

              {/* Message Bubble Container */}
              <div className="relative max-w-[85%] md:max-w-[70%]">
                <div
                  className={`p-3.5 shadow-sm text-xs leading-relaxed ${bubbleShape} ${
                    isSelf
                      ? themeStyles.bubbleSelf
                      : isAi
                      ? 'bg-indigo-950/70 text-indigo-100 border border-indigo-800/40 shadow-indigo-950/20'
                      : themeStyles.bubblePeer
                  }`}
                >
                  {/* Text */}
                  {msg.text && (
                    <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                  )}

                  {/* Attachment - Voice Note */}
                  {msg.attachment?.isVoiceNote && (
                    <div className="mt-2 flex items-center gap-3 p-2.5 rounded-xl bg-black/25 border border-white/10">
                      <button
                        onClick={() => togglePlayAudio(msg.id, msg.attachment!.dataUrl)}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition shrink-0"
                      >
                        {playingAudioId === msg.id ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <div className="grow">
                        <div className="flex items-center gap-0.5 h-6">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-1 rounded-full transition-all ${
                                playingAudioId === msg.id
                                  ? 'bg-emerald-400 animate-pulse'
                                  : 'bg-white/40'
                              }`}
                              style={{
                                height: `${Math.max(4, Math.sin(i * 0.5) * 18 + 8)}px`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono opacity-80 shrink-0">
                        {msg.attachment.duration || 3}s
                      </span>
                    </div>
                  )}

                  {/* Attachment - Image */}
                  {msg.attachment && msg.attachment.type.startsWith('image/') && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-white/10 max-w-sm">
                      <img
                        src={msg.attachment.dataUrl}
                        alt={msg.attachment.name}
                        onClick={() => setSelectedImageModal(msg.attachment!.dataUrl)}
                        className="w-full max-h-60 object-cover cursor-pointer hover:opacity-90 transition"
                      />
                      <div className="p-1.5 bg-black/40 text-[10px] text-white/80 flex items-center justify-between">
                        <span className="truncate max-w-[200px]">{msg.attachment.name}</span>
                        <a
                          href={msg.attachment.dataUrl}
                          download={msg.attachment.name}
                          className="hover:text-emerald-400"
                        >
                          <Download size={12} />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Attachment - File / Document */}
                  {msg.attachment &&
                    !msg.attachment.isVoiceNote &&
                    !msg.attachment.type.startsWith('image/') && (
                      <div className="mt-2 flex items-center gap-2.5 p-2.5 rounded-xl bg-black/25 border border-white/10">
                        <FileText size={20} className="shrink-0 text-white/80" />
                        <div className="grow min-w-0">
                          <span className="font-semibold block truncate text-[11px]">
                            {msg.attachment.name}
                          </span>
                          <span className="text-[9px] opacity-70">
                            {(msg.attachment.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <a
                          href={msg.attachment.dataUrl}
                          download={msg.attachment.name}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition shrink-0"
                        >
                          <Download size={13} />
                        </a>
                      </div>
                    )}

                  {/* Timestamp & Encrypted badge */}
                  <div
                    className={`flex items-center gap-1.5 justify-end mt-1 text-[9px] opacity-70 font-mono`}
                  >
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span title="Cifrado con AES-GCM 256 bits">
                      <Lock size={9} />
                    </span>
                  </div>
                </div>

                {/* Hover Action Menu */}
                <div
                  className={`opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 ${
                    isSelf ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'
                  } flex items-center gap-1 bg-neutral-900/90 border border-neutral-700/60 rounded-lg p-1 shadow-md z-10`}
                >
                  <button
                    onClick={() => onOpenCipherInspector(msg)}
                    title="Inspeccionar Cifrado (IV / Ciphertext)"
                    className="p-1 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 rounded transition"
                  >
                    <Binary size={12} />
                  </button>
                  {msg.text && (
                    <>
                      <button
                        onClick={() => handleQuickAIPrompt('summary', msg)}
                        title="Resumir con IA"
                        className="p-1 text-neutral-400 hover:text-indigo-400 hover:bg-neutral-800 rounded transition"
                      >
                        <Bot size={12} />
                      </button>
                      <button
                        onClick={() => handleQuickAIPrompt('translate', msg)}
                        title="Traducir con IA"
                        className="p-1 text-neutral-400 hover:text-indigo-400 hover:bg-neutral-800 rounded transition"
                      >
                        <Languages size={12} />
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(msg.text)}
                        title="Copiar texto"
                        className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition"
                      >
                        <Copy size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isAiResponding && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-900/40 max-w-xs text-xs text-indigo-300">
            <span className="animate-spin text-sm">🌀</span>
            <span>El Agente de IA está analizando y respondiendo...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selected File Preview Banner */}
      {selectedFile && (
        <div className="px-4 py-2 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-neutral-200">
            <Paperclip size={14} className="text-emerald-400" />
            <span className="font-semibold">{selectedFile.file.name}</span>
            <span className="text-[11px] text-neutral-500">
              ({(selectedFile.file.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input Area */}
      <footer className={`p-3 md:p-4 border-t ${themeStyles.border} ${themeStyles.sidebarBg}`}>
        {isRecording ? (
          /* Active Voice Recording Bar */
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-red-950/30 border border-red-800/40 animate-pulse">
            <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span>Grabando Nota de Voz Cifrada... {recordSeconds}s</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelRecording}
                className="px-3 py-1.5 text-xs rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleStopAndSendRecording}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 shadow-sm transition"
              >
                <Send size={13} />
                Enviar Audio
              </button>
            </div>
          </div>
        ) : (
          /* Normal Message Input Bar */
          <div className="flex items-end gap-2">
            {/* Attachment Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Adjuntar archivo o imagen cifrada"
              className="p-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition shrink-0"
            >
              <Paperclip size={18} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Quick @IA button */}
            <button
              onClick={() => {
                setInputText((prev) => (prev ? prev + ' @IA ' : '@IA '));
              }}
              title="Invocar @IA en este mensaje"
              className="hidden sm:flex items-center gap-1 px-2.5 py-2 rounded-xl bg-indigo-950/40 border border-indigo-800/50 hover:bg-indigo-900/50 text-indigo-300 text-xs font-medium transition shrink-0"
            >
              <Bot size={14} className="text-indigo-400" />
              <span>@IA</span>
            </button>

            {/* Textarea Input */}
            <div className="grow relative">
              <textarea
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  room.type === 'ai'
                    ? 'Escribe tu consulta para el Asistente de IA...'
                    : 'Mensaje cifrado... (Escribe @IA para consultar al agente)'
                }
                className="w-full max-h-32 px-4 py-2.5 text-xs rounded-2xl bg-neutral-900/90 border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60 transition resize-none leading-relaxed"
              />
            </div>

            {/* Voice Recorder Button */}
            <button
              onClick={handleStartRecording}
              title="Grabar nota de voz cifrada"
              className="p-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition shrink-0"
            >
              <Mic size={18} />
            </button>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!inputText.trim() && !selectedFile}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-40 disabled:hover:bg-emerald-600 shrink-0 shadow-sm"
            >
              <Send size={18} />
            </button>
          </div>
        )}
      </footer>

      {/* Fullscreen Image Lightbox Modal */}
      {selectedImageModal && (
        <div
          onClick={() => setSelectedImageModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
        >
          <img
            src={selectedImageModal}
            alt="Ampliación"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </main>
  );
};
