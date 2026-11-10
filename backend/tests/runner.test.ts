import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { JHipsterRunner } from '../src/jhipster/runner.js';

describe('JHipsterRunner', () => {
  const runner = new JHipsterRunner();

  it('debe sanitizar correctamente nombres de proyecto', () => {
    expect(runner.sanitizeProjectName('Cine 2026!')).toBe('cine2026');
    expect(runner.sanitizeProjectName('Mi-Proyecto_JDL')).toBe('mi-proyecto_jdl');
    expect(runner.sanitizeProjectName('')).toMatch(/^project_\d+$/);
  });

  it('debe guardar el archivo JDL y asegurar ruta relativa sin espacios para la ejecución', () => {
    const { jdlPath, projectDir } = runner.saveJdlFile('cine_test', 'entity Pelicula { titulo String }');
    
    expect(fs.existsSync(jdlPath)).toBe(true);
    const relativeJdl = path.relative(projectDir, jdlPath) || path.basename(jdlPath);
    
    // La ruta relativa no debe contener espacios para que Windows cmd.exe no fragmente los argumentos
    expect(relativeJdl).toBe('cine_test.jdl');
    expect(relativeJdl.includes(' ')).toBe(false);

    // Limpieza
    fs.rmSync(projectDir, { recursive: true, force: true });
  });
});

