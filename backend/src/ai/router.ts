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
    let provider: AIProvider | undefined;

    if (requestedMode === 'auto') {
      const candidates = ['gemini', 'groq', 'ollama'];
      for (const name of candidates) {
        const p = this.providers.get(name);
        if (p && (await p.isAvailable())) {
          provider = p;
          break;
        }
      }
    } else {
      provider = this.providers.get(requestedMode);
    }

    if (!provider) {
      throw new Error('No hay motor de IA disponible para corregir el JDL.');
    }

    return provider.repairJdl(currentJdl, validationErrors, originalAnalysis);
  }
}
