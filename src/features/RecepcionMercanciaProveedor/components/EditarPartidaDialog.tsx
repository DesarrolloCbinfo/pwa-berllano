import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import type {
  ActualizarPartidaPayload,
  PartidaIntermedia,
} from "../types/RecepcionMercanciaTypes";

interface Props {
  open: boolean;
  partida: PartidaIntermedia | null;
  guardando: boolean;
  onClose: () => void;
  onGuardar: (payload: ActualizarPartidaPayload) => Promise<boolean>;
}

export default function EditarPartidaDialog({
  open,
  partida,
  guardando,
  onClose,
  onGuardar,
}: Props) {
  const [claveProd, setClaveProd] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState(0);
  const [cantidadAdministracion, setCantidadAdministracion] = useState(0);
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    if (!open || !partida) return;
    setClaveProd(partida.clave_prod ?? "");
    setDescripcion(partida.descripcion ?? "");
    setCantidad(Number(partida.cantidad) || 0);
    setCantidadAdministracion(Number(partida.cantidad_administracion) || 0);
    setObservaciones(partida.observaciones ?? "");
  }, [open, partida]);

  const puedeGuardar = useMemo(
    () =>
      claveProd.trim().length > 0 &&
      cantidad > 0 &&
      cantidadAdministracion >= 0,
    [claveProd, cantidad, cantidadAdministracion]
  );

  const handleGuardar = async () => {
    if (!puedeGuardar || guardando) return;
    await onGuardar({
      clave_prod: claveProd.trim(),
      descripcion: descripcion.trim(),
      cantidad,
      cantidad_administracion: cantidadAdministracion,
      observaciones: observaciones.trim(),
    });
  };

  return (
    <Dialog open={open} onClose={guardando ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ bgcolor: "primary.main", color: "white" }}>
        Editar partida{partida ? ` #${partida.id}` : ""}
      </DialogTitle>
      <DialogContent sx={{ mt: 1 }}>
        <Stack spacing={2.5} mt={1}>
          <TextField
            label="Clave producto"
            value={claveProd}
            onChange={(event) => setClaveProd(event.target.value.toUpperCase())}
            disabled={guardando}
          />
          <TextField
            label="Descripción"
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            disabled={guardando}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Cantidad"
              type="number"
              value={cantidad || ""}
              onChange={(event) =>
                setCantidad(
                  event.target.value === "" ? 0 : Number(event.target.value)
                )
              }
              disabled={guardando}
              inputProps={{ min: 0, step: 1 }}
              fullWidth
            />
            <TextField
              label="Cantidad administración"
              type="number"
              value={cantidadAdministracion || ""}
              onChange={(event) =>
                setCantidadAdministracion(
                  event.target.value === "" ? 0 : Number(event.target.value)
                )
              }
              disabled={guardando}
              inputProps={{ min: 0, step: 1 }}
              fullWidth
            />
          </Stack>
          <TextField
            label="Observaciones"
            value={observaciones}
            onChange={(event) => setObservaciones(event.target.value)}
            disabled={guardando}
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={guardando} sx={{ textTransform: "none" }}>
          Cancelar
        </Button>
        <Button
          onClick={() => void handleGuardar()}
          variant="contained"
          disabled={!puedeGuardar || guardando}
          sx={{ textTransform: "none" }}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
