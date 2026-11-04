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

export interface IUsuarioConteo {
  usuario: string;
  nombre: string;
}

export interface IMarcaConteo {
  id: number;
  marca: string;
}

export interface IFamiliaConteo {
  clave: number;
  descripcion: string;
  Seleccion: boolean;
}

export interface IConteoActivo {
  idConteo: number;
  fecha: string;
  usuario: string;
  sucursal: number;
  usuarioAsignado: string;
  estado: number;
  descripcion: string;
}
