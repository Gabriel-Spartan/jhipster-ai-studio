import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { envConfig, getProvidersStatus } from './config/env.js';
import { AIProviderRouter } from './ai/router.js';
import { generateJdlFromAnalysis } from './parser/jsonToJdl.js';
import { validateJdlContent } from './validator/jdlValidator.js';
import { JHipsterRunner } from './jhipster/runner.js';
import { SystemAnalysisSchema } from './types/schema.js';
import { ProjectStore } from './storage/projectStore.js';

const app = express();
const router = new AIProviderRouter();
const runner = new JHipsterRunner();
const projectStore = new ProjectStore();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// 1. Estado y configuración de proveedores
app.get('/api/status', async (req, res) => {
  try {
    const providers = await router.getAvailableProviders();
    res.json({
      status: 'ok',
      defaultProvider: envConfig.defaultProvider,
      providers,
      maxRepairAttempts: envConfig.maxRepairAttempts,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Fixtures de demo / contingencia
app.get('/api/fixtures', (req, res) => {
  try {
    const fixturesDir = path.resolve(process.cwd(), '../fixtures');
    const files = fs.readdirSync(fixturesDir);
    const fixtures = files.map((file) => ({
      id: path.parse(file).name,
      fileName: file,
      type: file.endsWith('.json') ? 'analysis' : 'jdl',
    }));
    res.json({ fixtures });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/fixtures/:id', (req, res) => {
  try {
    const fixturesDir = path.resolve(process.cwd(), '../fixtures');
    const jsonPath = path.join(fixturesDir, `${req.params.id}.json`);
    const jdlPath = path.join(fixturesDir, `${req.params.id}.jdl`);

    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      return res.json({ type: 'analysis', data });
    } else if (fs.existsSync(jdlPath)) {
      const data = fs.readFileSync(jdlPath, 'utf-8');
      return res.json({ type: 'jdl', data });
    }
    return res.status(404).json({ error: `Fixture '${req.params.id}' no encontrado.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Análisis en lenguaje natural -> Estructura JSON
app.post('/api/analyze', async (req, res) => {
  const { prompt, provider } = req.body;
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'La descripción del sistema no puede estar vacía.' });
  }

  try {
    console.log(`[API /api/analyze] Solicitando análisis con motor: '${provider || 'auto'}'...`);
    const result = await router.analyze(provider || 'auto', prompt);
    res.json(result);
  } catch (error: any) {
    console.error(`[API /api/analyze] Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// 4. Generación determinista de JDL a partir del JSON
app.post('/api/generate-jdl', (req, res) => {
  const { analysis, options } = req.body;
  try {
    const validatedAnalysis = SystemAnalysisSchema.parse(analysis);
    const jdl = generateJdlFromAnalysis(validatedAnalysis, options || {});
    const validation = validateJdlContent(jdl);
    res.json({ jdl, validation });
  } catch (error: any) {
    res.status(400).json({ error: `Error en estructura: ${error.message}` });
  }
});

// 5. Validación de JDL
app.post('/api/validate-jdl', (req, res) => {
  const { jdl } = req.body;
  if (!jdl || typeof jdl !== 'string') {
    return res.status(400).json({ error: 'Contenido JDL no proporcionado.' });
  }

  const validation = validateJdlContent(jdl);
  res.json(validation);
});

// 6. Reparación asistida con IA
app.post('/api/repair-jdl', async (req, res) => {
  const { currentJdl, errors, analysis, provider } = req.body;
  if (!currentJdl || !errors || !Array.isArray(errors)) {
    return res.status(400).json({ error: 'JDL y lista de errores requeridos.' });
  }

  try {
    const repairedJdl = await router.repairJdl(
      provider || 'auto',
      currentJdl,
      errors,
      analysis || { systemName: 'Sistema', entities: [], relationships: [], observations: [] }
    );
    const validation = validateJdlContent(repairedJdl);
    res.json({ repairedJdl, validation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Ejecución y guardado en JHipster
app.post('/api/jhipster/generate', async (req, res) => {
  const { projectName, jdl, skipInstall } = req.body;
  if (!jdl || typeof jdl !== 'string') {
    return res.status(400).json({ error: 'Contenido JDL requerido.' });
  }

  try {
    const safeName = runner.sanitizeProjectName(projectName || 'jhipster_app');
    const job = await runner.generateProject(safeName, jdl, skipInstall !== false);
    res.json(job);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/jhipster/jobs/:id', (req, res) => {
  const job = runner.getJobStatus(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Trabajo no encontrado.' });
  }
  res.json(job);
});

app.get('/api/jhipster/download/:projectName', (req, res) => {
  try {
    const cleanName = runner.sanitizeProjectName(req.params.projectName);
    const outputDir = path.resolve(process.cwd(), '../output', cleanName);
    const jdlPath = path.join(outputDir, `${cleanName}.jdl`);

    if (fs.existsSync(jdlPath)) {
      return res.download(jdlPath, `${cleanName}.jdl`);
    }
    res.status(404).json({ error: 'Archivo JDL no encontrado.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Almacenamiento y gestión de proyectos
app.get('/api/projects', (req, res) => {
  try {
    const projects = projectStore.getAll();
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:id', (req, res) => {
  try {
    const project = projectStore.getById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre del proyecto es requerido.' });
    }
    const saved = projectStore.save(req.body);
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  try {
    const success = projectStore.delete(req.params.id);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = envConfig.port;
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 JHipster AI JDL Backend escuchando en http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
