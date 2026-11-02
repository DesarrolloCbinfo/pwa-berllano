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
  {
    id: 'depositos', titulo: 'Depósitos', descripcion: 'Diferencia entre Fiscal y Tarjeta para cada día y sucursal.',
    grupos: [{ titulo: 'Por sucursal', columnas: sucursales.map((sucursal) => ({
      campo: `${sucursal.total}_2`, etiqueta: sucursal.total, restar: sucursal.tarjeta,
    })) }],
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

function fechaSerialExcelRaz(fecha: string) {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const dias = (Date.UTC(anio, mes - 1, dia) - Date.UTC(1899, 11, 31)) / 86_400_000;
  return dias >= 60 ? dias + 1 : dias;
}

export function filasExcelRaz(filas: FilaRaz[]) {
  const columnas = gruposVenta('real').flatMap((grupo) => grupo.columnas);
  const tipos: Record<string, string> = {
    'venta-real': '1Real', puntos: '2Puntos', raz: '3Raz',
    fiscal: '4Fiscal', tarjeta: '5Tarjetas', depositos: '6Depositos',
  };
  return [
    ['dato', 'fecha', ...columnas.map((columna) => columna.etiqueta)],
    ...seccionesRaz.flatMap((seccion) => {
      const columnasSeccion = new Map(seccion.grupos.flatMap((grupo) => grupo.columnas)
        .map((columna) => [columna.etiqueta, columna]));
      const esPuntosOTarjeta = seccion.id === 'puntos' || seccion.id === 'tarjeta';
      return filas.map((fila) => [
        tipos[seccion.id], fechaSerialExcelRaz(fila.fecha),
        ...columnas.map((columna) => {
          const columnaSeccion = columnasSeccion.get(columna.etiqueta);
          if (columnaSeccion) {
            const valor = valorRaz(fila, columnaSeccion);
            // La consulta UNION de Access completa Ofi con cero en estos bloques.
            return valor ?? (columna.etiqueta === 'Ofi' && seccion.grupos.length === 1 ? 0 : null);
          }
          // Access conserva el desglose fiscal de Leju en Puntos y Tarjetas.
          if (esPuntosOTarjeta && ['LejuProd', 'LejuServ'].includes(columna.etiqueta)) {
            return fila.valores[`${columna.campo}2`.toLowerCase()] ?? null;
          }
          return 0;
        }),
      ]);
    }),
  ];
}
