import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import Spinner from '../../../components/ui/Spinner';
import Badge from '../../../components/ui/Badge';
import Alert from '../../../components/ui/Alert';
import Table from '../../../components/ui/Table';
import Input from '../../../components/ui/Input';

export default function ContentEditor() {
  const [tab, setTab] = useState('pages');
  const [pages, setPages] = useState([]);
  const [allPages, setAllPages] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [editingPage, setEditingPage] = useState(null);
  const [editingKnowledge, setEditingKnowledge] = useState(null);
  const [editingRealizada, setEditingRealizada] = useState(null);
  const [showNewKnowledge, setShowNewKnowledge] = useState(false);
  const [showNewRealizada, setShowNewRealizada] = useState(false);
  const [temaImages, setTemaImages] = useState({});
  const [uploadingTema, setUploadingTema] = useState('');
  const [editingAliado, setEditingAliado] = useState(null);
  const [showNewAliado, setShowNewAliado] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [showNewStaff, setShowNewStaff] = useState(false);
  const [editingActividad, setEditingActividad] = useState(null);
  const [showNewActividad, setShowNewActividad] = useState(false);

  const TEMAS_TABLA = [
    { id: 'social', title: 'Social' },
    { id: 'ambiental', title: 'Ambiental' },
    { id: 'deportivo', title: 'Deportivo' },
    { id: 'liderazgo', title: 'Liderazgo y democracia' },
    { id: 'emprendimientos', title: 'Emprendimientos' },
    { id: 'educacion', title: 'Educación' },
  ];

  const SLUGS_CON_TAB_PROPIA = ['actividades-realizadas', 'temas', 'aliados', 'staff', 'actividades-temas'];

  const fetchAll = () => {
    setLoading(true);
    setError('');
    Promise.all([api.get('/content'), api.get('/content/knowledge/all')])
      .then(([p, k]) => {
        setAllPages(p.data.data);
        setPages(p.data.data.filter((x) => !SLUGS_CON_TAB_PROPIA.includes(x.slug)));
        setKnowledge(k.data.data);
      })
      .catch((e) => setError(e.response?.data?.message || 'Error al cargar contenidos.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (tab === 'temas' && allPages.length > 0) loadTemaImages();
  }, [tab, allPages]);

  const savePage = async (data) => {
    try {
      await api.put(`/content/${editingPage.slug}`, data);
      setSaved('Contenido guardado correctamente.');
      setEditingPage(null);
      fetchAll();
      setTimeout(() => setSaved(''), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar.');
    }
  };

  const saveKnowledge = async (data) => {
    try {
      if (editingKnowledge) await api.put(`/content/knowledge/${editingKnowledge.id}`, data);
      else await api.post('/content/knowledge', data);
      setSaved('Entrada guardada correctamente.');
      setEditingKnowledge(null);
      setShowNewKnowledge(false);
      fetchAll();
      setTimeout(() => setSaved(''), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar.');
    }
  };

  const deleteKnowledge = async (k) => {
    if (!window.confirm(`Â¿Eliminar la entrada "${k.question}"?`)) return;
    try {
      await api.delete(`/content/knowledge/${k.id}`);
      fetchAll();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo eliminar.');
    }
  };

  const getRealizadasPage = () =>
    allPages.find((p) => p.slug === 'actividades-realizadas') || null;

  const parseRealizadas = () => {
    const page = getRealizadasPage();
    if (!page) return [];
    try {
      const arr = JSON.parse(page.content || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const saveRealizada = async (item) => {
    try {
      const items = parseRealizadas();
      const idx = items.findIndex((x) => x.id === item.id);
      if (idx >= 0) items[idx] = item;
      else items.push(item);

      const page = getRealizadasPage();
      if (page) {
        await api.put('/content/actividades-realizadas', { content: JSON.stringify(items) });
      } else {
        await api.post('/content', {
          slug: 'actividades-realizadas',
          title: 'Actividades que hemos realizado',
          content: JSON.stringify(items),
        });
      }
      setSaved('Actividad guardada correctamente.');
      setEditingRealizada(null);
      setShowNewRealizada(false);
      fetchAll();
      setTimeout(() => setSaved(''), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar.');
    }
  };

  const deleteRealizada = async (item) => {
    if (!window.confirm(`Â¿Eliminar la actividad "${item.title}"?`)) return;
    try {
      const items = parseRealizadas().filter((x) => x.id !== item.id);
      await api.put('/content/actividades-realizadas', { content: JSON.stringify(items) });
      fetchAll();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo eliminar.');
    }
  };

  const uploadRealizadaImage = async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    const r = await api.post('/content/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return r.data.data.url;
  };

  const getAliadosPage = () =>
    allPages.find((p) => p.slug === 'aliados') || null;

  const parseAliados = () => {
    const page = getAliadosPage();
    if (!page) return [];
    try {
      const arr = JSON.parse(page.content || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const saveAliado = async (item) => {
    try {
      const items = parseAliados();
      const idx = items.findIndex((x) => x.id === item.id);
      if (idx >= 0) items[idx] = item;
      else items.push(item);

      const page = getAliadosPage();
      if (page) {
        await api.put('/content/aliados', { content: JSON.stringify(items) });
      } else {
        await api.post('/content', {
          slug: 'aliados',
          title: 'Aliados',
          content: JSON.stringify(items),
        });
      }
      setSaved('Aliado guardado correctamente.');
      setEditingAliado(null);
      setShowNewAliado(false);
      fetchAll();
      setTimeout(() => setSaved(''), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar.');
    }
  };

  const deleteAliado = async (item) => {
    if (!window.confirm(`Â¿Eliminar el aliado "${item.title}"?`)) return;
    try {
      const items = parseAliados().filter((x) => x.id !== item.id);
      await api.put('/content/aliados', { content: JSON.stringify(items) });
      fetchAll();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo eliminar.');
    }
  };

  const uploadAliadoImage = async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    const r = await api.post('/content/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return r.data.data.url;
  };

  const getStaffPage = () =>
    allPages.find((p) => p.slug === 'staff') || null;

  const parseStaff = () => {
    const page = getStaffPage();
    if (!page) return [];
    try {
      const arr = JSON.parse(page.content || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const saveStaff = async (item) => {
    try {
      const items = parseStaff();
      const idx = items.findIndex((x) => x.id === item.id);
      if (idx >= 0) items[idx] = item;
      else items.push(item);

      const page = getStaffPage();
      if (page) {
        await api.put('/content/staff', { content: JSON.stringify(items) });
      } else {
        await api.post('/content', {
          slug: 'staff',
          title: 'Staff',
          content: JSON.stringify(items),
        });
      }
      setSaved('Miembro del staff guardado correctamente.');
      setEditingStaff(null);
      setShowNewStaff(false);
      fetchAll();
      setTimeout(() => setSaved(''), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar.');
    }
  };

  const deleteStaff = async (item) => {
    if (!window.confirm(`¿Eliminar a "${item.title}"?`)) return;
    try {
      const items = parseStaff().filter((x) => x.id !== item.id);
      await api.put('/content/staff', { content: JSON.stringify(items) });
      fetchAll();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo eliminar.');
    }
  };

  const uploadStaffImage = async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    const r = await api.post('/content/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return r.data.data.url;
  };

  const getActividadesPage = () =>
    allPages.find((p) => p.slug === 'actividades-temas') || null;

  const parseActividades = () => {
    const page = getActividadesPage();
    if (!page) return [];
    try {
      const arr = JSON.parse(page.content || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const saveActividad = async (item) => {
    try {
      const items = parseActividades();
      const idx = items.findIndex((x) => x.id === item.id);
      if (idx >= 0) items[idx] = item;
      else items.push(item);

      const page = getActividadesPage();
      if (page) {
        await api.put('/content/actividades-temas', { content: JSON.stringify(items) });
      } else {
        await api.post('/content', {
          slug: 'actividades-temas',
          title: 'Actividades',
          content: JSON.stringify(items),
        });
      }
      setSaved('Actividad guardada correctamente.');
      setEditingActividad(null);
      setShowNewActividad(false);
      fetchAll();
      setTimeout(() => setSaved(''), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar.');
    }
  };

  const deleteActividad = async (item) => {
    if (!window.confirm(`¿Eliminar la actividad "${item.title}"?`)) return;
    try {
      const items = parseActividades().filter((x) => x.id !== item.id);
      await api.put('/content/actividades-temas', { content: JSON.stringify(items) });
      fetchAll();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo eliminar.');
    }
  };

  const uploadActividadImage = async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    const r = await api.post('/content/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return r.data.data.url;
  };

  const getTemasPage = () => allPages.find((p) => p.slug === 'temas') || null;

  const parseTemaImages = () => {
    const page = getTemasPage();
    if (!page) return {};
    try {
      const data = JSON.parse(page.content || '{}');
      return data && typeof data === 'object' ? data : {};
    } catch {
      return {};
    }
  };

  const loadTemaImages = () => {
    setTemaImages(parseTemaImages());
  };

  const saveTemaImage = async (temaId, url) => {
    const next = { ...parseTemaImages(), [temaId]: url };
    const page = getTemasPage();
    try {
      if (page) {
        await api.put('/content/temas', { content: JSON.stringify(next) });
      } else {
        await api.post('/content', {
          slug: 'temas',
          title: 'Temas',
          content: JSON.stringify(next),
        });
      }
      setTemaImages(next);
      setSaved('Imagen de tema guardada correctamente.');
      setTimeout(() => setSaved(''), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar la imagen.');
    }
  };

  const uploadTemaImage = async (temaId, file) => {
    setUploadingTema(temaId);
    setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const r = await api.post('/content/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await saveTemaImage(temaId, r.data.data.url);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo subir la imagen.');
    } finally {
      setUploadingTema('');
    }
  };

  const pageColumns = [
    { key: 'title', label: 'Sección', render: (p) => <span className="font-medium text-gray-800">{p.title}</span> },
    { key: 'slug', label: 'Slug', render: (p) => <Badge variant="VIRTUAL">{p.slug}</Badge> },
    { key: 'updated', label: 'Última actualización', render: (p) => new Date(p.updatedAt).toLocaleString('es-ES') },
    { key: 'actions', label: '', render: (p) => (
      <button onClick={() => setEditingPage(p)} className="text-sm font-semibold text-primary-600 hover:text-primary-700">Editar</button>
    ) },
  ];

  const knowledgeColumns = [
    { key: 'question', label: 'Pregunta', render: (k) => <span className="font-medium text-gray-800">{k.question || k.keywords}</span> },
    { key: 'keywords', label: 'Palabras clave', render: (k) => <Badge variant="CHARLA">{k.keywords}</Badge> },
    { key: 'active', label: 'Estado', render: (k) => <Badge variant={k.active ? 'ACTIVA' : 'CERRADA'}>{k.active ? 'Activa' : 'Inactiva'}</Badge> },
    { key: 'actions', label: '', render: (k) => (
      <div className="flex gap-2">
        <button onClick={() => setEditingKnowledge(k)} className="text-sm font-semibold text-primary-600">Editar</button>
        <button onClick={() => deleteKnowledge(k)} className="text-sm font-semibold text-red-600">Eliminar</button>
      </div>
    ) },
  ];

  const realizadasColumns = [
    { key: 'image', label: '', render: (r) => r.imageUrl ? (
      <img src={r.imageUrl} alt={r.title} className="h-12 w-20 rounded-lg object-cover" />
    ) : <span className="text-gray-400">Sin imagen</span> },
    { key: 'title', label: 'Actividad', render: (r) => <span className="font-medium text-gray-800">{r.title}</span> },
    { key: 'meta', label: 'Año / Lugar', render: (r) => (
      <span className="text-sm text-gray-500">{r.year || 'â€”'}{r.location ? ` Â· ${r.location}` : ''}</span>
    ) },
    { key: 'actions', label: '', render: (r) => (
      <div className="flex gap-2">
        <button onClick={() => setEditingRealizada(r)} className="text-sm font-semibold text-primary-600">Editar</button>
        <button onClick={() => deleteRealizada(r)} className="text-sm font-semibold text-red-600">Eliminar</button>
      </div>
    ) },
  ];

  const aliadosColumns = [
    { key: 'image', label: '', render: (a) => a.imageUrl ? (
      <img src={a.imageUrl} alt={a.title} className="h-12 w-20 rounded-lg object-cover" />
    ) : <span className="text-gray-400">Sin imagen</span> },
    { key: 'title', label: 'Aliado', render: (a) => <span className="font-medium text-gray-800">{a.title}</span> },
    { key: 'actions', label: '', render: (a) => (
      <div className="flex gap-2">
        <button onClick={() => setEditingAliado(a)} className="text-sm font-semibold text-primary-600">Editar</button>
        <button onClick={() => deleteAliado(a)} className="text-sm font-semibold text-red-600">Eliminar</button>
      </div>
    ) },
  ];

  const actividadesColumns = [
    { key: 'image', label: '', render: (a) => a.imageUrl ? (
      <img src={a.imageUrl} alt={a.title} className="h-12 w-20 rounded-lg object-cover" />
    ) : <span className="text-gray-400">Sin imagen</span> },
    { key: 'title', label: 'Título', render: (a) => <span className="font-medium text-gray-800">{a.title}</span> },
    { key: 'desc', label: 'Descripción', render: (a) => <span className="block max-w-xs whitespace-normal line-clamp-2 text-sm text-gray-500">{a.description || '—'}</span> },
    { key: 'actions', label: '', render: (a) => (
      <div className="flex gap-2">
        <button onClick={() => setEditingActividad(a)} className="text-sm font-semibold text-primary-600">Editar</button>
        <button onClick={() => deleteActividad(a)} className="text-sm font-semibold text-red-600">Eliminar</button>
      </div>
    ) },
  ];

  const staffColumns = [
    { key: 'image', label: '', render: (s) => s.imageUrl ? (
      <img src={s.imageUrl} alt={s.title} className="h-12 w-20 rounded-lg object-cover" />
    ) : <span className="text-gray-400">Sin imagen</span> },
    { key: 'title', label: 'Nombre', render: (s) => <span className="font-medium text-gray-800">{s.title}</span> },
    { key: 'desc', label: 'Cargo', render: (s) => <span className="text-sm text-gray-500">{s.description || '—'}</span> },
    { key: 'actions', label: '', render: (s) => (
      <div className="flex gap-2">
        <button onClick={() => setEditingStaff(s)} className="text-sm font-semibold text-primary-600">Editar</button>
        <button onClick={() => deleteStaff(s)} className="text-sm font-semibold text-red-600">Eliminar</button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
      {saved && <Alert type="success" onClose={() => setSaved('')}>{saved}</Alert>}

      <div className="flex gap-2">
        <button onClick={() => setTab('pages')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'pages' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
          Contenido del sitio
        </button>
        <button onClick={() => setTab('actividades')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'actividades' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
          Actividades
        </button>
        <button onClick={() => setTab('realizadas')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'realizadas' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
          Actividades realizadas
        </button>
        <button onClick={() => setTab('temas')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'temas' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
          Temas
        </button>
        <button onClick={() => setTab('aliados')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'aliados' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
          Aliados
        </button>
        <button onClick={() => setTab('staff')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'staff' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
          Staff
        </button>
        <button onClick={() => setTab('knowledge')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'knowledge' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
          Conocimiento del chatbot
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : tab === 'pages' ? (
        <div className="card overflow-hidden">
          <Table columns={pageColumns} data={pages} />
        </div>
      ) : tab === 'realizadas' ? (
        <div>
          <button onClick={() => setShowNewRealizada(true)} className="btn-primary mb-4">+ Agregar actividad realizada</button>
          <div className="card overflow-hidden">
            <Table columns={realizadasColumns} data={parseRealizadas()} emptyMessage="No hay actividades realizadas de la fundación." />
          </div>
        </div>
      ) : tab === 'aliados' ? (
        <div>
          <button onClick={() => setShowNewAliado(true)} className="btn-primary mb-4">+ Agregar aliado</button>
          <div className="card overflow-hidden">
            <Table columns={aliadosColumns} data={parseAliados()} emptyMessage="No hay aliados registrados." />
          </div>
        </div>
      ) : tab === 'actividades' ? (
        <div>
          <button onClick={() => setShowNewActividad(true)} className="btn-primary mb-4">+ Agregar actividad</button>
          <div className="card overflow-hidden">
            <Table columns={actividadesColumns} data={parseActividades()} emptyMessage="No hay actividades registradas en este apartado." />
          </div>
        </div>
      ) : tab === 'staff' ? (
        <div>
          <button onClick={() => setShowNewStaff(true)} className="btn-primary mb-4">+ Agregar miembro del staff</button>
          <div className="card overflow-hidden">
            <Table columns={staffColumns} data={parseStaff()} emptyMessage="No hay miembros del staff registrados." />
          </div>
        </div>
      ) : tab === 'temas' ? (
        <div>
          <p className="mb-4 text-sm text-gray-500">
            Sube la imagen de cada tema. Se mostrarán en la página pública "Temas" en este orden.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEMAS_TABLA.map((tema) => (
              <div key={tema.id} className="card p-4">
                <p className="mb-3 font-semibold text-gray-800">{tema.title}</p>
                {temaImages[tema.id] && (
                  <img src={temaImages[tema.id]} alt={tema.title} className="mb-3 h-40 w-full rounded-lg object-cover" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-gray-600 file:mr-3 file:rounded file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-white hover:file:bg-primary-700"
                  disabled={uploadingTema === tema.id}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadTemaImage(tema.id, file);
                    e.target.value = '';
                  }}
                />
                {uploadingTema === tema.id && <p className="mt-2 text-xs text-gray-500">Subiendo...</p>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <button onClick={() => setShowNewKnowledge(true)} className="btn-primary mb-4">+ Nueva entrada</button>
          <div className="card overflow-hidden">
            <Table columns={knowledgeColumns} data={knowledge} emptyMessage="No hay entradas de conocimiento." />
          </div>
        </div>
      )}

      {editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setEditingPage(null)} />
          <div className="relative w-full max-w-3xl rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">Editar: {editingPage.title}</h2>
            <input
              className="input-field mb-4"
              defaultValue={editingPage.title}
              onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
            />
            <textarea
              className="input-field mb-4"
              rows="12"
              defaultValue={editingPage.content}
              onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
            />
            <div className="flex justify-between">
              <button onClick={() => setEditingPage(null)} className="btn-secondary">Cancelar</button>
              <button onClick={() => savePage({ title: editingPage.title, content: editingPage.content, imageUrl: editingPage.imageUrl })} className="btn-primary">
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {(editingKnowledge || showNewKnowledge) && (
        <KnowledgeForm
          entry={editingKnowledge}
          onSave={saveKnowledge}
          onClose={() => { setEditingKnowledge(null); setShowNewKnowledge(false); }}
        />
      )}

      {(editingRealizada || showNewRealizada) && (
        <RealizadaForm
          entry={editingRealizada}
          onSave={saveRealizada}
          onUpload={uploadRealizadaImage}
          onClose={() => { setEditingRealizada(null); setShowNewRealizada(false); }}
        />
      )}
      {(editingAliado || showNewAliado) && (
        <AliadoForm
          entry={editingAliado}
          onSave={saveAliado}
          onUpload={uploadAliadoImage}
          onClose={() => { setEditingAliado(null); setShowNewAliado(false); }}
        />
      )}
      {(editingActividad || showNewActividad) && (
        <ActividadTemaForm
          entry={editingActividad}
          onSave={saveActividad}
          onUpload={uploadActividadImage}
          onClose={() => { setEditingActividad(null); setShowNewActividad(false); }}
        />
      )}
      {(editingStaff || showNewStaff) && (
        <StaffForm
          entry={editingStaff}
          onSave={saveStaff}
          onUpload={uploadStaffImage}
          onClose={() => { setEditingStaff(null); setShowNewStaff(false); }}
        />
      )}
    </div>
  );
}

function KnowledgeForm({ entry, onSave, onClose }) {
  const [form, setForm] = useState({
    keywords: entry?.keywords || '',
    question: entry?.question || '',
    answer: entry?.answer || '',
    active: entry?.active ?? true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          {entry ? 'Editar entrada de conocimiento' : 'Nueva entrada de conocimiento'}
        </h2>
        <div className="space-y-4">
          <Input
            label="Palabras clave (separadas por coma)"
            value={form.keywords}
            onChange={(e) => setForm({ ...form, keywords: e.target.value })}
          />
          <Input
            label="Pregunta (opcional)"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
          />
          <div>
            <label className="label-field">Respuesta del chatbot</label>
            <textarea
              className="input-field"
              rows="4"
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            Entrada activa
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={() => onSave(form)} className="btn-primary">Guardar</button>
        </div>
      </div>
    </div>
  );
}

function AliadoForm({ entry, onSave, onUpload, onClose }) {
  const [form, setForm] = useState({
    id: entry?.id || Date.now(),
    title: entry?.title || '',
    imageUrl: entry?.imageUrl || '',
  });
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await onUpload(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch {
      alert('No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          {entry ? 'Editar aliado' : 'Nuevo aliado'}
        </h2>
        <div className="space-y-4">
          <Input
            label="Nombre del aliado"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div>
            <label className="label-field">Imagen / logo</label>
            <div className="flex items-center gap-4">
              {form.imageUrl && (
                <img src={form.imageUrl} alt="Vista previa" className="h-20 w-32 rounded-lg object-cover" />
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="block w-full text-sm text-gray-600 file:btn-primary file:mr-3 file:border-0"
                />
                {uploading && <span className="text-xs text-gray-500">Subiendo imagenâ€¦</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={() => onSave(form)} className="btn-primary">Guardar</button>
        </div>
      </div>
    </div>
  );
}
function RealizadaForm({ entry, onSave, onUpload, onClose }) {
  const [form, setForm] = useState({
    id: entry?.id || Date.now(),
    title: entry?.title || '',
    description: entry?.description || '',
    imageUrl: entry?.imageUrl || '',
    year: entry?.year || '',
    location: entry?.location || '',
  });
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await onUpload(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch {
      alert('No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          {entry ? 'Editar actividad realizada' : 'Nueva actividad realizada'}
        </h2>
        <div className="space-y-4">
          <Input
            label="Título de la actividad"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div>
            <label className="label-field">Descripción corta</label>
            <textarea
              className="input-field"
              rows="3"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Año"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              placeholder="2025"
            />
            <Input
              label="Lugar / ciudad"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field">Imagen destacada</label>
            <div className="flex items-center gap-4">
              {form.imageUrl && (
                <img src={form.imageUrl} alt="Vista previa" className="h-20 w-32 rounded-lg object-cover" />
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="block w-full text-sm text-gray-600 file:btn-primary file:mr-3 file:border-0"
                />
                {uploading && <span className="text-xs text-gray-500">Subiendo imagenâ€¦</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={() => onSave(form)} className="btn-primary">Guardar</button>
        </div>
      </div>
    </div>
  );
}

function StaffForm({ entry, onSave, onUpload, onClose }) {
  const [form, setForm] = useState({
    id: entry?.id || Date.now(),
    title: entry?.title || '',
    description: entry?.description || '',
    imageUrl: entry?.imageUrl || '',
  });
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await onUpload(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch {
      alert('No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          {entry ? 'Editar miembro del staff' : 'Nuevo miembro del staff'}
        </h2>
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div>
            <label className="label-field">Cargo en la fundación</label>
            <textarea
              className="input-field"
              rows="2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field">Foto</label>
            <div className="flex items-center gap-4">
              {form.imageUrl && (
                <img src={form.imageUrl} alt="Vista previa" className="h-20 w-32 rounded-lg object-cover" />
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="block w-full text-sm text-gray-600 file:btn-primary file:mr-3 file:border-0"
                />
                {uploading && <span className="text-xs text-gray-500">Subiendo imagen…</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={() => onSave(form)} className="btn-primary">Guardar</button>
        </div>
      </div>
    </div>
  );
}

function ActividadTemaForm({ entry, onSave, onUpload, onClose }) {
  const [form, setForm] = useState({
    id: entry?.id || Date.now(),
    title: entry?.title || '',
    description: entry?.description || '',
    imageUrl: entry?.imageUrl || '',
  });
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await onUpload(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch {
      alert('No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          {entry ? 'Editar actividad' : 'Nueva actividad'}
        </h2>
        <div className="space-y-4">
          <Input
            label="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div>
            <label className="label-field">Descripción</label>
            <textarea
              className="input-field"
              rows="4"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field">Imagen</label>
            <div className="flex items-center gap-4">
              {form.imageUrl && (
                <img src={form.imageUrl} alt="Vista previa" className="h-20 w-32 rounded-lg object-cover" />
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="block w-full text-sm text-gray-600 file:btn-primary file:mr-3 file:border-0"
                />
                {uploading && <span className="text-xs text-gray-500">Subiendo imagen…</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={() => onSave(form)} className="btn-primary">Guardar</button>
        </div>
      </div>
    </div>
  );
}
