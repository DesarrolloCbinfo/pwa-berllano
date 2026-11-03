import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { FinalizarRecepcionPayload } from "../types/RecepcionMercanciaTypes";

interface Props {
  open: boolean;
  folio: number | null;
  finalizando: boolean;
  onClose: () => void;
  onConfirmar: (datos: FinalizarRecepcionPayload) => void;
}

function fechaHoy() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(hoy.getDate()).padStart(2, "0")}`;
}

function fechaValida(valor: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  return !Number.isNaN(new Date(`${valor}T00:00:00`).getTime());
}

export default function FinalizarRecepcionDialog({
  open,
  folio,
  finalizando,
  onClose,
  onConfirmar,
}: Props) {
  const [totalFactura, setTotalFactura] = useState("");
  const [folioDocto, setFolioDocto] = useState("");
  const [fechaFactura, setFechaFactura] = useState(fechaHoy());

  useEffect(() => {
    if (!open) return;
    setTotalFactura("");
    setFolioDocto("");
    setFechaFactura(fechaHoy());
  }, [open, folio]);

  const totalNumero = Number(totalFactura);
  const totalValido =
    totalFactura.trim() !== "" &&
    Number.isFinite(totalNumero) &&
    totalNumero >= 0;
  const folioValido =
    folioDocto.trim().length > 0 && folioDocto.trim().length <= 20;
  const fechaEsValida = fechaValida(fechaFactura);

  const puedeFinalizar = useMemo(
    () => totalValido && folioValido && fechaEsValida,
    [totalValido, folioValido, fechaEsValida]
  );

  const handleConfirmar = () => {
    if (!puedeFinalizar || finalizando) return;
    onConfirmar({
      total_factura: totalNumero,
      folio_docto: folioDocto.trim(),
      fecha_factura: fechaFactura,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={finalizando ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Finalizar recepción</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Alert severity="warning">
            Esta acción aplicará la recepción del pedido y las partidas dejarán
            de estar en edición.
          </Alert>

          <Typography variant="body2">
            ¿Deseas finalizar la recepción del pedido{" "}
            <strong>#{folio ?? "-"}</strong>?
          </Typography>

          <TextField
            label="Total factura"
            type="number"
            value={totalFactura}
            onChange={(event) => setTotalFactura(event.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
            helperText="Puede ser 0"
            disabled={finalizando}
            fullWidth
          />

          <TextField
            label="Folio documento"
            value={folioDocto}
            onChange={(event) => setFolioDocto(event.target.value)}
            inputProps={{ maxLength: 20 }}
            helperText={`${folioDocto.length}/20`}
            disabled={finalizando}
            required
            fullWidth
          />

          <TextField
            label="Fecha factura"
            type="date"
            value={fechaFactura}
            onChange={(event) => setFechaFactura(event.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={finalizando}
            required
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={finalizando}
          sx={{ textTransform: "none" }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirmar}
          variant="contained"
          color="success"
          disabled={!puedeFinalizar || finalizando}
          sx={{ textTransform: "none" }}
        >
          {finalizando ? "Finalizando..." : "Finalizar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
