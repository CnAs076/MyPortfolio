import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import yaml from 'js-yaml'; 

export default function McpGenerator() {
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

  // Inicialización con persistencia en LocalStorage
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

  // Efecto para extraer servidores del YAML en tiempo real
  useEffect(() => {
    try {
      const parsedDoc = yaml.load(code) as any;
      if (parsedDoc && typeof parsedDoc === 'object' && parsedDoc.servers) {
        const serverNames = Object.keys(parsedDoc.servers);
        setAvailableServers(serverNames);
        
        // Corrección TypeScript: seleccionamos el primer string del array
        if (serverNames.length > 0 && !serverNames.includes(selectedServer)) {
          setSelectedServer(serverNames[0]);
        }
      } else {
        setAvailableServers([]);
        setSelectedServer('');
      }
    } catch (e) {
      // Ignorar errores mientras el usuario escribe
    }
  }, [code, selectedServer]); 

  // Efecto para guardar backup y actualizar el Iframe de Studio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mcp_yaml_backup', code);
    }

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

  // FUNCIÓN CONECTADA AL BACKEND REAL
  const handleGenerate = async () => {
    if (!code) return;
    setIsLoading(true);
    
    try {
      const response = await fetch('http://192.168.1.100:8000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yaml_content: code,
          server: selectedServer || ''
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error en la generación');
      }

      // Procesar la descarga del archivo ZIP
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mcp-server-${selectedServer || 'project'}.zip`);
      document.body.appendChild(link);
      link.click();
      
      // Limpieza de memoria
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error al generar:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'No se pudo conectar con el servidor backend'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-0">
      
      {/* Cabecera con Título, Descripción y Botones */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10 pb-6 border-b border-slate-700/50">
        <div className="flex-1">
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            Escribe tu especificación AsyncAPI a la izquierda y visualiza la arquitectura generada en tiempo real a la derecha.
          </p>
        </div>
        
        {/* CORRECCIÓN: Añadido flex-wrap y ajustes de width para evitar desbordamientos */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start lg:items-center gap-4 w-full lg:w-auto">
          
          {availableServers.length > 0 && (
            <div className="flex flex-col gap-1.5 w-full sm:w-auto max-w-full">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Selecciona Entorno:</span>
              {/* CORRECCIÓN: Añadido overflow-x-auto para que los servidores hagan scroll si hay muchos */}
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
                Procesando...
              </span>
            ) : (
              'Generar y Descargar .ZIP'
            )}
          </button>
        </div>
      </div>

      {/* Grid de Editor y Vista Previa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[700px]">
        
        {/* Editor Monaco */}
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

        {/* Vista Previa Iframe */}
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