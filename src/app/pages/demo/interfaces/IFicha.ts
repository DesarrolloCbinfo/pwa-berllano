export interface FichaResponse {
  id: number;
  cia: number;
  nombre: string;
  descripcion: string;
  sucursalId: number;
}

export interface SeccionResponse {
  id: number;
  nombre: string;
  orden: number;
  requerido: boolean;
  descripcion: string;
  fichaId: number;
}

export interface PreguntaResponse {
  id: number;
  label: string;
  orden: number;
  requerido: boolean;
  name: string;
  type: string;
  seccionId: number;
}
