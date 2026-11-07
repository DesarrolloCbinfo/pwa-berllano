import type { ITicketLinea, ModoTicket } from "../interfaces/workerInterfaces";

const ANCHO = 40;

const linea = (consecutivo: number, modo: ModoTicket, data = ""): ITicketLinea => ({
  consecutivo,
  modo,
  data,
});

const separador = (consecutivo: number): ITicketLinea =>
  linea(consecutivo, "TEXTO_PLANO", "-".repeat(ANCHO));

// Acomoda texto a la izquierda y monto/dato a la derecha en una sola linea de ANCHO.
export const dosColumnas = (izquierda: string, derecha: string, ancho = ANCHO): string => {
  const izq = izquierda.length > ancho - derecha.length - 1
    ? izquierda.slice(0, ancho - derecha.length - 1)
    : izquierda;
  return `${izq.padEnd(ancho - derecha.length, " ")}${derecha}`;
};

export const aLineas = (texto: string, ancho = ANCHO): string[] => {
  const salida: string[] = [];
  let restante = texto;
  while (restante.length > ancho) {
    salida.push(restante.slice(0, ancho));
    restante = restante.slice(ancho);
  }
  salida.push(restante);
  return salida;
};

export interface DatosTicketVenta {
  nombreEmpresa?: string;
  sucursal?: string;
  caja?: string;
  fecha?: string;
  folio?: string;
  cliente?: string;
  servicio?: string;
  atendio?: string;
  lineasDetalle: Array<{ cantidad: string; descripcion: string; importe?: string }>;
  total?: string;
  pieLineas?: string[];
}

// Ticket generico de venta/historial: encabezado + renglones + total + corte.
export const construirTicketVentaDataset = (v: DatosTicketVenta): ITicketLinea[] => {
  const t: ITicketLinea[] = [];
  let n = 1;

  if (v.nombreEmpresa) t.push(linea(n++, "CENTRADO_GRANDE_NEGRITA", v.nombreEmpresa));
  if (v.sucursal) t.push(linea(n++, "CENTRADO_NORMAL", v.sucursal));
  t.push(separador(n++));

  if (v.fecha) t.push(linea(n++, "NEGRITA", `FECHA: ${v.fecha}`));
  if (v.folio) t.push(linea(n++, "NEGRITA", `FOLIO: ${v.folio}`));
  if (v.caja) t.push(linea(n++, "TEXTO_PLANO", `CAJA: ${v.caja}`));
  if (v.cliente) t.push(linea(n++, "TEXTO_PLANO", `CLIENTE: ${v.cliente}`));
  if (v.servicio) t.push(linea(n++, "TEXTO_PLANO", `SERVICIO: ${v.servicio}`));
  if (v.atendio) t.push(linea(n++, "TEXTO_PLANO", `ATENDIO: ${v.atendio}`));
  t.push(separador(n++));

  for (const d of v.lineasDetalle) {
    for (const [i, trozo] of aLineas(d.descripcion).entries()) {
      if (i === 0) {
        t.push(linea(n++, "TEXTO_PLANO", dosColumnas(`${d.cantidad} ${trozo}`, d.importe ?? "")));
      } else {
        t.push(linea(n++, "TEXTO_PLANO", `  ${trozo}`));
      }
    }
  }

  t.push(separador(n++));
  if (v.total) t.push(linea(n++, "DERECHA_NEGRITA", v.total));

  for (const pie of v.pieLineas ?? [])
    t.push(linea(n++, "CENTRADO_NORMAL", pie));

  t.push(linea(n, "CORTE_PAPEL"));
  return t;
};

export interface DatosTicketCorte {
  nombreEmpresa?: string;
  sucursal?: string;
  caja?: string;
  fecha?: string;
  hora?: string;
  corte?: string;
  corteParcial?: string;
  usuario?: string;
  pieLineas?: string[];
}

// Ticket resumen del corte de dia (el reporte detallado queda en impresion carta).
export const construirTicketCorteDataset = (c: DatosTicketCorte): ITicketLinea[] => {
  const t: ITicketLinea[] = [];
  let n = 1;

  t.push(linea(n++, "CENTRADO_GRANDE_NEGRITA", c.nombreEmpresa ?? "CORTE DE DIA"));
  if (c.sucursal) t.push(linea(n++, "CENTRADO_NORMAL", c.sucursal));
  t.push(separador(n++));

  if (c.fecha) t.push(linea(n++, "NEGRITA", `FECHA: ${c.fecha}`));
  if (c.hora) t.push(linea(n++, "NEGRITA", `HORA:  ${c.hora}`));
  if (c.caja) t.push(linea(n++, "TEXTO_PLANO", `CAJA:  ${c.caja}`));
  if (c.usuario) t.push(linea(n++, "TEXTO_PLANO", `USR:   ${c.usuario}`));
  t.push(separador(n++));

  if (c.corte) t.push(linea(n++, "DERECHA_NEGRITA", `CORTE:        ${c.corte}`));
  if (c.corteParcial) t.push(linea(n++, "DERECHA_NEGRITA", `C. PARCIAL:   ${c.corteParcial}`));

  t.push(separador(n++));
  for (const pie of c.pieLineas ?? ["FIN DE REPORTE"])
    t.push(linea(n++, "CENTRADO_NORMAL", pie));

  t.push(linea(n, "CORTE_PAPEL"));
  return t;
};
