// Ordena las actividades realizadas de la más reciente a la más antigua.
// Criterio principal: el año de la actividad. En caso de empate, el orden de publicación
// (el id es la marca de tiempo con que se creó la entrada).
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// El campo "year" es texto libre: puede ser "2025" o una fecha como "11 de marzo 2022".
// Se extrae día, mes y año; si no hay año reconocible, la actividad queda al final.
export function fechaDeActividad(a) {
  const texto = String(a.year ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const anio = texto.match(/\b(19|20)\d{2}\b/);
  if (!anio) return 0;
  const mes = MESES.findIndex((m) => texto.includes(m));
  const dia = texto.match(/\b([0-3]?\d)\b/);
  return Date.UTC(Number(anio[0]), mes >= 0 ? mes : 0, dia ? Number(dia[1]) || 1 : 1);
}

export function ordenarActividades(items) {
  const published = (a) => Number(a.id) || 0;
  return [...items].sort((a, b) => fechaDeActividad(b) - fechaDeActividad(a) || published(b) - published(a));
}
