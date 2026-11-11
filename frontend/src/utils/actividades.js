// Ordena las actividades realizadas de la más reciente a la más antigua.
// Criterio principal: el año de la actividad. En caso de empate, el orden de publicación
// (el id es la marca de tiempo con que se creó la entrada).
export function ordenarActividades(items) {
  const year = (a) => parseInt(String(a.year ?? ''), 10) || 0;
  const published = (a) => Number(a.id) || 0;
  return [...items].sort((a, b) => year(b) - year(a) || published(b) - published(a));
}
