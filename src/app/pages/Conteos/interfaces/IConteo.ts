export interface IConteo {
  idConteo: number;
  fecha: string;
  descripcion: string;
  nombre: string; // nombre de la sucursal (viene del sp_ConteosLista)
}

export interface ISucursalConteo {
  cve_sucursal: number;
  nombre: string;
}
