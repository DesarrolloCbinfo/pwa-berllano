// Aritmetica de saldos del cobro Banorte en centavos enteros: comparar
// 0.01 + 0.09 con 0.10 en float da falsos negativos, por eso todo pasa
// por Math.round(n * 100) antes de sumar o comparar.

export const aCentavos = (monto: number): number => Math.round(monto * 100);

// Saldo aun no cubierto por cargos APROBADOS (no por montos escritos).
export const saldoBanorteCentavos = (
  totalCentavos: number,
  aprobadosCentavos: readonly number[]
): number => totalCentavos - aprobadosCentavos.reduce((a, b) => a + b, 0);

export type CotizacionCargoBanorte =
  | { ok: true; efectivoRestanteCentavos: number }
  | { ok: false; motivo: string };

// Cotiza un cargo de tarjeta contra el saldo pendiente: lo que quede se
// manda como "efectivo" al worker para que el SP lo registre como el
// complemento en efectivo del pago combinado. Rechaza cargos <= 0 o que
// excedan el saldo antes de tocar la terminal.
export const cotizarCargoBanorteCentavos = (
  totalCentavos: number,
  aprobadosCentavos: readonly number[],
  cargoCentavos: number
): CotizacionCargoBanorte => {
  if (!Number.isFinite(cargoCentavos) || cargoCentavos <= 0) {
    return { ok: false, motivo: "Captura un monto mayor a cero" };
  }
  const saldo = saldoBanorteCentavos(totalCentavos, aprobadosCentavos);
  if (cargoCentavos > saldo) {
    return { ok: false, motivo: "El monto excede el saldo pendiente de la venta" };
  }
  return { ok: true, efectivoRestanteCentavos: saldo - cargoCentavos };
};

export interface CondicionesCancelacionBanorte {
  hayToken: boolean;              // token_cancelacion emitido por el registro
  cargoEnCurso: boolean;          // un PAGAR esta en transito
  cierreEnCurso: boolean;         // VENTA esta imprimiendo/cerrando
  cancelacionEnCurso: boolean;    // ya hay una cancelacion en transito
  tieneTarjetaAprobada: boolean;  // algun cargo TC ya aprobado
  requiereConciliacion: boolean;  // resultado desconocido / registro fallido
}

// Cancelar solo es seguro con la venta en placeholder de efectivo puro: sin
// cargos aprobados (eso seria devolucion bancaria, no reversa), sin nada en
// transito y con un token vigente del registro.
export const puedeCancelarBanorte = (c: CondicionesCancelacionBanorte): boolean =>
  c.hayToken &&
  !c.cargoEnCurso &&
  !c.cierreEnCurso &&
  !c.cancelacionEnCurso &&
  !c.tieneTarjetaAprobada &&
  !c.requiereConciliacion;
