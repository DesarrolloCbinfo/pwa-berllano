export interface PedidoARecepcionar {
  folio: number;
  fecha: string;
  clave_proveedor: string;
  nombre_proveedor: string;
  clave_usuario: string;
  nombre_usuario: string;
  estatus: string;
}

export interface PedidosARecepcionarPaginado {
  data: PedidoARecepcionar[];
  pageNumber: number;
  pageSize: number;
  totalRegistros: number;
  totalPaginas: number;
}

export interface PedidoDetalle {
  folio: number;
  clave_prod: string;
  descripcion: string;
  proveedor: string;
  marca: string;
}

export interface PartidaIntermedia {
  id: number;
  sucursal_destino: number;
  folio: number;
  clave_prod: string;
  descripcion: string;
  proveedor: string;
  cantidad: number;
  cantidad_administracion: number;
  observaciones: string;
  estatus: string;
}

export interface AgregarPartidaPayload {
  sucursal_destino: number;
  folio: number;
  clave_prod: string;
  descripcion: string;
  proveedor: string;
  cantidad: number;
  observaciones: string;
}

export interface PartidaCapturada {
  clave_prod: string;
  descripcion: string;
  cantidad: number;
  observaciones: string;
}

export interface ValidacionClaveResponse {
  ok: boolean;
  codigo: number;
  clave_prod: string;
  descripcion: string;
  requiere_descripcion_manual: number;
  mensaje: string;
}

export interface ActualizarPartidaPayload {
  clave_prod: string;
  descripcion: string;
  cantidad: number;
  cantidad_administracion: number;
  observaciones: string;
}

export interface OperacionPartidaResponse {
  ok: boolean;
  id?: number;
  folio?: number;
  filasAfectadas?: number;
  mensaje: string;
}

export interface RegistrarPartidaResponse {
  ok: boolean;
  codigo: number;
  folio: number;
  sucursal_destino: number;
  mensaje: string;
  mensaje2?: string;
}

export interface FinalizarRecepcionPayload {
  total_factura: number;
  folio_docto: string;
  fecha_factura: string;
}

export interface FinalizarRecepcionResponse {
  ok: boolean;
  folio: number;
  cve_sucursal: number;
  total_factura: number;
  folio_docto: string;
  fecha_factura: string;
  estatus: string;
  mensaje: string;
}
