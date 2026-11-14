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
  onVenta: (pagoTotal: number) => Promise<void> | void;
  onCerrar: () => void;
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
  onCerrar,
}) => {
  // Lo escrito por el cajero en cada caja TC (aun no cobrado)
  const [tcMontos, setTcMontos] = React.useState<string[]>(Array(NUM_TC).fill(""));
  // Lo que el banco YA APROBO por tarjeta (montoAprobadoTCx del VBA)
  const [tcAprobados, setTcAprobados] = React.useState<number[]>(Array(NUM_TC).fill(0));
  const [tcMensajes, setTcMensajes] = React.useState<string[]>(Array(NUM_TC).fill(""));
  const [tcLoading, setTcLoading] = React.useState<boolean[]>(Array(NUM_TC).fill(false));
  const [efectivo, setEfectivo] = React.useState("");
  const [cerrandoVenta, setCerrandoVenta] = React.useState(false);

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
                disabled={tcAprobados[i] > 0 || tcLoading[i]}
                sx={{ ...campoSx, width: 95 }}
                placeholder="0.00"
              />
              <Button
                variant="contained"
                disableElevation
                disabled={
                  tcLoading[i] ||
                  tcAprobados[i] > 0 ||
                  !(parseFloat(tcMontos[i]) > 0) ||
                  excedeEscrito
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

        {excedeEscrito && (
          <Typography color="error" variant="caption" sx={{ display: "block", mt: 0.5 }}>
            El monto total en tarjeta no puede ser mayor al total de la venta.
          </Typography>
        )}

        {/* PAGO TOTAL + VENTA / CANCELAR */}
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
              disabled={!ventaCubierta || cerrandoVenta}
              onClick={async () => {
                setCerrandoVenta(true);
                try {
                  await onVenta(pagoTotal);
                } finally {
                  setCerrandoVenta(false);
                }
              }}
              title={ventaCubierta ? "Concluir la venta e imprimir el ticket" : "Falta cubrir el total de la venta"}
              sx={{ ...btnClasico, minWidth: 95 }}
            >
              {cerrandoVenta ? "..." : "VENTA"}
            </Button>
            <Button
              variant="contained"
              disableElevation
              disabled={!puedeCancelar}
              onClick={onCerrar}
              title={
                puedeCancelar
                  ? "Cerrar sin cobrar"
                  : "Hay cobros aprobados: cancela desde Devolucion"
              }
              sx={{ ...btnClasico, minWidth: 95 }}
            >
              CANCELAR
            </Button>
          </Box>
        </Box>
        {!puedeCancelar && (
          <Typography
            variant="caption"
            sx={{ display: "block", textAlign: "center", mt: 1, color: "#9c6500" }}
          >
            Ya hay tarjetas aprobadas; para salir debes hacer la devolucion primero.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CobroBanorteModal;
