import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

export default function McpGenerator() {
  const defaultYaml = `asyncapi: 3.0.0
info:
  title: Sistema de Gestión de Usuarios
  version: 1.0.0
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

  // Inicializamos el estado intentando leer primero de la memoria del navegador
  const [code, setCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mcp_yaml_backup');
      if (saved) return saved;
    }
    return defaultYaml;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // Efecto para guardar en localStorage y actualizar la vista previa (con retraso de 800ms)
  useEffect(() => {
    // 1. Guardamos el código actual
    if (typeof window !== 'undefined') {
      localStorage.setItem('mcp_yaml_backup', code);
    }

    // 2. Actualizamos el Iframe de Studio
    const timer = setTimeout(() => {
      try {
        const base64Code = btoa(unescape(encodeURIComponent(code)));
        setPreviewUrl(`https://studio.asyncapi.com/?base64=${base64Code}&readOnly=true&hidesidewide=true`);
      } catch (e) {
        console.error("Error codificando YAML:", e);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [code]);

  const handleGenerate = async () => {
    setIsLoading(true);
    console.log("YAML enviado para generación:\n", code);
    
    // Simulación de llamada al backend
    setTimeout(() => {
      alert("¡Simulación exitosa! El backend procesaría el YAML y generaría el .zip aquí.");
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-0">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-slate-700/50">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
            Generador de <span className="text-blue-400">Servidores MCP</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            Pega tu especificación AsyncAPI a la izquierda y visualiza la arquitectura generada en tiempo real a la derecha.
          </p>
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className={`py-3 px-8 rounded-xl font-bold text-white transition-all duration-200 flex justify-center items-center shadow-lg whitespace-nowrap text-lg
            ${isLoading 
              ? 'bg-blue-600/50 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/30'}`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando...
            </span>
          ) : (
            'Generar y Descargar .ZIP'
          )}
        </button>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[700px]">
        
        {/* Panel Izquierdo: Editor Monaco */}
        <div className="rounded-2xl overflow-hidden border border-slate-700 h-full flex flex-col bg-slate-950 shadow-2xl">
          <div className="bg-slate-800 text-xs text-slate-300 px-5 py-3.5 border-b border-slate-700 uppercase font-semibold flex justify-between tracking-wider">
            <span>Editor YAML (AsyncAPI 3.0.0)</span>
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
                padding: { top: 16 }
              }}
            />
          </div>
        </div>

        {/* Panel Derecho: Vista Previa Iframe */}
        <div className="rounded-2xl border border-slate-700 h-full flex flex-col bg-white overflow-hidden shadow-2xl">
          <div className="bg-slate-100 text-xs text-slate-700 px-5 py-3.5 border-b border-slate-300 uppercase font-bold flex justify-between items-center tracking-wider">
            <span>Vista Previa de la Arquitectura</span>
            {previewUrl && (
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors font-semibold">
                Abrir Studio
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
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
                    Cargando visualización...
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}