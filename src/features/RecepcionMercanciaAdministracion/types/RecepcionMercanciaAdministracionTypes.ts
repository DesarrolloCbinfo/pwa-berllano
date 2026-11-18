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
  /** Precio de venta lista 1 (catálogo actual). Informativo. */
  precioVenta_actual: number;
  /** Precio nuevo (editable). Lo entrega el SP. */
  nuevo_precio: number | null;
  porcentaje_iva: number | null;
  administracion_terminada: boolean | number | null;
  actualizar_catalogo: boolean | number | null;
}

export interface ActualizarRecepcionAdministracionPayload {
  id: number;
  cantidad_administracion: number;
  cantidad_bonificacion_admin: number;
  cantidad_bonificacion_r: number;
  costo_administracion: number;
  porcentaje_iva: number;
  nuevo_precio: number;
  actualizar_catalogo: boolean;
  observaciones: string;
}

export interface FinalizarAdministracionPayload {
  folio: number;
  cve_sucursal: number;
}
