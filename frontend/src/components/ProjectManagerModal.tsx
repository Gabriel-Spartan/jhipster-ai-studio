import { useState, useEffect } from 'react';
import {
  FolderArchive,
  Save,
  Trash2,
  FolderOpen,
  X,
  Clock,
  Database,
  Download,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import type { SystemAnalysis } from '../types';

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

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrompt: string;
  currentAnalysis: SystemAnalysis | null;
  currentJdl: string;
  currentProvider: string;
  currentStep: number;
  onLoadProject: (project: SavedProject) => void;
}

export function ProjectManagerModal({
  isOpen,
  onClose,
  currentPrompt,
  currentAnalysis,
  currentJdl,
  currentProvider,
  currentStep,
  onLoadProject,
}: ProjectManagerModalProps) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [projectName, setProjectName] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadProjectsList();
      if (currentAnalysis?.systemName) {
        setProjectName(currentAnalysis.systemName);
      }
    }
  }, [isOpen]);

  async function loadProjectsList() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Error cargando proyectos:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveCurrentProject() {
    if (!projectName.trim()) {
      alert('Por favor ingresa un nombre para el proyecto.');
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDescription.trim(),
          prompt: currentPrompt,
          provider: currentProvider,
          analysis: currentAnalysis,
          jdl: currentJdl,
          currentStep: currentStep,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        await loadProjectsList();
      }
    } catch (err) {
      alert('Error guardando el proyecto.');
    }
  }

  async function handleDeleteProject(id: string) {
    if (!confirm('¿Estás seguro de eliminar este proyecto del almacenamiento?')) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      alert('Error eliminando el proyecto.');
    }
  }

  // Exportar todos los proyectos a un archivo JSON local
  function handleExportBackup() {
    const dataStr = JSON.stringify(projects, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `proyectos_jhipster_backup_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Importar archivo JSON con proyectos
  function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          for (const proj of imported) {
            await fetch('/api/projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(proj),
            });
          }
          await loadProjectsList();
          alert('¡Proyectos importados con éxito!');
        }
      } catch (err) {
        alert('El archivo no tiene un formato JSON válido.');
      }
    };
    reader.readAsText(file);
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '840px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          margin: 0,
          background: '#0e1526',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Encabezado */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderArchive size={22} color="#818cf8" />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                Almacenamiento y Gestión de Proyectos
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Guarda tus avances o cambia entre múltiples proyectos modelados
              </p>
            </div>
          </div>

          <button className="btn btn-outline" style={{ padding: '6px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Sección 1: Guardar proyecto actual */}
        <div
          style={{
            padding: '16px',
            background: '#131c2e',
            borderRadius: 'var(--radius-md)',
            marginTop: '16px',
            border: '1px solid var(--border-color)',
          }}
        >
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: '#a5b4fc' }}>
            Guardar proyecto activo actual
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px' }}>
            <input
              type="text"
              className="select"
              placeholder="Nombre del proyecto (ej: Clinica Dental)"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              style={{ cursor: 'text' }}
            />
            <input
              type="text"
              className="select"
              placeholder="Descripción breve (opcional)"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              style={{ cursor: 'text' }}
            />
            <button
              className="btn btn-primary"
              style={{ padding: '8px 16px' }}
              onClick={handleSaveCurrentProject}
            >
              <Save size={15} /> Guardar
            </button>
          </div>
          {saveSuccess && (
            <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} /> ¡Proyecto guardado en el archivo de almacenamiento!
            </div>
          )}
        </div>

        {/* Sección 2: Lista de proyectos guardados */}
        <div style={{ flex: 1, overflowY: 'auto', marginTop: '16px', paddingRight: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Proyectos Registrados ({projects.length})
            </h4>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={handleExportBackup}
                title="Exportar todos los proyectos a un archivo .json"
              >
                <Download size={13} /> Exportar JSON
              </button>
              <label
                className="btn btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer' }}
                title="Importar proyectos desde un archivo .json"
              >
                <Upload size={13} /> Importar JSON
                <input
                  type="file"
                  accept=".json,.jsonl"
                  onChange={handleImportBackup}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              Cargando proyectos...
            </div>
          ) : projects.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: '#090d16',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-dim)',
                fontSize: '0.85rem',
              }}
            >
              No tienes proyectos guardados aún. Guarda tu proyecto actual arriba para tenerlo disponible cuando quieras.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: '#131c2e',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#f3f4f6', fontSize: '0.95rem' }}>
                        {proj.name}
                      </span>
                      {proj.analysis?.entities && (
                        <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                          <Database size={11} /> {proj.analysis.entities.length} tablas
                        </span>
                      )}
                    </div>
                    {proj.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                        {proj.description}
                      </p>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '0.74rem',
                        color: 'var(--text-dim)',
                        marginTop: '6px',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> {new Date(proj.updatedAt).toLocaleString()}
                      </span>
                      {proj.provider && <span>Motor: {proj.provider}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => {
                        onLoadProject(proj);
                        onClose();
                      }}
                    >
                      <FolderOpen size={14} /> Cargar
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '6px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      title="Eliminar proyecto"
                      onClick={() => handleDeleteProject(proj.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
