import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function Contact() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    api.get('/content/contacto').then((r) => setContent(r.data.data)).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">Contacto</h1>
      <div className="whitespace-pre-wrap text-gray-600 leading-relaxed">{content?.content}</div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="card p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.5 5L18 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-800">Correo</h3>
          <p className="mt-1 text-sm text-gray-500">jovenesunamejorciudad@gmail.com</p>
        </div>
        <div className="card p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.3a1 1 0 01.96.73l1.2 3.6a1 1 0 01-.4 1.16L8 9.8a12 12 0 006.2 6.2l1.3-2.1a1 1 0 011.16-.4l3.6 1.2a1 1 0 01.73.96V19a2 2 0 01-2 2H17C9.3 21 3 14.7 3 7V5z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-800">Teléfono</h3>
          <p className="mt-1 text-sm text-gray-500">+57 318 3704018</p>
        </div>
        <div className="card p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11zM12 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-800">Horario</h3>
          <p className="mt-1 text-sm text-gray-500">Lunes a viernes · 9:00 a 17:00</p>
        </div>
      </div>
    </div>
  );
}