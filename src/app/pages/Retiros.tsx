import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Paper,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import Swal from "sweetalert2";
import useConsumoApi from "../../hooks/useConsumoApi";
import useSession from "../../hooks/useSession";
import axios from "axios";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

// Tipo para la respuesta del corte actual
type CorteActual = {
  corte_maximo: number;
  corte_parcial_maximo: number;
};

const denominacionesGrandes = [1000, 500, 200, 100, 50, 20];
const denominacionesPequenas = [10, 5, 2, 1, 0.5, 0.2, 0.1];
const denominaciones = [
  1000, 500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1
];

export default function Retiros() {
  const { consumoApi } = useConsumoApi();
  const session = useSession();

  const [dataCorteActual, setDataCorteActual] = useState<CorteActual | null>(null);
  const [retiros, setRetiros] = useState<Record<number, number>>({});
  const [observaciones, setObservaciones] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fondoSucursal, setFondoSucursal] = useState<number>(0);
  const [totalARetirar, setTotalARetirar] = useState<number>(0);
  const [vales] = useState<number>(0);
  const [retirosOriginales, setRetirosOriginales] = useState<Record<number, number> | null>(null);
  const [intentosConfirmacion, setIntentosConfirmacion] = useState(0);

  // Inicializar retiros en 0
  useEffect(() => {
    const init: Record<number, number> = {};
    denominaciones.forEach(d => init[d] = 0);
    setRetiros(init);
  }, []);

  // Cargar corte actual
  useEffect(() => {
    fetchCorteActual();
  }, [session?.sucursal]);

  // Cargar total a retirar desde el backend
  useEffect(() => {
    if (dataCorteActual?.corte_maximo) {
      cargarTotalARetirar();
    }
  }, [dataCorteActual]);

  // Cargar fondo de caja de la sucursal
  useEffect(() => {
    const cargarFondoSucursal = async () => {
      const sucursalId = session?.sucursal;
      if (!sucursalId) return;

      const fondoSesion = Number((session as any)?.fondo ?? 0) || 0;

      try {
        const res = await consumoApi.get(`/api/sucursal/sucursal?sucursal=${sucursalId}`);
        const sucursalData = Array.isArray(res.data) && res.data.length > 0
          ? res.data[0]
          : res.data;
        const fondo = Number(sucursalData?.fondo ?? fondoSesion) || 0;
        setFondoSucursal(fondo);
      } catch (error) {
        console.error('Error cargando fondo de la sucursal:', error);
        setFondoSucursal(fondoSesion);
      }
    };

    cargarFondoSucursal();
  }, [session?.sucursal]);

  const fetchCorteActual = async () => {
    if (!session?.sucursal) return;

    try {
      const res = await consumoApi.get(
        `/api/PuntoDeVenta/get_corte_actual?caja=1&sucursal=${session.sucursal}`
      );
      if (Array.isArray(res.data) && res.data.length > 0) {
        setDataCorteActual(res.data[0]);
      }
    } catch (error) {
      console.error("Error cargando corte actual:", error);
    }
  };

  const cargarTotalARetirar = async () => {
    if (!session?.sucursal || !dataCorteActual) return;

    try {
      const res = await axios.get('https://localhost:5001/api/Corteparcial/calcular-total-a-retirar', {
        params: {
          sucursal: session.sucursal,
          caja: 1,
          corte: dataCorteActual.corte_maximo,
          corteParcial: dataCorteActual.corte_parcial_maximo,
        },
      });

      setTotalARetirar(Number(res.data?.totalARetirar ?? 0) || 0);
    } catch (error) {
      console.error("Error al calcular el total a retirar:", error);
    }
  };

  const handleCantidadChange = (denominacion: number, value: number) => {
    setRetiros(prev => ({
      ...prev,
      [denominacion]: Math.max(0, value)
    }));
  };

  const handleIncrement = (denominacion: number) => {
    setRetiros(prev => ({
      ...prev,
      [denominacion]: (prev[denominacion] || 0) + 1
    }));
  };

  const handleDecrement = (denominacion: number) => {
    setRetiros(prev => ({
      ...prev,
      [denominacion]: Math.max(0, (prev[denominacion] || 0) - 1)
    }));
  };

  const totalRetiro = useMemo(() => {
    return denominaciones.reduce(
      (acc, d) => acc + d * (retiros[d] || 0),
      0
    );
  }, [retiros]);

  const totalEgreso = totalRetiro;


  const validarDenominacionesIguales = (): boolean => {
    if (!retirosOriginales) return true; // Primera vez, no hay validación
    
    // Verificar que cada denominación sea exactamente igual
    for (const d of denominaciones) {
      if ((retiros[d] || 0) !== (retirosOriginales[d] || 0)) {
        return false;
      }
    }
    return true;
  };

  const RegistraRetiro = async () => {
    if (!session) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No hay sesión activa",
        confirmButtonColor: "#d33",
      });
      return;
    }

    if (!dataCorteActual) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo obtener la información del corte actual",
        confirmButtonColor: "#d33",
      });
      return;
    }

    const totalFinal = totalARetirar;

    // Validar que el total físico cubra el fondo de caja
    if (totalRetiro < fondoSucursal) {
      Swal.fire({
        icon: "error",
        title: "Error de validación",
        html: `
          <p>El total físico de las denominaciones ($${totalRetiro.toFixed(2)}) es menor que el fondo de caja ($${fondoSucursal.toFixed(2)}).</p>
          <p>Por favor, verifique las cantidades antes de continuar.</p>
        `,
        confirmButtonColor: "#d33",
      });
      return;
    }
    
    if (totalFinal === 0) {
      Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "El total físico es igual o menor al fondo de caja; no hay monto a retirar",
        confirmButtonColor: "#f8bb86",
      });
      return;
    }

    // Proceso de confirmación (3 veces)
    if (intentosConfirmacion === 0) {
      // Primera vez - mostrar alerta y guardar denominaciones originales
      const result = await Swal.fire({
        icon: "question",
        title: "Confirmar retiro (1/3)",
        text: "Por favor, vuelva a ingresar las mismas denominaciones para confirmar el retiro",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Entendido"
      });
      
      if (result.isConfirmed) {
        // Guardar las denominaciones originales
        setRetirosOriginales({...retiros});
        setIntentosConfirmacion(1);
        
        // Resetear las denominaciones a 0 para que el usuario las vuelva a ingresar
        const init: Record<number, number> = {};
        denominaciones.forEach(d => init[d] = 0);
        setRetiros(init);
      }
      return;
    }

    if (intentosConfirmacion === 1 || intentosConfirmacion === 2) {
      // Validar que las denominaciones sean exactamente iguales
      if (!validarDenominacionesIguales()) {
        Swal.fire({
          icon: "error",
          title: "Error de validación",
          text: "Las denominaciones ingresadas no coinciden con las originales. Debe ingresar exactamente las mismas cantidades por denominación.",
          confirmButtonColor: "#d33",
        });
        // Resetear para que vuelva a intentar desde el principio
        setIntentosConfirmacion(0);
        setRetirosOriginales(null);
        const init: Record<number, number> = {};
        denominaciones.forEach(d => init[d] = 0);
        setRetiros(init);
        return;
      }

      // Si las denominaciones coinciden
      if (intentosConfirmacion === 1) {
        // Segunda confirmación exitosa - pedir tercera
        const result = await Swal.fire({
          icon: "question",
          title: "Confirmar retiro (2/3)",
          text: "Por favor, vuelva a ingresar las mismas denominaciones una vez más",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Entendido"
        });
        
        if (result.isConfirmed) {
          setIntentosConfirmacion(2);
          // Resetear las denominaciones a 0 para la tercera entrada
          const init: Record<number, number> = {};
          denominaciones.forEach(d => init[d] = 0);
          setRetiros(init);
        }
        return;
      }

      if (intentosConfirmacion === 2) {
        // Tercera confirmación exitosa - mostrar alerta y continuar con el guardado
        await Swal.fire({
          icon: "success",
          title: "Validación completada (3/3)",
          text: "Las denominaciones han sido confirmadas correctamente. Procediendo a guardar...",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Continuar",
          timer: 2000
        });
        // Continuar con el guardado (no hacer return aquí)
      }
    }

    setLoading(true);
    try {
      const datosRetiro = {
        cia: 1,
        sucursal: session?.sucursal || 0,
        caja: 1,
        corte: dataCorteActual.corte_maximo,
        corteParcial: dataCorteActual.corte_parcial_maximo,
        tipoRetiro: 2,
        totalARetirar: totalFinal,
        totalEgreso: totalEgreso,
        observacion: observaciones.trim() || ".",
        usuario: session?.claveEmpleado || session?.id || "00001",
      };

      const response = await axios.post(
        'https://localhost:5001/api/Corteparcial/sp_pos_guardar_retiro',
        datosRetiro
      );

      if (response.data?.permitido) {
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: response.data?.mensaje || "Retiro registrado correctamente",
          confirmButtonColor: "#3085d6",
        });

        // Limpiar formulario
        const init: Record<number, number> = {};
        denominaciones.forEach(d => init[d] = 0);
        setRetiros(init);
        setObservaciones("");
        setIntentosConfirmacion(0);
        setRetirosOriginales(null);

        // Recargar corte actual
        fetchCorteActual();
      } else {
        Swal.fire({
          icon: "warning",
          title: "Atención",
          text: response.data?.mensaje || "No se pudo registrar el retiro",
          confirmButtonColor: "#f8bb86",
        });
      }
    } catch (error: any) {
      console.error("Error al registrar retiro:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.mensaje 
          || error?.response?.data?.detalle 
          || error?.message 
          || "Hubo un problema al registrar el retiro. Por favor, intenta nuevamente.",
        confirmButtonColor: "#d33",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDenominacion = (d: number) => {
    if (d >= 1) {
      return `$${d.toFixed(0)}`;
    }
    return `$${d.toFixed(1)}`;
  };

  return (
    <Box sx={{
      p: { xs: 1, sm: 1.5 },
      maxWidth: 1200,
      mx: "auto",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 0.5,
      fontFamily: '"Roboto", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
      '& .MuiTypography-root, & .MuiInputBase-root, & .MuiButton-root, & .MuiInputLabel-root': {
        fontFamily: 'inherit !important',
      },
    }}>
      {/* Encabezado con título, datos y botones */}
      <Paper elevation={1} sx={{ p: 1, mb: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "primary.main", lineHeight: 1.2 }}>
              Módulo de Retiros del Corte
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, mt: 0.25, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>Caja: 1</Typography>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>Corte: {dataCorteActual?.corte_maximo ?? "N/A"}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>Corte Parcial: {dataCorteActual?.corte_parcial_maximo ?? "N/A"}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={RegistraRetiro}
              disabled={loading || totalARetirar === 0}
              size="small"
              sx={{ minWidth: 90, px: 2, py: 0.5 }}
            >
              {loading ? "Guardando..." : "Guardar"}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => window.history.back()}
              size="small"
              sx={{ minWidth: 90, px: 2, py: 0.5 }}
            >
              Salir
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Total a Retirar */}
      <Paper
        elevation={2}
        sx={{
          p: 1,
          mb: 0.5,
          bgcolor: '#f5f5f5',
          border: '2px solid #a5a5a5ff',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 'bold', color: '#4e4e4eff' }}
          >
            TOTAL A RETIRAR:
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', color: '#5c5c5cff' }}
          >
            ${totalARetirar.toFixed(2)}
          </Typography>
        </Box>
      </Paper>

      {/* Grid de denominaciones */}
      <Card sx={{ mb: 0.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ p: 0.5, '&:last-child': { p: 0.5 }, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: "bold" }}>
            Desglose por Denominación
          </Typography>
          
          {/* Contenedor de dos columnas */}
          <Box sx={{ display: 'flex', gap: 0.5, flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {/* Columna izquierda - Billetes grandes (1000-20) */}
            <Box sx={{ flex: 1 }}>
              {denominacionesGrandes.map((d, index) => (
                <Box key={d}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  py: 0,
                  gap: 0.5,
                }}
              >
                {/* Denominación sola */}
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: "bold",
                    minWidth: 45,
                    color: d >= 20 ? "success.main" : "warning.main",
                    fontSize: '0.85rem',
                  }}
                >
                  {formatDenominacion(d)}
                </Typography>

                {/* Controles agrupados: X, -, campo, +, =, resultado */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.1 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    X
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleDecrement(d)}
                    sx={{
                      bgcolor: "grey.100",
                      border: "1px solid",
                      borderColor: "grey.300",
                      width: 26,
                      height: 26,
                    }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>

                  <TextField
                    type="number"
                    value={retiros[d] || 0}
                    onChange={(e) => handleCantidadChange(d, parseInt(e.target.value) || 0)}
                    inputProps={{
                      min: 0,
                      style: { textAlign: "center" },
                    }}
                    sx={{ width: 75, '& .MuiInputBase-root': { height: 26, px: 0.5 } }}
                    size="small"
                  />

                  <IconButton
                    size="small"
                    onClick={() => handleIncrement(d)}
                    sx={{
                      bgcolor: "grey.100",
                      border: "1px solid",
                      borderColor: "grey.300",
                      width: 26,
                      height: 26,
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>

                  <Typography variant="caption" sx={{ color: "text.secondary", mx: 0.25 }}>
                    =
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      minWidth: 60,
                      textAlign: "right",
                      fontWeight: "bold",
                      color: (retiros[d] || 0) > 0 ? "primary.main" : "text.secondary",
                      fontSize: '0.85rem',
                    }}
                  >
                    ${(d * (retiros[d] || 0)).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
                  {index < denominacionesGrandes.length - 1 && <Divider />}
                </Box>
              ))}
            </Box>

            {/* Columna derecha - Denominaciones pequeñas (10-0.1) */}
            <Box sx={{ flex: 1 }}>
              {denominacionesPequenas.map((d, index) => (
                <Box key={d}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      py: 0,
                      gap: 0.5,
                    }}
                  >
                    {/* Denominación sola */}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: "bold",
                        minWidth: 45,
                        color: d >= 20 ? "success.main" : "warning.main",
                        fontSize: '0.85rem',
                      }}
                    >
                      {formatDenominacion(d)}
                    </Typography>

                    {/* Controles agrupados: X, -, campo, +, =, resultado */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.1 }}>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        X
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleDecrement(d)}
                        sx={{
                          bgcolor: "grey.100",
                          border: "1px solid",
                          borderColor: "grey.300",
                          width: 26,
                          height: 26,
                        }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>

                      <TextField
                        type="number"
                        value={retiros[d] || 0}
                        onChange={(e) => handleCantidadChange(d, parseInt(e.target.value) || 0)}
                        inputProps={{
                          min: 0,
                          style: { textAlign: "center" },
                        }}
                        sx={{ width: 75, '& .MuiInputBase-root': { height: 26, px: 0.5 } }}
                        size="small"
                      />

                      <IconButton
                        size="small"
                        onClick={() => handleIncrement(d)}
                        sx={{
                          bgcolor: "grey.100",
                          border: "1px solid",
                          borderColor: "grey.300",
                          width: 26,
                          height: 26,
                        }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>

                      <Typography variant="caption" sx={{ color: "text.secondary", mx: 0.25 }}>
                        =
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          minWidth: 60,
                          textAlign: "right",
                          fontWeight: "bold",
                          color: (retiros[d] || 0) > 0 ? "primary.main" : "text.secondary",
                          fontSize: '0.85rem',
                        }}
                      >
                        ${(d * (retiros[d] || 0)).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                  {index < denominacionesPequenas.length - 1 && <Divider />}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Divisor antes de vales */}
          <Divider sx={{ my: 0.5 }} />

          {/* Fila de Vales */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              py: 0,
              gap: 0.5,
            }}
          >
            {/* Etiqueta VALES */}
            <Typography
              variant="body2"
              sx={{
                minWidth: 45,
                fontWeight: "bold",
                color: "success.main",
                fontSize: '0.85rem',
              }}
            >
              VALES
            </Typography>

            {/* Campo de vales sin botones */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.1 }}>
              <TextField
                type="number"
                value={vales}
                InputProps={{
                  readOnly: true,
                }}
                inputProps={{
                  min: 0,
                  step: 0.01,
                  style: { textAlign: "center" },
                }}
                sx={{ width: 75, '& .MuiInputBase-root': { height: 26, px: 0.5 } }}
                size="small"
              />

              {/* Operador = */}
              <Typography variant="caption" sx={{ color: "text.secondary", mx: 0.25 }}>
                =
              </Typography>

              {/* Resultado */}
              <Typography
                variant="body2"
                sx={{
                  minWidth: 60,
                  textAlign: "right",
                  fontWeight: "bold",
                  color: vales > 0 ? "primary.main" : "text.secondary",
                  fontSize: '0.85rem',
                }}
              >
                ${vales.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Observaciones, Total y Botones en la misma fila */}
      <Box sx={{ display: 'flex', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
        {/* Observaciones - Izquierda */}
        <Card sx={{ flex: 1, minWidth: 260 }}>
          <CardContent sx={{ p: 0.5, '&:last-child': { p: 0.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: "bold", whiteSpace: 'nowrap' }}>
                Observación:
              </Typography>
              <TextField
                fullWidth
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ingrese observaciones del retiro"
                variant="outlined"
                size="small"
                sx={{ '& .MuiInputBase-root': { height: 32 } }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Total Egreso - Centro */}
        <Paper
          elevation={3}
          sx={{
            p: 1,
            minWidth: 180,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 0.25,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Total Egreso:</Typography>
          <Typography variant="h5" sx={{ fontWeight: "bold", fontSize: '1.4rem' }}>
            ${totalEgreso.toFixed(2)}
          </Typography>
        </Paper>

      </Box>
    </Box>
  );
}
