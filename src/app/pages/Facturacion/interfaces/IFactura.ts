export interface IFactura {
  fechaCFDI: string;
  cia: number;
  sucursal: number;
  caja: number;
  noVenta: number;
  noCliente: number;
  importe: number;
  timbrado: number;
  id: number;
  rfc: string;
  uuid: string;
  xml: string;
  folio: number;
  serie: string;
  dCliente: string;
  dSucursal: string;
  habilitada?: boolean;
}

export interface ITipoFacturacion {
  id: number;
  nombre: string;
}

export interface IFormaPagoFactura {
  id: number;
  nombre: string;
}

export interface IVentaNoTimbrada {
  fecha: string;
  dSucursal: string;
  nombre: string;
  noVenta: number;
  caja: number;
  importe: number;
  sucursal: number;
  id_cliente_venta: number;
  habilitada?: boolean;
}

export interface IClienteFiscal {
  id: number;
  rfc: string;
  nombreFiscal: string;
  cpFiscal: string;
  regimenFiscal: string;
  usoCFDI: string;
  correoFiscal: string;
}

export interface IClientesFiscalesResponse {
  clientes: IClienteFiscal[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
}
