const colors = {
  NUEVO: 'bg-blue-100 text-blue-800',
  CONTACTADO: 'bg-yellow-100 text-yellow-800',
  EN_SEGUIMIENTO: 'bg-indigo-100 text-indigo-800',
  ATENDIDO: 'bg-blue-100 text-blue-800',
  FINALIZADO: 'bg-gray-100 text-gray-700',
  PROGRAMADA: 'bg-blue-100 text-blue-800',
  EN_CURSO: 'bg-yellow-100 text-yellow-800',
  COMPLETADA: 'bg-blue-100 text-blue-800',
  CANCELADA: 'bg-red-100 text-red-800',
  ACTIVA: 'bg-blue-100 text-blue-800',
  ESCALADA: 'bg-orange-100 text-orange-800',
  CERRADA: 'bg-gray-100 text-gray-700',
  REGISTRADO: 'bg-blue-100 text-blue-800',
  CONFIRMADO: 'bg-blue-100 text-blue-800',
  ASISTIO: 'bg-blue-100 text-blue-800',
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  EN_PROGRESO: 'bg-indigo-100 text-indigo-800',
  COMPLETADO: 'bg-blue-100 text-blue-800',
  CANCELADO: 'bg-red-100 text-red-800',
  CAPACITACION: 'bg-blue-100 text-blue-800',
  TALLER: 'bg-indigo-100 text-indigo-800',
  FORO: 'bg-purple-100 text-purple-800',
  ACTIVIDAD_CAMPO: 'bg-blue-100 text-blue-800',
  PRESENCIAL: 'bg-blue-100 text-blue-800',
  VIRTUAL: 'bg-purple-100 text-purple-800',
  HIBRIDA: 'bg-yellow-100 text-yellow-800',
  ADMIN: 'bg-red-100 text-red-800',
  COLABORADOR: 'bg-indigo-100 text-indigo-800',
  CLIENTE: 'bg-blue-100 text-blue-800',
};

export default function Badge({ children, variant, className = '' }) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  const color = variant && colors[variant] ? colors[variant] : 'bg-gray-100 text-gray-700';
  return <span className={`${base} ${color} ${className}`}>{children}</span>;
}