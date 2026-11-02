import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import useConsumoApi from "../../../hooks/useConsumoApi";
import useSession from "../../../hooks/useSession";
import { routes } from "../../../utils/Routes";
import { ConteosApis } from "./apis/ConteosApis";
import { getSucursalConteo } from "./conteoSession";
import { IProductoConteo } from "./interfaces/IProductoConteo";

export default function RegistroConteo() {
  const { consumoApi } = useConsumoApi();
  const session = useSession();
  const navigate = useNavigate();
  const { idConteo } = useParams<{ idConteo: string }>();
  const [searchParams] = useSearchParams();

  const [claveProd, setClaveProd] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [producto, setProducto] = useState<IProductoConteo | null>(null);
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [claveNoValida, setClaveNoValida] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const claveInputRef = useRef<HTMLInputElement>(null);
  const cantidadInputRef = useRef<HTMLInputElement>(null);

  const id = Number(idConteo);
  const usuario = session?.claveEmpleado ?? "";
  const nombreSucursal = getSucursalConteo()?.nombre ?? session?.dSucursal;

  const buscarProducto = async (clave: string) => {
    if (!clave.trim()) return false;

    try {
      const response = await consumoApi.get(ConteosApis.productos(id, clave));
      const filas: IProductoConteo[] = response.data ?? [];

      if (filas.length > 0) {
        setProducto(filas[0]);
        setClaveProd(filas[0].clave_prod);
        setClaveNoValida(false);
        cantidadInputRef.current?.focus();
        return true;
      }

      setProducto(null);
      setClaveNoValida(true);
      return false;
    } catch (error) {
      console.error("Error al validar la clave:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo validar la clave del producto",
      });
      return false;
    }
  };

  // Si viene ?clave= de la lista de productos (Editar), precargar el producto
  useEffect(() => {
    const claveInicial = searchParams.get("clave");
    if (claveInicial) {
      setClaveProd(claveInicial);
      buscarProducto(claveInicial);
    } else {
      claveInputRef.current?.focus();
    }
  }, [id]);

  const registrarConteo = async () => {
    if (registrando) return;

    if (!claveProd.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text: "No se puede hacer un registro sin clave y/o cantidad",
      });
      return;
    }

    // Solo clave sin cantidad: validar y mostrar descripcion (como el original)
    if (!cantidad.trim()) {
      await buscarProducto(claveProd);
      return;
    }

    const cantidadRegistrada = parseFloat(cantidad);
    if (Number.isNaN(cantidadRegistrada) || cantidadRegistrada < 0) {
      Swal.fire({
        icon: "warning",
        title: "Cantidad inválida",
        text: "Ingresa una cantidad numérica mayor o igual a 0",
      });
      return;
    }

    setRegistrando(true);
    try {
      const valido =
        producto?.clave_prod === claveProd
          ? true
          : await buscarProducto(claveProd);

      if (!valido) return;

      await consumoApi.post(ConteosApis.registro, {
        id,
        claveProd,
        cantidad: cantidadRegistrada,
        usuario,
      });

      setProducto((prev) =>
        prev
          ? { ...prev, conteo: prev.conteo + cantidadRegistrada }
          : prev
      );
      setCantidad("");
      setRegistroExitoso(true);
      setTimeout(() => setRegistroExitoso(false), 3000);
      claveInputRef.current?.focus();
    } catch (error) {
      console.error("Error al registrar el conteo:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo registrar el conteo",
      });
    } finally {
      setRegistrando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      registrarConteo();
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
    <Box sx={{ p: 4, minHeight: "calc(100vh - 64px)", textAlign: "center" }}>
      <Typography
        sx={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 700,
          fontSize: "1.75rem",
          color: "#111",
        }}
      >
        Registro de conteos
      </Typography>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2">
          <b>Usuario:</b> {session?.nombre}
        </Typography>
        <Typography variant="body2">
          <b>Sucursal:</b> {nombreSucursal}
        </Typography>
      </Box>

      <Paper
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          registrarConteo();
        }}
        sx={{
          width: 350,
          mx: "auto",
          mt: 4,
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <TextField
          inputRef={claveInputRef}
          label="Clave de Producto"
          value={claveProd}
          onChange={(e) => {
            setClaveProd(e.target.value);
            setProducto(null);
            setClaveNoValida(false);
          }}
          onBlur={() => {
            // Equivalente a ObtenerDescripcion del original: al salir del campo
            // con una clave distinta a la validada, buscar la descripcion
            if (claveProd.trim() && claveProd !== producto?.clave_prod) {
              buscarProducto(claveProd);
            }
          }}
          onKeyDown={handleKeyDown}
          required
          fullWidth
        />
        <TextField
          inputRef={cantidadInputRef}
          label="Cantidad de existencias"
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          onKeyDown={handleKeyDown}
          inputProps={{ step: "any", min: 0, max: 1000 }}
          fullWidth
        />

        {producto && (
          <Typography variant="body2">{producto.descripcion}</Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          disabled={registrando}
          sx={{ width: 200, mx: "auto" }}
        >
          {registrando ? "Registrando..." : "Registrar Conteo"}
        </Button>
      </Paper>

      <Box
        sx={{
          mt: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Button
          variant="contained"
          color="secondary"
          sx={{ width: 250 }}
          onClick={() => navigate(routes.conteoProductos(id))}
        >
          Lista de productos
        </Button>
        <Button
          variant="contained"
          sx={{ width: 250, backgroundColor: "green", "&:hover": { backgroundColor: "#006400" } }}
          onClick={() => navigate(routes.conteos)}
        >
          Regresar a lista de conteos
        </Button>
      </Box>

      {producto && (
        <Typography sx={{ mt: 3 }} variant="body1">
          <b>Conteo total: {producto.conteo}</b>
        </Typography>
      )}

      {claveNoValida && (
        <Alert severity="error" sx={{ maxWidth: 400, mx: "auto", mt: 3 }}>
          Ingresó una clave inválida
        </Alert>
      )}

      {registroExitoso && (
        <Alert severity="success" sx={{ maxWidth: 400, mx: "auto", mt: 3 }}>
          Registro completado
        </Alert>
      )}
    </Box>
  );
}
