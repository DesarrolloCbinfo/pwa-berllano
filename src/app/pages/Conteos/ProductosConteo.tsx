import { useEffect, useMemo, useRef, useState } from "react";
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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import useConsumoApiConteos from "../../../hooks/useConsumoApiConteos";
import useSession from "../../../hooks/useSession";
import { routes } from "../../../utils/Routes";
import { ConteosApis } from "./apis/ConteosApis";
import { getSucursalConteo } from "./conteoSession";
import { IProductoConteo } from "./interfaces/IProductoConteo";

export default function ProductosConteo() {
  const { consumoApi } = useConsumoApiConteos();
  const session = useSession();
  const navigate = useNavigate();
  const { idConteo } = useParams<{ idConteo: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [productos, setProductos] = useState<IProductoConteo[]>([]);
  const [cantidades, setCantidades] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [filtro, setFiltro] = useState("");

  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const guardarRef = useRef<HTMLButtonElement>(null);
  const primeroEnfocado = useRef(false);

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

  const productosFiltrados = useMemo(() => {
    const f = filtro.trim().toLowerCase();
    if (!f) return productos;
    return productos.filter((p) =>
      [p.clave_prod, p.descripcion, p.marca, p.familia]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(f))
    );
  }, [productos, filtro]);

  // Cantidades capturadas pero aun no guardadas (valores validos e invalidos)
  const pendientes = useMemo(() => {
    const items: { claveProd: string; cantidad: number }[] = [];
    const invalidas: string[] = [];
    Object.entries(cantidades).forEach(([clave, valor]) => {
      const texto = valor.trim();
      if (!texto) return;
      const n = parseFloat(texto);
      if (Number.isNaN(n) || n < 0) invalidas.push(clave);
      else items.push({ claveProd: clave, cantidad: n });
    });
    return { items, invalidas };
  }, [cantidades]);

  // Avisar si se intenta salir con capturas sin guardar
  useEffect(() => {
    if (pendientes.items.length === 0) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [pendientes.items.length]);

  // Enfocar el primer input al cargar (solo escritorio)
  useEffect(() => {
    if (isMobile || loading || primeroEnfocado.current) return;
    const primero = productosFiltrados[0];
    if (!primero) return;
    primeroEnfocado.current = true;
    setTimeout(() => {
      const el = inputRefs.current.get(primero.clave_prod);
      el?.focus();
      el?.select();
    }, 150);
  }, [loading, productosFiltrados, isMobile]);

  const setCantidad = (claveProd: string, valor: string) =>
    setCantidades((prev) => ({ ...prev, [claveProd]: valor }));

  const focusInput = (claveProd?: string) => {
    const el = claveProd ? inputRefs.current.get(claveProd) : undefined;
    if (el) {
      el.focus();
      el.select();
    } else {
      guardarRef.current?.focus();
    }
  };

  // Enter salta al input de la siguiente fila (o al boton Guardar).
  // Tab funciona solo: los botones de fila tienen tabIndex=-1.
  const handleCantidadKeyDown = (
    e: React.KeyboardEvent<HTMLElement>,
    claveProd: string
  ) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const idx = productosFiltrados.findIndex(
      (p) => p.clave_prod === claveProd
    );
    focusInput(idx >= 0 ? productosFiltrados[idx + 1]?.clave_prod : undefined);
  };

  const renderInputCantidad = (
    claveProd: string,
    sx?: React.ComponentProps<typeof TextField>["sx"]
  ) => (
    <TextField
      type="number"
      size="small"
      label="Cantidad"
      placeholder="Cantidad real"
      value={cantidades[claveProd] ?? ""}
      onChange={(e) => setCantidad(claveProd, e.target.value)}
      onKeyDown={(e) => handleCantidadKeyDown(e, claveProd)}
      onFocus={(e) => e.currentTarget.select()}
      inputRef={(el) => {
        if (el) inputRefs.current.set(claveProd, el);
        else inputRefs.current.delete(claveProd);
      }}
      inputProps={{ step: "any", min: 0, max: 1000, inputMode: "decimal" }}
      sx={sx}
    />
  );

  // Guarda todas las cantidades capturadas en una sola llamada
  const guardarConteos = async () => {
    if (guardando) return;

    if (pendientes.items.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin capturas",
        text: "Captura las cantidades en la tabla y presiona Guardar.",
      });
      return;
    }

    if (pendientes.invalidas.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Cantidades inválidas",
        text: `Revisa los valores capturados para: ${pendientes.invalidas.join(", ")}`,
      });
      return;
    }

    const confirma = await Swal.fire({
      icon: "question",
      title: "Guardar conteos",
      text: `Se registraran ${pendientes.items.length} cantidades en el conteo. Desea continuar?`,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
    });
    if (!confirma.isConfirmed) return;

    setGuardando(true);
    try {
      const res = await consumoApi.post(
        ConteosApis.registroMasivo,
        {
          id,
          usuario,
          registros: pendientes.items,
        },
        { timeout: 120000 }
      );
      const data = res.data ?? {};
      const errores: { claveProd: string }[] = data.errores ?? [];
      const clavesError = new Set(errores.map((e) => e.claveProd));

      Swal.fire({
        icon: errores.length > 0 ? "warning" : "success",
        title: `${data.registradas ?? 0} registros guardados`,
        text:
          errores.length > 0
            ? `${errores.length} productos no se pudieron registrar.`
            : undefined,
      });

      // Limpiar solo las capturas que se guardaron correctamente
      setCantidades((prev) => {
        const next = { ...prev };
        pendientes.items.forEach((it) => {
          if (!clavesError.has(it.claveProd)) delete next[it.claveProd];
        });
        return next;
      });
      await cargarProductos();
    } catch (error) {
      console.error("Error al guardar los conteos:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron guardar los conteos",
      });
    } finally {
      setGuardando(false);
    }
  };

  // Replica del boton "Actualizar Productos con Existencia 0 y Diferencia 0"
  // del sistema original: registra cantidad=0 por cada producto, en una sola llamada
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

    setGuardando(true);
    try {
      const res = await consumoApi.post(
        ConteosApis.registroMasivo,
        {
          id,
          usuario,
          registros: seleccionados.map((p) => ({
            claveProd: p.clave_prod,
            cantidad: 0,
          })),
        },
        { timeout: 120000 }
      );
      const data = res.data ?? {};
      const errores: unknown[] = data.errores ?? [];

      Swal.fire({
        icon: errores.length > 0 ? "warning" : "success",
        title: `Se actualizaron ${data.registradas ?? 0} de ${seleccionados.length} productos.`,
        text: errores.length > 0 ? `${errores.length} productos con error.` : undefined,
      });
      await cargarProductos();
    } catch (error) {
      console.error("Error al actualizar los productos:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron actualizar los productos",
      });
    } finally {
      setGuardando(false);
    }
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
    <Box
      sx={{ p: { xs: 2, md: 4 }, minHeight: "calc(100vh - 64px)" }}
    >
      <Typography
        sx={{
          textAlign: "center",
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 700,
          fontSize: { xs: "1.3rem", md: "1.75rem" },
          color: "#111",
        }}
      >
        PRODUCTOS RELACIONADOS
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          gap: 2,
          mt: 2,
          mb: 2,
        }}
      >
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="body2">
            <b>Usuario:</b> {session?.nombre}
          </Typography>
          <Typography variant="body2">
            <b>Sucursal:</b> {nombreSucursal}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1,
            flexWrap: "wrap",
            alignItems: { sm: "center" },
          }}
        >
          <TextField
            size="small"
            label="Filtrar"
            placeholder="Clave, descripción, marca o familia"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            sx={{ minWidth: { xs: "100%", sm: 260 } }}
          />
          <Button
            ref={guardarRef}
            variant="contained"
            disabled={guardando || pendientes.items.length === 0}
            onClick={guardarConteos}
            sx={{
              backgroundColor: "#1565C0",
              "&:hover": { backgroundColor: "#0D47A1" },
              whiteSpace: "nowrap",
            }}
          >
            {guardando ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              `Guardar (${pendientes.items.length})`
            )}
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="contained"
          size="small"
          sx={{ backgroundColor: "purple", "&:hover": { backgroundColor: "#6a0080" } }}
          onClick={actualizarExistenciaDiferenciaCeros}
          disabled={guardando}
        >
          Actualizar Productos con Existencia 0 y Diferencia 0
        </Button>
        <Button
          variant="contained"
          size="small"
          sx={{ backgroundColor: "green", "&:hover": { backgroundColor: "#006400" } }}
          onClick={() => navigate(routes.conteos)}
        >
          Regresar a lista de conteos
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate(routes.conteoRegistro(id))}
        >
          Regresar a registro de producto
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : productos.length === 0 ? (
        <Alert severity="info" sx={{ maxWidth: 600, mx: "auto" }}>
          No hay productos relacionados a este conteo
        </Alert>
      ) : productosFiltrados.length === 0 ? (
        <Alert severity="info" sx={{ maxWidth: 600, mx: "auto" }}>
          No hay productos que coincidan con el filtro
        </Alert>
      ) : isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {productosFiltrados.map((p) => (
            <Paper key={p.clave_prod} variant="outlined" sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 1,
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontWeight: "bold",
                    color: p.descripcion?.includes("NC)") ? "red" : "inherit",
                  }}
                >
                  {p.clave_prod}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {p.marca} · {p.familia}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {p.descripcion}
              </Typography>
              <Box sx={{ display: "flex", gap: 3, mt: 1, flexWrap: "wrap" }}>
                <Typography variant="body2">
                  <b>Existencia:</b> {p.existencia}
                </Typography>
                <Typography variant="body2">
                  <b>Conteo:</b> {p.conteo}
                </Typography>
                <Typography variant="body2">
                  <b>Diferencia:</b> {p.diferencia}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  mt: 1.5,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {renderInputCantidad(p.clave_prod, {
                  flex: { xs: "1 1 100%", sm: "0 0 auto" },
                })}
                <Button
                  size="small"
                  variant="outlined"
                  tabIndex={-1}
                  onClick={() =>
                    navigate(`${routes.conteoRegistro(id)}?clave=${encodeURIComponent(p.clave_prod)}`)
                  }
                >
                  Editar
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  tabIndex={-1}
                  onClick={() => eliminarConteo(p.clave_prod)}
                >
                  Eliminar
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
          <Table size="small" stickyHeader sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#212121" }}>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Clave de producto</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Descripción</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Marca</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Familia</TableCell>
                <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>Existencia</TableCell>
                <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>Conteo</TableCell>
                <TableCell align="center" sx={{ color: "#fff", fontWeight: "bold" }}>Diferencia</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Cantidad a registrar</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Editar conteo</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Eliminar conteo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productosFiltrados.map((p) => (
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
                    {renderInputCantidad(p.clave_prod, { width: 110 })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      tabIndex={-1}
                      onClick={() =>
                        navigate(`${routes.conteoRegistro(id)}?clave=${encodeURIComponent(p.clave_prod)}`)
                      }
                    >
                      Editar
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      tabIndex={-1}
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

      {!loading && productosFiltrados.length > 0 && (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: "center" }}>
          {productosFiltrados.length} productos · {pendientes.items.length} capturas pendientes ·
          Tab/Enter salta al siguiente producto · Guarda todo con el botón Guardar
        </Typography>
      )}
    </Box>
  );
}
