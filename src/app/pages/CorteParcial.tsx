import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Divider,
  Dialog,
  DialogContent,
  TextField,
  IconButton,
  GlobalStyles,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import useConsumoApi from "../../hooks/useConsumoApi";
import useSession from "../../hooks/useSession";
import { routes } from "../../utils/Routes";
import { useAuth } from "../../context/AuthContext";

interface InfoCorteItem {
  descripcion: string;
  total: number;
}

interface CorteData {
  corte_maximo: number;
  corte_parcial_maximo: number;
}

export default function CorteParcial() {
  const { consumoApi } = useConsumoApi();
  const session = useSession();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [ultimoCorte, setUltimoCorte] = useState<CorteData | null>(null);
  const [infoCorte, setInfoCorte] = useState<InfoCorteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const maxIntentos = 3;
  
  // Estados para modal de retiro de fondo
  const [modalRetiroAbierto, setModalRetiroAbierto] = useState(false);
  const [retirosModal, setRetirosModal] = useState<Record<number, number>>({});
  const [observacionModal, setObservacionModal] = useState<string>("");
  const [valesModal, setValesModal] = useState<number>(0);
  const [intentosConfirmacion, setIntentosConfirmacion] = useState(0);
  const [conteoAnterior, setConteoAnterior] = useState<string | null>(null);
  
  // Estados para modal de último retiro
  const [modalUltimoRetiroAbierto, setModalUltimoRetiroAbierto] = useState(false);
  const [retirosUltimoModal, setRetirosUltimoModal] = useState<Record<number, number>>({});
  const [observacionUltimoModal, setObservacionUltimoModal] = useState<string>("");
  const [valesUltimoModal, setValesUltimoModal] = useState<number>(0);
  const [intentosConfirmacionUltimo, setIntentosConfirmacionUltimo] = useState(0);
  const [conteoAnteriorUltimo, setConteoAnteriorUltimo] = useState<string | null>(null);
  const [montoEsperadoFormularioA, setMontoEsperadoFormularioA] = useState<number>(0);
  const [montoObligatorio, setMontoObligatorio] = useState<number>(0);
  const [ultimoRetiroCompletado, setUltimoRetiroCompletado] = useState<boolean>(false);
  const [retiroFondoCompletado, setRetiroFondoCompletado] = useState<boolean>(false);

  const [finalizandoCorte, setFinalizandoCorte] = useState<boolean>(false);
  
  const denominaciones = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1];

  // Inicializar retiros del modal
  useEffect(() => {
    const init: Record<number, number> = {};
    denominaciones.forEach(d => init[d] = 0);
    setRetirosModal(init);
    setRetirosUltimoModal(init);
  }, []);

  // Cargar el monto esperado del módulo anterior desde la BD
  useEffect(() => {
    const cargarMontoAnterior = async () => {
      try {
        const params = {
          cia: 1,
          sucursal: session?.sucursal || 0,
          corte: ultimoCorte?.corte_maximo || 0,
          corteParcial: ultimoCorte?.corte_parcial_maximo || 0,
          caja: 1
        };
        
        console.log("Parámetros enviados al GET:", params);
        
        const respuesta = await consumoApi.get('/api/cortedia/obtener-monto-esperado', {
          params
        });
        
        console.log("Monto recuperado de BD:", respuesta.data);

        if (respuesta.data) {
          const montoDetectado = respuesta.data.montoEsperado ?? respuesta.data.monto ?? 0;
          console.log("Monto detectado:", montoDetectado);
          setMontoObligatorio(montoDetectado);
          setMontoEsperadoFormularioA(montoDetectado);
        }
      } catch (error: any) {
        console.error("Error al obtener el monto del módulo anterior:", error);
        console.error("Detalles del error:", error?.response?.data);
        setMontoObligatorio(0);
        setMontoEsperadoFormularioA(0);
      }
    };

    if (ultimoCorte) {
      cargarMontoAnterior();
    }
  }, [ultimoCorte, session?.sucursal]);

  // Calcular total del retiro en el modal
  const totalRetiroModal = useMemo(() => {
    return denominaciones.reduce(
      (acc, d) => acc + d * (retirosModal[d] || 0),
      0
    );
  }, [retirosModal]);

  // Calcular total del último retiro en el modal
  const totalUltimoRetiroModal = useMemo(() => {
    return denominaciones.reduce(
      (acc, d) => acc + d * (retirosUltimoModal[d] || 0),
      0
    );
  }, [retirosUltimoModal]);

  // Abrir modal de retiro de fondo
  const abrirModalRetiro = () => {
    // Resetear valores
    const init: Record<number, number> = {};
    denominaciones.forEach(d => init[d] = 0);
    setRetirosModal(init);
    setObservacionModal("");
    setValesModal(0);
    setIntentosConfirmacion(0);
    setConteoAnterior(null);
    setModalRetiroAbierto(true);
  };

  // Cerrar modal
  const cerrarModalRetiro = () => {
    setModalRetiroAbierto(false);
  };

  // Guardar retiro de fondo
  const guardarRetiroFondo = async () => {
    if (totalRetiroModal === 0) {
      Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "El total del retiro debe ser mayor a 0",
      });
      return;
    }

    if (!ultimoCorte) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se encontró información del corte",
      });
      return;
    }

    // Triple confirmación del conteo físico
    const conteoActual: Record<string, number> = {};
    denominaciones.forEach(d => conteoActual[`m${d}`] = retirosModal[d] || 0);
    conteoActual.vales = valesModal;
    conteoActual.total = Number(totalRetiroModal.toFixed(2));
    const conteoActualJson = JSON.stringify(conteoActual);

    if (intentosConfirmacion > 0 && conteoActualJson !== conteoAnterior) {
      Swal.fire({
        icon: "error",
        title: "Error de validación",
        text: "Las cantidades no coinciden con el conteo anterior. Reiniciando confirmaciones. Vuelva a contar.",
        confirmButtonColor: "#d33",
      });
      setIntentosConfirmacion(0);
      setConteoAnterior(null);
      const init: Record<number, number> = {};
      denominaciones.forEach(d => init[d] = 0);
      setRetirosModal(init);
      setValesModal(0);
      return;
    }

    const nuevoIntento = intentosConfirmacion + 1;
    setConteoAnterior(conteoActualJson);

    if (nuevoIntento < 3) {
      setIntentosConfirmacion(nuevoIntento);
      await Swal.fire({
        icon: "success",
        title: `Conteo ${nuevoIntento} registrado`,
        text: "Realice la siguiente confirmación idéntica.",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Aceptar",
      });
      const init: Record<number, number> = {};
      denominaciones.forEach(d => init[d] = 0);
      setRetirosModal(init);
      setValesModal(0);
      return;
    }

    setIntentosConfirmacion(0);
    setConteoAnterior(null);

    const dataParaGuardar = {
      cia: 1,
      sucursal: session?.sucursal || 0,
      caja: 1,
      corte: ultimoCorte.corte_maximo,
      corteParcial: ultimoCorte.corte_parcial_maximo,
      tipoRetiro: 1,
      totalARetirar: totalRetiroModal,
      totalEgreso: totalRetiroModal,
      observacion: observacionModal || "",
      usuario: session?.id || session?.claveEmpleado || ""
    };

    try {
      setLoading(true);
      console.log("Payload retiro fondo:", dataParaGuardar);
      const res = await consumoApi.post('/api/Corteparcial/sp_pos_guardar_retiro', dataParaGuardar);

      setLoading(false);

      if (res.data?.permitido) {
        setRetiroFondoCompletado(true);
        cerrarModalRetiro();

        // Pequeño delay para asegurar que el modal se cierre antes de mostrar la alerta
        setTimeout(async () => {
          await Swal.fire({
            icon: "success",
            title: "Éxito",
            text: res.data?.mensaje || "Retiro de fondo registrado correctamente",
          });
          fetchInfoCorte();
        }, 100);
      } else {
        const mensaje = res.data?.mensaje
          ? res.data.mensaje.replace(/\s*\(\d+(?:,\d{3})*(?:\.\d{1,2})?\)/g, "")
          : "El retiro no pudo ser registrado";
        Swal.fire({
          icon: "warning",
          title: "Atención",
          text: mensaje,
        });
      }
    } catch (error: any) {
      console.error("Error al guardar retiro:", error);
      setLoading(false);
      cerrarModalRetiro();
      
      const errorMessage = (error?.response?.data?.mensaje 
        || error?.response?.data?.detalle 
        || error?.message 
        || "No se pudo registrar el retiro").replace(/\s*\(\d+(?:,\d{3})*(?:\.\d{1,2})?\)/g, "");
      
      // Pequeño delay para asegurar que el modal se cierre antes de mostrar la alerta
      setTimeout(() => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
        });
      }, 100);
    }
  };

  // Abrir modal de último retiro
  const abrirModalUltimoRetiro = () => {
    // Resetear valores
    const init: Record<number, number> = {};
    denominaciones.forEach(d => init[d] = 0);
    setRetirosUltimoModal(init);
    setObservacionUltimoModal("");
    setValesUltimoModal(0);
    setIntentosConfirmacionUltimo(0);
    setConteoAnteriorUltimo(null);
    setModalUltimoRetiroAbierto(true);
  };

  // Cerrar modal de último retiro
  const cerrarModalUltimoRetiro = () => {
    setModalUltimoRetiroAbierto(false);
  };

  // Guardar último retiro
  const guardarUltimoRetiro = async () => {
    if (totalUltimoRetiroModal === 0) {
      Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "El total del retiro debe ser mayor a 0",
      });
      return;
    }

    if (!ultimoCorte) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se encontró información del corte",
      });
      return;
    }

    // Triple confirmación del conteo físico
    const conteoActual: Record<string, number> = {};
    denominaciones.forEach(d => conteoActual[`m${d}`] = retirosUltimoModal[d] || 0);
    conteoActual.vales = valesUltimoModal;
    conteoActual.total = Number(totalUltimoRetiroModal.toFixed(2));
    const conteoActualJson = JSON.stringify(conteoActual);

    if (intentosConfirmacionUltimo > 0 && conteoActualJson !== conteoAnteriorUltimo) {
      Swal.fire({
        icon: "error",
        title: "Error de validación",
        text: "Las cantidades no coinciden con el conteo anterior. Reiniciando confirmaciones. Vuelva a contar.",
        confirmButtonColor: "#d33",
      });
      setIntentosConfirmacionUltimo(0);
      setConteoAnteriorUltimo(null);
      const init: Record<number, number> = {};
      denominaciones.forEach(d => init[d] = 0);
      setRetirosUltimoModal(init);
      setValesUltimoModal(0);
      return;
    }

    const nuevoIntento = intentosConfirmacionUltimo + 1;
    setConteoAnteriorUltimo(conteoActualJson);

    if (nuevoIntento < 3) {
      setIntentosConfirmacionUltimo(nuevoIntento);
      await Swal.fire({
        icon: "success",
        title: `Conteo ${nuevoIntento} registrado`,
        text: "Realice la siguiente confirmación idéntica.",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Aceptar",
      });
      const init: Record<number, number> = {};
      denominaciones.forEach(d => init[d] = 0);
      setRetirosUltimoModal(init);
      setValesUltimoModal(0);
      return;
    }

    setIntentosConfirmacionUltimo(0);
    setConteoAnteriorUltimo(null);

    try {
      setLoading(true);

      const dataUltimoRetiro = {
        cia: 1,
        sucursal: session?.sucursal || 0,
        caja: 1,
        corte: ultimoCorte.corte_maximo,
        corteParcial: ultimoCorte.corte_parcial_maximo,
        tipoRetiro: 3,
        totalARetirar: totalUltimoRetiroModal,
        totalEgreso: totalUltimoRetiroModal,
        observacion: observacionUltimoModal || "Último retiro parcial",
        usuario: session?.id || session?.claveEmpleado || ""
      };

      console.log("Payload último retiro:", dataUltimoRetiro);

      const response = await consumoApi.post('/api/Corteparcial/sp_pos_guardar_retiro', dataUltimoRetiro);

      setLoading(false);

      if (response.data?.permitido) {
        cerrarModalUltimoRetiro();

        // Pequeño delay para asegurar que el modal se cierre antes de mostrar la alerta
        setTimeout(async () => {
          await Swal.fire({
            icon: "success",
            title: "Éxito",
            text: response.data?.mensaje || "Último retiro guardado correctamente.",
          });
          setUltimoRetiroCompletado(true);
          fetchInfoCorte();
        }, 100);
      } else {
        Swal.fire({
          icon: "warning",
          title: "Atención",
          text: response.data?.mensaje || "El último retiro no pudo ser registrado",
        });
      }
    } catch (error: any) {
      console.error("Error al guardar último retiro:", error);
      setLoading(false);
      cerrarModalUltimoRetiro();
      
      const errorMessage = error?.response?.data?.mensaje 
        || error?.response?.data?.detalle 
        || error?.message 
        || "No se pudo guardar el último retiro";
      
      // Pequeño delay para asegurar que el modal se cierre antes de mostrar la alerta
      setTimeout(() => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
        });
      }, 100);
    }
  };

  // Formatear denominación
  const formatDenominacion = (d: number) => {
    if (d >= 1) {
      return `$${d.toFixed(0)}`;
    }
    return `$${d.toFixed(1)}`;
  };

  // Obtener el último corte
  const fetchUltimoCorte = async () => {
    try {
      setLoading(true);
      const res = await consumoApi.get(
        "/api/PuntoDeVenta/get_corte_actual",
        {
          params: {
            sucursal: session?.sucursal,
            caja: 1,
          },
        }
      );

      const data = res.data;
      if (Array.isArray(data) && data.length > 0) {
        setUltimoCorte(data[0]);
      }
    } catch (error) {
      console.error("Error al obtener el último corte:", error);
      Swal.fire("Error", "No se pudo obtener información del corte", "error");
    } finally {
      setLoading(false);
    }
  };

  // Obtener información del corte
  const fetchInfoCorte = async () => {
    if (!ultimoCorte) return;
    
    try {
      setLoading(true);
      const res = await consumoApi.get(
        "/api/PuntoDeVenta/sp_bw_get_info_corte",
        {
          params: {
            sucursal: session?.sucursal,
            caja: 1,
            corte: ultimoCorte.corte_maximo,
            corte_parcial: ultimoCorte.corte_parcial_maximo,
          },
        }
      );

      setInfoCorte(res.data);
    } catch (err) {
      console.error("Error al obtener información del corte:", err);
      Swal.fire("Error", "No se pudo cargar la información del corte", "error");
    } finally {
      setLoading(false);
    }
  };



  // Calcular total de efectivo vendido
  const totalEfectivo = useMemo(() => {
    const efectivoItem = infoCorte.find(
      (item) => item.descripcion === "Efectivo"
    );
    return efectivoItem ? Number(efectivoItem.total) : 0;
  }, [infoCorte]);

  // Obtener total de retiros desde infoCorte (ya calculado por sp_bw_get_info_corte)
  const totalRetiros = useMemo(() => {
    const retiroItem = infoCorte.find(item => item.descripcion === "retiro");
    return retiroItem ? Number(retiroItem.total) : 0;
  }, [infoCorte]);

  // Obtener retiro de fondo desde infoCorte
  const totalRetiroFondo = useMemo(() => {
    const item = infoCorte.find(i => i.descripcion === "retiro fondo");
    return item ? Number(item.total) : 0;
  }, [infoCorte]);

  // Obtener fondo total a entregar desde infoCorte
  const fondoTotalEntregar = useMemo(() => {
    const item = infoCorte.find(i => i.descripcion === "fondo total a entregar");
    return item ? Number(item.total) : 0;
  }, [infoCorte]);

  // Verificar si ya se entregó el fondo completo
  const fondoEntregado = useMemo(() => {
    return fondoTotalEntregar > 0 && totalRetiroFondo >= fondoTotalEntregar;
  }, [fondoTotalEntregar, totalRetiroFondo]);

  // Calcular monto de medios de pago no efectivo
  const montoNoEfectivo = useMemo(() => {
    return infoCorte
      .filter(
        (item) =>
          item.descripcion !== "Efectivo" && item.descripcion !== "retiro" && item.descripcion !== "retiro fondo" && item.descripcion !== "fondo total a entregar"
      )
      .reduce((acc, item) => acc + Number(item.total), 0);
  }, [infoCorte]);

  // Calcular total de venta (todos los pagos) menos retiros
  const montoCorte = useMemo(() => {
    const totalVentas = infoCorte
      .filter((item) => item.descripcion !== "retiro" && item.descripcion !== "retiro fondo" && item.descripcion !== "fondo total a entregar")
      .reduce((acc, item) => acc + Number(item.total), 0);
    return totalVentas - totalRetiros;
  }, [infoCorte]);

  // Filtrar medios de pago no efectivo para la tabla
  const mediosPagoTabla = useMemo(() => {
    return infoCorte.filter(
      (item) =>
        item.descripcion !== "Efectivo" && item.descripcion !== "retiro" && item.descripcion !== "retiro fondo" && item.descripcion !== "fondo total a entregar"
    );
  }, [infoCorte]);

  // Verificar si los totales coinciden
  const totalesCoinciden = useMemo(() => {
    const r = Number(totalRetiros.toFixed(2));
    const e = Number(totalEfectivo.toFixed(2));
    return r === e && r > 0;
  }, [infoCorte, totalEfectivo]);

  // Calcular efectivo teórico (lo que debería haber en caja)
  const efectivoTeorico = useMemo(() => {
    return Number((totalEfectivo - totalRetiros).toFixed(2));
  }, [infoCorte, totalEfectivo]);

  // Pedir efectivo real al usuario
  const pedirEfectivo = async () => {
    const result = await Swal.fire({
      title: "Efectivo en cajón",
      input: "number",
      inputLabel: "Teclea el efectivo real en el cajón",
      inputAttributes: {
        step: "0.01",
        min: "0",
      },
      showCancelButton: true,
      confirmButtonText: "Validar",
      cancelButtonText: "Cancelar",
      allowOutsideClick: false,
      inputValidator: (value) => {
        if (!value || Number(value) < 0) {
          return "Ingresa un monto válido";
        }
        return null;
      },
    });

    if (!result.isConfirmed) return null;

    return Number(Number(result.value).toFixed(2));
  };

  // Finalizar corte
  const finalizarCorte = async () => {
    setFinalizandoCorte(true);
    try {
      // Validar que haya operaciones registradas
      const tieneOperaciones = infoCorte.some(
        (item) => item.descripcion !== "retiro" && Number(item.total) !== 0
      );

      if (!tieneOperaciones) {
        await Swal.fire({
          icon: "warning",
          title: "Atención",
          text: "¡Atención! No se ha hecho ninguna operación dentro de este corte, por lo tanto no puede realizar el corte parcial. Verifique.",
          confirmButtonColor: "#f8bb86",
        });
        return;
      }

      // Confirmación inicial
      const confirmacion = await Swal.fire({
        title: "¿Desea realizar el corte parcial?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí",
        cancelButtonText: "No",
        allowOutsideClick: false,
      });

      if (!confirmacion.isConfirmed) return;

      // Cerrar corte directamente con el efectivo teórico
      await cerrarCorte(efectivoTeorico);

      // Limpiar totales y recargar el siguiente corte parcial
      setInfoCorte([]);
      setRetiroFondoCompletado(false);
      setUltimoRetiroCompletado(false);
      setMontoObligatorio(0);
      setMontoEsperadoFormularioA(0);
      await fetchUltimoCorte();
    } finally {
      setFinalizandoCorte(false);
    }
  };

  // Cerrar corte en la API
  const cerrarCorte = async (ultimoRetiro: number) => {
    if (!ultimoCorte) return;
    
    try {
      setLoading(true);

      const requestBody = {
        sucursal: session?.sucursal || 0,
        corte: ultimoCorte.corte_maximo,
        corteParcial: ultimoCorte.corte_parcial_maximo,
        caja: 1,
        monto: montoCorte,
        corteFinal: false, // Corte parcial NO es corte final
        usr: session?.id || "",
        cia: 1,
        ultimoRetiro: ultimoRetiro
      };

      console.log("Datos enviados al cerrar corte parcial:", requestBody);

      const res = await consumoApi.post(
        "/api/cortedia/cerrar",
        requestBody
      );

      const data = res.data;

      if (data?.corteProcesado || data?.mensaje) {
        await Swal.fire({
          icon: "success",
          title: "Corte realizado",
          text: data?.mensaje || "Corte parcial registrado.",
          confirmButtonColor: "#3085d6",
        });
      } else {
        Swal.fire(
          "Error",
          data?.mensaje || "No se pudo cerrar el corte",
          "error"
        );
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo cerrar el corte", "error");
    } finally {
      setLoading(false);
    }
  };

  // Cancelar corte
  const cancelarCorte = () => {
    Swal.fire({
      title: "¿Cancelar corte?",
      text: "Esta acción no guardará los cambios",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No, continuar",
    }).then((result) => {
      if (result.isConfirmed) {
        window.history.back();
      }
    });
  };

  // Efectos para cargar datos
  useEffect(() => {
    if (session?.sucursal) {
      fetchUltimoCorte();
    }
  }, [session?.sucursal]);

  useEffect(() => {
    if (ultimoCorte?.corte_maximo) {
      fetchInfoCorte();
      setIntentos(0);
    }
  }, [ultimoCorte?.corte_maximo, ultimoCorte?.corte_parcial_maximo]);

  // Formatear fecha actual
  const fechaActual = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Box className="corte-parcial-page" sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900, mx: "auto" }}>
      <GlobalStyles
        styles={{
          '.corte-parcial-page .MuiTypography-root, .corte-parcial-page .MuiButton-root, .corte-parcial-page .MuiTableCell-root': {
            fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
          },
        }}
      />
      <Typography
        variant="h3"
        sx={{ mb: 0.5, fontWeight: "bold", textAlign: "center", color: "primary.main" }}
      >
        Módulo de Corte de caja
      </Typography>

      {/* Info del corte */}
      <Paper elevation={2} sx={{ p: 1, mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-around",
            gap: 1,
          }}
        >
          <Typography sx={{ fontSize: "0.85rem" }}>
            <strong>Sucursal:</strong> {session?.dSucursal || session?.sucursal}
          </Typography>
          <Typography sx={{ fontSize: "0.85rem" }}>
            <strong>Corte:</strong> {ultimoCorte?.corte_maximo ?? "N/A"}
          </Typography>
          <Typography sx={{ fontSize: "0.85rem" }}>
            <strong>Corte parcial:</strong>{" "}
            {ultimoCorte?.corte_parcial_maximo ?? "N/A"}
          </Typography>
        </Box>
      </Paper>

      {/* Medios de pago */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 1.5 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
            Medios de pago
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
            <Table size="small" stickyHeader sx={{ '& th, & td': { py: 0.5, px: 1, fontSize: '0.85rem' } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.100" }}>
                  <TableCell>Tipo Pago</TableCell>
                  <TableCell align="right">Entregado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mediosPagoTabla.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.descripcion}</TableCell>
                    <TableCell align="right">
                      ${Number(item.total).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {mediosPagoTabla.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      No hay medios de pago registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Totales */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 1.5 }}>
          <Box sx={{ mb: 0.5 }}>
            <Typography sx={{ fontWeight: "bold", fontSize: "1rem" }}>
              Total de Retiros: ${totalRetiros.toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ mb: 0.5 }}>
            <Typography sx={{ fontWeight: "bold", fontSize: "1rem" }}>
              Retiro de Fondo: ${totalRetiroFondo.toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ mb: 0.5 }}>
            <Typography sx={{ fontWeight: "bold", fontSize: "1rem" }}>
              Total de Efectivo: ${totalEfectivo.toFixed(2)}
            </Typography>
          </Box>

          <Divider sx={{ my: 1 }} />

          {!totalesCoinciden && totalRetiros > 0 && (
            <Alert severity="warning" sx={{ mb: 1, py: 0.5 }}>
               Los totales no coinciden. Intentos restantes:{" "}
              {maxIntentos - intentos}
            </Alert>
          )}

          {totalesCoinciden && totalRetiros === 0 && (
            <Alert severity="warning" sx={{ mb: 1, py: 0.5 }}>
               No se han registrado retiros.
            </Alert>
          )}

          {totalesCoinciden && totalRetiros > 0 && (
            <Alert severity="success" sx={{ mb: 1, py: 0.5 }}>
               Los totales coinciden. Puedes finalizar el corte.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Botones */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 3, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={abrirModalRetiro}
          disabled={loading}
          sx={{
            px: 3,
            py: 1,
            fontWeight: "bold",
            borderRadius: 2,
            textTransform: "none",
            fontSize: "0.9rem",
            minWidth: 120,
          }}
        >
          Retiro de Fondo
        </Button>

        <Button
          variant="contained"
          color="success"
          onClick={abrirModalUltimoRetiro}
          disabled={loading || !fondoEntregado}
          sx={{
            px: 3,
            py: 1,
            fontWeight: "bold",
            borderRadius: 2,
            textTransform: "none",
            fontSize: "0.9rem",
            minWidth: 120,
          }}
        >
          Último Retiro
        </Button>

        <Button
          variant="contained"
          color="warning"
          onClick={finalizarCorte}
          disabled={!ultimoRetiroCompletado || loading || finalizandoCorte}
          sx={{
            px: 3,
            py: 1,
            fontWeight: "bold",
            borderRadius: 2,
            textTransform: "none",
            fontSize: "0.9rem",
            minWidth: 120,
          }}
        >
          {loading || finalizandoCorte ? "Procesando..." : "Finalizar Corte"}
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          onClick={cancelarCorte}
          sx={{
            px: 3,
            py: 1,
            fontWeight: "bold",
            borderRadius: 2,
            textTransform: "none",
            fontSize: "0.9rem",
            minWidth: 120,
          }}
        >
          Cancelar
        </Button>
      </Box>


      {/* Modal de Retiro de Fondo */}
      <Dialog
        open={modalRetiroAbierto}
        onClose={cerrarModalRetiro}
        maxWidth="sm"
        sx={{ zIndex: 1300 }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, maxHeight: '90vh' }}>
            {/* Encabezado */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', pb: 0.5 }}>
              <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                Módulo de Retiros del Corte
              </Typography>
              <IconButton onClick={cerrarModalRetiro} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Info del corte */}
            <Box sx={{ display: 'flex', justifyContent: 'space-around', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography sx={{ fontSize: '0.85rem' }}><strong>Caja:</strong> 1</Typography>
              <Typography sx={{ fontSize: '0.85rem' }}><strong>Corte:</strong> {ultimoCorte?.corte_maximo ?? "N/A"}</Typography>
              <Typography sx={{ fontSize: '0.85rem' }}><strong>Corte Parcial:</strong> {ultimoCorte?.corte_parcial_maximo ?? "N/A"}</Typography>
            </Box>

            {/* Denominaciones: billetes a la izquierda, monedas a la derecha */}
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                justifyContent: 'center',
                border: '2px solid #e9e9e9',
                borderRadius: 2,
                p: 1.5,
                bgcolor: '#ffffff',
                width: 'fit-content',
                mx: 'auto',
              }}
            >
              {/* Billetes */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 170 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center' }}>Billetes</Typography>
                {[1000, 500, 200, 100, 50, 20].map((d) => {
                  const cantidad = retirosModal[d] || 0;
                  const resultado = d * cantidad;
                  const esFila = [500, 100, 20].includes(d);
                  return (
                    <Box
                      key={d}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '60px 55px 55px',
                        alignItems: 'center',
                        gap: 0.5,
                        py: 0.25,
                        px: 0.75,
                        bgcolor: esFila ? 'grey.200' : 'transparent',
                        borderRadius: 0.5,
                      }}
                    >
                      <Typography sx={{ fontWeight: 'bold', fontSize: '0.8rem', textAlign: 'left' }}>
                        {formatDenominacion(d)} X
                      </Typography>
                      <TextField
                        type="number"
                        value={cantidad}
                        onChange={(e) => {
                          const valor = Math.max(0, parseInt(e.target.value) || 0);
                          setRetirosModal(prev => ({ ...prev, [d]: valor }));
                        }}
                        size="small"
                        sx={{ width: '100%', '& input': { p: '2px 4px', textAlign: 'center', fontSize: '0.8rem' } }}
                        inputProps={{ min: 0 }}
                      />
                      <Typography sx={{ textAlign: 'right', fontWeight: 'bold', fontSize: '0.8rem' }}>
                        {resultado.toFixed(2)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* Monedas */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 170 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center' }}>Monedas</Typography>
                {[10, 5, 2, 1, 0.5, 0.2, 0.1].map((d) => {
                  const cantidad = retirosModal[d] || 0;
                  const resultado = d * cantidad;
                  const esFila = [5, 1, 0.2, 0.1].includes(d);
                  return (
                    <Box
                      key={d}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '60px 55px 55px',
                        alignItems: 'center',
                        gap: 0.5,
                        py: 0.25,
                        px: 0.75,
                        bgcolor: esFila ? 'grey.200' : 'transparent',
                        borderRadius: 0.5,
                      }}
                    >
                      <Typography sx={{ fontWeight: 'bold', fontSize: '0.8rem', textAlign: 'left' }}>
                        {formatDenominacion(d)} X
                      </Typography>
                      <TextField
                        type="number"
                        value={cantidad}
                        onChange={(e) => {
                          const valor = Math.max(0, parseInt(e.target.value) || 0);
                          setRetirosModal(prev => ({ ...prev, [d]: valor }));
                        }}
                        size="small"
                        sx={{ width: '100%', '& input': { p: '2px 4px', textAlign: 'center', fontSize: '0.8rem' } }}
                        inputProps={{ min: 0 }}
                      />
                      <Typography sx={{ textAlign: 'right', fontWeight: 'bold', fontSize: '0.8rem' }}>
                        {resultado.toFixed(2)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Fila de VALES */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '60px 70px 60px',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                py: 0.25,
                px: 1,
                bgcolor: '#c8e6c9',
                borderRadius: 0.5,
              }}
            >
              <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'left' }}>VALES</Typography>
              <TextField
                type="number"
                value={valesModal}
                onChange={(e) => setValesModal(parseFloat(e.target.value) || 0)}
                size="small"
                sx={{ width: '100%', '& input': { p: '2px 4px', textAlign: 'center', fontSize: '0.8rem' } }}
                inputProps={{ min: 0, step: 0.01 }}
              />
              <Typography sx={{ textAlign: 'right', fontWeight: 'bold', fontSize: '0.85rem' }}>
                {valesModal.toFixed(2)}
              </Typography>
            </Box>

            {/* Total Retiro */}
            <Box sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                Total Retiro: ${totalRetiroModal.toFixed(2)}
              </Typography>
            </Box>

            {/* Observación */}
            <Box>
              <Typography sx={{ mb: 0.25, fontWeight: 'bold', fontSize: '0.85rem' }}>Observación:</Typography>
              <TextField
                fullWidth
                multiline
                rows={1}
                size="small"
                value={observacionModal}
                onChange={(e) => setObservacionModal(e.target.value)}
                placeholder="Ingrese observaciones..."
                sx={{ '& textarea': { p: '4px 8px', fontSize: '0.85rem' } }}
              />
            </Box>

            {/* Botones */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', pt: 0.5 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={guardarRetiroFondo}
                disabled={loading}
                size="small"
              >
                Guardar
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={cerrarModalRetiro}
                size="small"
              >
                Salir
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Modal de Último Retiro */}
      <Dialog
        open={modalUltimoRetiroAbierto}
        onClose={cerrarModalUltimoRetiro}
        maxWidth="sm"
        sx={{ zIndex: 1300 }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, maxHeight: '90vh' }}>
            {/* Encabezado */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', pb: 0.5 }}>
              <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                Módulo de Retiros del Corte
              </Typography>
              <IconButton onClick={cerrarModalUltimoRetiro} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Info del corte */}
            <Box sx={{ display: 'flex', justifyContent: 'space-around', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography sx={{ fontSize: '0.85rem' }}><strong>Caja:</strong> 1</Typography>
              <Typography sx={{ fontSize: '0.85rem' }}><strong>Corte:</strong> {ultimoCorte?.corte_maximo ?? "N/A"}</Typography>
              <Typography sx={{ fontSize: '0.85rem' }}><strong>Corte Parcial:</strong> {ultimoCorte?.corte_parcial_maximo ?? "N/A"}</Typography>
            </Box>

            {/* Denominaciones: billetes a la izquierda, monedas a la derecha */}
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                justifyContent: 'center',
                border: '2px solid #e9e9e9',
                borderRadius: 2,
                p: 1.5,
                bgcolor: '#ffffff',
                width: 'fit-content',
                mx: 'auto',
              }}
            >
              {/* Billetes */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 170 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center' }}>Billetes</Typography>
                {[1000, 500, 200, 100, 50, 20].map((d) => {
                  const cantidad = retirosUltimoModal[d] || 0;
                  const resultado = d * cantidad;
                  const esFila = [500, 100, 20].includes(d);
                  return (
                    <Box
                      key={d}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '60px 55px 55px',
                        alignItems: 'center',
                        gap: 0.5,
                        py: 0.25,
                        px: 0.75,
                        bgcolor: esFila ? 'grey.200' : 'transparent',
                        borderRadius: 0.5,
                      }}
                    >
                      <Typography sx={{ fontWeight: 'bold', fontSize: '0.8rem', textAlign: 'left' }}>
                        {formatDenominacion(d)} X
                      </Typography>
                      <TextField
                        type="number"
                        value={cantidad}
                        onChange={(e) => {
                          const valor = Math.max(0, parseInt(e.target.value) || 0);
                          setRetirosUltimoModal(prev => ({ ...prev, [d]: valor }));
                        }}
                        size="small"
                        sx={{ width: '100%', '& input': { p: '2px 4px', textAlign: 'center', fontSize: '0.8rem' } }}
                        inputProps={{ min: 0 }}
                      />
                      <Typography sx={{ textAlign: 'right', fontWeight: 'bold', fontSize: '0.8rem' }}>
                        {resultado.toFixed(2)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* Monedas */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 170 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center' }}>Monedas</Typography>
                {[10, 5, 2, 1, 0.5, 0.2, 0.1].map((d) => {
                  const cantidad = retirosUltimoModal[d] || 0;
                  const resultado = d * cantidad;
                  const esFila = [5, 1, 0.2, 0.1].includes(d);
                  return (
                    <Box
                      key={d}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '60px 55px 55px',
                        alignItems: 'center',
                        gap: 0.5,
                        py: 0.25,
                        px: 0.75,
                        bgcolor: esFila ? 'grey.200' : 'transparent',
                        borderRadius: 0.5,
                      }}
                    >
                      <Typography sx={{ fontWeight: 'bold', fontSize: '0.8rem', textAlign: 'left' }}>
                        {formatDenominacion(d)} X
                      </Typography>
                      <TextField
                        type="number"
                        value={cantidad}
                        onChange={(e) => {
                          const valor = Math.max(0, parseInt(e.target.value) || 0);
                          setRetirosUltimoModal(prev => ({ ...prev, [d]: valor }));
                        }}
                        size="small"
                        sx={{ width: '100%', '& input': { p: '2px 4px', textAlign: 'center', fontSize: '0.8rem' } }}
                        inputProps={{ min: 0 }}
                      />
                      <Typography sx={{ textAlign: 'right', fontWeight: 'bold', fontSize: '0.8rem' }}>
                        {resultado.toFixed(2)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Fila de VALES */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '60px 70px 60px',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                py: 0.25,
                px: 1,
                bgcolor: '#c8e6c9',
                borderRadius: 0.5,
              }}
            >
              <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'left' }}>VALES</Typography>
              <TextField
                type="number"
                value={valesUltimoModal}
                onChange={(e) => setValesUltimoModal(parseFloat(e.target.value) || 0)}
                size="small"
                sx={{ width: '100%', '& input': { p: '2px 4px', textAlign: 'center', fontSize: '0.8rem' } }}
                inputProps={{ min: 0, step: 0.01 }}
              />
              <Typography sx={{ textAlign: 'right', fontWeight: 'bold', fontSize: '0.85rem' }}>
                {valesUltimoModal.toFixed(2)}
              </Typography>
            </Box>

            {/* Total Retiro */}
            <Box sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                Total Retiro: ${totalUltimoRetiroModal.toFixed(2)}
              </Typography>
            </Box>

            {/* Observación */}
            <Box>
              <Typography sx={{ mb: 0.25, fontWeight: 'bold', fontSize: '0.85rem' }}>Observación:</Typography>
              <TextField
                fullWidth
                multiline
                rows={1}
                size="small"
                value={observacionUltimoModal}
                onChange={(e) => setObservacionUltimoModal(e.target.value)}
                placeholder="Ingrese observaciones..."
                sx={{ '& textarea': { p: '4px 8px', fontSize: '0.85rem' } }}
              />
            </Box>

            {/* Botones */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', pt: 0.5 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={guardarUltimoRetiro}
                disabled={loading}
                size="small"
              >
                Guardar
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={cerrarModalUltimoRetiro}
                size="small"
              >
                Salir
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
