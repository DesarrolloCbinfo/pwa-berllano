import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import useConsumoApi from "../../../hooks/useConsumoApi";
import useSession from "../../../hooks/useSession";
import { routes } from "../../../utils/Routes";
import { ConteosApis } from "./apis/ConteosApis";
import { IConteo, ISucursalConteo } from "./interfaces/IConteo";
import {
  getSucursalConteo,
  setSucursalConteo,
  SucursalConteoSel,
} from "./conteoSession";

export default function ConteosPage() {
  const { consumoApi } = useConsumoApi();
  const session = useSession();
  const navigate = useNavigate();

  const [conteos, setConteos] = useState<IConteo[]>([]);
  const [sucursales, setSucursales] = useState<ISucursalConteo[]>([]);
  const [sucursalSel, setSucursalSel] = useState<SucursalConteoSel | null>(
    () => getSucursalConteo()
  );
  const [loading, setLoading] = useState(true);
  const [sinSucursales, setSinSucursales] = useState(false);

  // Carga las sucursales habilitadas para conteos (c_cat_sucursalesConteos)
  useEffect(() => {
    const cargarSucursales = async () => {
      try {
        const response = await consumoApi.get(ConteosApis.sucursales);
        const lista: ISucursalConteo[] = response.data ?? [];
        setSucursales(lista);

        if (lista.length === 0) {
          setSinSucursales(true);
          setLoading(false);
          return;
        }

        const guardada = getSucursalConteo();
        if (guardada && lista.some((s) => s.cve_sucursal === guardada.id)) {
          setSucursalSel(guardada);
          return;
        }

        // Default: sucursal de la sesion si esta habilitada para conteos, si no la primera
        const inicial =
          lista.find((s) => s.cve_sucursal === session?.sucursal) ?? lista[0];
        if (inicial) {
          const sel = { id: inicial.cve_sucursal, nombre: inicial.nombre };
          setSucursalSel(sel);
          setSucursalConteo(sel);
        }
      } catch (error) {
        console.error("Error al cargar las sucursales de conteos:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo cargar la lista de sucursales",
        });
      }
    };

    cargarSucursales();
  }, []);

  const cargarConteos = async () => {
    if (!session || !sucursalSel) return;

    setLoading(true);
    try {
      const response = await consumoApi.get(
        ConteosApis.lista(sucursalSel.id, session.claveEmpleado)
      );
      setConteos(response.data ?? []);
    } catch (error) {
      console.error("Error al cargar los conteos:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar la lista de conteos",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarConteos();
  }, [sucursalSel?.id, session?.claveEmpleado]);

  // El SP puede devolver fecha como texto o como datetime (llega en ISO)
  const formatFecha = (fecha: string) => {
    const d = new Date(fecha);
    return Number.isNaN(d.getTime()) ? fecha : d.toLocaleDateString("es-MX");
  };

  const handleSucursalChange = (value: number) => {
    const suc = sucursales.find((s) => s.cve_sucursal === value);
    if (!suc) return;

    const sel = { id: suc.cve_sucursal, nombre: suc.nombre };
    setSucursalSel(sel);
    setSucursalConteo(sel);
  };

  return (
    <Box sx={{ p: 4, minHeight: "calc(100vh - 64px)" }}>
      <Typography
        sx={{
          textAlign: "center",
          mb: 1,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 700,
          fontSize: "1.75rem",
          color: "#111",
        }}
      >
        CONTEOS DE SUCURSAL
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="body2">
          <b>Usuario:</b> {session?.nombre}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="sucursal-conteo-label">Sucursal</InputLabel>
          <Select
            labelId="sucursal-conteo-label"
            label="Sucursal"
            value={sucursalSel?.id ?? ""}
            onChange={(e) => handleSucursalChange(Number(e.target.value))}
          >
            {sucursales.map((s) => (
              <MenuItem key={s.cve_sucursal} value={s.cve_sucursal}>
                {s.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : sinSucursales ? (
        <Alert severity="warning" sx={{ maxWidth: 600, mx: "auto" }}>
          No hay sucursales habilitadas para conteos
        </Alert>
      ) : conteos.length === 0 ? (
        <Alert severity="info" sx={{ maxWidth: 600, mx: "auto" }}>
          No hay conteos abiertos en la sucursal seleccionada
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ maxWidth: 900, mx: "auto" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#212121" }}>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                  Fecha del conteo
                </TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                  Descripción
                </TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                  Editar
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {conteos.map((conteo) => (
                <TableRow key={conteo.idConteo} hover>
                  <TableCell>{formatFecha(conteo.fecha)}</TableCell>
                  <TableCell>{conteo.descripcion}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() =>
                        navigate(routes.conteoRegistro(conteo.idConteo))
                      }
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
