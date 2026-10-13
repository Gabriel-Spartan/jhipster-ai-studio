import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Layers,
  Code2,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Download,
  RotateCcw,
  Wrench,
  ArrowRight,
  Database,
  Terminal,
  RefreshCw,
  FolderDown,
  BookOpen,
  Stethoscope,
  Package,
  FolderArchive,
  Save,
} from 'lucide-react';
import { DatabaseDiagram } from './components/DatabaseDiagram';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import type { SavedProject } from './components/ProjectManagerModal';
import type {
  SystemAnalysis,
  AIAnalysisResponse,
  ValidationResult,
  ProviderInfo,
  GenerationJob,
} from './types';

const DEMO_PROMPTS = {
  library: `Crear un sistema de biblioteca que permita gestionar usuarios, libros, autores y préstamos. Un autor puede escribir varios libros, un usuario puede realizar varios préstamos y cada préstamo corresponde a un libro.`,
  veterinary: `Crear un sistema para una clínica veterinaria que gestione clientes, mascotas, veterinarios, citas y tratamientos. Un cliente puede tener varias mascotas, y una cita médica puede incluir uno o varios tratamientos.`,
  inventory: `Crear un sistema de inventario que gestione productos, categorías, proveedores, inventario y movimientos. Cada producto pertenece a una categoría y a un proveedor, y registra movimientos de entrada y salida con su fecha y cantidad.`,
};

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Estado general y configuración
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('auto');

  // Paso 1: Requerimientos
  const [prompt, setPrompt] = useState<string>(DEMO_PROMPTS.library);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [transferredMessage, setTransferredMessage] = useState<string | null>(null);

  // Paso 2: Análisis Estructurado & Ambigüedades
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResponse | null>(null);
  const [isGeneratingJdl, setIsGeneratingJdl] = useState<boolean>(false);
  const [selectedObservations, setSelectedObservations] = useState<Record<number, boolean>>({});
  const [observationResolutions, setObservationResolutions] = useState<Record<number, string>>({});

  // Paso 3: Editor y Validación JDL
  const [jdlCode, setJdlCode] = useState<string>('');
  const [originalJdl, setOriginalJdl] = useState<string>('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [repairAttempts, setRepairAttempts] = useState<number>(0);
  const [isRepairing, setIsRepairing] = useState<boolean>(false);
  const [repairError, setRepairError] = useState<string | null>(null);
  const [repairSuccess, setRepairSuccess] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Paso 4: JHipster Runner
  const [projectName, setProjectName] = useState<string>('biblioteca_app');
  const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null);
  const [isLaunchingJHipster, setIsLaunchingJHipster] = useState<boolean>(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Modal de almacenamiento de múltiples proyectos
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState<boolean>(false);

  // Cargar estado inicial de proveedores
  useEffect(() => {
    fetchProviders();
  }, []);

  // Polling de logs si hay trabajo de JHipster en ejecución
  useEffect(() => {
    let interval: any;
    if (currentJob && currentJob.status === 'running') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/jhipster/jobs/${currentJob.id}`);
          if (res.ok) {
            const updated = await res.json();
            setCurrentJob(updated);
            if (terminalEndRef.current) {
              terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }
        } catch (err) {
          console.error('Error polling job:', err);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [currentJob]);

  async function fetchProviders() {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch {
      console.warn('Backend aún no responde en /api/status');
    }
  }

  // --- PASO 1: Analizar Requisitos ---
  async function handleAnalyzeWithCustomPrompt(promptToUse: string) {
    if (!promptToUse.trim()) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToUse, provider: selectedProvider }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al comunicarse con el proveedor de IA.');
      }

      const data: AIAnalysisResponse = await res.json();
      setAnalysisResult(data);
      // Reiniciar selecciones de ambigüedad para el nuevo análisis
      setSelectedObservations({});
      setObservationResolutions({});
      if (data.analysis.systemName) {
        setProjectName(data.analysis.systemName.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
      }
      setCurrentStep(2);
    } catch (err: any) {
      setAnalysisError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleAnalyze() {
    await handleAnalyzeWithCustomPrompt(prompt);
  }

  // --- Manejo de Selección y Resolución de Ambigüedades ---
  function toggleObservation(idx: number) {
    setSelectedObservations((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  }

  function handleResolutionChange(idx: number, val: string) {
    setObservationResolutions((prev) => ({
      ...prev,
      [idx]: val,
    }));
  }

  function handleSelectAllObservations() {
    if (!analysisResult?.analysis?.observations) return;
    const all: Record<number, boolean> = {};
    analysisResult.analysis.observations.forEach((_, idx) => {
      all[idx] = true;
    });
    setSelectedObservations(all);
  }

  function handleDeselectAllObservations() {
    setSelectedObservations({});
  }

  function buildUpdatedPromptWithObservations(): string {
    if (!analysisResult?.analysis?.observations) return prompt;

    const selectedIndices = Object.keys(selectedObservations)
      .map(Number)
      .filter((idx) => selectedObservations[idx]);

    if (selectedIndices.length === 0) return prompt;

    const additions = selectedIndices.map((idx) => {
      const rawObs = analysisResult.analysis.observations[idx];
      const cleanedObs = rawObs.replace(/^⚠\s*/, '').trim();
      const resolution = observationResolutions[idx]?.trim();
      if (resolution) {
        return `• [Ambigüedad resuelta]: ${cleanedObs}\n  -> Especificación: ${resolution}`;
      } else {
        return `• [Ambigüedad a solventar]: ${cleanedObs} (Por favor considerar y definir explícitamente en el modelo)`;
      }
    });

    return `${prompt.trim()}\n\n--- Aclaraciones y Solución de Ambigüedades ---\n${additions.join('\n')}`;
  }

  async function handleApplyObservationsToRequirements(reAnalyzeDirectly: boolean = false) {
    const updatedPrompt = buildUpdatedPromptWithObservations();
    setPrompt(updatedPrompt);

    const count = Object.values(selectedObservations).filter(Boolean).length;
    if (reAnalyzeDirectly) {
      await handleAnalyzeWithCustomPrompt(updatedPrompt);
    } else {
      setTransferredMessage(
        `Se han incorporado ${count} ambigüedad(es) al texto de requisitos. Puedes revisarlas o ajustarlas antes de re-analizar.`
      );
      setCurrentStep(1);
    }
  }

  // Cargar Fixture de Contingencia Offline
  async function handleLoadFixture(fixtureId: string) {
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      const res = await fetch(`/api/fixtures/${fixtureId}`);
      if (!res.ok) throw new Error('Fixture no encontrado');
      const json = await res.json();

      if (json.type === 'analysis') {
        const mockResponse: AIAnalysisResponse = {
          analysis: json.data as SystemAnalysis,
          provider: 'Fixture (Modo Contingencia)',
          model: 'Local Backup v1',
          durationMs: 45,
        };
        setAnalysisResult(mockResponse);
        setProjectName(mockResponse.analysis.systemName.toLowerCase());
        setCurrentStep(2);
      } else if (json.type === 'jdl') {
        setJdlCode(json.data);
        setOriginalJdl(json.data);
        setRepairAttempts(0);
        setRepairError(null);
        setRepairSuccess(false);
        const valRes = await fetch('/api/validate-jdl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jdl: json.data }),
        });
        const vData = await valRes.json();
        setValidation(vData);
        setCurrentStep(3);
      }
    } catch (err: any) {
      setAnalysisError(`Error al cargar fixture: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Cargar Proyecto Guardado desde el Almacenamiento
  function handleLoadSavedProject(saved: SavedProject) {
    if (saved.prompt) setPrompt(saved.prompt);
    if (saved.provider) setSelectedProvider(saved.provider);
    if (saved.name) setProjectName(saved.name);

    if (saved.analysis) {
      setAnalysisResult({
        analysis: saved.analysis,
        provider: saved.provider || 'Proyecto Guardado',
        model: 'Almacenamiento Local',
        durationMs: 0,
      });
    }

    if (saved.jdl) {
      setJdlCode(saved.jdl);
      setOriginalJdl(saved.jdl);
      handleValidateJdl(saved.jdl);
    }

    setCurrentStep(saved.currentStep || (saved.jdl ? 3 : saved.analysis ? 2 : 1));
  }

  // Mini-retos para cambiar el requerimiento en vivo
  function appendMiniChallenge(challengeText: string) {
    setPrompt((prev) => `${prev.trim()}\n\n[Requisito adicional]: ${challengeText}`);
  }

  // --- PASO 2: Generar JDL desde JSON ---
  async function handleGenerateJdl() {
    if (!analysisResult) return;
    setIsGeneratingJdl(true);

    try {
      const res = await fetch('/api/generate-jdl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: analysisResult.analysis,
          options: {
            includeApplicationConfig: true,
            baseName: analysisResult.analysis.systemName,
            includeDefaultOptions: true,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al generar JDL determinista.');
      }

      const data = await res.json();
      setJdlCode(data.jdl);
      setOriginalJdl(data.jdl);
      setValidation(data.validation);
      setRepairAttempts(0);
      setCurrentStep(3);
    } catch (err: any) {
      alert(`Error al generar JDL: ${err.message}`);
    } finally {
      setIsGeneratingJdl(false);
    }
  }

  // --- PASO 3: Validación y Reparación ---
  async function handleValidateJdl(codeToValidate?: string) {
    const code = codeToValidate || jdlCode;
    setIsValidating(true);
    try {
      const res = await fetch('/api/validate-jdl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdl: code }),
      });
      const data = await res.json();
      setValidation(data);
    } catch (err: any) {
      alert(`Error de validación: ${err.message}`);
    } finally {
      setIsValidating(false);
    }
  }

  async function handleAiRepair() {
    if (!validation) return;
    setIsRepairing(true);
    setRepairError(null);
    setRepairSuccess(false);

    try {
      const errorMessages = validation.errors.map((e) => e.message);
      const res = await fetch('/api/repair-jdl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentJdl: jdlCode,
          errors: errorMessages,
          analysis: analysisResult?.analysis,
          provider: selectedProvider,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error en reparación.');
      }

      const data = await res.json();
      if (data.repairedJdl) {
        setJdlCode(data.repairedJdl);
        setValidation(data.validation);
        setRepairAttempts((prev) => prev + 1);
        setRepairSuccess(true);
      }
    } catch (err: any) {
      console.error('Error en reparación con IA:', err);
      setRepairError(err.message || 'Error en comunicación con la IA.');
    } finally {
      setIsRepairing(false);
    }
  }

  function handleCopyJdl() {
    navigator.clipboard.writeText(jdlCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }

  function handleDownloadJdl() {
    const blob = new Blob([jdlCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName || 'modelo'}.jdl`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // --- PASO 4: Generación con JHipster ---
  async function handleLaunchJHipster() {
    setIsLaunchingJHipster(true);
    try {
      const res = await fetch('/api/jhipster/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          jdl: jdlCode,
          skipInstall: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al ejecutar JHipster.');
      }

      const job: GenerationJob = await res.json();
      setCurrentJob(job);
    } catch (err: any) {
      alert(`Error al iniciar JHipster: ${err.message}`);
    } finally {
      setIsLaunchingJHipster(false);
    }
  }

  return (
    <div className="container">
      {/* HEADER */}
      <header className="header">
        <div className="logo-badge">
          <div className="brand-icon">
            <Cpu size={24} />
          </div>
          <div>
            <h1 className="brand-title">JHipster AI Studio</h1>
            <p className="brand-subtitle">
              Tú describes. La IA modela. Tú validas. JHipster construye.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => setIsProjectsModalOpen(true)}
            title="Ver y cargar proyectos guardados"
          >
            <FolderArchive size={14} color="#818cf8" /> Mis Proyectos
          </button>

          <button
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => setIsProjectsModalOpen(true)}
            title="Guardar el estado del proyecto actual"
          >
            <Save size={14} color="#34d399" /> Guardar
          </button>

          <span className="badge badge-info">
            <Sparkles size={12} /> JDL Generator v1.0
          </span>

          <button
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => {
              if (confirm('¿Deseas reiniciar el flujo desde el principio?')) {
                setCurrentStep(1);
                setCurrentJob(null);
              }
            }}
          >
            <RotateCcw size={14} /> Reiniciar
          </button>
        </div>
      </header>

      {/* STEPPER NAVEGACIÓN */}
      <nav className="stepper">
        <div
          className={`step-item ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
          onClick={() => setCurrentStep(1)}
        >
          <div className="step-number">{currentStep > 1 ? '✓' : '1'}</div>
          <div className="step-label">1. Requisitos</div>
        </div>

        <div
          className={`step-item ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
          onClick={() => analysisResult && setCurrentStep(2)}
        >
          <div className="step-number">{currentStep > 2 ? '✓' : '2'}</div>
          <div className="step-label">2. Análisis Estructurado</div>
        </div>

        <div
          className={`step-item ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}
          onClick={() => jdlCode && setCurrentStep(3)}
        >
          <div className="step-number">{currentStep > 3 ? '✓' : '3'}</div>
          <div className="step-label">3. Editor & Validador JDL</div>
        </div>

        <div
          className={`step-item ${currentStep === 4 ? 'active' : ''} ${currentJob?.status === 'completed' ? 'completed' : ''}`}
          onClick={() => validation?.isValid && setCurrentStep(4)}
        >
          <div className="step-number">4</div>
          <div className="step-label">4. JHipster</div>
        </div>
      </nav>

      {/* ============================================================
          PANTALLA 1: INICIO Y REQUERIMIENTOS
         ============================================================ */}
      {currentStep === 1 && (
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 className="card-title">
                <BookOpen size={20} color="#818cf8" /> Describe tu sistema en lenguaje natural
              </h2>
              <p className="card-description">
                La IA interpretará los requisitos para identificar entidades, tipos de datos, relaciones y posibles ambigüedades.
              </p>
            </div>

            {/* Selector de Motor de IA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Motor de IA:
              </label>
              <select
                className="select"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
              >
                <option value="auto">Automático (Prioriza activo / Fallback)</option>
                {providers.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name.toUpperCase()} {p.isAvailable ? `(${p.model})` : '— [No disponible]'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notificación de ambigüedades transferidas */}
          {transferredMessage && (
            <div
              style={{
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                color: '#6ee7b7',
                fontSize: '0.88rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="#34d399" />
                <span>{transferredMessage}</span>
              </div>
              <button
                className="btn btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.78rem', height: 'auto' }}
                onClick={() => setTransferredMessage(null)}
              >
                Cerrar aviso
              </button>
            </div>
          )}

          {/* Textarea de requerimiento */}
          <textarea
            className="textarea"
            placeholder="Ejemplo: Deseo un sistema para gestionar una biblioteca con libros, autores, usuarios y préstamos..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          {/* Ejemplos rápidos predefinidos */}
          <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Ejemplos rápidos:
            </span>
            <button
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => setPrompt(DEMO_PROMPTS.library)}
            >
              <BookOpen size={14} /> Biblioteca
            </button>
            <button
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => setPrompt(DEMO_PROMPTS.veterinary)}
            >
              <Stethoscope size={14} /> Clínica Veterinaria
            </button>
            <button
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => setPrompt(DEMO_PROMPTS.inventory)}
            >
              <Package size={14} /> Inventario
            </button>

            {/* Mini-retos para dinámica en clase */}
            <span style={{ fontSize: '0.82rem', color: '#a78bfa', fontWeight: 600, marginLeft: '12px' }}>
              Mini-retos:
            </span>
            <button
              className="btn btn-outline"
              style={{ padding: '6px 10px', fontSize: '0.78rem', borderColor: '#4338ca' }}
              onClick={() => appendMiniChallenge('Ahora un libro puede tener varios autores y cada autor varias nacionalidades.')}
            >
              + Varios autores
            </button>
            <button
              className="btn btn-outline"
              style={{ padding: '6px 10px', fontSize: '0.78rem', borderColor: '#4338ca' }}
              onClick={() => appendMiniChallenge('Una mascota puede tener un historial de tratamientos con fecha de inicio y fin.')}
            >
              + Historial tratamientos
            </button>
          </div>

          {/* Alertas de error si falla la IA */}
          {analysisError && (
            <div style={{ marginTop: '16px' }} className="observation-box">
              <AlertTriangle size={18} color="#ef4444" />
              <div>
                <strong style={{ color: '#f87171' }}>Error al conectar con la IA:</strong> {analysisError}
                <div style={{ marginTop: '6px', fontSize: '0.82rem' }}>
                  Puedes usar el <strong>Modo Contingencia</strong> abajo para cargar datos de respaldo sin depender de la conexión.
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción principales */}
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-outline"
                style={{ fontSize: '0.82rem' }}
                onClick={() => handleLoadFixture('library')}
              >
                Cargar Fixture Biblioteca
              </button>
              <button
                className="btn btn-outline"
                style={{ fontSize: '0.82rem' }}
                onClick={() => handleLoadFixture('veterinary')}
              >
                Cargar Fixture Veterinaria
              </button>
              <button
                className="btn btn-outline"
                style={{ fontSize: '0.82rem' }}
                onClick={() => handleLoadFixture('inventory')}
              >
                Cargar Fixture Inventario
              </button>
            </div>

            <button
              className="btn btn-primary"
              disabled={isAnalyzing || !prompt.trim()}
              onClick={handleAnalyze}
            >
              {isAnalyzing ? (
                <>
                  <div className="spinner" /> Analizando con IA...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Analizar Sistema con IA <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {/* ============================================================
          PANTALLA 2: ANÁLISIS ESTRUCTURADO Y OBSERVACIONES
         ============================================================ */}
      {currentStep === 2 && analysisResult && (
        <div>
          {/* Metadatos del análisis */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: '#312e81', padding: '8px', borderRadius: '8px' }}>
                <Layers size={22} color="#a5b4fc" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  Modelo Estructurado: {analysisResult.analysis.systemName}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Generado por <strong>{analysisResult.provider}</strong> ({analysisResult.model}) en{' '}
                  <strong>{analysisResult.durationMs}ms</strong>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => setCurrentStep(1)}>
                Editar Requisitos
              </button>
              <button
                className="btn btn-primary"
                disabled={isGeneratingJdl}
                onClick={handleGenerateJdl}
              >
                {isGeneratingJdl ? (
                  <>
                    <div className="spinner" /> Generando JDL...
                  </>
                ) : (
                  <>
                    Generar JDL Candidato <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Panel de Observaciones y Ambigüedades (Regla Clave del Documento) */}
          <section className="card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 className="card-title" style={{ color: '#fbbf24' }}>
                  <AlertTriangle size={20} color="#fbbf24" /> Observaciones y Ambigüedades Detectadas
                </h3>
                <p className="card-description" style={{ marginBottom: '10px' }}>
                  La IA no inventa decisiones de negocio en silencio. Selecciona las ambigüedades que deseas resolver para transferirlas a la descripción o re-analizar:
                </p>
              </div>

              {analysisResult.analysis.observations && analysisResult.analysis.observations.length > 0 && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                    onClick={handleSelectAllObservations}
                  >
                    Seleccionar todas
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                    onClick={handleDeselectAllObservations}
                  >
                    Deseleccionar
                  </button>
                </div>
              )}
            </div>

            <div className="observations-container">
              {analysisResult.analysis.observations && analysisResult.analysis.observations.length > 0 ? (
                analysisResult.analysis.observations.map((obs, idx) => {
                  const isSelected = Boolean(selectedObservations[idx]);
                  return (
                    <div
                      key={idx}
                      className={`observation-box ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="observation-header">
                        <input
                          type="checkbox"
                          className="observation-checkbox"
                          id={`obs-check-${idx}`}
                          checked={isSelected}
                          onChange={() => toggleObservation(idx)}
                        />
                        <label
                          htmlFor={`obs-check-${idx}`}
                          className="observation-text"
                          style={{ cursor: 'pointer' }}
                        >
                          {obs}
                        </label>
                      </div>

                      {/* Input opcional para especificar cómo solventar la ambigüedad */}
                      {isSelected && (
                        <div className="observation-resolution-box">
                          <label style={{ fontSize: '0.78rem', color: '#fde68a', fontWeight: 600 }}>
                            ¿Cómo deseas solventar esta ambigüedad? (opcional):
                          </label>
                          <input
                            type="text"
                            className="observation-input"
                            placeholder="Ej: Sí, permitir que un libro tenga varios autores / Sí, un cliente puede pagar en cuotas..."
                            value={observationResolutions[idx] || ''}
                            onChange={(e) => handleResolutionChange(idx, e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  No se registraron ambigüedades críticas en la descripción.
                </div>
              )}
            </div>

            {/* Barra de acción cuando hay ambigüedades seleccionadas */}
            {Object.values(selectedObservations).filter(Boolean).length > 0 && (
              <div className="observation-actions-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-warning" style={{ fontSize: '0.82rem' }}>
                    {Object.values(selectedObservations).filter(Boolean).length} seleccionada(s)
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Listo para incorporar a los requisitos
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem' }}
                    onClick={() => handleApplyObservationsToRequirements(false)}
                  >
                    Transferir a Requisitos y Editar ➔
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '0.85rem' }}
                    disabled={isAnalyzing}
                    onClick={() => handleApplyObservationsToRequirements(true)}
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="spinner" /> Re-analizando...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} /> Re-analizar con estas soluciones ⚡
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Entidades Detectadas */}
          <section className="card">
            <h3 className="card-title">
              <Database size={20} color="#38bdf8" /> Entidades y Atributos ({analysisResult.analysis.entities.length})
            </h3>
            <div className="entities-grid">
              {analysisResult.analysis.entities.map((entity, idx) => (
                <div key={idx} className="entity-card">
                  <div className="entity-header">
                    <span className="entity-name">{entity.name}</span>
                    <span className="badge badge-info">{entity.fields.length} campos</span>
                  </div>
                  {entity.fields.map((field, fIdx) => (
                    <div key={fIdx} className="field-row">
                      <span className="field-name">{field.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="field-type">{field.type}</span>
                        {field.required && (
                          <span style={{ color: '#f87171', fontSize: '0.7rem', fontWeight: 700 }}>*</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* Diagrama Interactivo de Base de Datos (Mermaid ERD con Pan, Zoom y Fullscreen) */}
          <DatabaseDiagram analysis={analysisResult.analysis} />
        </div>
      )}

      {/* ============================================================
          PANTALLA 3: EDITOR Y VALIDADOR DE JDL
         ============================================================ */}
      {currentStep === 3 && (
        <div>
          <div className="jdl-editor-container">
            {/* Editor de código JDL */}
            <section className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 className="card-title" style={{ margin: 0 }}>
                  <Code2 size={20} color="#818cf8" /> Editor de Modelo JDL
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleCopyJdl}>
                    <Copy size={14} /> {copySuccess ? 'Copiado!' : 'Copiar'}
                  </button>
                  <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleDownloadJdl}>
                    <Download size={14} /> Descargar .jdl
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => {
                      setJdlCode(originalJdl);
                      handleValidateJdl(originalJdl);
                    }}
                  >
                    <RotateCcw size={14} /> Restablecer
                  </button>
                </div>
              </div>

              <textarea
                className="code-editor"
                value={jdlCode}
                onChange={(e) => {
                  setJdlCode(e.target.value);
                  handleValidateJdl(e.target.value);
                }}
              />
            </section>

            {/* Panel de Validación y Acciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Estado de Validación JDL</span>
                  {isValidating && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Validando...</span>}
                </h4>

                {validation?.isValid ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="badge badge-success" style={{ padding: '8px 14px', fontSize: '0.88rem' }}>
                      <CheckCircle2 size={16} /> JDL Válido para JHipster
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      • Entidades válidas: <strong>{validation.entitiesFound.join(', ')}</strong><br />
                      • Relaciones verificadas: <strong>{validation.relationshipsFound}</strong>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="badge badge-danger" style={{ padding: '8px 14px', fontSize: '0.88rem' }}>
                      <XCircle size={16} /> Errores detectados ({validation?.errors.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {validation?.errors.map((err, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '8px 10px',
                            background: 'rgba(239, 68, 68, 0.08)',
                            borderLeft: '3px solid #ef4444',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            color: '#fca5a5',
                          }}
                        >
                          {err.message}
                        </div>
                      ))}
                    </div>

                    {/* Alerta de error si falla la reparación */}
                    {repairError && (
                      <div
                        style={{
                          padding: '10px 12px',
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          color: '#fca5a5',
                        }}
                      >
                        <strong>Error en reparación:</strong> {repairError}
                      </div>
                    )}

                    {/* Alerta de éxito de reparación */}
                    {repairSuccess && (
                      <div
                        style={{
                          padding: '10px 12px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          color: '#6ee7b7',
                        }}
                      >
                        ✓ JDL corregido con éxito por el motor de IA.
                      </div>
                    )}

                    {/* Botón de auto-reparación asistida */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                        disabled={isRepairing}
                        onClick={handleAiRepair}
                      >
                        {isRepairing ? (
                          <>
                            <div className="spinner" /> Corrigiendo con IA...
                          </>
                        ) : (
                          <>
                            <Wrench size={16} /> Corregir con IA ({repairAttempts}/2 intentos)
                          </>
                        )}
                      </button>

                      {repairAttempts >= 2 && (
                        <button
                          className="btn btn-outline"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                          title="Restablecer intentos de corrección"
                          onClick={() => setRepairAttempts(0)}
                        >
                          <RotateCcw size={14} /> Reintentar
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    className="btn btn-outline"
                    style={{ width: '100%', fontSize: '0.82rem' }}
                    onClick={() => handleLoadFixture('invalid')}
                  >
                    Simular Caso Inválido de Prueba
                  </button>
                </div>
              </div>

              {/* Botón de Aprobación Humana Explícita (Sección 15) */}
              <div className="card" style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.06)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                  Aprobación Humana
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Revisa el modelo generado. Una vez conforme, procede a enviarlo al generador oficial de JHipster.
                </p>

                <button
                  className="btn btn-success"
                  style={{ width: '100%', padding: '12px' }}
                  disabled={!validation?.isValid}
                  onClick={() => setCurrentStep(4)}
                >
                  Usar este JDL con JHipster 🚀
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          PANTALLA 4: JHIPSTER RUNNER Y GENERACIÓN DE APLICACIÓN
         ============================================================ */}
      {currentStep === 4 && (
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 className="card-title">
                <Terminal size={22} color="#10b981" /> Generación de Aplicación con JHipster
              </h2>
              <p className="card-description">
                JHipster transformará el modelo JDL en una aplicación completa (Backend Spring Boot, Frontend React/Angular, Base de datos y pruebas).
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Nombre del proyecto:
              </label>
              <input
                type="text"
                className="select"
                style={{ cursor: 'text', width: '180px' }}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
              <button
                className="btn btn-primary"
                disabled={isLaunchingJHipster || currentJob?.status === 'running'}
                onClick={handleLaunchJHipster}
              >
                {isLaunchingJHipster ? (
                  <>
                    <div className="spinner" /> Iniciando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} /> Generar Aplicación
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stepper del proceso JHipster */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div style={{ padding: '12px', background: '#131c2e', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paso 1</div>
              <div style={{ fontWeight: 600, color: '#34d399' }}>✓ JDL Validado</div>
            </div>
            <div style={{ padding: '12px', background: '#131c2e', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paso 2</div>
              <div style={{ fontWeight: 600, color: currentJob ? '#38bdf8' : 'var(--text-dim)' }}>
                {currentJob ? '✓ Modelo Guardado' : 'Pendiente'}
              </div>
            </div>
            <div style={{ padding: '12px', background: '#131c2e', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paso 3</div>
              <div style={{ fontWeight: 600, color: currentJob?.status === 'running' ? '#fbbf24' : currentJob?.status === 'completed' ? '#34d399' : 'var(--text-dim)' }}>
                {currentJob?.status === 'running' ? '⏳ Generando código...' : currentJob?.status === 'completed' ? '✓ Código Generado' : 'Pendiente'}
              </div>
            </div>
            <div style={{ padding: '12px', background: '#131c2e', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paso 4</div>
              <div style={{ fontWeight: 600, color: currentJob?.status === 'completed' ? '#34d399' : 'var(--text-dim)' }}>
                {currentJob?.status === 'completed' ? '✓ Listo para entrega' : 'Pendiente'}
              </div>
            </div>
          </div>

          {/* Consola de logs en vivo */}
          <div className="terminal">
            {currentJob?.logs && currentJob.logs.length > 0 ? (
              currentJob.logs.map((line, idx) => (
                <div
                  key={idx}
                  className={`terminal-line ${line.includes('ERROR') ? 'error' : line.includes('éxito') ? 'success' : ''}`}
                >
                  {line}
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-dim)' }}>
                Presiona "Generar Aplicación" para ejecutar JHipster sobre este modelo JDL o descarga el archivo directamente.
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>

          {/* Estado final y descarga */}
          {currentJob?.status === 'completed' && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px 20px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h4 style={{ color: '#34d399', fontWeight: 700 }}>¡Proyecto generado con éxito!</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Ubicación de salida en el disco: <code>{currentJob.outputPath}</code>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={`/api/jhipster/download/${projectName}`}
                  download={`${projectName}.jdl`}
                  className="btn btn-outline"
                >
                  <FolderDown size={16} /> Descargar .jdl Oficial
                </a>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setCurrentStep(1);
                    setCurrentJob(null);
                  }}
                >
                  Crear Otro Sistema
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* MODAL DE ALMACENAMIENTO DE MÚLTIPLES PROYECTOS */}
      <ProjectManagerModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        currentPrompt={prompt}
        currentAnalysis={analysisResult?.analysis || null}
        currentJdl={jdlCode}
        currentProvider={selectedProvider}
        currentStep={currentStep}
        onLoadProject={handleLoadSavedProject}
      />
    </div>
  );
}
