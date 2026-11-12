// Límite de intentos por IP, en memoria y sin dependencias externas.
// - onlyFailures: solo cuenta las respuestas 401 (credenciales incorrectas); los inicios de sesión
//   correctos no consumen el límite.
// - Detrás de un proxy (Render, etc.) define TRUST_PROXY=1 para que el límite use la IP real del
//   cliente y no la del proxy.
function rateLimit({ windowMs, max, onlyFailures = false, message = 'Demasiados intentos. Intenta más tarde.' }) {
  const hits = new Map();

  const prune = (now) => {
    if (hits.size < 5000) return;
    for (const [key, entry] of hits) {
      if (entry.reset <= now) hits.delete(key);
    }
  };

  return (req, res, next) => {
    const now = Date.now();
    prune(now);

    const key = req.ip || 'desconocida';
    let entry = hits.get(key);
    if (!entry || entry.reset <= now) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(key, entry);
    }

    if (entry.count >= max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ success: false, message });
    }

    if (onlyFailures) {
      res.on('finish', () => {
        if (res.statusCode === 401) entry.count += 1;
      });
    } else {
      entry.count += 1;
    }

    next();
  };
}

module.exports = { rateLimit };
