export type PeriodoRaz = { anio: number; mes: number };

export type FilaRaz = {
  fecha: string;
  valores: Record<string, number | null>;
};

export type ColumnaRaz = {
  campo: string;
  etiqueta: string;
  restar?: string;
};

export type GrupoRaz = { titulo: string; columnas: ColumnaRaz[] };
export type SeccionRaz = {
  id: string;
  titulo: string;
  descripcion: string;
  grupos: GrupoRaz[];
};

export const mesesRaz = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const sucursales = [
  { total: 'Ara', producto: 'AraProd', servicio: 'AraServ', puntos: 'puntosAra', tarjeta: 'tarjetaAra' },
  { total: 'P1', producto: 'P1Prod', servicio: 'P1Serv', puntos: 'puntosP1', tarjeta: 'tarjetaP1' },
  { total: 'P2', producto: 'P2Prod', servicio: 'P2Serv', puntos: 'puntosP2', tarjeta: 'tarjetaP2' },
  { total: 'Ver', producto: 'VerProd', servicio: 'VerServ', puntos: 'puntosVer', tarjeta: 'tarjetaVer' },
  { total: 'Dor', producto: 'DorProd', servicio: 'DorServ', puntos: 'puntosDor', tarjeta: 'tarjetaDor' },
  { total: 'Anda', producto: 'AndProd', servicio: 'AndServ', puntos: 'puntosAnd', tarjeta: 'tarjetaAnD' },
  { total: 'Leju', producto: 'LejuProd', servicio: 'LejuServ', puntos: 'puntosLeju', tarjeta: 'tarjetaLeju' },
  { total: 'Ofi', producto: 'OfiProd', servicio: 'OfiServ', puntos: 'puntosOfi', tarjeta: 'tarjetaOfi' },
];

function gruposVenta(tipo: 'real' | 'fiscal' | 'raz'): GrupoRaz[] {
  return ([
    ['total', 'Total por sucursal'],
    ['producto', 'Productos'],
    ['servicio', 'Servicios'],
  ] as const).map(([concepto, titulo]) => ({
    titulo,
    columnas: sucursales.map((sucursal) => {
      const campoReal = sucursal[concepto];
      const campoFiscal = concepto === 'total' ? `${campoReal}_2` : `${campoReal}2`;
      return {
        etiqueta: campoReal,
        campo: tipo === 'fiscal' ? campoFiscal : campoReal,
        ...(tipo === 'raz' ? { restar: campoFiscal } : {}),
      };
    }),
  }));
}

export const seccionesRaz: SeccionRaz[] = [
  {
    id: 'venta-real', titulo: 'Venta real', descripcion: 'Ventas diarias por sucursal, productos y servicios.',
    grupos: gruposVenta('real'),
  },
  {
    id: 'puntos', titulo: 'Puntos', descripcion: 'Puntos por día y sucursal.',
    grupos: [{ titulo: 'Por sucursal', columnas: sucursales.map((sucursal) => ({ campo: sucursal.puntos, etiqueta: sucursal.total })) }],
  },
  {
    id: 'raz', titulo: 'Raz', descripcion: 'Diferencia entre Venta real y Fiscal para cada día y columna.',
    grupos: gruposVenta('raz'),
  },
  {
    id: 'fiscal', titulo: 'Fiscal', descripcion: 'Ventas fiscales por sucursal, productos y servicios.',
    grupos: gruposVenta('fiscal'),
  },
  {
    id: 'tarjeta', titulo: 'Tarjeta', descripcion: 'Importes de tarjeta por día y sucursal.',
    grupos: [{ titulo: 'Por sucursal', columnas: sucursales.map((sucursal) => ({ campo: sucursal.tarjeta, etiqueta: sucursal.total })) }],
  },
];

export function parametrosRaz(periodo: PeriodoRaz) {
  if (!Number.isInteger(periodo.anio) || periodo.anio < 1900 || periodo.anio > 9999) {
    throw new Error('Ingresa un año válido entre 1900 y 9999.');
  }
  if (!Number.isInteger(periodo.mes) || periodo.mes < 1 || periodo.mes > 12) {
    throw new Error('Selecciona un mes válido.');
  }
  return { a: periodo.anio, m: periodo.mes };
}

export function normalizarRaz(data: unknown): FilaRaz[] {
  const filas = Array.isArray(data) ? data
    : typeof data === 'object' && data !== null && 'data' in data ? data.data : undefined;
  if (!Array.isArray(filas)) throw new Error('La respuesta del Reporte Raz no contiene una lista de registros.');

  return filas.map((fila: unknown) => {
    if (typeof fila !== 'object' || fila === null) throw new Error('El reporte contiene un registro inválido.');
    const propiedades = Object.entries(fila);
    const fecha = String(propiedades.find(([clave]) => clave.toLowerCase() === 'fecha')?.[1] ?? '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error('El reporte contiene un registro sin fecha válida.');
    const valores = Object.fromEntries(propiedades
      .filter(([clave]) => clave.toLowerCase() !== 'fecha')
      .map(([clave, valor]) => {
        const numero = typeof valor === 'number' || (typeof valor === 'string' && valor.trim() !== '')
          ? Number(valor) : NaN;
        return [clave.toLowerCase(), Number.isFinite(numero) ? numero : null];
      }));
    return { fecha, valores };
  }).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function valorRaz(fila: FilaRaz, columna: ColumnaRaz): number | null {
  const valor = fila.valores[columna.campo.toLowerCase()] ?? null;
  if (valor === null || !columna.restar) return valor;
  const fiscal = fila.valores[columna.restar.toLowerCase()] ?? null;
  return fiscal === null ? null : valor - fiscal;
}

export function totalColumnaRaz(filas: FilaRaz[], columna: ColumnaRaz): number | null {
  return filas.reduce<number | null>((total, fila) => {
    const valor = valorRaz(fila, columna);
    return valor === null ? total : (total ?? 0) + valor;
  }, null);
}

export function formatoFechaRaz(fecha: string) {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

const formatoNumero = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});

export function formatoNumeroRaz(valor: number | null) {
  return valor === null ? '—' : formatoNumero.format(Math.abs(valor) < 0.005 ? 0 : valor);
}

export function filasExcelRaz(filas: FilaRaz[], seccion: SeccionRaz, periodo: PeriodoRaz) {
  const columnas = seccion.grupos.flatMap((grupo) => grupo.columnas);
  return [
    [`Reporte Raz — ${seccion.titulo}`],
    [`${mesesRaz[periodo.mes - 1]} de ${periodo.anio}`],
    [],
    ['Fecha', ...seccion.grupos.flatMap((grupo) => grupo.columnas.map((_, indice) => indice === 0 ? grupo.titulo : ''))],
    ['', ...columnas.map((columna) => columna.etiqueta)],
    ...filas.map((fila) => [formatoFechaRaz(fila.fecha), ...columnas.map((columna) => valorRaz(fila, columna))]),
    ['TOTALES', ...columnas.map((columna) => totalColumnaRaz(filas, columna))],
  ];
}
