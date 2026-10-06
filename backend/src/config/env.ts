import dotenv from 'dotenv';
import path from 'path';

// Cargar .env de la raíz del proyecto si existe, o del backend
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

export interface ProviderConfig {
  name: 'gemini' | 'groq' | 'ollama';
  displayName: string;
  isAvailable: boolean;
  model: string;
  missingReason?: string;
}

export const envConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  defaultProvider: process.env.AI_DEFAULT_PROVIDER || 'auto',
  maxRepairAttempts: parseInt(process.env.MAX_REPAIR_ATTEMPTS || '2', 10),

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  },

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3',
  },
};

export function getProvidersStatus(): ProviderConfig[] {
  return [
    {
      name: 'gemini',
      displayName: 'Google Gemini',
      isAvailable: Boolean(envConfig.gemini.apiKey && envConfig.gemini.apiKey.trim().length > 0),
      model: envConfig.gemini.model,
      missingReason: !envConfig.gemini.apiKey ? 'GEMINI_API_KEY no configurada' : undefined,
    },
    {
      name: 'groq',
      displayName: 'Groq (Llama)',
      isAvailable: Boolean(envConfig.groq.apiKey && envConfig.groq.apiKey.trim().length > 0),
      model: envConfig.groq.model,
      missingReason: !envConfig.groq.apiKey ? 'GROQ_API_KEY no configurada' : undefined,
    },
    {
      name: 'ollama',
      displayName: 'Ollama (Local)',
      // Para ollama se puede asumir disponible si hay baseUrl o verificar conectividad
      isAvailable: Boolean(envConfig.ollama.baseUrl),
      model: envConfig.ollama.model,
      missingReason: undefined,
    },
  ];
}
