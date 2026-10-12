import { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Move,
  Download,
  Database,
} from 'lucide-react';
import type { SystemAnalysis } from '../types';

interface DatabaseDiagramProps {
  analysis: SystemAnalysis;
}

export function DatabaseDiagram({ analysis }: DatabaseDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Estados de transformación (Pan & Zoom)
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const rawUniqueId = useId().replace(/:/g, '_');
  const diagramId = `mermaid_erd_${rawUniqueId}`;

  // Inicializar Mermaid con tema oscuro moderno
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: '#0d131f',
        primaryColor: '#312e81',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#6366f1',
        lineColor: '#818cf8',
        secondaryColor: '#1e293b',
        tertiaryColor: '#0f172a',
      },
      er: {
        useMaxWidth: false,
      },
    });
  }, []);

  // Generar código Mermaid ERD a partir del SystemAnalysis
  function generateMermaidCode(): string {
    const lines: string[] = ['erDiagram'];

    // 1. Entidades y atributos
    for (const entity of analysis.entities) {
      const cleanEntityName = entity.name.replace(/[^a-zA-Z0-9_]/g, '');
      lines.push(`  ${cleanEntityName} {`);
      for (const field of entity.fields) {
        const cleanType = (field.type || 'String').replace(/[^a-zA-Z0-9_]/g, '');
        const cleanName = field.name.replace(/[^a-zA-Z0-9_]/g, '');
        lines.push(`    ${cleanType} ${cleanName}`);
      }
      lines.push('  }');
    }

    // 2. Relaciones
    if (analysis.relationships && analysis.relationships.length > 0) {
      for (const rel of analysis.relationships) {
        const from = rel.from.replace(/[^a-zA-Z0-9_]/g, '');
        const to = rel.to.replace(/[^a-zA-Z0-9_]/g, '');
        const label = (rel.description || 'relacion')
          .replace(/[^a-zA-Z0-9_]/g, '_')
          .substring(0, 20);

        let symbol = '||--o{';
        switch (rel.type.toLowerCase()) {
          case 'one-to-one':
            symbol = '||--||';
            break;
          case 'one-to-many':
            symbol = '||--o{';
            break;
          case 'many-to-one':
            symbol = '}o--||';
            break;
          case 'many-to-many':
            symbol = '}o--o{';
            break;
          default:
            symbol = '||--o{';
        }

        lines.push(`  ${from} ${symbol} ${to} : "${label}"`);
      }
    }

    return lines.join('\n');
  }

  // Renderizar SVG con Mermaid
  useEffect(() => {
    let isMounted = true;
    async function renderDiagram() {
      try {
        setError(null);
        const code = generateMermaidCode();
        const renderId = `${diagramId}_${Date.now()}`;
        const { svg } = await mermaid.render(renderId, code);
        if (isMounted) {
          setSvgContent(svg);
          // Centrar vista al cargar
          setPan({ x: 0, y: 0 });
          setZoom(1);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Error renderizando Mermaid ERD:', err);
          setError(err.message || 'Error al compilar diagrama');
        }
      }
    }

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [analysis]);

  // Manejo de Zoom
  function handleZoomIn() {
    setZoom((prev) => Math.min(prev + 0.2, 3));
  }

  function handleZoomOut() {
    setZoom((prev) => Math.max(prev - 0.2, 0.4));
  }

  function handleResetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  // Manejo de Arrastre / Pan
  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return; // Solo click principal
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(Math.max(prev + zoomDelta, 0.4), 3));
  }

  // Descargar SVG
  function handleDownloadSvg() {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${analysis.systemName.toLowerCase()}_diagrama_bd.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className={`card ${isFullscreen ? 'diagram-fullscreen-modal' : ''}`}
      style={{
        padding: isFullscreen ? '24px' : '20px',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
        background: isFullscreen ? 'rgba(11, 15, 25, 0.96)' : 'var(--bg-card)',
        backdropFilter: isFullscreen ? 'blur(16px)' : 'blur(12px)',
        margin: 0,
      }}
    >
      {/* Encabezado y Barra de Herramientas de Movilización/Zoom */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '14px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Database size={20} color="#818cf8" />
          <h3 className="card-title" style={{ margin: 0, fontSize: '1.05rem' }}>
            Diagrama de Base de Datos (ERD Interactivo)
          </h3>
          <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
            <Move size={12} /> Arrastrable & Zoom
          </span>
        </div>

        {/* Controles de Navegación del Diagrama */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-outline"
            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
            title="Aumentar Zoom"
            onClick={handleZoomIn}
          >
            <ZoomIn size={15} />
          </button>
          <button
            className="btn btn-outline"
            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
            title="Disminuir Zoom"
            onClick={handleZoomOut}
          >
            <ZoomOut size={15} />
          </button>
          <button
            className="btn btn-outline"
            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
            title="Centrar y Restablecer Vista"
            onClick={handleResetView}
          >
            <RotateCcw size={15} /> {Math.round(zoom * 100)}%
          </button>
          <button
            className="btn btn-outline"
            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
            title="Descargar diagrama SVG"
            onClick={handleDownloadSvg}
          >
            <Download size={15} />
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Expandir diagrama'}
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <>
                <Minimize2 size={15} /> Reducir
              </>
            ) : (
              <>
                <Maximize2 size={15} /> Agrandar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instrucción sutil para el usuario */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
          marginBottom: '8px',
        }}
      >
        <span>💡 Mantén presionado el botón izquierdo del ratón para mover el diagrama. Usa la rueda para hacer zoom.</span>
        <span>{analysis.entities.length} tablas • {analysis.relationships.length} relaciones</span>
      </div>

      {/* Canvas del Diagrama Interactivo */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: isFullscreen ? 'calc(100vh - 120px)' : '460px',
          background: '#090d16',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          position: 'relative',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {error ? (
          <div
            style={{
              padding: '24px',
              color: '#f87171',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            Error generando el diagrama: {error}
          </div>
        ) : (
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '100%',
              minHeight: '100%',
              padding: '40px',
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>
    </div>
  );
}
