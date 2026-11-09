#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('========================================================');
console.log('🚀 Iniciando JHipster AI Studio (Backend + Frontend)...');
console.log('========================================================\n');

// Detectar si estamos en Windows para usar el comando shell apropiado
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// 1. Iniciar Backend (Puerto 3001)
const backend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'backend'),
  stdio: 'pipe',
  shell: isWin,
});

backend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.log(`\x1b[34m[BACKEND]\x1b[0m ${line}`);
    }
  }
});

backend.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.error(`\x1b[31m[BACKEND-ERR]\x1b[0m ${line}`);
    }
  }
});

// 2. Iniciar Frontend (Puerto 3000)
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'frontend'),
  stdio: 'pipe',
  shell: isWin,
});

frontend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.log(`\x1b[32m[FRONTEND]\x1b[0m ${line}`);
    }
  }
});

frontend.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.error(`\x1b[33m[FRONTEND-ERR]\x1b[0m ${line}`);
    }
  }
});

// Manejo de apagado ordenado con Ctrl+C
function cleanExit() {
  console.log('\n🛑 Deteniendo servidores...');
  try {
    backend.kill('SIGINT');
  } catch {}
  try {
    frontend.kill('SIGINT');
  } catch {}
  process.exit(0);
}

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
process.on('exit', cleanExit);

