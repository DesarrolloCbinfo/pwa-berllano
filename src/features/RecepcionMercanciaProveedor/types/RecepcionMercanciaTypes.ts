export interface PedidoARecepcionar {
  folio: number;
  fecha: string;
  proveedor: string;
  usuarioRealizaPedido: string;
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
  cantidad_pedido: number;
  costo_pedido: number;
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
  cantidad_pedido: number;
  costo_pedido: number;
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
  cantidad_pedido: number;
  costo_pedido: number;
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

export interface FinalizarRecepcionResponse {
  ok: boolean;
  folio: number;
  estatus: string;
  mensaje: string;
}
