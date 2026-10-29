import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

interface Props {
  open: boolean;
  folio: number | null;
  finalizando: boolean;
  onClose: () => void;
  onConfirmar: () => void;
}

export default function FinalizarRecepcionDialog({
  open,
  folio,
  finalizando,
  onClose,
  onConfirmar,
}: Props) {
  return (
    <Dialog open={open} onClose={finalizando ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Finalizar recepción</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Esta acción aplicará la recepción del pedido y las partidas dejarán de
          estar en edición.
        </Alert>
        <Typography variant="body2">
          ¿Deseas finalizar la recepción del pedido <strong>#{folio ?? "-"}</strong>?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={finalizando} sx={{ textTransform: "none" }}>
          Cancelar
        </Button>
        <Button
          onClick={onConfirmar}
          variant="contained"
          color="success"
          disabled={finalizando}
          sx={{ textTransform: "none" }}
        >
          {finalizando ? "Finalizando..." : "Finalizar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
