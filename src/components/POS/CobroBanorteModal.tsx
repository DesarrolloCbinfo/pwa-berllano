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

// Port del formulario Access "f_banorte" (Banorte V 1.0 interredes).
// Cada boton PAGAR lanza POST /api/terminal/cobro al worker con el no_venta
// ya registrado; el worker cobra, inserta detalle_ventas_pagos e imprime
// el voucher. Las reglas de saldo son las de RecalcularSaldos del VBA.

interface CobroBanorteModalProps {
  open: boolean;
  total: number;          // TOTAL_A_PAGAR de la venta
  folioVenta: number;     // no_venta ya registrada (detalle_ventas)
  onPagar: (monto: number, tarjeta: string) => Promise<ICobroTerminalResumen | null>;
  onCerrar: () => void;
}

const NUM_TC = 3;

const estiloBtn = {
  borderRadius: 0,
  fontWeight: "bold",
  textTransform: "none" as const,
  fontSize: "0.85rem",
};

const CobroBanorteModal: React.FC<CobroBanorteModalProps> = ({
  open,
  total,
  folioVenta,
  onPagar,
  onCerrar,
}) => {
  // Lo escrito por el cajero en cada caja TC (aun no cobrado)
  const [tcMontos, setTcMontos] = React.useState<string[]>(Array(NUM_TC).fill(""));
  // Lo que el banco YA APROBO por tarjeta (montoAprobadoTCx del VBA)
  const [tcAprobados, setTcAprobados] = React.useState<number[]>(Array(NUM_TC).fill(0));
  const [tcMensajes, setTcMensajes] = React.useState<string[]>(Array(NUM_TC).fill(""));
  const [tcLoading, setTcLoading] = React.useState<boolean[]>(Array(NUM_TC).fill(false));
  const [efectivo, setEfectivo] = React.useState("");

  const totalAprobado = tcAprobados.reduce((a, b) => a + b, 0);
  const totalEscrito = tcMontos.reduce((a, b) => a + (parseFloat(b) || 0), 0);
  const excedeEscrito = totalEscrito > total;

  // RecalcularSaldos: si lo escrito cubre el total, el efectivo queda en 0 y bloqueado
  const efectivoLocked = totalEscrito >= total;
  const efectivoVal = efectivoLocked ? 0 : parseFloat(efectivo) || 0;

  const pagoTotal = totalAprobado + efectivoVal;
  const ventaCubierta = pagoTotal >= total;
  const puedeCancelar = totalAprobado === 0;

  const setTcMonto = (i: number, v: string) =>
    setTcMontos((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  const setTcAprobado = (i: number, v: number) =>
    setTcAprobados((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  const setTcMensaje = (i: number, v: string) =>
    setTcMensajes((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  const setTcCargando = (i: number, v: boolean) =>
    setTcLoading((prev) => prev.map((x, idx) => (idx === i ? v : x)));

  const handlePagar = async (i: number) => {
    const monto = parseFloat(tcMontos[i]) || 0;
    if (monto <= 0) {
      setTcMensaje(i, "Captura un monto mayor a cero");
      return;
    }
    setTcCargando(i, true);
    setTcMensaje(i, "Esperando tarjeta en la terminal...");
    try {
      const res = await onPagar(monto, `TC${i + 1}`);
      if (res?.aprobada) {
        setTcAprobado(i, monto);
        const extra = [
          res.ventaInsertada ? "" : " (no registro pago en BD)",
          res.ticketImpreso ? "" : " (voucher no impreso)",
        ].join("");
        setTcMensaje(i, `Aprobada: ${res.mensajeRespuesta}${extra}`);
      } else {
        setTcAprobado(i, 0);
        setTcMensaje(i, res ? res.mensajeRespuesta || "No aprobada" : "Sin respuesta del worker");
      }
    } finally {
      setTcCargando(i, false);
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      onClose={() => { if (puedeCancelar) onCerrar(); }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "#7b1e26",
          color: "white",
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "1rem",
          py: 1,
        }}
      >
        Banorte V 1.0 — Folio venta {folioVenta}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {/* TOTAL / EFECTIVO */}
        <Box sx={{ display: "flex", gap: 3, mt: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
            <Typography sx={{ fontWeight: "bold", minWidth: 80 }}>TOTAL</Typography>
            <TextField
              size="small"
              value={total.toFixed(2)}
              disabled
              fullWidth
              inputProps={{ style: { textAlign: "right", fontWeight: "bold" } }}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
            <Typography sx={{ fontWeight: "bold", minWidth: 80 }}>EFECTIVO</Typography>
            <TextField
              size="small"
              type="number"
              value={efectivoLocked ? "0.00" : efectivo}
              onChange={(e) => setEfectivo(e.target.value)}
              disabled={efectivoLocked}
              fullWidth
              inputProps={{ style: { textAlign: "right" } }}
            />
          </Box>
        </Box>

        {/* TC1..TC3 */}
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
          {Array.from({ length: NUM_TC }, (_, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontWeight: "bold", minWidth: 36 }}>{`TC${i + 1}`}</Typography>
              <TextField
                size="small"
                type="number"
                value={tcMontos[i]}
                onChange={(e) => setTcMonto(i, e.target.value)}
                disabled={tcAprobados[i] > 0 || tcLoading[i]}
                sx={{ width: 110 }}
                inputProps={{ style: { textAlign: "right" } }}
                placeholder="0.00"
              />
              <Button
                variant="contained"
                disabled={
                  tcLoading[i] ||
                  tcAprobados[i] > 0 ||
                  !(parseFloat(tcMontos[i]) > 0) ||
                  excedeEscrito
                }
                onClick={() => handlePagar(i)}
                sx={{
                  ...estiloBtn,
                  backgroundColor: "#4a6572",
                  color: "white",
                  minWidth: 80,
                  "&:hover": { backgroundColor: "#34495e" },
                }}
              >
                {tcLoading[i] ? "..." : "PAGAR"}
              </Button>
              <Typography
                variant="caption"
                sx={{
                  flex: 1,
                  color:
                    tcAprobados[i] > 0
                      ? "green"
                      : tcMensajes[i]
                        ? "#b26a00"
                        : "text.secondary",
                  fontWeight: tcAprobados[i] > 0 ? "bold" : "normal",
                }}
              >
                {tcAprobados[i] > 0
                  ? `$${tcAprobados[i].toFixed(2)} — ${tcMensajes[i]}`
                  : tcMensajes[i]}
              </Typography>
            </Box>
          ))}
        </Box>

        {excedeEscrito && (
          <Typography color="error" variant="caption">
            El monto total en tarjeta no puede ser mayor al total de la venta.
          </Typography>
        )}

        {/* PAGO TOTAL */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
          <Typography sx={{ fontWeight: "bold", minWidth: 100 }}>PAGO TOTAL</Typography>
          <TextField
            size="small"
            value={pagoTotal.toFixed(2)}
            disabled
            sx={{ width: 130 }}
            inputProps={{ style: { textAlign: "right", fontWeight: "bold" } }}
          />
          <Typography
            variant="caption"
            sx={{ color: ventaCubierta ? "green" : "text.secondary", fontWeight: "bold" }}
          >
            {ventaCubierta ? "Cubierto" : `Faltan $${(total - pagoTotal).toFixed(2)}`}
          </Typography>
        </Box>

        {/* VENTA / CANCELAR */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mt: 3 }}>
          <Button
            variant="contained"
            disabled
            title="Pendiente de implementar"
            sx={{ ...estiloBtn, backgroundColor: "#9e9e9e", color: "white", minWidth: 130 }}
          >
            VENTA (pendiente)
          </Button>
          <Button
            variant="contained"
            disabled={!puedeCancelar}
            onClick={onCerrar}
            title={
              puedeCancelar
                ? "Cerrar sin cobrar"
                : "Hay cobros aprobados: cancela desde Devolucion"
            }
            sx={{ ...estiloBtn, backgroundColor: "#4a6572", color: "white", minWidth: 130 }}
          >
            CANCELAR
          </Button>
        </Box>
        {!puedeCancelar && (
          <Typography
            variant="caption"
            sx={{ display: "block", textAlign: "center", mt: 1, color: "#b26a00" }}
          >
            Ya hay tarjetas aprobadas; para salir debes hacer la devolucion primero.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CobroBanorteModal;
