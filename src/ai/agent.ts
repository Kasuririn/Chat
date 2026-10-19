/**
 * AegisCrypt AI Agent Integration
 * Connects client chat requests to the server-side Gemini API (/api/ai/chat)
 * and manages customizable personas and support utilities.
 */

import { AIPersona, Message } from '../types';

export const DEFAULT_PERSONAS: AIPersona[] = [
  {
    id: 'guardian',
    name: 'Guardián de Privacidad',
    avatar: '🛡️',
    tagline: 'Experto en criptografía, seguridad y buenas prácticas.',
    systemPrompt: `Eres el Guardián de Privacidad en AegisCrypt. Tu misión es educar, proteger y guiar a los usuarios en ciberseguridad, cifrado de extremo a extremo (E2EE), gestión de claves y privacidad digital. Sé profesional, claro, riguroso y conciso.`,
    temperature: 0.5,
  },
  {
    id: 'copilot',
    name: 'Copiloto Asistente',
    avatar: '🤖',
    tagline: 'Asistente general para redactar, resumir y organizar tareas.',
    systemPrompt: `Eres el Copiloto Asistente en AegisCrypt. Ayudas a los usuarios a responder mensajes difíciles, estructurar ideas, resumir charlas largas, resolver dudas generales y mejorar su productividad dentro del chat. Sé amigable, directo y proactivo.`,
    temperature: 0.7,
  },
  {
    id: 'translator',
    name: 'Traductor Seguro',
    avatar: '🌐',
    tagline: 'Traducción fluida y multilingüe preservando modismos.',
    systemPrompt: `Eres el Traductor Seguro en AegisCrypt. Tu especialidad es traducir mensajes con fidelidad de matices entre español, inglés, portugués, francés, alemán, chino, etc., y explicar posibles ambigüedades culturales.`,
    temperature: 0.3,
  },
  {
    id: 'analyst',
    name: 'Analista de Código & Datos',
    avatar: '⚡',
    tagline: 'Auditoría de scripts, snippets técnicos y lógica de datos.',
    systemPrompt: `Eres el Analista Técnico en AegisCrypt. Ayudas a los usuarios a inspeccionar fragmentos de código, formatear JSON, verificar errores sintácticos y explicar algoritmos criptográficos o de redes.`,
    temperature: 0.4,
  },
  {
    id: 'custom',
    name: 'Agente Personalizado',
    avatar: '✨',
    tagline: 'Configurado a la medida de tus necesidades.',
    systemPrompt: `Eres un asistente inteligente personal en una aplicación de mensajería privada. Actúa según las instrucciones configuradas por el usuario.`,
    temperature: 0.7,
  },
];

export async function askAIAgent(params: {
  message: string;
  history?: Message[];
  persona?: AIPersona;
  context?: string;
}): Promise<string> {
  const { message, history = [], persona, context } = params;

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: history.slice(-6).map((m) => ({
          text: m.text,
          senderName: m.senderName,
          isAi: m.isAi,
        })),
        systemInstruction: persona?.systemPrompt,
        personaName: persona?.name,
        context,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Error al comunicarse con el servidor');
    }

    return data.reply;
  } catch (err: any) {
    console.error('Error in askAIAgent:', err);
    return `⚠️ No se pudo obtener respuesta del agente de IA: ${err.message || 'Error de conexión'}. Verifica la conectividad o la configuración del servidor.`;
  }
}
