import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';

const HEADINGS = ['mision', 'vision', 'objetivos', 'historia', 'valores'];

const stripAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const normalize = (s) => stripAccents(s.trim().toLowerCase()).replace(/[:\-–—]+$/, '').trim();

function isHeadingLine(line) {
  const t = normalize(line);
  if (!t || /[.!?]$/.test(t) || t.split(/\s+/).length > 2) return false;
  return HEADINGS.includes(t);
}

function buildBlocks(content) {
  const paragraphs = content.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
  const blocks = [];
  for (const p of paragraphs) {
    const lines = p.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 1 && isHeadingLine(lines[0])) {
      blocks.push({ type: 'heading', text: lines[0] });
    } else {
      blocks.push({ type: 'paragraph', text: lines.join(' ') });
    }
  }
  return blocks;
}

export default function CMSPage({ slug }) {
  const [content, setContent] = useState(null);
  const [allies, setAllies] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/content/${slug}`)
      .then((r) => setContent(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    if (slug === 'quienes-somos') {
      api.get('/content/aliados')
        .then((r) => {
          try { setAllies(JSON.parse(r.data.data?.content || '[]')); } catch { setAllies([]); }
        })
        .catch(() => {});
      api.get('/content/staff')
        .then((r) => {
          try { setStaff(JSON.parse(r.data.data?.content || '[]')); } catch { setStaff([]); }
        })
        .catch(() => {});
    }
  }, [slug]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-16"><Spinner /></div>;
  if (!content) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-gray-500">Contenido no encontrado.</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-center text-4xl font-extrabold text-gray-900">{content.title}</h1>
      {content.imageUrl && <img src={content.imageUrl} alt={content.title} className="mb-8 w-full rounded-2xl object-cover shadow-sm" />}

      <div className="space-y-5">
        {buildBlocks(content.content).map((block, i) =>
          block.type === 'heading' ? (
            <h2 key={i} className="pt-2 text-2xl font-extrabold tracking-tight text-primary-700">
              {block.text}
            </h2>
          ) : (
            <p key={i} className="leading-relaxed text-gray-600">
              {block.text}
            </p>
          )
        )}
      </div>

      {slug === 'quienes-somos' && staff.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-primary-700">Staff</h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {staff.map((s, i) => (
              <div key={s.id || i} className="card flex flex-col items-center p-4 text-center">
                {s.imageUrl && (
                  <img src={s.imageUrl} alt={s.title} className="mb-3 h-32 w-32 rounded-full object-cover" />
                )}
                <p className="text-sm font-semibold text-gray-800">{s.title}</p>
                {s.description && <p className="mt-1 text-xs text-gray-500">{s.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {slug === 'quienes-somos' && allies.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-primary-700">Aliados</h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {allies.map((a, i) => (
              <div key={a.id || i} className="card flex flex-col items-center p-4 text-center">
                {a.imageUrl && (
                  <img src={a.imageUrl} alt={a.title} className="mb-3 h-20 w-full object-contain" />
                )}
                <p className="text-sm font-semibold text-gray-800">{a.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
