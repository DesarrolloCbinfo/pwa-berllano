import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import type { ICobroTerminalResumen } from "../../interfaces/workerInterfaces";
import {
  aCentavos,
  cotizarCargoBanorteCentavos,
  puedeCancelarBanorte,
} from "./banorteSaldo";

// Port del formulario Access "f_banorte" (Banorte V 1.0 interredes).
// Cada boton PAGAR lanza POST /api/terminal/cobro al worker con el no_venta
// ya registrado; el worker cobra, inserta detalle_ventas_pagos e imprime
// el voucher. Las reglas de saldo son las de RecalcularSaldos del VBA.

interface CobroBanorteModalProps {
  open: boolean;
  total: number;          // TOTAL_A_PAGAR de la venta
  folioVenta: number;     // no_venta ya registrada (detalle_ventas)
  // efectivoRestante: saldo en pesos que queda como complemento en efectivo
  // despues de este cargo (contable, no lo captura el cajero).
  onPagar: (monto: number, tarjeta: string, efectivoRestante: number) => Promise<ICobroTerminalResumen | null>;
  onVenta: (pagoTotal: number) => Promise<void> | void;
  // Reversa en sistema de la(s) venta(s) recien registradas (no es
  // devolucion bancaria). Ausencia = boton deshabilitado; un string de
  // retorno bloquea el modal para conciliacion; void = sigue abierto.
  onCancelar?: () => Promise<string | void>;
}

const NUM_TC = 3;

// Estilo de campo clasico: caja blanca, borde gris fino, numeros a la derecha
const campoSx = {
  "& .MuiInputBase-root": {
    borderRadius: 0,
    backgroundColor: "#fff",
    fontSize: "0.9rem",
  },
  "& .MuiInputBase-input": {
    textAlign: "right",
    py: 0.6,
    px: 1,
  },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#9e9e9e" },
};

const labelSx = { fontWeight: "bold", minWidth: 90, color: "#333", fontSize: "0.95rem" };

// Boton estilo Access: gris, borde fino, esquinas rectas
const btnClasico = {
  borderRadius: 0,
  fontWeight: "bold" as const,
  textTransform: "none" as const,
  fontSize: "0.8rem",
  backgroundColor: "#e6e6e6",
  color: "#1a1a1a",
  border: "1px solid #9c9c9c",
  boxShadow: "none",
  minWidth: 78,
  "&:hover": { backgroundColor: "#d5d5d5", boxShadow: "none" },
  "&.Mui-disabled": { backgroundColor: "#f1f1f1", color: "#a3a3a3", border: "1px solid #c6c6c6" },
};

const CobroBanorteModal: React.FC<CobroBanorteModalProps> = ({
  open,
  total,
  folioVenta,
  onPagar,
  onVenta,
  onCancelar,
}) => {
  // Lo escrito por el cajero en cada caja TC (aun no cobrado)
  const [tcMontos, setTcMontos] = React.useState<string[]>(Array(NUM_TC).fill(""));
  // Lo que el banco YA APROBO por tarjeta (montoAprobadoTCx del VBA)
  const [tcAprobados, setTcAprobados] = React.useState<number[]>(Array(NUM_TC).fill(0));
  const [tcMensajes, setTcMensajes] = React.useState<string[]>(Array(NUM_TC).fill(""));
  const [tcLoading, setTcLoading] = React.useState<boolean[]>(Array(NUM_TC).fill(false));
  const [efectivo, setEfectivo] = React.useState("");
  const [cerrandoVenta, setCerrandoVenta] = React.useState(false);
  // Cualquier cargo en transito bloquea todos los PAGAR/VENTA: dos slots no
  // pueden cotizar contra el mismo saldo en paralelo.
  const [cobroPendiente, setCobroPendiente] = React.useState(false);
  // Una aprobada cuyo pago NO quedo registrado bloquea el modal completo:
  // no se reintenta ni se cierra hasta conciliar la venta a mano.
  const [bloqueoConciliacion, setBloqueoConciliacion] = React.useState("");
  // Cancelacion del cobro en transito (misma exclusion mutua por ref).
  const [cancelando, setCancelando] = React.useState(false);

  const totalAprobado = tcAprobados.reduce((a, b) => a + b, 0);
  const aprobadosCentavos = tcAprobados.map(aCentavos);

  // RecalcularSaldos: el efectivo se bloquea por lo YA APROBADO, no por lo
  // escrito; un texto declinado/sin cobrar no debe poner el efectivo en 0.
  const efectivoLocked = aprobadosCentavos.reduce((a, b) => a + b, 0) >= aCentavos(total);
  const efectivoVal = efectivoLocked ? 0 : parseFloat(efectivo) || 0;

  const pagoTotal = totalAprobado + efectivoVal;
  const ventaCubierta = aCentavos(pagoTotal) >= aCentavos(total);

  const setTcMonto = (i: number, v: string) =>
    setTcMontos((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  const setTcAprobado = (i: number, v: number) =>
    setTcAprobados((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  const setTcMensaje = (i: number, v: string) =>
    setTcMensajes((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  const setTcCargando = (i: number, v: boolean) =>
    setTcLoading((prev) => prev.map((x, idx) => (idx === i ? v : x)));

  // Candado inmediato (ref): dos PAGAR no pueden salir contra el mismo saldo
  // aunque el click llegue antes de que React repinte el estado.
  const cobroEnCursoRef = React.useRef(false);

  const handlePagar = async (i: number) => {
    if (cobroEnCursoRef.current || bloqueoConciliacion || cancelando) return;
    const cargoCentavos = aCentavos(parseFloat(tcMontos[i]) || 0);
    const cotizacion = cotizarCargoBanorteCentavos(
      aCentavos(total),
      aprobadosCentavos,
      cargoCentavos
    );
    if (!cotizacion.ok) {
      setTcMensaje(i, cotizacion.motivo);
      return;
    }
    cobroEnCursoRef.current = true;
    setCobroPendiente(true);
    setTcCargando(i, true);
    setTcMensaje(i, "Esperando tarjeta en la terminal...");
    try {
      const res = await onPagar(
        cargoCentavos / 100,
        `TC${i + 1}`,
        cotizacion.efectivoRestanteCentavos / 100
      );
      if (res?.aprobada) {
        // Aunque el registro local falle, el cargo ya salio por la terminal:
        // el slot queda aprobado y NO se puede volver a cobrar.
        setTcAprobado(i, cargoCentavos / 100);
        const extra = [
          res.ventaInsertada ? "" : " (no registro pago en BD)",
          res.ticketImpreso ? "" : " (voucher no impreso)",
        ].join("");
        setTcMensaje(i, `Aprobada: ${res.mensajeRespuesta}${extra}`);
        if (!res.ventaInsertada) {
          setBloqueoConciliacion(
            `TC${i + 1} aprobada por ${(cargoCentavos / 100).toFixed(2)} pero el pago no quedo registrado en BD. ` +
            `No vuelva a cobrar; solicite conciliación con el folio ${folioVenta}.`
          );
        }
      } else if (res) {
        setTcAprobado(i, 0);
        setTcMensaje(i, res.mensajeRespuesta || "No aprobada");
      } else {
        // Respuesta nula: no sabemos si el cargo se aplico. Se bloquea todo
        // para evitar un posible cobro duplicado.
        setTcAprobado(i, 0);
        setTcMensaje(i, "Resultado del cargo desconocido");
        setBloqueoConciliacion(
          `No se pudo confirmar el cargo de TC${i + 1}. No vuelva a cobrar; ` +
          `solicite conciliación con el folio ${folioVenta}.`
        );
      }
    } finally {
      setTcCargando(i, false);
      setCobroPendiente(false);
      cobroEnCursoRef.current = false;
    }
  };

  const puedeCancelar = puedeCancelarBanorte({
    hayToken: !!onCancelar,
    cargoEnCurso: cobroPendiente,
    cierreEnCurso: cerrandoVenta,
    cancelacionEnCurso: cancelando,
    tieneTarjetaAprobada: tcAprobados.some((v) => v > 0),
    requiereConciliacion: !!bloqueoConciliacion,
  });

  const tituloCancelar = !onCancelar
    ? "Cancelar no esta disponible para este cobro"
    : tcAprobados.some((v) => v > 0)
      ? "Ya hay un cargo aprobado en tarjeta; para devolverlo use el proceso bancario correspondiente"
      : "Revierte la venta registrada en el sistema; no devuelve el cargo a la tarjeta";

  const handleCancelar = async () => {
    if (!onCancelar || !puedeCancelar || cobroEnCursoRef.current) return;
    // Mismo candado que PAGAR/VENTA: la cancelacion no puede cruzarse con un
    // cargo o el cierre.
    cobroEnCursoRef.current = true;
    setCancelando(true);
    try {
      const motivo = await onCancelar();
      if (typeof motivo === "string" && motivo) setBloqueoConciliacion(motivo);
    } finally {
      setCancelando(false);
      cobroEnCursoRef.current = false;
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{ sx: { borderRadius: 1, overflow: "hidden" } }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "#7b1e26",
          color: "white",
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "0.9rem",
          py: 0.9,
          letterSpacing: 0.5,
        }}
      >
        Banorte V 1.0 — Folio venta {folioVenta}
      </DialogTitle>
      <DialogContent sx={{ pt: 1.5, backgroundColor: "#efefef" }}>
        {/* Leyenda superior centrada */}
        <Typography
          variant="caption"
          sx={{ display: "block", textAlign: "center", color: "#555", letterSpacing: 0.5 }}
        >
          Banorte V 1.0 interredes
        </Typography>

        {/* TOTAL / EFECTIVO (izq) + logo Banorte (der) */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mt: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={labelSx}>TOTAL</Typography>
              <TextField
                size="small"
                value={total.toFixed(2)}
                disabled
                sx={{ ...campoSx, width: 130 }}
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={labelSx}>EFECTIVO</Typography>
              <TextField
                size="small"
                type="number"
                value={efectivoLocked ? "0.00" : efectivo}
                onChange={(e) => setEfectivo(e.target.value)}
                disabled={efectivoLocked}
                sx={{ ...campoSx, width: 130 }}
              />
            </Box>
          </Box>
          {/* Logo Banorte aproximado: recuadro rojo con texto blanco */}
          <Box
            sx={{
              width: 155,
              height: 52,
              mt: 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(180deg, #a50034 0%, #6e1423 55%, #4d0d18 100%)",
              border: "1px solid #3a0a12",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.18), 0 1px 3px rgba(0,0,0,.35)",
            }}
          >
            <Typography
              sx={{
                color: "#fff",
                fontWeight: 900,
                fontStyle: "italic",
                fontSize: "1.25rem",
                letterSpacing: 1.5,
                textShadow: "0 1px 2px rgba(0,0,0,.6)",
                fontFamily: "Arial, Helvetica, sans-serif",
              }}
            >
              BANORTE
            </Typography>
          </Box>
        </Box>

        {/* Marco TC1..TC3 */}
        <Box
          sx={{
            mt: 2,
            border: "1px solid #b5b5b5",
            borderRadius: "3px",
            backgroundColor: "#fbfbfb",
            p: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 1.2,
          }}
        >
          {Array.from({ length: NUM_TC }, (_, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontWeight: "bold", minWidth: 34, color: "#333" }}>{`TC${i + 1}`}</Typography>
              <TextField
                size="small"
                type="number"
                value={tcMontos[i]}
                onChange={(e) => setTcMonto(i, e.target.value)}
                disabled={tcAprobados[i] > 0 || cobroPendiente || cerrandoVenta || cancelando || !!bloqueoConciliacion}
                sx={{ ...campoSx, width: 95 }}
                placeholder="0.00"
              />
              <Button
                variant="contained"
                disableElevation
                disabled={
                  cobroPendiente ||
                  cerrandoVenta ||
                  cancelando ||
                  !!bloqueoConciliacion ||
                  tcAprobados[i] > 0 ||
                  !(parseFloat(tcMontos[i]) > 0)
                }
                onClick={() => handlePagar(i)}
                sx={btnClasico}
              >
                {tcLoading[i] ? "..." : "PAGAR"}
              </Button>
              <TextField
                size="small"
                fullWidth
                value={
                  tcAprobados[i] > 0
                    ? `$${tcAprobados[i].toFixed(2)} — ${tcMensajes[i]}`
                    : tcMensajes[i]
                }
                InputProps={{ readOnly: true }}
                sx={{
                  ...campoSx,
                  "& .MuiInputBase-input": {
                    ...campoSx["& .MuiInputBase-input"],
                    textAlign: "left",
                    fontSize: "0.78rem",
                    color:
                      tcAprobados[i] > 0
                        ? "#1e7d1e"
                        : tcMensajes[i]
                          ? "#9c6500"
                          : "#666",
                    fontWeight: tcAprobados[i] > 0 ? "bold" : "normal",
                  },
                }}
              />
            </Box>
          ))}
        </Box>

        {bloqueoConciliacion && (
          <Typography color="error" variant="caption" sx={{ display: "block", mt: 0.5, fontWeight: "bold" }}>
            {bloqueoConciliacion}
          </Typography>
        )}

        {/* PAGO TOTAL + VENTA (oculto cuando el modal quedo bloqueado para
            conciliacion: no se permiten mas cargos ni el cierre) */}
        {!bloqueoConciliacion && (
          <>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ ...labelSx, minWidth: 100 }}>PAGO TOTAL</Typography>
                <TextField
                  size="small"
                  value={pagoTotal.toFixed(2)}
                  disabled
                  sx={{ ...campoSx, width: 110 }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: ventaCubierta ? "#1e7d1e" : "#777", fontWeight: "bold", ml: 0.5 }}
                >
                  {ventaCubierta ? "Cubierto" : `Faltan $${(total - pagoTotal).toFixed(2)}`}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button
                  variant="contained"
                  disableElevation
                  disabled={!puedeCancelar}
                  onClick={handleCancelar}
                  title={tituloCancelar}
                  sx={{ ...btnClasico, minWidth: 95 }}
                >
                  {cancelando ? "..." : "CANCELAR"}
                </Button>
                <Button
                  variant="contained"
                  disableElevation
                  disabled={!ventaCubierta || cerrandoVenta || cobroPendiente || cancelando}
                  onClick={async () => {
                    // Mismo candado que los PAGAR: el cierre (impresion) y un
                    // cargo no pueden correr en paralelo.
                    if (cobroEnCursoRef.current) return;
                    cobroEnCursoRef.current = true;
                    setCerrandoVenta(true);
                    try {
                      await onVenta(pagoTotal);
                    } finally {
                      setCerrandoVenta(false);
                      cobroEnCursoRef.current = false;
                    }
                  }}
                  title={ventaCubierta ? "Concluir la venta e imprimir el ticket" : "Falta cubrir el total de la venta"}
                  sx={{ ...btnClasico, minWidth: 95 }}
                >
                  {cerrandoVenta ? "..." : "VENTA"}
                </Button>
              </Box>
            </Box>
            <Typography
              variant="caption"
              sx={{ display: "block", textAlign: "center", mt: 1, color: "#9c6500" }}
            >
              {tcAprobados.some((v) => v > 0)
                ? "Hay un cargo aprobado. CANCELAR no hace devoluciones bancarias."
                : onCancelar
                  ? "Puedes concluir la venta con VENTA o revertirla con CANCELAR."
                  : "No se habilito CANCELAR para esta venta."}
            </Typography>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CobroBanorteModal;
