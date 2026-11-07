export type TipoRecursoWorker = 'Tickets' | 'Documentos' | 'TerminalBanorte' | 'LectorHuella';

export interface IRecursoWorker {
  idRecurso: number;
  idEmpresa: number;
  idSucursal: number;
  equipo: string;
  recurso: TipoRecursoWorker;
  ipWorker: string;
  hostWorker: string | null;
  puerto: number;
  nombreDispositivoLocal: string | null;
  activo: boolean;
  fechaRegistro: string | null;
}

export type ModoTicket =
  | 'CENTRADO_GRANDE_NEGRITA'
  | 'CENTRADO_NEGRITA'
  | 'CENTRADO_NORMAL'
  | 'CENTRADO'
  | 'TEXTO_PLANO'
  | 'NEGRITA'
  | 'GRANDE_NEGRITA'
  | 'DERECHA'
  | 'DERECHA_NEGRITA'
  | 'AVANCE'
  | 'CORTE_PAPEL'
  | 'CORTE_PARCIAL'
  | 'CAJON'
  | 'ABRE_CAJON';

export interface ITicketLinea {
  consecutivo: number;
  modo: ModoTicket;
  data: string;
}

export interface ITicketPayload {
  recurso: string;
  ticket_dataset: ITicketLinea[];
}

export interface IWorkerIdentidad {
  hostname: string;
  hostMdns: string;
  ipsLan: string[];
  puerto: number;
  version: string;
  status: string;
}

export interface IRecursoResuelto {
  urlPrimaria: string;
  urlFallbackMdns: string | null;
  nombreDispositivo: string | null;
  equipo: string;
}
