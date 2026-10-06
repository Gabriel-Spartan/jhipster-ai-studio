import { z } from 'zod';

export const JDLFieldTypeEnum = z.enum([
  'String',
  'Integer',
  'Long',
  'BigDecimal',
  'Float',
  'Double',
  'Boolean',
  'LocalDate',
  'ZonedDateTime',
  'Instant',
  'Duration',
  'UUID',
  'Blob',
  'AnyBlob',
  'ImageBlob',
  'TextBlob'
]);

export type JDLFieldType = z.infer<typeof JDLFieldTypeEnum>;

export const JDLRelationshipTypeEnum = z.enum([
  'one-to-one',
  'one-to-many',
  'many-to-one',
  'many-to-many'
]);

export type JDLRelationshipType = z.infer<typeof JDLRelationshipTypeEnum>;

export const FieldSchema = z.object({
  name: z.string().min(1),
  type: z.string(), // permite JDLFieldType o nombre de enum
  required: z.boolean().default(false),
  unique: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  description: z.string().optional(),
});

export type Field = z.infer<typeof FieldSchema>;

export const EnumSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.string().min(1)).min(1),
});

export type EnumDefinition = z.infer<typeof EnumSchema>;

export const EntitySchema = z.object({
  name: z.string().min(1),
  tableName: z.string().optional(),
  fields: z.array(FieldSchema).default([]),
  description: z.string().optional(),
});

export type Entity = z.infer<typeof EntitySchema>;

export const RelationshipSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  type: JDLRelationshipTypeEnum,
  fromField: z.string().optional(),
  toField: z.string().optional(),
  required: z.boolean().optional(),
  description: z.string(),
});

export type Relationship = z.infer<typeof RelationshipSchema>;

export const SystemAnalysisSchema = z.object({
  systemName: z.string().min(1),
  entities: z.array(EntitySchema).min(1),
  enums: z.array(EnumSchema).optional().default([]),
  relationships: z.array(RelationshipSchema).default([]),
  observations: z.array(z.string()).default([]),
});

export type SystemAnalysis = z.infer<typeof SystemAnalysisSchema>;

export interface AIAnalysisResult {
  analysis: SystemAnalysis;
  providerUsed: string;
  modelUsed: string;
  durationMs: number;
}
