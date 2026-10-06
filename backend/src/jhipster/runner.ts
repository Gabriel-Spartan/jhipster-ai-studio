import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export interface GenerationStatus {
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

export class JHipsterRunner {
  private baseOutputDir: string;
  private activeJobs: Map<string, GenerationStatus> = new Map();

  constructor() {
    this.baseOutputDir = path.resolve(process.cwd(), '../output');
    if (!fs.existsSync(this.baseOutputDir)) {
      fs.mkdirSync(this.baseOutputDir, { recursive: true });
    }
  }

  // Sanitizar estrictamente el nombre para evitar path traversal o inyección
  sanitizeProjectName(name: string): string {
    const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, '').trim().toLowerCase();
    if (!sanitized) {
      return `project_${Date.now()}`;
    }
    return sanitized;
  }

  // Guardar archivo JDL en el directorio del proyecto
  saveJdlFile(projectName: string, jdlContent: string): { jdlPath: string; projectDir: string } {
    const cleanName = this.sanitizeProjectName(projectName);
    const projectDir = path.join(this.baseOutputDir, cleanName);

    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    const jdlPath = path.join(projectDir, `${cleanName}.jdl`);
    fs.writeFileSync(jdlPath, jdlContent, 'utf-8');

    return { jdlPath, projectDir };
  }

  // Iniciar generación de proyecto JHipster con ejecución controlada
  async generateProject(
    projectName: string,
    jdlContent: string,
    skipInstall: boolean = true
  ): Promise<GenerationStatus> {
    const cleanName = this.sanitizeProjectName(projectName);
    const jobId = `${cleanName}_${Date.now()}`;
    const { jdlPath, projectDir } = this.saveJdlFile(cleanName, jdlContent);

    const jobStatus: GenerationStatus = {
      id: jobId,
      projectName: cleanName,
      status: 'running',
      logs: [`[JHipster Runner] Iniciando proceso para ${cleanName}...`, `[JHipster Runner] Archivo JDL guardado en: ${jdlPath}`],
      outputPath: projectDir,
      jdlPath,
      startTime: Date.now(),
    };

    this.activeJobs.set(jobId, jobStatus);

    // Ejecución asíncrona controlada
    this.runJHipsterProcess(jobStatus, projectDir, jdlPath, skipInstall);

    return jobStatus;
  }

  private runJHipsterProcess(
    job: GenerationStatus,
    projectDir: string,
    jdlPath: string,
    skipInstall: boolean
  ) {
    const args = ['jhipster', 'jdl', jdlPath, '--no-insight'];
    if (skipInstall) {
      args.push('--skip-install');
      args.push('--skip-git');
    }

    job.logs.push(`[JHipster Runner] Ejecutando: npx ${args.join(' ')}`);

    const child = spawn('npx', args, {
      cwd: projectDir,
      env: { ...process.env, CI: 'true', NODE_ENV: 'development' },
      shell: false, // Evita shell injection
    });

    // Timeout de seguridad: 3 minutos máximo
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      job.status = 'failed';
      job.error = 'Proceso cancelado por timeout (límite de 3 minutos excedido).';
      job.logs.push(`[JHipster Runner] ERROR: ${job.error}`);
    }, 180000);

    child.stdout.on('data', (data) => {
      const text = data.toString();
      const lines = text.split('\n').filter((l: string) => l.trim().length > 0);
      for (const line of lines) {
        job.logs.push(line);
      }
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      const lines = text.split('\n').filter((l: string) => l.trim().length > 0);
      for (const line of lines) {
        job.logs.push(`[STDERR] ${line}`);
      }
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      job.endTime = Date.now();
      if (code === 0) {
        job.status = 'completed';
        job.logs.push(`[JHipster Runner] ¡Generación completada con éxito en ${job.outputPath}!`);
      } else {
        job.status = 'failed';
        job.error = `El proceso de JHipster finalizó con código de salida ${code}.`;
        job.logs.push(`[JHipster Runner] ERROR: ${job.error}`);
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      job.status = 'failed';
      job.error = err.message;
      job.logs.push(`[JHipster Runner] Error de ejecución: ${err.message}`);
    });
  }

  getJobStatus(jobId: string): GenerationStatus | undefined {
    return this.activeJobs.get(jobId);
  }
}
