import React, { useState } from 'react';
import { AIPersona } from '../../types';
import { DEFAULT_PERSONAS, askAIAgent } from '../../ai/agent';
import { Bot, Sparkles, Send, Check, X, Sliders, ShieldCheck } from 'lucide-react';

interface AIConfigModalProps {
  currentPersona: AIPersona;
  isOpen: boolean;
  onClose: () => void;
  onSavePersona: (persona: AIPersona) => void;
  themeStyles: any;
}

export const AIConfigModal: React.FC<AIConfigModalProps> = ({
  currentPersona,
  isOpen,
  onClose,
  onSavePersona,
  themeStyles,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(currentPersona.id || 'guardian');
  const [name, setName] = useState(currentPersona.name);
  const [avatar, setAvatar] = useState(currentPersona.avatar);
  const [tagline, setTagline] = useState(currentPersona.tagline);
  const [systemPrompt, setSystemPrompt] = useState(currentPersona.systemPrompt);
  const [temperature, setTemperature] = useState(currentPersona.temperature);

  // Test prompt state
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: AIPersona) => {
    setSelectedPresetId(preset.id);
    setName(preset.name);
    setAvatar(preset.avatar);
    setTagline(preset.tagline);
    setSystemPrompt(preset.systemPrompt);
    setTemperature(preset.temperature);
  };

  const handleSave = () => {
    onSavePersona({
      id: selectedPresetId,
      name,
      avatar,
      tagline,
      systemPrompt,
      temperature,
    });
    onClose();
  };

  const handleRunTest = async () => {
    if (!testInput.trim()) return;
    setIsTesting(true);
    setTestOutput('');
    try {
      const reply = await askAIAgent({
        message: testInput,
        persona: {
          id: selectedPresetId,
          name,
          avatar,
          tagline,
          systemPrompt,
          temperature,
        },
      });
      setTestOutput(reply);
    } catch (err: any) {
      setTestOutput(`Error: ${err.message || 'Fallo de conexión'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border ${themeStyles.cardBg} ${themeStyles.border} p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Configuración del Agente de IA
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Gemini 3.8 Flash API
              </span>
            </h3>
            <p className={`text-xs ${themeStyles.textSecondary}`}>
              Personaliza el rol, personalidad y comportamiento del copiloto inteligente.
            </p>
          </div>
        </div>

        {/* Presets Grid */}
        <div className="mb-6">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block">
            Seleccionar Personalidad Predefinida
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DEFAULT_PERSONAS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`flex items-start gap-3 p-3 text-left rounded-xl border transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-xs'
                      : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <span className="text-2xl shrink-0 p-1 bg-neutral-950/60 rounded-lg border border-neutral-800">
                    {preset.avatar}
                  </span>
                  <div className="grow min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white">{preset.name}</span>
                      {isSelected && <Check size={14} className="text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5">{preset.tagline}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Customization Details */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">
                Nombre del Agente
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">
                Emoji Avatar
              </label>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-800 text-white text-center focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 mb-1 block flex items-center justify-between">
              <span>Instrucción del Sistema (System Prompt)</span>
              <span className="text-[10px] text-neutral-500 font-normal">Define cómo responde el modelo</span>
            </label>
            <textarea
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Sliders size={13} className="text-indigo-400" />
                Temperatura (Creatividad vs Precisión):
              </label>
              <span className="text-xs font-mono text-indigo-400 font-semibold">{temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>0.0 (Preciso / Lógico)</span>
              <span>1.0 (Creativo / Variado)</span>
            </div>
          </div>
        </div>

        {/* Live Test Box */}
        <div className="mb-6 p-4 rounded-xl border border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-neutral-300">
            <Sparkles size={14} className="text-indigo-400" />
            Probar Agente en Vivo
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunTest()}
              placeholder="Escribe una pregunta de prueba (ej: ¿Qué es AES-GCM?)..."
              className="grow px-3 py-2 text-xs rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleRunTest}
              disabled={isTesting || !testInput.trim()}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {isTesting ? (
                <span className="animate-spin text-xs">🌀</span>
              ) : (
                <Send size={13} />
              )}
              Probar
            </button>
          </div>
          {testOutput && (
            <div className="mt-3 p-3 rounded-lg bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-200 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
              <strong className="text-indigo-400 block mb-1 font-mono text-[11px]">
                Respuesta de {name}:
              </strong>
              {testOutput}
            </div>
          )}
        </div>

        {/* Privacy Note */}
        <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
          <span>
            Las solicitudes al agente se procesan en tu backend seguro mediante la API oficial de Gemini. Puedes invocar al agente en cualquier chat escribiendo <strong>@IA</strong> o haciendo clic en el icono del bot.
          </span>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl text-neutral-400 hover:bg-neutral-800 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};
