import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  IconButton,
  Snackbar,
  Alert,
  Box,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useConsumoApi from "../../hooks/useConsumoApi";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/EditOutlined";

interface Props {
  open: boolean;
  onClose: () => void;
  pedido: number;
  sucursal: number;
  usuario: string;
}

type Cargo = {
  id?: number;
  sucursal: number;
  pedido: number;
  idCargo: number;
  subtotal: number;
  iva: number;
  total: number;
  usuario: string;
};

export default function CargosVariosDialog({ open, onClose, pedido, sucursal, usuario }: Props) {
  const { consumoApi } = useConsumoApi();
  const qc = useQueryClient();

  const [idCargo, setIdCargo] = useState<number>(0);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [iva, setIva] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [editRow, setEditRow] = useState<Cargo | undefined>();
  const [notif, setNotif] = useState<{ open: boolean; severity: "success" | "error"; message: string }>({
    open: false,
    severity: "success",
    message: "",
  });

  const queryKey = useMemo(() => ["temporal_cargos", pedido, sucursal], [pedido, sucursal]);

  const { data: cargos } = useQuery<Cargo[]>({
    queryKey,
    queryFn: async () => {
      const { data } = await consumoApi.get(`/api/TemporalData/sp_temporal_cargos_get/${pedido}/${sucursal}`);
      return data;
    },
    enabled: open && !!pedido && !!sucursal,
  });

  useEffect(() => {
    if (!open) return;
    if (editRow) {
      setIdCargo(editRow.idCargo);
      setSubtotal(editRow.subtotal);
      setIva(editRow.iva);
      setTotal(editRow.total);
    } else {
      setIdCargo(0);
      setSubtotal(0);
      setIva(0);
      setTotal(0);
    }
  }, [open, editRow]);

  useEffect(() => {
    setTotal((Number(subtotal) || 0) + (Number(iva) || 0));
  }, [subtotal, iva]);

  const crear = useMutation({
    mutationFn: async () => {
      const payload: Cargo = { id: 0, sucursal, pedido, idCargo, subtotal, iva, total, usuario };
      const { data } = await consumoApi.post(`/api/TemporalData/sp_temporal_cargos_post`, payload);
      return data as { codigo?: number; mensaje?: string };
    },
    onSuccess: (res) => {
      const ok = (res as any)?.codigo === 1 || !("codigo" in (res || {}));
      setNotif({
        open: true,
        severity: ok ? "success" : "error",
        message: (res?.mensaje as string) || (ok ? "Cargo agregado" : "Operación realizada"),
      });
      qc.invalidateQueries({ queryKey });
      setEditRow(undefined);
    },
    onError: (e: any) => setNotif({ open: true, severity: "error", message: e?.message || "Error" }),
  });

  const actualizar = useMutation({
    mutationFn: async () => {
      if (!editRow?.id && editRow?.id !== 0) throw new Error("Sin id de cargo");
      const payload: Cargo = { id: editRow.id, sucursal, pedido, idCargo, subtotal, iva, total, usuario };
      const { data } = await consumoApi.put(`/api/TemporalData/sp_temporal_cargos_update/${editRow.id}`, payload);
      return data as { codigo?: number; mensaje?: string };
    },
    onSuccess: (res) => {
      const ok = (res as any)?.codigo === 1 || !("codigo" in (res || {}));
      setNotif({
        open: true,
        severity: ok ? "success" : "error",
        message: (res?.mensaje as string) || (ok ? "Cargo actualizado" : "Operación realizada"),
      });
      qc.invalidateQueries({ queryKey });
      setEditRow(undefined);
    },
    onError: (e: any) => setNotif({ open: true, severity: "error", message: e?.message || "Error" }),
  });

  const eliminar = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await consumoApi.delete(`/api/TemporalData/sp_temporal_cargos_delete/${id}`);
      return data as { codigo?: number; mensaje?: string };
    },
    onSuccess: (res) => {
      const ok = (res as any)?.codigo === 1 || !("codigo" in (res || {}));
      setNotif({
        open: true,
        severity: ok ? "success" : "error",
        message: (res?.mensaje as string) || (ok ? "Cargo eliminado" : "Operación realizada"),
      });
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => setNotif({ open: true, severity: "error", message: e?.message || "Error" }),
  });

  const handleAceptar = async () => {
    if (!idCargo) {
      setNotif({ open: true, severity: "error", message: "Captura el tipo de cargo" });
      return;
    }
    if (editRow) await actualizar.mutateAsync();
    else await crear.mutateAsync();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        💳 Cargos varios
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 0 }}>
          <Box sx={{ flex: 1 }}>
            <Stack spacing={2}>
              <TextField
                label="Tipo cargo"
                type="number"
                value={idCargo || ""}
                onChange={(e) => setIdCargo(Number(e.target.value))}
              />
              <TextField
                label="Subtotal"
                type="number"
                value={subtotal || ""}
                onChange={(e) => setSubtotal(Number(e.target.value))}
              />
              <TextField label="IVA" type="number" value={iva || ""} onChange={(e) => setIva(Number(e.target.value))} />
              <TextField
                label="Total"
                type="number"
                value={total || ""}
                onChange={(e) => setTotal(Number(e.target.value))}
              />
            </Stack>
          </Box>
          <Box sx={{ flex: 1 }}>
            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
              <Table
                size="small"
                sx={{
                  "& .MuiTableHead-root": { bgcolor: "grey.50" },
                  "& .MuiTableBody-root .MuiTableRow-root:hover": { bgcolor: "action.hover" },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Cargo</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      Subtotal
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      IVA
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      Total
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(cargos ?? []).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => setEditRow(c)}
                            sx={{ "&:hover": { bgcolor: "primary.light", color: "white" } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => c.id !== undefined && eliminar.mutate(c.id)}
                            sx={{ "&:hover": { bgcolor: "error.light", color: "white" } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{c.idCargo}</TableCell>
                      <TableCell align="right" sx={{ color: "text.secondary" }}>
                        ${c.subtotal?.toFixed?.(2) ?? "0.00"}
                      </TableCell>
                      <TableCell align="right" sx={{ color: "text.secondary" }}>
                        ${c.iva?.toFixed?.(2) ?? "0.00"}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: "primary.main" }}>
                        ${c.total?.toFixed?.(2) ?? "0.00"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="text">
          Cancelar
        </Button>
        <Button onClick={handleAceptar} variant="contained">
          Aceptar
        </Button>
      </DialogActions>

      <Snackbar open={notif.open} autoHideDuration={4000} onClose={() => setNotif((s) => ({ ...s, open: false }))}>
        <Alert severity={notif.severity} variant="outlined" onClose={() => setNotif((s) => ({ ...s, open: false }))}>
          {notif.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}
