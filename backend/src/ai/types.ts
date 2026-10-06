import { SystemAnalysis } from '../types/schema.js';

export interface AIProviderResponse {
  analysis: SystemAnalysis;
  provider: string;
  model: string;
  durationMs: number;
  rawResponse?: string;
}

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  isAvailable(): Promise<boolean>;
  analyzeRequirements(prompt: string): Promise<AIProviderResponse>;
  repairJdl(currentJdl: string, validationErrors: string[], originalAnalysis: SystemAnalysis): Promise<string>;
}
