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
