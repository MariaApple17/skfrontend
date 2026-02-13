import React, {
  useEffect,
  useState,
} from 'react';

import {
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
} from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertModalProps {
  open: boolean;
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  loading?: boolean;
  confirmDisabled?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}

/* ===============================
   THEME CONFIG
================================ */
const THEME_CONFIG = {
  success: {
    icon: CheckCircle,
    gradient: 'from-emerald-500 to-green-600',
    glow: 'shadow-emerald-500/50',
    lightBg: 'bg-emerald-50',
    ring: 'ring-emerald-200',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
  },
  error: {
    icon: XCircle,
    gradient: 'from-rose-500 to-red-600',
    glow: 'shadow-rose-500/50',
    lightBg: 'bg-rose-50',
    ring: 'ring-rose-200',
    iconBg: 'bg-gradient-to-br from-rose-500 to-red-600',
  },
  warning: {
    icon: AlertTriangle,
    gradient: 'from-orange-500 to-amber-600',
    glow: 'shadow-orange-500/50',
    lightBg: 'bg-orange-50',
    ring: 'ring-orange-200',
    iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600',
  },
  info: {
    icon: Info,
    gradient: 'from-sky-500 to-blue-600',
    glow: 'shadow-sky-500/50',
    lightBg: 'bg-sky-50',
    ring: 'ring-sky-200',
    iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600',
  },
} as const;

/* ===============================
   LOADING SPINNER
================================ */
const Spinner = () => (
  <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
);

/* ===============================
   COMPONENT
================================ */
const AlertModal: React.FC<AlertModalProps> = ({
  open,
  title,
  message,
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showCancel = false,
  loading = false,
  confirmDisabled = false,
  onConfirm,
  onClose,
  children,
}) => {
  const [mounted, setMounted] = useState(open);
  const [animating, setAnimating] = useState(false);

  const theme = THEME_CONFIG[type];
  const Icon = theme.icon;

  /* ===============================
     OPEN / CLOSE ANIMATION
  ================================ */
  useEffect(() => {
    if (open) {
      setMounted(true);
      setTimeout(() => setAnimating(true), 10);
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setMounted(false), 250);
      return () => clearTimeout(timer);
    }
  }, [open]);

  /* ===============================
     BODY SCROLL LOCK
  ================================ */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  /* ===============================
     BACKDROP CLICK
  ================================ */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  if (!mounted) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-slate-950/90
        backdrop-blur-md
        transition-opacity duration-250
        ${animating ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div
        className={`
          relative w-full max-w-sm
          bg-white rounded-3xl
          shadow-2xl shadow-black/50
          overflow-hidden
          transform transition-all duration-300 ease-out
          ${animating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-8'}
        `}
      >
        {/* TOP BAR */}
        <div className={`h-2 bg-gradient-to-r ${theme.gradient}`} />

        <div className="p-8">
          {/* ICON / LOADING */}
          <div className="flex justify-center mb-6">
            <div className={`${theme.lightBg} ${theme.ring} ring-4 p-4 rounded-2xl`}>
              <div className={`${theme.iconBg} p-3 rounded-xl shadow-lg ${theme.glow}`}>
                {loading ? (
                  <Spinner />
                ) : (
                  <Icon className="w-10 h-10 text-white" strokeWidth={2.5} />
                )}
              </div>
            </div>
          </div>

          {/* TEXT */}
          <div className="text-center space-y-3 mb-6">
            {title && <h3 className="text-2xl font-bold text-slate-900">{title}</h3>}
            <p className="text-slate-600 text-base">
              {loading ? 'Processing your request…' : message}
            </p>
          </div>

          {children && <div className="mb-6">{children}</div>}

          {/* ACTIONS */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={onConfirm}
              disabled={loading || confirmDisabled}
              className={`
                w-full py-3.5 rounded-xl font-semibold text-white
                bg-gradient-to-r ${theme.gradient}
                shadow-lg ${theme.glow}
                hover:shadow-xl
                active:scale-98
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-200
              `}
            >
              {loading ? 'Please wait…' : confirmText}
            </button>

            {showCancel && (
              <button
                onClick={onClose}
                disabled={loading}
                className="
                  w-full py-3.5 rounded-xl font-medium
                  bg-slate-100 text-slate-700
                  hover:bg-slate-200
                  active:scale-98
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              >
                {cancelText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;