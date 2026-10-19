# AegisCrypt — Documentación Técnica de Arquitectura para Agentes de IA

Este documento (`AGENTS.md`) contiene la especificación técnica completa de **AegisCrypt**, las decisiones de diseño tomadas, su justificación arquitectónica, la estructura de código fuente y las directrices para que cualquier modelo de lenguaje (LLM) o ingeniero continúe desarrollando, extendiendo o auditando la aplicación.

---

## 1. Visión General del Proyecto

**AegisCrypt** es una aplicación web de mensajería privada con **cifrado de extremo a extremo (E2EE)**, arquitectura **Local-First / Serverless** (sin base de datos central de mensajes) y un **Agente de Asistencia con IA** potenciado por la API de Google Gemini (`gemini-3.8-flash`).

### Desafío Inicial del Usuario
El usuario planteó los siguientes requisitos clave:
1. Una aplicación de mensajería privada.
2. Un agente de IA integrado mediante API que apoye a los usuarios.
3. **Sin servidor central de persistencia**: El usuario no sabía cómo guardar los mensajes y archivos adjuntos sin una base de datos en la nube.
4. Una interfaz agradable, fluida y altamente personalizable.
5. Cifrado de extremo a extremo (E2EE) real.

---

## 2. Decisiones de Arquitectura y Justificación

### A. Persistencia de Datos sin Servidor: Modelo Local-First con IndexedDB
- **Problema**: ¿Dónde se guardan los mensajes, audios e imágenes si no hay un servidor backend con base de datos?
- **Decisión**: Implementar **IndexedDB** (`src/storage/db.ts`) como motor de base de datos principal en el dispositivo del cliente.
- **Por qué**:
  - `localStorage` tiene un límite estricto de ~5 MB, insuficiente para notas de voz o imágenes.
  - `IndexedDB` es transaccional, nativo en todos los navegadores modernos y permite almacenar cientos de megabytes o gigabytes de objetos estructurados y binarios (`Blob`, `ArrayBuffer`, DataURLs).
  - Almacena localmente las salas (`rooms`), mensajes (`messages`), archivos adjuntos (`attachments`) y preferencias del usuario (`settings`).
  - Ofrece máxima privacidad: los datos nunca abandonan el dispositivo del usuario sin cifrar.
  - Se implementó un sistema de **Exportar / Importar Copias de Seguridad Cifradas (`.json`)** para que el usuario pueda migrar sus chats entre dispositivos sin intermediarios.

### B. Cifrado de Extremo a Extremo (E2EE) con Web Crypto API
- **Decisión**: Utilizar la API estándar del navegador `window.crypto.subtle` en `src/crypto/e2ee.ts` en lugar de librerías externas de criptografía pesadas o inseguras.
- **Detalles Criptográficos**:
  - **Algoritmo**: `AES-GCM` (Galois/Counter Mode) con clave simétrica de **256 bits**.
  - **Autenticación e Integridad**: AES-GCM produce una etiqueta de autenticación (Auth Tag) de 128 bits que garantiza que los mensajes no puedan ser alterados en tránsito o en disco.
  - **Derivación de Clave (KDF)**: `PBKDF2` utilizando `SHA-256`, una sal criptográfica de 16 bytes generada aleatoriamente por mensaje (`crypto.getRandomValues`) y **100,000 iteraciones**.
  - **Vector de Inicialización (IV)**: 12 bytes (96 bits) únicos para cada mensaje cifrado.
  - **Código de Seguridad (Safety Numbers)**: Huella digital determinista de 30 dígitos formateada en 6 bloques de 5 números (estilo Signal) y matriz visual para verificar la autenticidad entre contactos.
  - **Inspector Criptográfico**: Permite a los usuarios inspeccionar visualmente el criptograma en Base64, el IV y el Salt para validar matemáticamente el cifrado.

### C. Red y Sincronización P2P en Tiempo Real
- **Decisión**: Arquitectura híbrida P2P en `src/network/p2p.ts`:
  1. **BroadcastChannel Mesh**: Utiliza el bus interno del navegador (`aegis_e2ee_bus_channel`). Esto permite que un usuario abra dos pestañas en paralelo (ej. "Alice" y "Bob") y experimente envío, recepción, descifrado y sonidos en tiempo real sin servidor.
  2. **Detección de Presencia**: Pings periódicos de presencia que calculan el número de pares conectados en línea.

### D. Agente de IA con API de Gemini
- **Decisión**: Implementar un servidor full-stack en Express (`server.ts`) con el SDK oficial `@google/genai` consumiendo el modelo `gemini-3.8-flash`.
- **Seguridad de la API Key**: La clave de API de Gemini (`process.env.GEMINI_API_KEY`) reside exclusivamente en el servidor backend; el frontend nunca tiene acceso a credenciales en texto plano.
- **Personalidades Predefinidas**:
  - Guardián de Privacidad (Ciberseguridad y buenas prácticas).
  - Copiloto Asistente (Redacción, síntesis y tareas).
  - Traductor Seguro (Traducciones multilingües contextuales).
  - Analista Técnico (Auditoría de código y datos).
  - Agente Personalizado (System Prompt y temperatura configurables por el usuario).
- **Invocación**:
  - Sala 1 a 1 dedicada al Asistente.
  - Mención `@IA` o `@asistente` en cualquier sala.
  - Acciones rápidas de "Resumir", "Traducir" o "Explicar" con un clic sobre cualquier mensaje.
- **Resiliencia & Fallback**: Si la conexión con Gemini se demora o la API no está configurada, el backend cuenta con un motor heurístico de privacidad local que responde de inmediato al usuario sin congelar la interfaz.

### E. Grabación y Reproducción de Audio sin Dependencias Externas
- **Decisión**: En `src/utils/audio.ts`:
  - **Sintetizador Web Audio API**: Genera sonidos de clic, pop de envío y campana de recepción usando osciladores (`OscillatorNode`) con envolventes de ganancia exponenciales, eliminando la necesidad de archivos de audio externos.
  - **MediaRecorder**: Graba notas de voz directamente desde el micrófono, genera el DataURL y mide la duración en segundos, permitiendo su almacenamiento cifrado en IndexedDB.

### F. Personalización Visual Avanzada (Anti-AI Slop)
- **Decisión**: Motor de temas dinámico en `src/utils/theme.ts`:
  - 5 Temas: Dark OLED, Esmeralda Sigiloso, Violeta Cósmico, Ámbar Cibernético y Luz Nórdica.
  - 3 Estilos de burbuja: Moderna (curvada), Afilada (angular) y Mínima.
  - 4 Patrones de fondo: Puntos (`bg-pattern-dots`), Malla (`bg-pattern-grid`), Cruces (`bg-pattern-crosses`) o Liso.
  - Control de escala tipográfica (chica, normal, grande) y toggle de efectos de sonido.

---

## 3. Estructura de Archivos y Componentes

```
.
├── AGENTS.md                                # Este archivo de documentación técnica
├── index.html                               # Punto de entrada HTML con meta tags y viewport
├── metadata.json                            # Metadatos del applet de AI Studio
├── package.json                             # Dependencias y scripts de ejecución
├── server.ts                                # Servidor Express con middleware Vite y API Gemini
├── tsconfig.json                            # Configuración TypeScript ES2022 / React-JSX
├── vite.config.ts                           # Configuración Vite con plugin React y Tailwind v4
└── src/
    ├── main.tsx                             # Montaje de la aplicación React
    ├── App.tsx                              # Componente raíz: orquestador de estado, P2P y modales
    ├── index.css                            # Estilos globales y utilidades de patrones de fondo
    ├── types/
    │   └── index.ts                         # Interfaces: Room, Message, Attachment, UserProfile, AIPersona
    ├── crypto/
    │   └── e2ee.ts                          # Web Crypto: AES-GCM 256, PBKDF2, Safety Numbers
    ├── storage/
    │   └── db.ts                            # Motor IndexedDB, export/import de copias JSON, wipe seguro
    ├── network/
    │   └── p2p.ts                           # Administrador de red P2P (BroadcastChannel y presencia)
    ├── ai/
    │   └── agent.ts                         # Cliente del Agente de IA, catálogo de personalidades
    ├── utils/
    │   ├── audio.ts                         # Sintetizador Web Audio API y grabador MediaRecorder
    │   └── theme.ts                         # Mapeo de paletas de color y estilos de temas
    └── components/
        ├── Sidebar.tsx                      # Barra lateral: búsqueda, lista de salas, perfil y accesos
        ├── ChatArea.tsx                     # Área de chat: mensajes, audios, fotos, menú de IA, input
        └── modals/
            ├── SecurityModal.tsx            # Clave de sala, código de seguridad (Safety Number) y matriz
            ├── AIConfigModal.tsx            # Selector de personalidades IA, prompt editor y test en vivo
            ├── CustomizationModal.tsx       # Temas visuales, burbujas, fondos, fuentes y sonido
            ├── StorageModal.tsx             # Métricas de IndexedDB, export/import de backup y wipe
            ├── CipherInspectorModal.tsx     # Inspector de datos cifrados (Ciphertext, IV, Salt)
            └── NewRoomModal.tsx             # Creador de salas directas, grupos, bóveda de notas o IA
```

---

## 4. Flujo de Datos y Ciclo de Vida

1. **Arranque (`App.tsx` -> `initializeDatabase`)**:
   - Abre o crea la base de datos `AegisPrivateDB_v1` en IndexedDB.
   - Si no existe perfil de usuario, crea uno anónimo con su huella criptográfica.
   - Si no existen salas, crea las 3 iniciales: *Asistente IA Seguro*, *Canal P2P (Red Segura)* y *Bóveda de Notas Personales*.
   - Conecta el bus de red P2P (`p2pManager.init`).

2. **Envío de un Mensaje**:
   - El usuario escribe texto o adjunta archivo/audio.
   - `encryptText` deriva la clave de la sala con `PBKDF2` y cifra los datos con `AES-GCM-256`.
   - Se guarda el registro en IndexedDB con su estado `sent`.
   - Se emite el evento `CHAT_MESSAGE` por `p2pManager.broadcastMessage`.
   - Si el mensaje contiene `@IA` o es la sala de la IA, se invoca automáticamente `handleTriggerAIResponse`.

3. **Recepción de Mensajes P2P**:
   - El listener de `p2pManager` intercepta el evento en la otra pestaña o peer.
   - Si la sala tiene configurada la clave compartida, ejecuta `decryptText`.
   - Se guarda el mensaje en IndexedDB y se reproduce el timbre suave con Web Audio.

---

## 5. Instrucciones para Ejecutar y Verificar

### Comandos de desarrollo:
```bash
# Iniciar servidor de desarrollo en puerto 3000
npm run dev

# Validar errores de tipos TypeScript
npm run lint

# Compilar para producción
npm run build
```

### Pruebas recomendadas para el siguiente LLM:
1. **Prueba P2P Multi-pestaña**:
   - Abrir la URL de la aplicación en dos pestañas del navegador en paralelo.
   - En la pestaña A, entrar en "Canal P2P" y enviar un mensaje.
   - Verificar que en la pestaña B el mensaje aparece instantáneamente y se descifra.
2. **Prueba de Notas de Voz**:
   - Pulsar el botón del micrófono, conceder permiso, hablar 3 segundos y pulsar "Enviar Audio".
   - Verificar la reproducción de la nota de voz y la animación de la onda de audio.
3. **Prueba de Invocación de IA**:
   - Enviar `@IA resume las ventajas del almacenamiento local`.
   - Verificar que el backend responde mediante la API de Gemini (o el fallback local) y agrega la respuesta como mensaje de IA.
4. **Prueba de Copia de Seguridad**:
   - Abrir el modal de *Almacenamiento Local* (icono de disco duro).
   - Descargar el archivo `.json`, verificar que contiene las salas y mensajes, y probar la restauración.

---

## 6. Hoja de Ruta para Futuras Mejoras (Next Steps)

Cualquier LLM que retome este proyecto puede expandirlo en las siguientes direcciones recomendadas:
- [ ] **WebRTC DataChannel con servidor STUN/TURN público**: Permitir conectar dispositivos en redes NAT distintas sin necesidad de estar en el mismo navegador/origen.
- [ ] **Protocolo Double Ratchet / Signal**: Agregar renovación continua de claves de sesión (Perfect Forward Secrecy) por cada mensaje individual.
- [ ] **Bloqueo Biométrico con WebAuthn**: Bloquear la bóveda local con FaceID, TouchID o PIN del dispositivo antes de cargar IndexedDB.
- [ ] **Destrucción Programada (Mensajes Efímeros)**: Temporizador configurable para que un mensaje se auto-elimine de IndexedDB tras ser leído (ej. 30 segundos, 1 hora, 24 horas).
- [ ] **Llamadas de Voz P2P Cifradas**: Aprovechar el `RTCPeerConnection` ya establecido para transmitir flujos de audio WebRTC punto a punto.
