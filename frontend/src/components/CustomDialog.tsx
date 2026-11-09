import { useState, useCallback, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type DialogVariant = 'info' | 'warning' | 'danger' | 'success';

export interface DialogConfig {
  type: 'alert' | 'confirm';
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function useCustomDialog() {
  const [dialogConfig, setDialogConfig] = useState<DialogConfig | null>(null);

  const closeDialog = useCallback(() => {
    setDialogConfig(null);
  }, []);

  const showAlert = useCallback(
    (options: {
      title: string;
      message: string;
      variant?: DialogVariant;
      confirmText?: string;
    }) => {
      setDialogConfig({
        type: 'alert',
        title: options.title,
        message: options.message,
        variant: options.variant || 'info',
        confirmText: options.confirmText || 'Aceptar',
      });
    },
    []
  );

  const showConfirm = useCallback(
    (options: {
      title: string;
      message: string;
      variant?: DialogVariant;
      confirmText?: string;
      cancelText?: string;
      onConfirm: () => void;
      onCancel?: () => void;
    }) => {
      setDialogConfig({
        type: 'confirm',
        title: options.title,
        message: options.message,
        variant: options.variant || 'warning',
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        onConfirm: options.onConfirm,
        onCancel: options.onCancel,
      });
    },
    []
  );

  return {
    dialogConfig,
    closeDialog,
    showAlert,
    showConfirm,
  };
}

interface CustomDialogProps {
  config: DialogConfig | null;
  onClose: () => void;
}

export function CustomDialog({ config, onClose }: CustomDialogProps) {
  useEffect(() => {
    if (!config) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (config?.onCancel) config.onCancel();
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config, onClose]);

  if (!config) return null;

  const variant = config.variant || 'info';

  const variantStyles: Record<
    DialogVariant,
    {
      borderColor: string;
      iconBg: string;
      iconBorder: string;
      titleColor: string;
      confirmBtnClass: string;
      confirmBtnStyle?: React.CSSProperties;
      icon: React.ReactNode;
    }
  > = {
    danger: {
      borderColor: 'rgba(239, 68, 68, 0.4)',
      iconBg: 'rgba(239, 68, 68, 0.12)',
      iconBorder: 'rgba(239, 68, 68, 0.3)',
      titleColor: '#fca5a5',
      confirmBtnClass: 'btn btn-danger',
      confirmBtnStyle: {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
      },
      icon: <XCircle size={24} color="#f87171" />,
    },
    warning: {
      borderColor: 'rgba(245, 158, 11, 0.4)',
      iconBg: 'rgba(245, 158, 11, 0.12)',
      iconBorder: 'rgba(245, 158, 11, 0.3)',
      titleColor: '#fde68a',
      confirmBtnClass: 'btn btn-primary',
      confirmBtnStyle: {
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
      },
      icon: <AlertTriangle size={24} color="#fbbf24" />,
    },
    success: {
      borderColor: 'rgba(16, 185, 129, 0.4)',
      iconBg: 'rgba(16, 185, 129, 0.12)',
      iconBorder: 'rgba(16, 185, 129, 0.3)',
      titleColor: '#6ee7b7',
      confirmBtnClass: 'btn btn-success',
      icon: <CheckCircle2 size={24} color="#34d399" />,
    },
    info: {
      borderColor: 'rgba(99, 102, 241, 0.4)',
      iconBg: 'rgba(99, 102, 241, 0.12)',
      iconBorder: 'rgba(99, 102, 241, 0.3)',
      titleColor: '#c7d2fe',
      confirmBtnClass: 'btn btn-primary',
      icon: <Info size={24} color="#818cf8" />,
    },
  };

  const currentStyle = variantStyles[variant];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(5, 8, 15, 0.78)',
        backdropFilter: 'blur(6px)',
        zIndex: 20000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={() => {
        if (config.onCancel) config.onCancel();
        onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          margin: 0,
          padding: '22px 24px',
          background: '#0e1526',
          border: `1px solid ${currentStyle.borderColor}`,
          boxShadow: '0 22px 50px rgba(0, 0, 0, 0.7)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="btn btn-outline"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            padding: '5px',
            border: 'none',
          }}
          onClick={() => {
            if (config.onCancel) config.onCancel();
            onClose();
          }}
          title="Cerrar"
        >
          <X size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: currentStyle.iconBg,
              border: `1px solid ${currentStyle.iconBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {currentStyle.icon}
          </div>

          <div style={{ flex: 1, paddingRight: '16px' }}>
            <h4
              style={{
                fontSize: '1.02rem',
                fontWeight: 700,
                color: currentStyle.titleColor,
                marginBottom: '6px',
              }}
            >
              {config.title}
            </h4>
            <p
              style={{
                fontSize: '0.88rem',
                color: 'var(--text-main)',
                lineHeight: 1.5,
                opacity: 0.9,
              }}
            >
              {config.message}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '22px',
          }}
        >
          {config.type === 'confirm' && (
            <button
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => {
                if (config.onCancel) config.onCancel();
                onClose();
              }}
            >
              {config.cancelText || 'Cancelar'}
            </button>
          )}

          <button
            className={currentStyle.confirmBtnClass}
            style={{
              padding: '8px 18px',
              fontSize: '0.85rem',
              ...currentStyle.confirmBtnStyle,
            }}
            onClick={() => {
              if (config.onConfirm) config.onConfirm();
              onClose();
            }}
          >
            {config.confirmText || 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
}

