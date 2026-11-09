export interface Field {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  min?: number;
  max?: number;
  description?: string;
}

export interface Entity {
  name: string;
  fields: Field[];
  description?: string;
}

export interface Relationship {
  from: string;
  to: string;
  type: string;
  fromField?: string;
  toField?: string;
  description: string;
}

export interface ObservationItem {
  text: string;
  suggestions?: string[];
}

export type Observation = string | ObservationItem;

export interface SystemAnalysis {
  systemName: string;
  entities: Entity[];
  relationships: Relationship[];
  observations: Observation[];
}

export interface AIAnalysisResponse {
  analysis: SystemAnalysis;
  provider: string;
  model: string;
  durationMs: number;
}

export interface ValidationError {
  line?: number;
  message: string;
  severity: 'error' | 'warning';
  entity?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  entitiesFound: string[];
  relationshipsFound: number;
}

export interface ProviderInfo {
  name: string;
  model: string;
  isAvailable: boolean;
  models?: string[];
}

export interface GenerationJob {
  id: string;
  projectName: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  logs: string[];
  outputPath: string;
  jdlPath: string;
  startTime?: number;
  endTime?: number;
  error?: string;
}
