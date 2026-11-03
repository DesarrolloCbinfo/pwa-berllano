import {
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/EditOutlined";
import type { PartidaIntermedia } from "../types/RecepcionMercanciaTypes";

interface Props {
  partidas: PartidaIntermedia[];
  cargando: boolean;
  eliminandoId: number | null;
  onEditar: (partida: PartidaIntermedia) => void;
  onEliminar: (partida: PartidaIntermedia) => void;
}

export default function EdicionPartidasTable({
  partidas,
  cargando,
  eliminandoId,
  onEditar,
  onEliminar,
}: Props) {
  return (
    <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "grey.50" }}>
            <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Clave</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              Cantidad
            </TableCell>
       
            <TableCell sx={{ fontWeight: 600 }}>Observaciones</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Estatus</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cargando && partidas.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                <CircularProgress size={24} />
              </TableCell>
            </TableRow>
          )}

          {!cargando && partidas.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Aún no hay partidas capturadas para este pedido.
                </Typography>
              </TableCell>
            </TableRow>
          )}

          {partidas.map((partida) => (
            <TableRow key={partida.id} hover>
              <TableCell>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Editar partida">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => onEditar(partida)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar partida">
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onEliminar(partida)}
                        disabled={eliminandoId === partida.id}
                      >
                        {eliminandoId === partida.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <DeleteIcon fontSize="small" />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </TableCell>
              <TableCell>
                <Chip label={partida.clave_prod} size="small" variant="outlined" />
              </TableCell>
              <TableCell sx={{ maxWidth: 260 }}>{partida.descripcion || "-"}</TableCell>
              <TableCell align="right">{partida.cantidad}</TableCell>
              {/* <TableCell align="right">{partida.cantidad_administracion}</TableCell> */}
              <TableCell sx={{ maxWidth: 220 }}>
                {partida.observaciones || "-"}
              </TableCell>
              <TableCell>
                <Chip
                  label={partida.estatus}
                  size="small"
                  color={partida.estatus === "Edicion" ? "warning" : "default"}
                  variant="outlined"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
