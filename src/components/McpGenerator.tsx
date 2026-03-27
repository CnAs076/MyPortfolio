import { useState } from 'react';
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

  const handleGenerate = async () => {
    setIsLoading(true);
    
    // Aquí conectaremos tu servidor casero más adelante
    console.log("YAML listo para enviar:\n", code);
    
    // Simulamos que el backend tarda 2 segundos
    setTimeout(() => {
      alert("¡Simulación completada! Aquí se descargaría el .zip del Servidor MCP.");
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-900 rounded-xl shadow-2xl border border-slate-700">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">Generador de Servidores MCP</h2>
        <p className="text-slate-400">Pega tu especificación AsyncAPI (YAML o JSON) y genera un servidor MCP listo para usar.</p>
      </div>

      <div className="rounded-lg overflow-hidden border border-slate-700 mb-6">
        <Editor
          height="400px"
          defaultLanguage="yaml"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex justify-center items-center
          ${isLoading 
            ? 'bg-blue-600/50 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-500 shadow-lg'}`}
      >
        {isLoading ? 'Generando servidor MCP...' : 'Generar y Descargar .ZIP'}
      </button>
    </div>
  );
}