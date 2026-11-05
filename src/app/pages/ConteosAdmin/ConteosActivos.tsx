import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import useConsumoApi from "../../../hooks/useConsumoApi";
import useSession from "../../../hooks/useSession";
import { routes } from "../../../utils/Routes";
import { ConteosApis } from "../Conteos/apis/ConteosApis";
import { getSucursalConteo } from "../Conteos/conteoSession";
import {
  IConteoActivo,
  IUsuarioConteo,
} from "../Conteos/interfaces/IConteo";

export default function ConteosActivos() {
  const { consumoApi } = useConsumoApi();
  const session = useSession();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [conteos, setConteos] = useState<IConteoActivo[]>([]);
  const [usuarios, setUsuarios] = useState<IUsuarioConteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardandoId, setGuardandoId] = useState<number | null>(null);

  const sucursal = getSucursalConteo();
  const suc = sucursal?.id ?? session?.sucursal ?? 0;

  const cargar = async () => {
    setLoading(true);
    try {
      const [resAct, resUsr] = await Promise.all([
        consumoApi.get(ConteosApis.activos(suc)),
        consumoApi.get(ConteosApis.usuarios),
      ]);
      setConteos(resAct.data ?? []);
      setUsuarios(resUsr.data ?? []);
    } catch (error) {
      console.error("Error al cargar los conteos activos:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los conteos activos",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [suc]);

  const formatFecha = (fecha: string) => {
    const d = new Date(fecha);
    return Number.isNaN(d.getTime()) ? fecha : d.toLocaleDateString("es-MX");
  };

  const cambiarUsuario = async (idConteo: number, usuario: string) => {
    setGuardandoId(idConteo);
    try {
      await consumoApi.post(ConteosApis.cambiaUsuario, {
        idConteo,
        usuario,
      });
      setConteos((prev) =>
        prev.map((c) =>
          c.idConteo === idConteo ? { ...c, usuarioAsignado: usuario } : c
        )
      );
    } catch (error) {
      console.error("Error al cambiar el usuario asignado:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cambiar el usuario asignado",
      });
      cargar();
    } finally {
      setGuardandoId(null);
    }
  };

  const eliminarConteo = async (conteo: IConteoActivo) => {
    const confirma = await Swal.fire({
      icon: "warning",
      title: "Eliminar conteo",
      text: `Se eliminara el conteo #${conteo.idConteo} "${conteo.descripcion ?? ""}" con sus registros. Desea continuar?`,
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#D32F2F",
    });
    if (!confirma.isConfirmed) return;

    try {
      await consumoApi.post(ConteosApis.eliminaConteo, {
        idConteo: conteo.idConteo,
      });
      setConteos((prev) => prev.filter((c) => c.idConteo !== conteo.idConteo));
      Swal.fire({ icon: "success", title: "Conteo eliminado" });
    } catch (error) {
      console.error("Error al eliminar el conteo:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar el conteo",
      });
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "calc(100vh - 64px)" }}>
      <Typography
        sx={{
          textAlign: "center",
          mb: 1,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 700,
          fontSize: { xs: "1.3rem", md: "1.75rem" },
          color: "#111",
        }}
      >
        CONTEOS ACTIVOS
      </Typography>

      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography variant="body2">
          <b>Sucursal:</b> {sucursal?.nombre ?? suc}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : conteos.length === 0 ? (
        <Alert severity="info" sx={{ maxWidth: 600, mx: "auto" }}>
          No hay conteos activos en la sucursal
        </Alert>
      ) : isMobile ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxWidth: 600,
            mx: "auto",
          }}
        >
          {conteos.map((c) => (
            <Paper key={c.idConteo} variant="outlined" sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 1,
                }}
              >
                <Typography sx={{ fontWeight: "bold" }}>
                  Conteo #{c.idConteo}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {formatFecha(c.fecha)}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {c.descripcion}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <b>Usuario:</b> {c.usuario}
              </Typography>
              <Select
                size="small"
                fullWidth
                sx={{ mt: 1 }}
                value={c.usuarioAsignado ?? ""}
                disabled={guardandoId === c.idConteo}
                onChange={(e) => cambiarUsuario(c.idConteo, e.target.value)}
              >
                {usuarios.map((u) => (
                  <MenuItem key={u.usuario} value={u.usuario}>
                    {u.nombre}
                  </MenuItem>
                ))}
                {c.usuarioAsignado &&
                  !usuarios.some((u) => u.usuario === c.usuarioAsignado) && (
                    <MenuItem value={c.usuarioAsignado}>
                      {c.usuarioAsignado}
                    </MenuItem>
                  )}
              </Select>
              <Button
                variant="outlined"
                size="small"
                color="error"
                fullWidth
                sx={{ mt: 1.5 }}
                onClick={() => eliminarConteo(c)}
              >
                Eliminar
              </Button>
            </Paper>
          ))}
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{ maxWidth: 1100, mx: "auto", overflowX: "auto" }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#212121" }}>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                  Conteo
                </TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                  Fecha
                </TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                  Descripcion
                </TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                  Usuario
                </TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                  Usuario asignado
                </TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                  Eliminar
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {conteos.map((c) => (
                <TableRow key={c.idConteo} hover>
                  <TableCell>{c.idConteo}</TableCell>
                  <TableCell>{formatFecha(c.fecha)}</TableCell>
                  <TableCell>{c.descripcion}</TableCell>
                  <TableCell>{c.usuario}</TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    <Select
                      size="small"
                      fullWidth
                      value={c.usuarioAsignado ?? ""}
                      disabled={guardandoId === c.idConteo}
                      onChange={(e) =>
                        cambiarUsuario(c.idConteo, e.target.value)
                      }
                    >
                      {usuarios.map((u) => (
                        <MenuItem key={u.usuario} value={u.usuario}>
                          {u.nombre}
                        </MenuItem>
                      ))}
                      {c.usuarioAsignado &&
                        !usuarios.some(
                          (u) => u.usuario === c.usuarioAsignado
                        ) && (
                          <MenuItem value={c.usuarioAsignado}>
                            {c.usuarioAsignado}
                          </MenuItem>
                        )}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => eliminarConteo(c)}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Button
          variant="contained"
          onClick={() => navigate(routes.conteoAdmin)}
        >
          Regresar
        </Button>
      </Box>
    </Box>
  );
}
