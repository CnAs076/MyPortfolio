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
              type: integer`;

  const [code, setCode] = useState(defaultYaml);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // Efecto para actualizar la URL del iframe cuando el código cambia
  // Usamos un pequeño retraso (debounce) para no saturar el visor al teclear rápido
  useEffect(() => {
    const timer = setTimeout(() => {
      // Codificamos el YAML en base64 para pasarlo por la URL de forma segura
      const base64Code = btoa(unescape(encodeURIComponent(code)));
      // Usamos el visor oficial de AsyncAPI Studio (readOnly mode)
      setPreviewUrl(`https://studio.asyncapi.com/?base64=${base64Code}&readOnly=true`);
    }, 800);

    return () => clearTimeout(timer);
  }, [code]);

  const handleGenerate = async () => {
    setIsLoading(true);
    console.log("YAML listo para enviar al backend:\n", code);
    
    setTimeout(() => {
      alert("¡Simulación completada! Aquí se descargaría el .zip del Servidor MCP.");
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-slate-900 rounded-xl shadow-2xl border border-slate-700">
      
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Generador de Servidores MCP</h2>
          <p className="text-slate-400">Edita tu especificación a la izquierda y visualiza los cambios a la derecha.</p>
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className={`py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 flex justify-center items-center shadow-lg whitespace-nowrap
            ${isLoading 
              ? 'bg-blue-600/50 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/30'}`}
        >
          {isLoading ? 'Generando servidor MCP...' : 'Generar y Descargar .ZIP'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
        
        {/* Editor Monaco */}
        <div className="rounded-lg overflow-hidden border border-slate-700 h-full flex flex-col bg-slate-950">
          <div className="bg-slate-800 text-xs text-slate-400 px-4 py-2 border-b border-slate-700 uppercase font-semibold flex justify-between">
            <span>Editor YAML</span>
            <span className="text-blue-400">AsyncAPI 3.0.0</span>
          </div>
          <div className="flex-grow">
            <Editor
              height="100%"
              defaultLanguage="yaml"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                padding: { top: 16 }
              }}
            />
          </div>
        </div>

        {/* Vista Previa Iframe */}
        <div className="rounded-lg border border-slate-700 h-full flex flex-col bg-white overflow-hidden">
          <div className="bg-slate-100 text-xs text-slate-600 px-4 py-2 border-b border-slate-300 uppercase font-semibold flex justify-between items-center">
            <span>Vista Previa (AsyncAPI Studio)</span>
            {previewUrl && (
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                Abrir en nueva pestaña
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              </a>
            )}
          </div>
          <div className="flex-grow bg-white">
            {previewUrl ? (
              <iframe 
                src={previewUrl} 
                className="w-full h-full border-none"
                title="AsyncAPI Preview"
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                Generando vista previa...
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}