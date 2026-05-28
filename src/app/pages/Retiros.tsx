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
  useTheme,
  useMediaQuery,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import Swal from "sweetalert2";
import useConsumoApi from "../../hooks/useConsumoApi";
import useSession from "../../hooks/useSession";

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [dataCorteActual, setDataCorteActual] = useState<CorteActual | null>(null);
  const [retiros, setRetiros] = useState<Record<number, number>>({});
  const [observaciones, setObservaciones] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [totalRetiroEditable, setTotalRetiroEditable] = useState<string>("0.00");
  const [vales, setVales] = useState<number>(0);
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

  // Sincronizar el total editable cuando cambian las denominaciones
  useEffect(() => {
    setTotalRetiroEditable(totalRetiro.toFixed(2));
  }, [totalRetiro]);

  const handleTotalChange = (value: string) => {
    // Permitir solo números y punto decimal
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value) || value === '') {
      setTotalRetiroEditable(value);
    }
  };

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

    const totalFinal = parseFloat(totalRetiroEditable) || 0;
    
    if (totalFinal === 0) {
      Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "El total del retiro debe ser mayor a 0",
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
      const response = await consumoApi.post(
        "/api/PuntoDeVenta/sp_kiosko_registra_retiro",
        null,
        {
          params: {
            caja: 1,
            sucursal: session.sucursal,
            corte: dataCorteActual.corte_maximo,
            corte_parcial: dataCorteActual.corte_parcial_maximo,
            retiro: parseFloat(totalRetiroEditable) || 0,
            usuario: `'${session.claveEmpleado || session.id || "00001"}'`,
            observaciones: observaciones.trim() || "sin observacion registrada",
          },
        }
      );

      const resultado = Array.isArray(response.data) && response.data.length > 0 
        ? response.data[0] 
        : response.data;

      if (resultado.codigo === 0) {
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: resultado.mensaje1 || "Retiro registrado correctamente",
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
          text: resultado.mensaje1 || "No se pudo registrar el retiro",
          confirmButtonColor: "#f8bb86",
        });
      }
    } catch (error) {
      console.error("Error al registrar retiro:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al registrar el retiro. Por favor, intenta nuevamente.",
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
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: "auto" }}>
      {/* Encabezado con título a la izquierda y datos a la derecha */}
      <Paper elevation={2} sx={{ p: 2, mb: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          {/* Título a la izquierda */}
          <Box>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              Módulo de
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>
              Retiros del Corte
            </Typography>
          </Box>

          {/* Datos a la derecha */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography>
              <strong>Caja:</strong> 1
            </Typography>
            <Typography>
              <strong>Corte:</strong> {dataCorteActual?.corte_maximo ?? "N/A"}
            </Typography>
            <Typography>
              <strong>Corte Parcial:</strong> {dataCorteActual?.corte_parcial_maximo ?? "N/A"}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Total a Retirar */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          mb: 1.5, 
          bgcolor: '#f5f5f5',
          border: '2px solid #a5a5a5ff'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold',
              color: '#4e4e4eff'
            }}
          >
            TOTAL A RETIRAR:
          </Typography>
          <TextField
            value={totalRetiroEditable}
            onChange={(e) => handleTotalChange(e.target.value)}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 0.5, fontWeight: 'bold' }}>$</Typography>,
              sx: {
                fontWeight: 'bold',
                fontSize: '1.5rem',
                color: '#5c5c5cff',
              }
            }}
            sx={{ 
              minWidth: 150,
              '& .MuiInputBase-input': {
                textAlign: 'right',
                fontWeight: 'bold',
                color: '#5c5c5cff',
              }
            }}
            size="small"
          />
        </Box>
      </Paper>

      {/* Grid de denominaciones */}
      <Card sx={{ mb: 1.5 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            Desglose por Denominación
          </Typography>
          
          {/* Contenedor de dos columnas */}
          <Box sx={{ display: 'flex', gap: 15 }}>
            {/* Columna izquierda - Billetes grandes (1000-20) */}
            <Box sx={{ flex: 1 }}>
              {denominacionesGrandes.map((d, index) => (
                <Box key={d}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1.5,
                  gap: 2,
                }}
              >
                {/* Denominación sola */}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    color: d >= 20 ? "success.main" : "warning.main",
                  }}
                >
                  {formatDenominacion(d)}
                </Typography>

                {/* Controles agrupados: X, -, campo, +, =, resultado */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.1 }}>
                  <Typography variant="body1" sx={{ color: "text.secondary" }}>
                    X
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleDecrement(d)}
                    sx={{
                      bgcolor: "grey.100",
                      border: "1px solid",
                      borderColor: "grey.300",
                      width: 32,
                      height: 32,
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
                    sx={{ width: 70 }}
                    size="small"
                  />

                  <IconButton
                    size="small"
                    onClick={() => handleIncrement(d)}
                    sx={{
                      bgcolor: "grey.100",
                      border: "1px solid",
                      borderColor: "grey.300",
                      width: 32,
                      height: 32,
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>

                  <Typography variant="body1" sx={{ color: "text.secondary", mx: 0.5 }}>
                    =
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      minWidth: 100,
                      textAlign: "right",
                      fontWeight: "bold",
                      color: (retiros[d] || 0) > 0 ? "primary.main" : "text.secondary",
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
                      justifyContent: "space-between",
                      py: 1.5,
                      gap: 2,
                    }}
                  >
                    {/* Denominación sola */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "bold",
                        color: d >= 20 ? "success.main" : "warning.main",
                      }}
                    >
                      {formatDenominacion(d)}
                    </Typography>

                    {/* Controles agrupados: X, -, campo, +, =, resultado */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.1 }}>
                      <Typography variant="body1" sx={{ color: "text.secondary" }}>
                        X
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleDecrement(d)}
                        sx={{
                          bgcolor: "grey.100",
                          border: "1px solid",
                          borderColor: "grey.300",
                          width: 32,
                          height: 32,
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
                        sx={{ width: 70 }}
                        size="small"
                      />

                      <IconButton
                        size="small"
                        onClick={() => handleIncrement(d)}
                        sx={{
                          bgcolor: "grey.100",
                          border: "1px solid",
                          borderColor: "grey.300",
                          width: 32,
                          height: 32,
                        }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>

                      <Typography variant="body1" sx={{ color: "text.secondary", mx: 0.5 }}>
                        =
                      </Typography>

                      <Typography
                        variant="h6"
                        sx={{
                          minWidth: 100,
                          textAlign: "right",
                          fontWeight: "bold",
                          color: (retiros[d] || 0) > 0 ? "primary.main" : "text.secondary",
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
          <Divider sx={{ my: 2 }} />

          {/* Fila de Vales */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 0.5,
              gap: 2,
            }}
          >
            {/* Etiqueta VALES */}
            <Typography
              variant="h6"
              sx={{
                minWidth: 80,
                fontWeight: "bold",
                color: "success.main",
              }}
            >
              VALES
            </Typography>

            {/* Espacio vacío donde estaba la X */}
            <Box sx={{ minWidth: 20 }} />

            {/* Campo de vales sin botones */}
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
              sx={{ width: 70 }}
              size="small"
            />

            {/* Operador = */}
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              =
            </Typography>

            {/* Resultado */}
            <Typography
              variant="h6"
              sx={{
                minWidth: 100,
                textAlign: "right",
                fontWeight: "bold",
                color: vales > 0 ? "primary.main" : "text.secondary",
              }}
            >
              ${vales.toFixed(2)}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Total */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 3,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">Total Egreso:</Typography>
        <Typography variant="h4" fontWeight="bold">
          ${totalRetiro.toFixed(2)}
        </Typography>
      </Paper>

      {/* Observaciones */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
            Observación:
          </Typography>
          <TextField
            fullWidth
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ingrese observaciones del retiro"
            variant="outlined"
            size={isMobile ? "medium" : "small"}
          />
        </CardContent>
      </Card>

      {/* Botones */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={RegistraRetiro}
          disabled={loading || totalRetiro === 0}
          sx={{
            px: 4,
            py: 1.5,
            fontWeight: "bold",
            borderRadius: 2,
            textTransform: "none",
            fontSize: "1rem",
            minWidth: 120,
          }}
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => window.history.back()}
          sx={{
            px: 4,
            py: 1.5,
            fontWeight: "bold",
            borderRadius: 2,
            textTransform: "none",
            fontSize: "1rem",
            minWidth: 120,
          }}
        >
          Salir
        </Button>
      </Box>
    </Box>
  );
}
