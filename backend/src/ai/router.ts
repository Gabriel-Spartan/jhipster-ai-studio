import { AIProvider, AIProviderResponse } from './types.js';
import { GeminiProvider } from './providers/gemini.js';
import { GroqProvider } from './providers/groq.js';
import { OllamaProvider } from './providers/ollama.js';
import { SystemAnalysis } from '../types/schema.js';

export class AIProviderRouter {
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    this.providers.set('gemini', new GeminiProvider());
    this.providers.set('groq', new GroqProvider());
    this.providers.set('ollama', new OllamaProvider());
  }

  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  async getAvailableProviders(): Promise<{ name: string; model: string; isAvailable: boolean }[]> {
    const list: { name: string; model: string; isAvailable: boolean }[] = [];
    for (const [key, provider] of this.providers.entries()) {
      const isAvailable = await provider.isAvailable();
      list.push({
        name: key,
        model: provider.model,
        isAvailable,
      });
    }
    return list;
  }

  async analyze(mode: string, userPrompt: string): Promise<AIProviderResponse> {
    const requestedMode = (mode || 'auto').toLowerCase();

    if (requestedMode === 'auto') {
      return this.analyzeWithAutoStrategy(userPrompt);
    }

    const provider = this.providers.get(requestedMode);
    if (!provider) {
      throw new Error(`Motor de IA '${mode}' no reconocido. Opciones válidas: auto, gemini, groq, ollama.`);
    }

    const isAvailable = await provider.isAvailable();
    if (!isAvailable) {
      throw new Error(`El motor de IA '${mode}' no está disponible o sus credenciales no han sido configuradas.`);
    }

    return provider.analyzeRequirements(userPrompt);
  }

  private async analyzeWithAutoStrategy(userPrompt: string): Promise<AIProviderResponse> {
    // Orden de prioridad preferida: Gemini -> Groq -> Ollama
    const candidates = ['gemini', 'groq', 'ollama'];
    const availableProviders: AIProvider[] = [];

    for (const name of candidates) {
      const p = this.providers.get(name);
      if (p && (await p.isAvailable())) {
        availableProviders.push(p);
      }
    }

    if (availableProviders.length === 0) {
      throw new Error('No hay ningún motor de IA disponible configurado. Por favor configura GEMINI_API_KEY o GROQ_API_KEY en el archivo .env, o inicia el servicio de Ollama.');
    }

    const errors: string[] = [];

    for (const provider of availableProviders) {
      try {
        console.log(`[AI Auto-Router] Intentando análisis con ${provider.name} (${provider.model})...`);
        const result = await provider.analyzeRequirements(userPrompt);
        console.log(`[AI Auto-Router] Análisis completado con éxito por ${result.provider} en ${result.durationMs}ms`);
        return result;
      } catch (err: any) {
        console.warn(`[AI Auto-Router] Falló ${provider.name}: ${err.message}. Intentando fallback...`);
        errors.push(`${provider.name}: ${err.message}`);
      }
    }

    throw new Error(`Todos los proveedores configurados fallaron: ${errors.join(' | ')}`);
  }

  async repairJdl(mode: string, currentJdl: string, validationErrors: string[], originalAnalysis: SystemAnalysis): Promise<string> {
    const requestedMode = (mode || 'auto').toLowerCase();

    const candidates = requestedMode === 'auto'
      ? ['gemini', 'groq', 'ollama']
      : [requestedMode, 'gemini', 'groq', 'ollama'];

    const availableProviders: AIProvider[] = [];
    for (const name of candidates) {
      const p = this.providers.get(name);
      if (p && (await p.isAvailable()) && !availableProviders.includes(p)) {
        availableProviders.push(p);
      }
    }

    if (availableProviders.length === 0) {
      return this.deterministicJdlRepair(currentJdl, validationErrors);
    }

    const errors: string[] = [];
    for (const provider of availableProviders) {
      try {
        console.log(`[AI Auto-Router] Intentando reparación con ${provider.name}...`);
        const repaired = await provider.repairJdl(currentJdl, validationErrors, originalAnalysis);
        if (repaired && repaired.trim().length > 0) {
          console.log(`[AI Auto-Router] JDL reparado con éxito por ${provider.name}`);
          return repaired;
        }
      } catch (err: any) {
        console.warn(`[AI Auto-Router] Falló reparación con ${provider.name}: ${err.message}. Intentando fallback...`);
        errors.push(`${provider.name}: ${err.message}`);
      }
    }

    console.warn(`[AI Auto-Router] Todos los proveedores de IA fallaron. Aplicando contingencia determinista...`);
    return this.deterministicJdlRepair(currentJdl, validationErrors);
  }

  private deterministicJdlRepair(currentJdl: string, validationErrors: string[]): string {
    let fixed = currentJdl.trim();

    // 1. Balancear llaves faltantes
    let openBraces = 0;
    for (const ch of fixed) {
      if (ch === '{') openBraces++;
      if (ch === '}') openBraces--;
    }
    while (openBraces > 0) {
      fixed += '\n}';
      openBraces--;
    }

    // 2. Detectar entidades faltantes y agregarlas
    for (const err of validationErrors) {
      const match = err.match(/entidad\s+(?:origen|destino)?\s*"([^"]+)",\s*pero\s*"[^"]+"\s*no está definida/i);
      if (match && match[1]) {
        const missingEntity = match[1];
        if (!fixed.includes(`entity ${missingEntity}`)) {
          fixed = `entity ${missingEntity} {\n  login String required unique\n  nombre String\n}\n\n` + fixed;
        }
      }
    }

    // 3. Reemplazar tipos inválidos
    fixed = fixed.replace(/SuperCustomType/g, 'String');

    return fixed;
  }
}
