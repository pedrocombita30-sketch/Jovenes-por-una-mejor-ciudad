import { useState } from 'react';
import { Icon, ICONS, typeLabels, StatusPill } from './ui';

// Tema o actividad del módulo. Se despliega para mostrar su material debajo del título.
// - PDF: visor integrado en la página (y opción de abrir en pestaña nueva).
// - Imagen: vista previa.
// - Otros archivos: nombre, tipo y acciones (abrir / descargar).
// - Enlaces: se registran como vistos al activarlos (no se verifica la lectura del sitio externo).
export default function MaterialItem({ material, fetchBlob, onComplete, busy = false }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState({ status: 'idle' });
  const isLink = material.type === 'ENLACE';

  const loadPreview = async () => {
    setPreview({ status: 'loading' });
    try {
      const blob = await fetchBlob(material);
      setPreview({ status: 'ready', ...blob });
      // Abrir correctamente el archivo registra la finalización (lógica existente en el backend)
      onComplete(material);
    } catch (e) {
      setPreview({
        status: 'error',
        message:
          e.response?.data?.message ||
          'No se pudo abrir el material. Intenta de nuevo más tarde.',
      });
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !isLink && preview.status !== 'ready' && preview.status !== 'loading') {
      loadPreview();
    }
  };

  const openLink = () => {
    window.open(material.externalUrl, '_blank', 'noopener,noreferrer');
    onComplete(material);
  };

  const renderBody = () => {
    if (isLink) {
      return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-4">
          <p className="min-w-0 break-all text-sm text-gray-600">{material.externalUrl}</p>
          <button onClick={openLink} disabled={busy} className="btn-primary shrink-0 text-sm">
            Abrir enlace
          </button>
        </div>
      );
    }

    if (preview.status === 'loading' || preview.status === 'idle') {
      return (
        <div className="flex items-center gap-3 py-6 text-sm text-gray-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          Cargando material…
        </div>
      );
    }

    if (preview.status === 'error') {
      return (
        <div className="space-y-3">
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{preview.message}</p>
          <button onClick={loadPreview} className="btn-secondary text-sm">Reintentar</button>
        </div>
      );
    }

    const isPdf = preview.mime.includes('pdf');
    const isImage = preview.mime.startsWith('image/');

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 truncate text-xs text-gray-500" title={preview.filename}>
            {preview.filename}
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => window.open(preview.url, '_blank', 'noopener,noreferrer')}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              Abrir en pestaña nueva
            </button>
            <a href={preview.url} download={preview.filename} className="btn-primary px-3 py-1.5 text-xs">
              Descargar
            </a>
          </div>
        </div>

        {isPdf && (
          <iframe
            src={preview.url}
            title={material.title}
            className="h-[60vh] min-h-[320px] w-full rounded-lg border border-gray-200 bg-white"
          />
        )}

        {isImage && (
          <img src={preview.url} alt={material.title} className="max-h-[70vh] w-full rounded-lg object-contain bg-gray-50" />
        )}

        {!isPdf && !isImage && (
          <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            Este tipo de archivo no se puede mostrar en la página. Ábrelo en una pestaña nueva o descárgalo.
          </p>
        )}
      </div>
    );
  };

  return (
    <li className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <button
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            material.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
          title={material.completed ? 'Completado' : 'Pendiente'}
        >
          {material.completed ? <Icon d={ICONS.CHECK} className="h-4 w-4" /> : <Icon d={ICONS[material.type] || ICONS.DOCUMENTO} className="h-4 w-4" />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-gray-800">{material.title}</span>
          <span className="text-xs text-gray-500">{typeLabels[material.type] || material.type}</span>
        </span>

        <StatusPill tone={material.completed ? 'done' : 'pending'}>
          {material.completed ? 'Completado' : 'Pendiente'}
        </StatusPill>

        <Icon
          d={ICONS.CHEVRON}
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-white px-4 py-4">
          {material.description && (
            <p className="mb-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">{material.description}</p>
          )}
          {renderBody()}
        </div>
      )}
    </li>
  );
}
