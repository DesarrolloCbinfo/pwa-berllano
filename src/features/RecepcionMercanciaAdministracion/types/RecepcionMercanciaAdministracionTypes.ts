export interface RecepcionAdministracionRow {
  id: number;
  sucursal_destino: number;
  folio: number;
  fecha_pedido: string;
  fecha_recepcion: string | null;
  clave_prod: string;
  descripcion: string;
  proveedor: string;
  cantidad: number;
  cantidad_administracion: number;
  observaciones: string | null;
  cantidad_pedido: number;
  diferencia: number;
  costo_pedido: number;
  estatus: string;
  total_factura: number | null;
  folio_docto: string | null;
  fecha_factura: string | null;
  fecha_registro: string | null;
  cantidad_bonificacion_r: number | null;
  cantidad_bonificacion_p: number | null;
  cantidad_bonificacion_admin: number | null;
  costo_sin_iva: number;
  costo_total: number;
  costoFactura1: number;
  precioVenta: number;
}

export interface ActualizarRecepcionAdministracionPayload {
  id: number;
  cantidad_administracion: number;
  cantidad_bonificacion_r: number;
  cantidad_bonificacion_p: number;
  cantidad_bonificacion_admin: number;
  costo_sin_iva: number;
}
