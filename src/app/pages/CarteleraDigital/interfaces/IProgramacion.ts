export interface IProgramacion {
  idProgramacion: number;
  idSucursal: number;
  idContenido: number;
  diaSemana: number;
  horainicio: string;
  horafin: string;
  orden: number;
  duracionSegundos: number;
  nombreSucursal: string;
  nombreContenido: string;
  tipo: number;
  extencion: string;
}

export interface IProgramacionPayload {
  idSucursal: number;
  idContenido: number;
  diaSemana: number;
  horainicio: string;
  horafin: string;
  orden: number;
  duracionSegundos: number;
}
