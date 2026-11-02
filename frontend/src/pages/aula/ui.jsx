export const ICONS = {
  DOCUMENTO: 'M7 21h10a2 2 0 002-2V9l-6-6H7a2 2 0 00-2 2v14a2 2 0 002 2zm5-14V3l5 5h-4a1 1 0 01-1-1z',
  PRESENTACION: 'M9 17V7a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2zM5 10h3v7H5zM16 12h3v5h-3z',
  ENLACE: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6v6M10 14L20 4',
  QUIZ: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  CHEVRON: 'M19 9l-7 7-7-7',
  LOCK: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  CHECK: 'M5 13l4 4L19 7',
};

export function Icon({ d, className = 'h-5 w-5' }) {
  return (
    <svg className={`${className} shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}

export const typeLabels = { DOCUMENTO: 'Documento', PRESENTACION: 'Presentación', ENLACE: 'Enlace' };

export const moduleStatusLabels = {
  BLOQUEADO: 'Bloqueado',
  EN_PROGRESO: 'En progreso',
  PENDIENTE_CUESTIONARIO: 'Pendiente de cuestionario',
  COMPLETADO: 'Completado',
  SIN_CONTENIDO: 'Sin contenido',
};

export const moduleStatusStyles = {
  BLOQUEADO: 'bg-gray-200 text-gray-600',
  EN_PROGRESO: 'bg-blue-100 text-blue-800',
  PENDIENTE_CUESTIONARIO: 'bg-amber-100 text-amber-800',
  COMPLETADO: 'bg-green-100 text-green-800',
  SIN_CONTENIDO: 'bg-gray-100 text-gray-600',
};

export function ProgressBar({ percent, tone = 'primary', className = '' }) {
  const color = tone === 'green' ? 'bg-green-600' : 'bg-primary-600';
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

export function StatusPill({ tone, children }) {
  const styles = {
    done: 'bg-green-100 text-green-800',
    pending: 'bg-gray-100 text-gray-600',
    info: 'bg-blue-100 text-blue-800',
    warn: 'bg-amber-100 text-amber-800',
    locked: 'bg-gray-200 text-gray-600',
  };
  return (
    <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[tone]}`}>
      {children}
    </span>
  );
}
