import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import useConsumoApi from "../../../hooks/useConsumoApi";
import useSession from "../../../hooks/useSession";
import { routes } from "../../../utils/Routes";
import { ConteosApis } from "./apis/ConteosApis";
import { getSucursalConteo } from "./conteoSession";
import { IProductoConteo } from "./interfaces/IProductoConteo";

export default function ProductosConteo() {
  const { consumoApi } = useConsumoApi();
  const session = useSession();
  const navigate = useNavigate();
  const { idConteo } = useParams<{ idConteo: string }>();

  const [productos, setProductos] = useState<IProductoConteo[]>([]);
  const [cantidades, setCantidades] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const id = Number(idConteo);
  const usuario = session?.claveEmpleado ?? "";
  const nombreSucursal = getSucursalConteo()?.nombre ?? session?.dSucursal;

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const response = await consumoApi.get(ConteosApis.productos(id));
      setProductos(response.data ?? []);
    } catch (error) {
      console.error("Error al cargar los productos del conteo:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar la lista de productos",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) cargarProductos();
  }, [id]);

  const registrarDesdeTabla = async (claveProd: string) => {
    const cantidadStr = cantidades[claveProd] ?? "";
    const cantidadRegistrada = parseFloat(cantidadStr);

    if (!cantidadStr.trim() || Number.isNaN(cantidadRegistrada) || cantidadRegistrada < 0) {
      Swal.fire({
        icon: "warning",
        title: "Cantidad inválida",
        text: "Ingresa una cantidad para registrar el conteo",
      });
      return;
    }

    try {
      await consumoApi.post(ConteosApis.registro, {
        id,
        claveProd,
        cantidad: cantidadRegistrada,
        usuario,
      });
      setCantidades((prev) => ({ ...prev, [claveProd]: "" }));
      await cargarProductos();
    } catch (error) {
      console.error("Error al registrar el conteo:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo registrar el conteo",
      });
    }
  };

  // Replica del boton "Actualizar Productos con Existencia 0 y Diferencia 0"
  // del sistema original: registra cantidad=0 via sp_ConteosRegistro por cada producto
  const actualizarExistenciaDiferenciaCeros = async () => {
    const seleccionados = productos.filter(
      (p) => Number(p.existencia) === 0 && Number(p.diferencia) === 0
    );

    if (seleccionados.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin productos",
        text: "No se encontraron productos con existencia 0 y diferencia 0 para actualizar.",
      });
      return;
    }

    const confirmacion = await Swal.fire({
      title: `¿Registrar conteo 0 a ${seleccionados.length} productos?`,
      text: "Se registrará cantidad 0 a los productos con existencia 0 y diferencia 0.",
      showDenyButton: true,
      confirmButtonText: "Actualizar",
      denyButtonText: "Cancelar",
    });

    if (!confirmacion.isConfirmed) return;

    // Igual que el original: una llamada a sp_ConteosRegistro por cada producto
    let actualizados = 0;
    const errores: string[] = [];

    for (const p of seleccionados) {
      try {
        await consumoApi.post(ConteosApis.registro, {
          id,
          claveProd: p.clave_prod,
          cantidad: 0,
          usuario,
        });
        actualizados++;
      } catch (error) {
        console.error(`Error al registrar el producto ${p.clave_prod}:`, error);
        errores.push(p.clave_prod);
      }
    }

    Swal.fire({
      icon: errores.length > 0 ? "warning" : "success",
      title: `Se actualizaron ${actualizados} productos con existencia 0 y diferencia 0.`,
      text: errores.length > 0 ? `Con errores en: ${errores.join(", ")}` : undefined,
    });

    await cargarProductos();
  };

  const eliminarConteo = async (claveProd: string) => {
    const result = await Swal.fire({
      title: `¿Eliminar el conteo del producto ${claveProd}?`,
      showDenyButton: true,
      confirmButtonText: "Eliminar",
      denyButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await consumoApi.post(ConteosApis.elimina, {
        id,
        claveProd,
        usuario,
      });
      await cargarProductos();
    } catch (error) {
      console.error("Error al eliminar el conteo:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar el conteo",
      });
    }
  };

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ maxWidth: 400, mx: "auto" }}>
          Conteo inválido
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, minHeight: "calc(100vh - 64px)" }}>
      <Typography
        sx={{
          textAlign: "center",
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 700,
          fontSize: "1.75rem",
          color: "#111",
        }}
      >
        PRODUCTOS RELACIONADOS
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mt: 2,
          mb: 2,
        }}
      >
        <Box sx={{ width: 200 }}>
          <Typography variant="body2">
            <b>Usuario:</b> {session?.nombre}
          </Typography>
          <Typography variant="body2">
            <b>Sucursal:</b> {nombreSucursal}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            sx={{ backgroundColor: "purple", "&:hover": { backgroundColor: "#6a0080" } }}
            onClick={actualizarExistenciaDiferenciaCeros}
          >
            Actualizar Productos con Existencia 0 y Diferencia 0
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "green", "&:hover": { backgroundColor: "#006400" } }}
            onClick={() => navigate(routes.conteos)}
          >
            Regresar a lista de conteos
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate(routes.conteoRegistro(id))}
          >
            Regresar a registro de producto
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : productos.length === 0 ? (
        <Alert severity="info" sx={{ maxWidth: 600, mx: "auto" }}>
          No hay productos relacionados a este conteo
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#212121" }}>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Clave de producto</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Descripción</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Marca</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Familia</TableCell>
                <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>Existencia</TableCell>
                <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>Conteo</TableCell>
                <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>Diferencia</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Editar conteo</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Registrar conteo desde tabla</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Eliminar conteo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productos.map((p) => (
                <TableRow key={p.clave_prod} hover>
                  <TableCell>
                    {p.descripcion?.includes("NC)") ? (
                      <Typography component="span" sx={{ color: "red", fontWeight: "bold" }}>
                        {p.clave_prod}
                      </Typography>
                    ) : (
                      p.clave_prod
                    )}
                  </TableCell>
                  <TableCell>{p.descripcion}</TableCell>
                  <TableCell>{p.marca}</TableCell>
                  <TableCell>{p.familia}</TableCell>
                  <TableCell align="center">{p.existencia}</TableCell>
                  <TableCell align="center">{p.conteo}</TableCell>
                  <TableCell align="center">{p.diferencia}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        navigate(`${routes.conteoRegistro(id)}?clave=${encodeURIComponent(p.clave_prod)}`)
                      }
                    >
                      Editar
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <TextField
                        type="number"
                        size="small"
                        value={cantidades[p.clave_prod] ?? ""}
                        onChange={(e) =>
                          setCantidades((prev) => ({
                            ...prev,
                            [p.clave_prod]: e.target.value,
                          }))
                        }
                        inputProps={{ step: "any", min: 0, max: 1000 }}
                        sx={{ width: 90 }}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => registrarDesdeTabla(p.clave_prod)}
                      >
                        Ok
                      </Button>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => eliminarConteo(p.clave_prod)}
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
    </Box>
  );
}
