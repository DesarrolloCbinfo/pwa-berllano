import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  MenuItem,
  FormControl,
  Select,
  CircularProgress,
  Checkbox,
  Alert,
  Snackbar,
  InputLabel
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Search as SearchIcon
} from '@mui/icons-material';

import useConsumoApi from '../../../hooks/useConsumoApi'; 

// --- Interfaces ---
interface Empleado {
  clave_empleado: string;
  NombreCompleto: string;
}

interface ScheduleRow {
  fecha: string; 
  dayName: string; 
  h1: string;
  h1c: string;
  h2c: string;
  h2: string;
  descanso: boolean;
}

const AsignacionHorarios: React.FC = () => {
  const { consumoApi } = useConsumoApi();

  // --- ESTADOS ---
  const [sucursalId, setSucursalId] = useState<string>("");
  
  // ESTE ES EL ESTADO IMPORTANTE QUE GUARDA EL ID DEL EMPLEADO SELECCIONADO
  const [empleado, setEmpleado] = useState(''); 
  
  const [listaEmpleados, setListaEmpleados] = useState<Empleado[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date()); 
  const [scheduleData, setScheduleData] = useState<ScheduleRow[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);
  const [replicating, setReplicating] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // --- Utilidades ---
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(date.setDate(diff));
  };

  const formatDateForApi = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // --------------------------------------------------------------------------------------
  // 1. CARGA DE EMPLEADOS (Filtro por Sucursal)
  // --------------------------------------------------------------------------------------
  const fetchEmpleados = async () => {
    if(!sucursalId) return;

    setLoadingEmpleados(true);
    setListaEmpleados([]); 
    setEmpleado(''); // Reseteamos el empleado al cambiar de sucursal
    
    try {
      const response = await consumoApi.get(`/api/CatNominaEmpleadosHorarios/sp_bw_cat_asig_hora_lista_emple`, {
        params: { sucursal: parseInt(sucursalId) }
      });

      if(response.data.length === 0) {
        setMessage({ text: 'No se encontraron empleados en esta sucursal', type: 'error' });
      } else {
        setListaEmpleados(response.data);
        setMessage({ text: `Se encontraron ${response.data.length} empleados`, type: 'success' });
      }
    } catch (error) {
      console.error("Error cargando empleados", error);
      setMessage({ text: 'Error de conexión', type: 'error' });
    } finally {
        setLoadingEmpleados(false);
    }
  };

  useEffect(() => {
    fetchEmpleados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


 // --------------------------------------------------------------------------------------
  // 2. GET: CARGAR GRID (CORREGIDO PARA EVITAR PARPADEO)
  // --------------------------------------------------------------------------------------
  const fetchHorarios = useCallback(async () => {
    // Si no hay empleado seleccionado, no hacemos nada
    if (!empleado) return; 

    setLoading(true);
    try {
      const lunes = getMonday(currentWeek);
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);

      const response = await consumoApi.get('/api/CatNominaEmpleadosHorarios/sp_bw_cat_asig_hora_formulario', {
        params: {
          clave_empleado: empleado,
          fecha_inicio: formatDateForApi(lunes),
          fecha_fin: formatDateForApi(domingo)
        }
      });

      const dataMapeada = response.data.map((item: any) => {
        const fechaObj = new Date(item.fecha);
        const diaNombre = fechaObj.toLocaleDateString('es-ES', { weekday: 'long' });
        const diaCapitalizado = diaNombre.charAt(0).toUpperCase() + diaNombre.slice(1);

        return {
          fecha: item.fecha,
          dayName: diaCapitalizado,
          h1: item.H1 || '',
          h1c: item.H1C || '',
          h2c: item.H2C || '',
          h2: item.H2 || '',
          descanso: item.descanso 
        };
      });
      setScheduleData(dataMapeada);
    } catch (error) {
      console.error("Error cargando horarios", error);
    } finally {
      setLoading(false);
    }
    // NOTA: Quitamos 'consumoApi' de aquí abajo para evitar el bucle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empleado, currentWeek]); 

  // Este efecto hace que al seleccionar algo en el Combo, se cargue el Grid solo
  useEffect(() => {
    fetchHorarios();
    // NOTA: Quitamos 'fetchHorarios' de aquí y ponemos explícitamente las variables
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empleado, currentWeek]);

  // --------------------------------------------------------------------------------------
  // 3. PUT: GUARDAR FILA (Aquí se pasa el ID seleccionado)
  // --------------------------------------------------------------------------------------
  const handleSaveRow = async (row: ScheduleRow) => {
    if (!empleado) return;

    try {
      await consumoApi.put('/api/CatNominaEmpleadosHorarios/sp_bw_cat_asig_hora_formulario_upd', null, {
        params: {
          clave_empleado: empleado, // <--- AQUI SE PASA EL ID AL PUT (UPDATE)
          fecha: row.fecha.split('T')[0],
          H1: row.h1,
          H1C: row.h1c,
          H2C: row.h2c,
          H2: row.h2,
          descanso: row.descanso,
          Usuario: 'WEB_TESTER',
          Sucursal: parseInt(sucursalId)
        }
      });
      // Opcional: Feedback visual
    } catch (error) {
      setMessage({ text: 'Error al guardar cambio', type: 'error' });
    }
  };


 // --------------------------------------------------------------------------------------
  // 5. REPLICAR HORARIOS (Modificado para esperar mucho tiempo)
  // --------------------------------------------------------------------------------------
  const handleReplicar = async () => {
    if (!empleado) return;
    if (!window.confirm("¿Copiar esta semana a la siguiente? Se sobrescribirán los datos futuros.")) return;

    setReplicating(true);
    try {
      const lunes = getMonday(currentWeek);
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);

      // --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE ---
      await consumoApi.post('/api/CatNominaEmpleadosHorarios/sp_bw_cat_asig_hora_reg_horarios', null, {
        params: {
          EMPLEADO: empleado,
          F1: formatDateForApi(lunes),
          F2: formatDateForApi(domingo)
        },
        // timeout: 0 significa "sin limite", pero es mejor poner un numero alto (ms)
        // 600000 ms = 600 segundos = 10 minutos.
        // Esto le dice a Axios: "No canceles la petición aunque tarde mucho".
        timeout: 600000 
      });
      // --------------------------------------

      setMessage({ text: 'Horarios replicados correctamente', type: 'success' });
      handleNextWeek(); 
    } catch (error: any) { // Tipamos el error para leerlo mejor
      console.error("Error replicando:", error);
      
      // Si el error es por timeout, el mensaje suele ser "timeout of ... exceeded"
      if (error.code === 'ECONNABORTED') {
         setMessage({ text: 'El proceso tardó demasiado y se cortó la conexión (Timeout en Front)', type: 'error' });
      } else {
         setMessage({ text: 'Error al replicar horarios', type: 'error' });
      }
    } finally {
      setReplicating(false);
    }
  };

  // --- Funciones Varias de UI ---
  const handlePreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const handleNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  const getWeekRangeDisplay = () => {
    const startOfWeek = getMonday(currentWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return `${startOfWeek.toLocaleDateString('es-ES')} - ${endOfWeek.toLocaleDateString('es-ES')}`;
  };

  const handleInputChange = (index: number, field: keyof ScheduleRow, value: any) => {
    const newData = [...scheduleData];
    // @ts-ignore 
    newData[index][field] = value;
    setScheduleData(newData);
  };


  // --- RENDER ---
  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      
      <Snackbar open={!!message} autoHideDuration={4000} onClose={() => setMessage(null)}>
        <Alert severity={message?.type} onClose={() => setMessage(null)}>{message?.text}</Alert>
      </Snackbar>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Asignación de Horarios
        </Typography>

        {/* FILTRO SUCURSAL */}
        <Box sx={{ mb: 3, p: 2, border: '1px dashed orange', borderRadius: 2, backgroundColor: '#fff8e1' }}>
            <Typography variant="caption" sx={{ color: 'orange', fontWeight: 'bold' }}>FILTRO SUCURSAL</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <TextField 
                    label="ID Sucursal" 
                    type="number" 
                    size="small" 
                    value={sucursalId}
                    onChange={(e) => setSucursalId(e.target.value)}
                    sx={{ width: 150, backgroundColor: 'white' }}
                />
                <Button 
                    variant="contained" 
                    color="warning" 
                    onClick={fetchEmpleados} 
                    disabled={loadingEmpleados}
                    startIcon={loadingEmpleados ? <CircularProgress size={20} color="inherit"/> : <SearchIcon />}
                >
                    {loadingEmpleados ? 'Cargando...' : 'Buscar'}
                </Button>
            </Box>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'center', mb: 3 }}>
          
          {/* SELECT EMPLEADO: AQUÍ SE SELECCIONA Y SE GUARDA EN EL ESTADO 'empleado' */}
          <Box sx={{ flex: { xs: 1, md: 0.4 }, width: '100%' }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
              Empleado:
            </Typography>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="select-emp-label">Seleccione Empleado</InputLabel>
              <Select
                labelId="select-emp-label"
                value={empleado}
                label="Seleccione Empleado"
                onChange={(e) => setEmpleado(e.target.value)} // <--- ESTO ACTUALIZA EL ESTADO GLOBAL
                disabled={loadingEmpleados || listaEmpleados.length === 0}
              >
                <MenuItem value="">
                    <em>{listaEmpleados.length === 0 ? '-- Sin empleados --' : '-- Seleccione --'}</em>
                </MenuItem>
                {listaEmpleados.map((emp) => (
                  <MenuItem key={emp.clave_empleado} value={emp.clave_empleado}>
                    {emp.NombreCompleto}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          {/* NAVEGACIÓN SEMANAL */}
          <Box sx={{ flex: { xs: 1, md: 0.6 }, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <IconButton 
              onClick={handlePreviousWeek}
              disabled={loading}
              sx={{ backgroundColor: '#1976d2', color: 'white', '&:hover': { backgroundColor: '#1565c0' } }}
            >
              <ArrowBackIcon />
            </IconButton>
            
            <Typography variant="h6" sx={{ fontWeight: 'medium', minWidth: 200, textAlign: 'center' }}>
              Semana: {getWeekRangeDisplay()}
            </Typography>
            
            <IconButton 
              onClick={handleNextWeek}
              disabled={loading}
              sx={{ backgroundColor: '#1976d2', color: 'white', '&:hover': { backgroundColor: '#1565c0' } }}
            >
              <ArrowForwardIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* GRID DE HORARIOS */}
      <Paper sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Día</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>H1</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>H1C</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>H2C</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>H2</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Descanso</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scheduleData.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center">Seleccione un empleado para ver horarios</TableCell></TableRow>
                ) : (
                  scheduleData.map((row, index) => (
                    <TableRow key={row.fecha} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
                      
                      <TableCell sx={{ fontWeight: 'medium', textAlign: 'center' }}>
                        {row.dayName} <br/>
                        <Typography variant="caption" color="textSecondary">
                            {new Date(row.fecha).toLocaleDateString()}
                        </Typography>
                      </TableCell>

                      {['h1', 'h1c', 'h2c', 'h2'].map((field) => (
                        <TableCell key={field} sx={{ textAlign: 'center' }}>
                          <TextField
                            variant="outlined"
                            size="small"
                            fullWidth
                            placeholder="HH:MM"
                            value={row[field as keyof ScheduleRow]}
                            onChange={(e) => handleInputChange(index, field as keyof ScheduleRow, e.target.value)}
                            onBlur={() => handleSaveRow(row)} // GUARDA AL SALIR DEL INPUT
                          />
                        </TableCell>
                      ))}

                      <TableCell sx={{ textAlign: 'center' }}>
                        <Checkbox 
                            checked={row.descanso}
                            onChange={(e) => {
                                handleInputChange(index, 'descanso', e.target.checked);
                                const updatedRow = { ...row, descanso: e.target.checked };
                                handleSaveRow(updatedRow); // GUARDA AL CAMBIAR CHECKBOX
                            }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            sx={{ px: 3, py: 1 }}
            onClick={handleReplicar}
            disabled={replicating || !empleado}
          >
            {replicating ? 'Replicando...' : 'Replicar Horarios'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AsignacionHorarios;