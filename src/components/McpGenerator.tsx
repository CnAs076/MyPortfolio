import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import yaml from 'js-yaml';

const BACKEND_URL = 'https://api.cdev76.com';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const translations = {
  es: {
    description: 'Escribe tu especificación AsyncAPI a la izquierda y visualiza la arquitectura generada en tiempo real a la derecha.',
    selectEnv: 'Selecciona Entorno:',
    generateBtn: 'Generar y Descargar .ZIP',
    processing: 'Procesando...',
    editorTitle: 'Editor YAML (AsyncAPI 3.0.0)',
    previewTitle: 'Vista Previa de la Arquitectura',
    openStudio: 'Abrir Studio',
    loadingPreview: 'Cargando visualización...',
    chatTitle: 'Asistente AsyncAPI',
    chatPlaceholder: 'Escribe tu petición... (Enter para enviar)',
    chatHint: 'Shift+Enter para nueva línea · Enter para enviar',
    apply: 'Aplicar',
    applyAlways: 'Aplicar siempre',
    reject: 'Rechazar',
    locked: 'Acceso restringido',
    lockedDesc: 'El asistente de IA y el generador de servidores MCP requieren un código de acceso.',
    contactText: 'Si quieres probarlo,',
    contactLink: 'ponte en contacto conmigo',
    contactSuffix: 'y te envío el código.',
    contactHref: '/es/contacto',
    accessPlaceholder: 'Código de acceso',
    wrongCode: 'Código incorrecto. Inténtalo de nuevo.',
    connectionError: 'No se pudo conectar con el servidor.',
    verifying: 'Verificando...',
    unlock: 'Desbloquear',
    streamingError: 'Error al conectar con el asistente:',
    initialMessage: '¡Hola! Soy tu asistente de AsyncAPI 3.0. Puedo ayudarte a generar y modificar tu especificación YAML. ¿Qué necesitas?',
  },
  en: {
    description: 'Write your AsyncAPI specification on the left and visualize the generated architecture in real time on the right.',
    selectEnv: 'Select Environment:',
    generateBtn: 'Generate & Download .ZIP',
    processing: 'Processing...',
    editorTitle: 'YAML Editor (AsyncAPI 3.0.0)',
    previewTitle: 'Architecture Preview',
    openStudio: 'Open Studio',
    loadingPreview: 'Loading visualization...',
    chatTitle: 'AsyncAPI Assistant',
    chatPlaceholder: 'Type your request... (Enter to send)',
    chatHint: 'Shift+Enter for new line · Enter to send',
    apply: 'Apply',
    applyAlways: 'Apply always',
    reject: 'Reject',
    locked: 'Restricted access',
    lockedDesc: 'The AI assistant and the MCP server generator require an access code.',
    contactText: 'If you want to try it,',
    contactLink: 'get in touch with me',
    contactSuffix: "and I'll send you the code.",
    contactHref: '/en/contact',
    accessPlaceholder: 'Access code',
    wrongCode: 'Incorrect code. Please try again.',
    connectionError: 'Could not connect to the server.',
    verifying: 'Verifying...',
    unlock: 'Unlock',
    streamingError: 'Error connecting to the assistant:',
    initialMessage: "Hello! I'm your AsyncAPI 3.0 assistant. I can help you generate and modify your YAML specification. What do you need?",
  },
};

function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(```yaml[\s\S]*?```)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```yaml')) {
          const yamlContent = part.replace(/^```yaml\n?/, '').replace(/\n?```$/, '');
          return (
            <div key={i} className="mt-2 rounded-lg bg-slate-900 border border-slate-600 overflow-hidden">
              <div className="flex items-center px-3 py-1.5 bg-slate-800 border-b border-slate-600">
                <span className="text-xs text-slate-400 font-mono">asyncapi.yaml</span>
              </div>
              <pre className="text-xs text-green-300 p-3 overflow-x-auto font-mono leading-relaxed">{yamlContent}</pre>
            </div>
          );
        }
        return part ? <span key={i} className="whitespace-pre-wrap">{part}</span> : null;
      })}
    </>
  );
}

export default function McpGenerator() {
  const isEnglish = typeof window !== 'undefined' && window.location.pathname.startsWith('/en/');
  const t = isEnglish ? translations.en : translations.es;

  const defaultYaml = `asyncapi: 3.0.0
info:
  title: Sistema de Gestión de Usuarios
  version: 1.0.0
servers:
  produccion:
    host: kafka.miempresa.com:9092
    protocol: kafka
    description: Cluster de Kafka de Producción
  desarrollo:
    host: localhost:9092
    protocol: kafka
    description: Broker local para pruebas
channels:
  usuarios.registrados:
    address: usuarios
    messages:
      userSignup:
        payload:
          type: object
          properties:
            id:
              type: integer
operations:
  registrarUsuario:
    action: send
    channel:
      $ref: '#/channels/usuarios.registrados'`;

  const [code, setCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mcp_yaml_backup');
      if (saved) return saved;
    }
    return defaultYaml;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [availableServers, setAvailableServers] = useState<string[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: t.initialMessage }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatStreaming, setIsChatStreaming] = useState(false);
  const [pendingYaml, setPendingYaml] = useState<string | null>(null);
  const autoApplyRef = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const savedScrollRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auth state
  const [chatUnlocked, setChatUnlocked] = useState(() =>
    typeof window !== 'undefined' && !!localStorage.getItem('mcp_access_token')
  );
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const accessCodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const parsedDoc = yaml.load(code) as any;
      if (parsedDoc && typeof parsedDoc === 'object' && parsedDoc.servers) {
        const serverNames = Object.keys(parsedDoc.servers);
        setAvailableServers(serverNames);
        if (serverNames.length > 0 && !serverNames.includes(selectedServer)) {
          setSelectedServer(serverNames[0]);
        }
      } else {
        setAvailableServers([]);
        setSelectedServer('');
      }
    } catch (e) {
      // ignore parse errors while typing
    }
  }, [code, selectedServer]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mcp_yaml_backup', code);
    }
    const timer = setTimeout(() => {
      try {
        const base64Code = btoa(encodeURIComponent(code).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
        setPreviewUrl(`https://studio.asyncapi.com/?base64=${base64Code}&readOnly=true&hidesidewide=true`);
      } catch (e) {
        console.error('Error encoding YAML:', e);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [code]);

  const handleChatScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;
    savedScrollRef.current = container.scrollTop;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    isAtBottomRef.current = distanceFromBottom <= 60;
  };

  useEffect(() => {
    if (isAtBottomRef.current) {
      const container = chatContainerRef.current;
      if (container) container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => {
        if (chatUnlocked) {
          inputRef.current?.focus();
          const container = chatContainerRef.current;
          if (container) {
            container.scrollTop = savedScrollRef.current ?? container.scrollHeight;
          }
        } else {
          accessCodeRef.current?.focus();
        }
      }, 100);
    }
  }, [chatOpen, chatUnlocked]);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mcp_access_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleUnauthorized = () => {
    localStorage.removeItem('mcp_access_token');
    setChatUnlocked(false);
    setChatOpen(true);
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accessCodeInput.trim()) return;
    setIsAuthenticating(true);
    setAuthError('');
    try {
      const res = await fetch(`${BACKEND_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: accessCodeInput.trim() }),
      });
      if (res.ok) {
        localStorage.setItem('mcp_access_token', accessCodeInput.trim());
        setChatUnlocked(true);
        setAccessCodeInput('');
      } else {
        setAuthError(t.wrongCode);
      }
    } catch {
      setAuthError(t.connectionError);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGenerate = async () => {
    if (!code) return;
    if (!localStorage.getItem('mcp_access_token')) {
      handleUnauthorized();
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ yaml_content: code, server: selectedServer || '' }),
      });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mcp-server-${selectedServer || 'project'}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Generate error:', error);
      alert(`Error: ${error instanceof Error ? error.message : t.connectionError}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || isChatStreaming) return;

    const userMsg: ChatMessage = { role: 'user', content: chatInput.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages([...updatedMessages, { role: 'assistant', content: '' }]);
    setChatInput('');
    isAtBottomRef.current = true;
    setIsChatStreaming(true);

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          yaml_content: code,
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) throw new Error('Chat error');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              accumulatedContent += parsed.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + parsed.text,
                };
                return updated;
              });
            }
          } catch { /* ignore malformed lines */ }
        }
      }

      const yamlBlocks = accumulatedContent.match(/```yaml\n?([\s\S]*?)```/g);
      if (yamlBlocks && yamlBlocks.length > 0) {
        const lastYaml = yamlBlocks[yamlBlocks.length - 1]
          .replace(/^```yaml\n?/, '').replace(/\n?```$/, '');
        if (autoApplyRef.current) {
          setCode(lastYaml);
        } else {
          setPendingYaml(lastYaml);
        }
      }
    } catch (error) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: `${t.streamingError} ${error instanceof Error ? error.message : 'unknown error'}`,
        };
        return updated;
      });
    } finally {
      setIsChatStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-0">

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10 pb-6 border-b border-slate-700/50">
        <div className="flex-1">
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">{t.description}</p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-start lg:items-center gap-4 w-full lg:w-auto">
          {availableServers.length > 0 && (
            <div className="flex flex-col gap-1.5 w-full sm:w-auto max-w-full">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">{t.selectEnv}</span>
              <div className="flex overflow-x-auto bg-slate-800/80 rounded-xl p-1 border border-slate-700 shadow-inner max-w-full">
                {availableServers.map(srv => (
                  <button
                    key={srv}
                    onClick={() => setSelectedServer(srv)}
                    className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      selectedServer === srv
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {srv}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className={`py-3.5 px-8 rounded-xl font-bold text-white transition-all duration-200 flex justify-center items-center shadow-lg whitespace-nowrap text-lg sm:mt-6 w-full sm:w-auto
              ${isLoading
                ? 'bg-blue-600/50 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/30'}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t.processing}
              </span>
            ) : t.generateBtn}
          </button>
        </div>
      </div>

      {/* Editor + Preview grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[700px]">

        {/* Monaco Editor */}
        <div className="rounded-2xl overflow-hidden border border-slate-700 h-full flex flex-col bg-slate-950 shadow-2xl">
          <div className="bg-slate-800 text-xs text-slate-300 px-5 py-3.5 border-b border-slate-700 uppercase font-semibold flex justify-between tracking-wider">
            <span>{t.editorTitle}</span>
            <span className="text-blue-400 font-mono">.yaml</span>
          </div>
          <div className="flex-grow pt-2 bg-slate-950">
            <Editor
              height="100%"
              defaultLanguage="yaml"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 15,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                padding: { top: 16 },
              }}
            />
          </div>
        </div>

        {/* Preview iframe */}
        <div className="rounded-2xl border border-slate-700 h-full flex flex-col bg-white overflow-hidden shadow-2xl">
          <div className="bg-slate-100 text-xs text-slate-700 px-5 py-3.5 border-b border-slate-300 uppercase font-bold flex justify-between items-center tracking-wider">
            <span>{t.previewTitle}</span>
            {previewUrl && (
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors font-semibold">
                {t.openStudio}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            )}
          </div>
          <div className="flex-grow">
            {previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full border-none"
                title="AsyncAPI Preview"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 bg-white text-lg">
                <span className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t.loadingPreview}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Floating chat button */}
      <button
        onClick={() => setChatOpen(true)}
        title={t.chatTitle}
        className="fixed bottom-6 right-6 z-40 will-change-transform w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-blue-500/40"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
      </button>

      {/* Chat drawer */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setChatOpen(false)}
          />

          <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-700 flex flex-col shadow-2xl animate-slide-in-right">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{t.chatTitle}</p>
                  <p className="text-xs text-slate-400">Powered by DeepSeek</p>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {!chatUnlocked ? (
              /* Lock screen */
              <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
                <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-lg">{t.locked}</p>
                  <p className="text-slate-400 text-sm mt-2 leading-relaxed">{t.lockedDesc}</p>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                    {t.contactText}{' '}
                    <a href={t.contactHref} className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
                      {t.contactLink}
                    </a>
                    {' '}{t.contactSuffix}
                  </p>
                </div>
                <form onSubmit={handleAuth} className="w-full flex flex-col gap-3">
                  <input
                    ref={accessCodeRef}
                    type="password"
                    value={accessCodeInput}
                    onChange={e => { setAccessCodeInput(e.target.value); setAuthError(''); }}
                    placeholder={t.accessPlaceholder}
                    autoComplete="off"
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-center tracking-widest"
                  />
                  {authError && (
                    <p className="text-red-400 text-xs text-center">{authError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isAuthenticating || !accessCodeInput.trim()}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {isAuthenticating ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t.verifying}
                      </>
                    ) : t.unlock}
                  </button>
                </form>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div ref={chatContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
                      }`}>
                        {msg.role === 'assistant' ? (
                          msg.content === '' && isChatStreaming ? (
                            <span className="flex items-center gap-1.5 text-slate-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </span>
                          ) : (
                            <MessageContent content={msg.content} />
                          )
                        ) : (
                          <span className="whitespace-pre-wrap">{msg.content}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pending YAML action bar */}
                {pendingYaml && (
                  <div className="px-4 py-3 bg-slate-950 border-t border-blue-500/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
                      <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <span className="font-mono truncate">asyncapi.yaml</span>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => { setCode(pendingYaml); setPendingYaml(null); setChatOpen(false); }}
                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg font-semibold transition-colors"
                      >
                        {t.apply}
                      </button>
                      <button
                        onClick={() => { autoApplyRef.current = true; setCode(pendingYaml); setPendingYaml(null); setChatOpen(false); }}
                        className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1.5 rounded-lg font-semibold transition-colors"
                      >
                        {t.applyAlways}
                      </button>
                      <button
                        onClick={() => setPendingYaml(null)}
                        className="text-xs bg-slate-700 hover:bg-red-900/60 text-slate-400 hover:text-red-300 px-2.5 py-1.5 rounded-lg font-semibold transition-colors"
                      >
                        {t.reject}
                      </button>
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                  <div className="flex gap-2 items-end">
                    <textarea
                      ref={inputRef}
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isChatStreaming}
                      placeholder={t.chatPlaceholder}
                      rows={2}
                      className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isChatStreaming || !chatInput.trim()}
                      className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200 flex-shrink-0"
                    >
                      {isChatStreaming ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">{t.chatHint}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
