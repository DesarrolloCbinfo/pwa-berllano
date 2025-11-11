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
  Snackbar,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import useConsumoApi from "../../hooks/useConsumoApi";
import { TemporalRMRow } from "../../app/pages/RecepcionMercancia/RecepcionMercancia";

interface Props {
  open: boolean;
  onClose: () => void;
  folioPedido: number;
  sucursal: number;
  usuario: string;
  row?: TemporalRMRow; // si existe, es edición
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function AddProductoDialog({
  open,
  onClose,
  folioPedido,
  sucursal,
  usuario,
  row,
  onSuccess,
  onError,
}: Props) {
  const { consumoApi } = useConsumoApi();
  const [clave, setClave] = useState<string>(row?.claveProd ?? "");
  const [descripcion, setDescripcion] = useState<string>(row?.descripcion ?? "");
  const [cantidad, setCantidad] = useState<number>(row?.cantidad ?? 0);
  const [costoUnitario, setCostoUnitario] = useState<number>(row?.costoUnitario ?? 0);
  const [tasaIva, setTasaIva] = useState<number>(row?.tasaIva ?? 0);
  const [loadingDesc, setLoadingDesc] = useState<boolean>(false);
  const [notif, setNotif] = useState<{ open: boolean; severity: "success" | "error"; message: string }>({
    open: false,
    severity: "success",
    message: "",
  });

  useEffect(() => {
    if (!open) return;
    setClave(row?.claveProd ?? "");
    setDescripcion(row?.descripcion ?? "");
    setCantidad(row?.cantidad ?? 0);
    setCostoUnitario(row?.costoUnitario ?? 0);
    setTasaIva(row?.tasaIva ?? 0);
  }, [open, row]);

  const canSubmit = useMemo(() => !!clave && cantidad > 0, [clave, cantidad]);

  const fetchDescripcion = async (claveProd: string) => {
    if (!claveProd) return;
    setLoadingDesc(true);
    try {
      // Intento de endpoint para obtener descripción por clave
      const { data } = await consumoApi.get(`/api/CatClientesSuc/producto/${encodeURIComponent(claveProd)}`);
      // El API puede regresar arreglo u objeto; manejamos ambos
      const item = Array.isArray(data) ? data[0] : data;
      setDescripcion(item?.descripcion_corta || item?.descripcion || "");
      setCostoUnitario(item?.costoUnitario || item?.costo || 0);
      setTasaIva(item?.tasaIva || 0);
    } catch (e: any) {
      // Si el endpoint no existe, permitimos captura manual
      setNotif({ open: true, severity: "error", message: "No se pudo obtener la descripción automáticamente" });
    } finally {
      setLoadingDesc(false);
    }
  };

  const crear = useMutation({
    mutationFn: async () => {
      const payload: TemporalRMRow & { usuario: string; usuarioPedido: string } = {
        folioPedido,
        folioRecepcion: 0,
        numeroFactura: "",
        totalFactura: 0,
        claveProd: clave,
        descripcion: descripcion,
        proveedor: "",
        cantidad: cantidad,
        cantidadPedido: 0,
        sucursal,
        usuario,
        usuarioPedido: usuario,
        costoUnitario: costoUnitario,
        tasaIva: tasaIva,
      };
      const { data } = await consumoApi.post(`/api/TemporalData/sp_temporal_rm_create`, payload);
      return data as { codigo?: number; mensaje?: string };
    },
    onSuccess: (res) => {
      const ok = (res as any)?.codigo === 1 || !("codigo" in (res || {}));
      onSuccess((res?.mensaje as string) || (ok ? "Producto agregado" : "Operación realizada"));
    },
    onError: (e: any) => onError(e?.message || "Error al agregar"),
  });

  const actualizar = useMutation({
    mutationFn: async () => {
      if (!row?.id && row?.id !== 0) throw new Error("No se encontró el id del registro");
      const payload: TemporalRMRow & { usuario: string } = {
        ...row,
        claveProd: clave,
        descripcion,
        cantidad,
        costoUnitario,
        tasaIva,
        usuario,
      } as any;
      const { data } = await consumoApi.put(`/api/TemporalData/sp_tempral_rm_update/${row.id}`, payload);
      return data as { codigo?: number; mensaje?: string };
    },
    onSuccess: (res) => {
      const ok = (res as any)?.codigo === 1 || !("codigo" in (res || {}));
      onSuccess((res?.mensaje as string) || (ok ? "Producto actualizado" : "Operación realizada"));
    },
    onError: (e: any) => onError(e?.message || "Error al actualizar"),
  });

  const handleAceptar = async () => {
    if (!canSubmit) return;
    if (row) await actualizar.mutateAsync();
    else await crear.mutateAsync();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        {row ? "✏️ Editar producto" : "➕ Agregar producto"}
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Stack spacing={2.5} mt={1}>
          <TextField
            label="Clave producto"
            value={clave}
            onChange={(e) => setClave(e.target.value.toUpperCase())}
            onBlur={() => fetchDescripcion(clave)}
          />
          <TextField
            label="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            InputProps={{
              endAdornment: loadingDesc ? (
                <InputAdornment position="end">
                  <CircularProgress size={16} />
                </InputAdornment>
              ) : undefined,
            }}
          />
          <TextField
            label="Cantidad"
            type="number"
            value={cantidad || ""}
            onChange={(e) => setCantidad(Number(e.target.value))}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Costo unitario"
              type="number"
              value={costoUnitario || ""}
              onChange={(e) => setCostoUnitario(Number(e.target.value))}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              fullWidth
            />
            <TextField
              label="Tasa IVA"
              type="number"
              value={tasaIva || ""}
              onChange={(e) => setTasaIva(Number(e.target.value))}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              inputProps={{ step: 0.01, min: 0, max: 1 }}
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="text">
          Cancelar
        </Button>
        <Button
          onClick={handleAceptar}
          variant="contained"
          disabled={!canSubmit || crear.isPending || actualizar.isPending}
        >
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
