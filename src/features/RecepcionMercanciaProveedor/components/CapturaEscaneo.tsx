import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import type {
  PartidaCapturada,
  ValidacionClaveResponse,
} from "../types/RecepcionMercanciaTypes";
import { obtenerMensajeError } from "../utils/errores";

export type ResultadoAlta = "ok" | "duplicado" | "error";

interface Props {
  folio: number;
  onValidar: (clave: string) => Promise<ValidacionClaveResponse>;
  onAgregar: (partida: PartidaCapturada) => Promise<ResultadoAlta>;
}

function normalizarCodigo(valor: string) {
  return valor.trim().toUpperCase();
}

export default function CapturaEscaneo({
  folio,
  onValidar,
  onAgregar,
}: Props) {
  const [codigo, setCodigo] = useState("");
  const [primerCodigo, setPrimerCodigo] = useState<string | null>(null);
  const [escaneos, setEscaneos] = useState(0);
  const [claveVerificada, setClaveVerificada] = useState<string | null>(null);
  const [descripcionCatalogo, setDescripcionCatalogo] = useState("");
  const [requiereDescripcionManual, setRequiereDescripcionManual] =
    useState(false);
  const [descripcionManual, setDescripcionManual] = useState("");
  const [mensajeValidacion, setMensajeValidacion] = useState("");
  const [codigoPendienteValidacion, setCodigoPendienteValidacion] = useState<
    string | null
  >(null);
  const [validando, setValidando] = useState(false);
  const [cantidad, setCantidad] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const scanRef = useRef<HTMLInputElement>(null);
  const cantidadRef = useRef<HTMLInputElement>(null);
  const descripcionRef = useRef<HTMLInputElement>(null);

  const reiniciar = useCallback(() => {
    setCodigo("");
    setPrimerCodigo(null);
    setEscaneos(0);
    setClaveVerificada(null);
    setDescripcionCatalogo("");
    setRequiereDescripcionManual(false);
    setDescripcionManual("");
    setMensajeValidacion("");
    setCodigoPendienteValidacion(null);
    setValidando(false);
    setCantidad("");
    setObservaciones("");
    setError("");
    setEnviando(false);
    window.setTimeout(() => scanRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    reiniciar();
  }, [folio, reiniciar]);

  const verificado = claveVerificada != null;
  const cantidadNumero = Number(cantidad);
  const cantidadValida =
    Number.isInteger(cantidadNumero) && cantidadNumero > 0;
  const descripcionValida = requiereDescripcionManual
    ? descripcionManual.trim().length > 0
    : descripcionCatalogo.trim().length > 0;

  const validarCodigo = async (codigoValidar: string) => {
    const clave = codigoValidar.trim();
    if (!clave) {
      setError("La clave es obligatoria.");
      return;
    }
    if (clave.length > 50) {
      setError("La clave no puede exceder 50 caracteres.");
      return;
    }

    setValidando(true);
    setError("");

    try {
      const data = await onValidar(clave);
      const descripcion = String(data.descripcion ?? "").trim();
      const requiere =
        data.requiere_descripcion_manual === 1 ||
        data.codigo === 404 ||
        !data.ok ||
        !descripcion;
      const claveMaestra = String(data.clave_prod ?? "").trim() || clave;

      setClaveVerificada(claveMaestra);
      setDescripcionCatalogo(requiere ? "" : descripcion);
      setRequiereDescripcionManual(requiere);
      setDescripcionManual("");
      setMensajeValidacion(String(data.mensaje ?? "").trim());
      setCodigoPendienteValidacion(null);

      window.setTimeout(() => {
        if (requiere) {
          descripcionRef.current?.focus();
        } else {
          cantidadRef.current?.focus();
        }
      }, 0);
    } catch (errorValidacion) {
      setError(
        obtenerMensajeError(
          errorValidacion,
          "No se pudo validar la clave del producto."
        )
      );
      setCodigoPendienteValidacion(clave);
    } finally {
      setValidando(false);
    }
  };

  const procesarEscaneo = (valorCrudo: string) => {
    if (verificado || validando || enviando || codigoPendienteValidacion) return;

    const valor = valorCrudo.trim();
    if (!valor) return;
    if (valor.length > 50) {
      setError("La clave no puede exceder 50 caracteres.");
      setCodigo("");
      return;
    }

    if (!primerCodigo) {
      setPrimerCodigo(valor);
      setEscaneos(1);
      setError("");
      setCodigo("");
      return;
    }

    if (normalizarCodigo(valor) !== normalizarCodigo(primerCodigo)) {
      setPrimerCodigo(null);
      setEscaneos(0);
      setError("Los códigos no coinciden. Inicia de nuevo.");
      setCodigo("");
      window.setTimeout(() => scanRef.current?.focus(), 0);
      return;
    }

    const siguiente = escaneos + 1;
    setCodigo("");
    setError("");

    if (siguiente >= 3) {
      setEscaneos(3);
      void validarCodigo(primerCodigo);
      return;
    }

    setEscaneos(siguiente);
  };

  const manejarEscaneo = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    procesarEscaneo(event.currentTarget.value);
  };

  const handleAgregar = async () => {
    const descripcion = (
      requiereDescripcionManual ? descripcionManual : descripcionCatalogo
    ).trim();

    if (
      !claveVerificada ||
      !descripcion ||
      !cantidadValida ||
      enviando
    ) {
      return;
    }

    setEnviando(true);
    try {
      const resultado = await onAgregar({
        clave_prod: claveVerificada,
        descripcion,
        cantidad: cantidadNumero,
        observaciones: observaciones.trim(),
      });
      if (resultado === "ok" || resultado === "duplicado") {
        reiniciar();
      }
    } finally {
      setEnviando(false);
    }
  };

  if (validando) {
    return (
      <Alert
        severity="info"
        icon={<CircularProgress size={18} />}
      >
        Validando clave del producto...
      </Alert>
    );
  }

  if (codigoPendienteValidacion) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">
          {error || "No se pudo validar la clave del producto."}
        </Alert>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained"
            onClick={() => void validarCodigo(codigoPendienteValidacion)}
            sx={{ textTransform: "none" }}
          >
            Reintentar validación
          </Button>
          <Button
            variant="text"
            onClick={reiniciar}
            sx={{ textTransform: "none" }}
          >
            Escanear de nuevo
          </Button>
        </Stack>
      </Stack>
    );
  }

  if (!verificado) {
    return (
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Escanea o escribe el mismo código de barras 3 veces para verificar
          el producto.
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          flexWrap="wrap"
          useFlexGap
        >
          <TextField
            label="Código de barras"
            value={codigo}
            onChange={(event) => setCodigo(event.target.value)}
            onKeyDown={manejarEscaneo}
            inputRef={scanRef}
            autoFocus
            fullWidth
            disabled={enviando}
            placeholder="Escanea o escribe y presiona Enter"
            inputProps={{ maxLength: 50 }}
            sx={{ flex: 1, minWidth: 240 }}
          />
          <Chip
            label={`${escaneos}/3`}
            color={escaneos > 0 ? "primary" : "default"}
            sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
          />
          <Button
            variant="outlined"
            onClick={() => procesarEscaneo(codigo)}
            disabled={!codigo.trim() || enviando}
            sx={{ textTransform: "none", whiteSpace: "nowrap" }}
          >
            Aceptar escaneo
          </Button>
        </Stack>

        {primerCodigo && (
          <Typography variant="caption" color="text.secondary">
            Código en verificación: {primerCodigo}
          </Typography>
        )}

        {error && <Alert severity="warning">{error}</Alert>}
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Alert severity={requiereDescripcionManual ? "warning" : "success"}>
        {requiereDescripcionManual ? (
          <>
            Clave <strong>{claveVerificada}</strong>:{" "}
            {mensajeValidacion ||
              "Clave no registrada. Ingresa la descripción manualmente."}
          </>
        ) : (
          <>
            Producto verificado: <strong>{descripcionCatalogo}</strong>
          </>
        )}
      </Alert>

      {requiereDescripcionManual && (
        <TextField
          label="Descripción del producto"
          required
          value={descripcionManual}
          onChange={(event) => setDescripcionManual(event.target.value)}
          inputRef={descripcionRef}
          inputProps={{ maxLength: 255 }}
          disabled={enviando}
          fullWidth
        />
      )}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <TextField
          label="Cantidad a recepcionar"
          type="number"
          value={cantidad}
          onChange={(event) => setCantidad(event.target.value)}
          inputRef={cantidadRef}
          inputProps={{ min: 1, step: 1 }}
          disabled={enviando}
          sx={{ width: { xs: "100%", sm: 220 } }}
        />
        <TextField
          label="Observaciones"
          value={observaciones}
          onChange={(event) => setObservaciones(event.target.value)}
          disabled={enviando}
          placeholder="Opcional"
          fullWidth
        />
      </Stack>

      <Stack direction="row" spacing={1.5}>
        <Button
          variant="contained"
          startIcon={
            enviando ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <AddIcon />
            )
          }
          onClick={() => void handleAgregar()}
          disabled={!cantidadValida || !descripcionValida || enviando}
          sx={{ textTransform: "none" }}
        >
          Agregar
        </Button>
        <Button
          variant="text"
          startIcon={<RestartAltIcon />}
          onClick={reiniciar}
          disabled={enviando}
          sx={{ textTransform: "none" }}
        >
          Escanear otro
        </Button>
      </Stack>
    </Stack>
  );
}
