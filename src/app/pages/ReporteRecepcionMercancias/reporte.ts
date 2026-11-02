import type { SucursalOption } from '../../../components/selectores/SucursalSelector';
import type { ProveedorOption } from '../../../components/selectores/ProveedorSelector';
import { ReporteRecepcionMercanciasApis } from './apis/ReporteRecepcionMercanciasApis';

type Periodo = { fechaInicial: string; fechaFinal: string };

export type ConsultaRecepcion = Periodo & (
  | { nivel: 'sucursales' }
  | { nivel: 'proveedores'; sucursal: SucursalOption }
  | { nivel: 'folios'; sucursal: SucursalOption; proveedor: ProveedorOption }
);

export type NivelRecepcion = ConsultaRecepcion['nivel'];

export type FilaRecepcion = {
  clave: string;
  nombre: string;
  fecha: string;
  subtotal: number;
  iva: number;
  total: number;
};

export const titulosReporte: Record<NivelRecepcion, string> = {
  sucursales: 'Recepción de mercancías por sucursal',
  proveedores: 'Recepción de mercancías por proveedor',
  folios: 'Recepción de mercancías por folios',
};

export function crearPeticionRecepcion(consulta: ConsultaRecepcion) {
  const params: Record<string, string | number> = {
    f1: consulta.fechaInicial,
    f2: consulta.fechaFinal,
  };
  if (consulta.nivel !== 'sucursales') params.suc = consulta.sucursal.cve_sucursal;
  if (consulta.nivel === 'folios') params.cve_proveedor = consulta.proveedor.id;
  return { endpoint: ReporteRecepcionMercanciasApis[consulta.nivel], params };
}

export function normalizarRecepciones(data: unknown, nivel: NivelRecepcion): FilaRecepcion[] {
  const rows = Array.isArray(data)
    ? data
    : typeof data === 'object' && data !== null && 'data' in data
      ? data.data
      : undefined;
  if (!Array.isArray(rows)) throw new Error('La respuesta del reporte no contiene una lista de registros.');

  return rows.map((row: unknown) => {
    if (typeof row !== 'object' || row === null) {
      throw new Error('El reporte contiene un registro con formato incorrecto.');
    }
    const item = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key.toLowerCase(), value]),
    );
    const clave = String(
      (nivel === 'sucursales' ? item.sucursal
        : nivel === 'proveedores' ? item.cve_proveedor : item.folio_recepcion) ?? '',
    ).trim();
    if (!clave) throw new Error('El reporte contiene un registro sin clave.');

    const numero = (value: unknown) => {
      const parsed = Number(value ?? 0);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    return {
      clave,
      nombre: String((nivel === 'sucursales' ? item.nombre : item.proveedor) ?? '').trim(),
      fecha: String(item.fecha_recepcion ?? '').trim(),
      subtotal: numero(item.sumadesubtotal ?? item.subtotal),
      iva: numero(item.sumadeiva ?? item.iva),
      total: numero(item.sumadetotal ?? item.total),
    };
  });
}

export const formatoMoneda = (valor: number) => valor.toLocaleString('es-MX', {
  style: 'currency', currency: 'MXN',
});

export function formatoFecha(valor: string) {
  const fecha = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  return fecha ? `${fecha[3]}/${fecha[2]}/${fecha[1]}` : valor;
}

export function sumarRecepciones(filas: FilaRecepcion[]) {
  return filas.reduce((suma, fila) => ({
    subtotal: suma.subtotal + fila.subtotal,
    iva: suma.iva + fila.iva,
    total: suma.total + fila.total,
  }), { subtotal: 0, iva: 0, total: 0 });
}

export function filasParaExportar(filas: FilaRecepcion[], nivel: NivelRecepcion) {
  return filas.map((fila) => ({
    ...(nivel === 'folios'
      ? { Fecha: formatoFecha(fila.fecha), Folio: fila.clave }
      : nivel === 'sucursales'
        ? { Clave: fila.clave, Sucursal: fila.nombre }
        : { Clave: fila.clave, Proveedor: fila.nombre }),
    Subtotal: fila.subtotal,
    IVA: fila.iva,
    Total: fila.total,
  }));
}

export function contextoReporte(consulta: ConsultaRecepcion) {
  return [
    `Del ${formatoFecha(consulta.fechaInicial)} al ${formatoFecha(consulta.fechaFinal)}`,
    ...(consulta.nivel !== 'sucursales' ? [`Sucursal: ${consulta.sucursal.nombre}`] : []),
    ...(consulta.nivel === 'folios' ? [`Proveedor: ${consulta.proveedor.id} - ${consulta.proveedor.nombre}`] : []),
  ].join(' · ');
}

export function crearHtmlImpresion(consulta: ConsultaRecepcion, filas: FilaRecepcion[]) {
  const escapar = (valor: unknown) => String(valor ?? '').replace(/[&<>"']/g, (caracter) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[caracter] ?? caracter);
  const esFolios = consulta.nivel === 'folios';
  const columnas = [
    ...(esFolios ? ['Fecha', 'Folio'] : [consulta.nivel === 'sucursales' ? 'Sucursal' : 'Proveedor']),
    'Subtotal', 'IVA', 'Total',
  ];
  const totales = sumarRecepciones(filas);
  const renglones = filas.map((fila) => [
    ...(esFolios ? [formatoFecha(fila.fecha), fila.clave] : [fila.nombre || fila.clave]),
    formatoMoneda(fila.subtotal), formatoMoneda(fila.iva), formatoMoneda(fila.total),
  ]);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
    <title>${escapar(titulosReporte[consulta.nivel])}</title>
    <style>
      @page { size: letter portrait; margin: 15mm 18mm; }
      body { font: 9pt Arial, sans-serif; color: #111; }
      h1 { font-size: 20pt; font-style: italic; border-bottom: 4px solid #111; padding-bottom: 5px; }
      p { line-height: 1.6; }
      table { width: 100%; border-collapse: collapse; margin-top: 18px; }
      th, td { padding: 6px 4px; border-bottom: 1px solid #aaa; text-align: left; }
      th { color: #004100; }
      tr > :nth-last-child(-n+3) { text-align: right; white-space: nowrap; }
      thead { display: table-header-group; } tr { break-inside: avoid; }
      tfoot { display: table-row-group; font-weight: bold; }
    </style></head><body>
    <h1>${escapar(titulosReporte[consulta.nivel])}</h1>
    <p>${escapar(contextoReporte(consulta))}</p>
    <table><thead><tr>${columnas.map((columna) => `<th>${escapar(columna)}</th>`).join('')}</tr></thead>
    <tbody>${renglones.map((fila) => `<tr>${fila.map((valor) => `<td>${escapar(valor)}</td>`).join('')}</tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="${esFolios ? 2 : 1}" style="text-align:right">Totales:</td>${Object.values(totales).map((valor) =>
      `<td>${escapar(formatoMoneda(valor))}</td>`,
    ).join('')}</tr></tfoot></table></body></html>`;
}
