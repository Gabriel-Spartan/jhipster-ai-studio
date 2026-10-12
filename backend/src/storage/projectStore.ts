import fs from 'fs';
import path from 'path';
import { SystemAnalysis } from '../types/schema.js';

export interface SavedProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  prompt: string;
  provider?: string;
  analysis?: SystemAnalysis;
  jdl?: string;
  currentStep?: number;
}

export class ProjectStore {
  private storageFilePath: string;

  constructor() {
    const storageDir = path.resolve(process.cwd(), '../storage');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    this.storageFilePath = path.join(storageDir, 'projects.json');
    if (!fs.existsSync(this.storageFilePath)) {
      fs.writeFileSync(this.storageFilePath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  private readProjects(): SavedProject[] {
    try {
      const data = fs.readFileSync(this.storageFilePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private writeProjects(projects: SavedProject[]): void {
    fs.writeFileSync(this.storageFilePath, JSON.stringify(projects, null, 2), 'utf-8');
  }

  getAll(): SavedProject[] {
    return this.readProjects().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  getById(id: string): SavedProject | null {
    const list = this.readProjects();
    return list.find((p) => p.id === id) || null;
  }

  save(projectData: Partial<SavedProject> & { name: string }): SavedProject {
    const list = this.readProjects();
    const now = new Date().toISOString();

    let existingIndex = -1;
    if (projectData.id) {
      existingIndex = list.findIndex((p) => p.id === projectData.id);
    }

    if (existingIndex >= 0) {
      const updated: SavedProject = {
        ...list[existingIndex],
        ...projectData,
        updatedAt: now,
      };
      list[existingIndex] = updated;
      this.writeProjects(list);
      return updated;
    } else {
      const newId = projectData.id || `proj_${Date.now()}`;
      const newProject: SavedProject = {
        id: newId,
        name: projectData.name,
        description: projectData.description || '',
        createdAt: now,
        updatedAt: now,
        prompt: projectData.prompt || '',
        provider: projectData.provider || 'auto',
        analysis: projectData.analysis,
        jdl: projectData.jdl || '',
        currentStep: projectData.currentStep || 1,
      };
      list.push(newProject);
      this.writeProjects(list);
      return newProject;
    }
  }

  delete(id: string): boolean {
    const list = this.readProjects();
    const filtered = list.filter((p) => p.id !== id);
    if (filtered.length !== list.length) {
      this.writeProjects(filtered);
      return true;
    }
    return false;
  }
}
