import { useEffect, useRef, useState } from "react";
import {
  Button,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import type { PedidoDetalle } from "../types/RecepcionMercanciaTypes";

interface Props {
  folio: number;
  detalle: PedidoDetalle[];
  cargando: boolean;
  onAgregar: (
    item: PedidoDetalle,
    cantidad: number,
    observaciones: string
  ) => Promise<boolean>;
}

interface Captura {
  cantidad: number;
  observaciones: string;
}

function formatoMoneda(valor: number) {
  return Number(valor || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

export default function CapturaPartidasTable({
  folio,
  detalle,
  cargando,
  onAgregar,
}: Props) {
  const [capturas, setCapturas] = useState<Record<number, Captura>>({});
  const [agregadas, setAgregadas] = useState<number[]>([]);
  const [enviandoIndex, setEnviandoIndex] = useState<number | null>(null);
  const folioInicializado = useRef<number | null>(null);

  useEffect(() => {
    if (folioInicializado.current === folio) return;
    if (detalle.length === 0) return;

    const inicial = detalle.reduce<Record<number, Captura>>((acumulado, item, index) => {
      acumulado[index] = {
        cantidad: Number(item.cantidad_pedido) || 0,
        observaciones: "",
      };
      return acumulado;
    }, {});
    setCapturas(inicial);
    setAgregadas([]);
    setEnviandoIndex(null);
    folioInicializado.current = folio;
  }, [detalle, folio]);

  const actualizarCaptura = (index: number, cambios: Partial<Captura>) => {
    setCapturas((prev) => ({
      ...prev,
      [index]: {
        cantidad: prev[index]?.cantidad ?? 0,
        observaciones: prev[index]?.observaciones ?? "",
        ...cambios,
      },
    }));
  };

  const handleAgregar = async (index: number, item: PedidoDetalle) => {
    const captura = capturas[index];
    if (!captura || captura.cantidad <= 0 || agregadas.includes(index)) return;

    setEnviandoIndex(index);
    try {
      const agregada = await onAgregar(item, captura.cantidad, captura.observaciones);
      if (agregada) {
        setAgregadas((prev) => [...prev, index]);
      }
    } finally {
      setEnviandoIndex(null);
    }
  };

  return (
    <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "grey.50" }}>
            <TableCell sx={{ fontWeight: 600 }}>Clave</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Marca</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              Cant. pedido
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              Costo pedido
            </TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 130 }}>Cant. recibir</TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Observaciones</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              Acción
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cargando && detalle.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                <CircularProgress size={24} />
              </TableCell>
            </TableRow>
          )}

          {!cargando && detalle.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  El pedido no tiene partidas para capturar.
                </Typography>
              </TableCell>
            </TableRow>
          )}

          {detalle.map((item, index) => {
            const captura = capturas[index] ?? { cantidad: 0, observaciones: "" };
            const agregada = agregadas.includes(index);
            const enviando = enviandoIndex === index;

            return (
              <TableRow key={`${item.clave_prod}-${index}`} hover>
                <TableCell>
                  <Chip label={item.clave_prod} size="small" variant="outlined" />
                </TableCell>
                <TableCell sx={{ maxWidth: 260 }}>{item.descripcion || "-"}</TableCell>
                <TableCell>{item.marca || "-"}</TableCell>
                <TableCell align="right">{item.cantidad_pedido}</TableCell>
                <TableCell align="right">{formatoMoneda(item.costo_pedido)}</TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    value={captura.cantidad || ""}
                    onChange={(event) =>
                      actualizarCaptura(index, {
                        cantidad:
                          event.target.value === "" ? 0 : Number(event.target.value),
                      })
                    }
                    disabled={agregada || enviandoIndex !== null}
                    inputProps={{ min: 0, step: 1 }}
                    sx={{ width: 110 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={captura.observaciones}
                    onChange={(event) =>
                      actualizarCaptura(index, { observaciones: event.target.value })
                    }
                    disabled={agregada || enviandoIndex !== null}
                    placeholder="Opcional"
                    fullWidth
                  />
                </TableCell>
                <TableCell align="right">
                  {agregada ? (
                    <Chip label="Agregada" size="small" color="success" />
                  ) : (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={
                        enviando ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <AddIcon />
                        )
                      }
                      disabled={
                        enviandoIndex !== null || captura.cantidad <= 0
                      }
                      onClick={() => void handleAgregar(index, item)}
                      sx={{ textTransform: "none" }}
                    >
                      Agregar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
