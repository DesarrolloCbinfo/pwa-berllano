'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  GridPaginationModel,
  GridRowParams,
  DataGrid,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  RestoreFromTrash as RestoreIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Checkbox,
  Tooltip,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material';

import useConsumoApi from '../../../hooks/useConsumoApi';
import { IUsuario } from '../../../interfaces/IUsuario';
import { useSessionContext } from '../../../context/SessionProvider'; // <--- Importamos la sesión

// --- ESTILOS BERLLANO ELEGANTE ---
const commonProps = {
  fullWidth: true,
  size: 'small' as const,
  variant: 'outlined' as const,
  sx: {
    '& .MuiInputBase-root': {
      height: '50px',
      alignItems: 'center',
      borderRadius: '12px', // Más redondeado
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      '&:hover': {
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        borderColor: '#999',
      },
    },
    '& .MuiInputLabel-root': {
      transform: 'translate(14px, 14px) scale(1)',
      color: '#666',
      fontWeight: 500,
    },
    '& .MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)',
      color: '#333',
      fontWeight: 600,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#e0e0e0',
      borderWidth: '1.5px',
    },
  },
};

// --- INTERFACES ---
interface TrabajadorRow extends IUsuario {
  id: string;
  TotalRegistros?: number;
}

const initialFormState: Partial<IUsuario> = {
  id: '',
  claveEmpleado: '',
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  idPuesto: 0,
  rfc: '',
  imss: '',
  fecha_alta: '',
  fecha_baja: '',
  status: 1,
  email: '',
  telefono1: '',
  idDepartamento: 0,
  curp: '',
  domicilio: '',
  colonia: '',
  poblacion: '',
  estado: '',
  lugarNacimiento: '',
  codigoPostal: '',
  telefono2: '',
  sexo: '',
  fechaNacimiento: '',
  nivelEscolaridad: 0,
  escolaridadConcluido: '',
  estadoCivil: 0,
  motivoBajaEspecificacion: '',
  clavePerfil: 0,
  password: '',
  confianza: 0,
  salarioActual: 0,
  num_tc: '',
  num_clabe: '',
  num_cuenta: '',
};

// Error Boundary para manejar errores de React
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ hasError: true, error });
    console.error('Error en CatTrabajadores:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant='h6' color='error' gutterBottom>
            Ha ocurrido un error inesperado
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            {this.state.error && this.state.error.toString()}
          </Typography>
          <Button
            variant='contained'
            onClick={() => this.setState({ hasError: false, error: null })}
            sx={{ mt: 2 }}
          >
            Recargar página
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

function CatTrabajadoresWrapper() {
  return (
    <ErrorBoundary>
      <CatTrabajadores />
    </ErrorBoundary>
  );
}

export default function CatTrabajadores() {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext(); // <--- Extraemos la sesión

  // --- ESTADOS ---
  const [rows, setRows] = useState<TrabajadorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [viewData, setViewData] = useState<TrabajadorRow | null>(null);
  const [activeViewTab, setActiveViewTab] = useState(0);
  const [activeEditTab, setActiveEditTab] = useState(0);
  const [statusOptions, setStatusOptions] = useState<
    Array<{ clave_status: number; descripcion: string }>
  >([]);
  const [puestosOptions, setPuestosOptions] = useState<
    Array<{ clave_puesto: number; descripcion_puesto: string }>
  >([]);
  const [formasPagoOptions, setFormasPagoOptions] = useState<
    Array<{ clave_forma_pago: number; descripcion_forma_pago: string }>
  >([]);
  const [estadosCivilesOptions, setEstadosCivilesOptions] = useState<
    Array<{ id: number; descripcion: string }>
  >([]);
  const [nivelesEscolaridad, setNivelesEscolaridad] = useState<
    Array<{ clave_nivel: number; descripcion_escolaridad: string }>
  >([]);
  const [escolaridadConcluidoOptions, setEscolaridadConcluidoOptions] = useState<
    Array<{ id: number; descripcion: string }>
  >([]);
  const [motivosBajaOptions, setMotivosBajaOptions] = useState<
    Array<{ descripcion: string }>
  >([]);
  const [departamentosOptions, setDepartamentos] = useState<
    Array<{ clave_departamento: number; descripcion_departamento: string }>
  >([]);
  const [message, setMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- ESTADOS DE EDICIÓN ---
  const [editClaveEmpleado, setEditClaveEmpleado] = useState('');
  const [editStatus, setEditStatus] = useState(1);
  const [editNombre, setEditNombre] = useState('');
  const [editApellidoPaterno, setEditApellidoPaterno] = useState('');
  const [editApellidoMaterno, setEditApellidoMaterno] = useState('');
  const [editClavePuesto, setEditClavePuesto] = useState(0);
  const [editRFC, setEditRFC] = useState('');
  const [editIMSS, setEditIMSS] = useState('');
  const [editClaveDepartamento, setEditClaveDepartamento] = useState(0);
  const [editFechaAlta, setEditFechaAlta] = useState('');
  const [editFechaNacimiento, setEditFechaNacimiento] = useState('');
  const [editLugarNacimiento, setEditLugarNacimiento] = useState('');
  const [editNivelEscolaridad, setEditNivelEscolaridad] = useState(1);
  const [editEscolaridadConcluido, setEditEscolaridadConcluido] = useState('');
  const [editSexo, setEditSexo] = useState('');
  const [editEstadoCivil, setEditEstadoCivil] = useState(1);
  const [editSalarioActual, setEditSalarioActual] = useState(0);
  const [editDomicilio, setEditDomicilio] = useState('');
  const [editColonia, setEditColonia] = useState('');
  const [editPoblacion, setEditPoblacion] = useState('');
  const [editEstado, setEditEstado] = useState('');
  const [editCodigoPostal, setEditCodigoPostal] = useState('');
  const [editTelefono1, setEditTelefono1] = useState('');
  const [editTelefono2, setEditTelefono2] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editContraseña, setEditContraseña] = useState('');
  const [editCURP, setEditCURP] = useState('');
  const [editConfianza, setEditConfianza] = useState(false);
  const [editClaveFormaPago, setEditClaveFormaPago] = useState(1);
  const [editNumTC, setEditNumTC] = useState('');
  const [editNumClabe, setEditNumClabe] = useState('');
  const [editNumCuenta, setEditNumCuenta] = useState('');
  const [editNumCuentaTarjeta, setEditNumCuentaTarjeta] = useState('');
  const [editRecontratable, setEditRecontratable] = useState(0);
  const [editReingreso, setEditReingreso] = useState(false);
  const [editMotivoBaja, setEditMotivoBaja] = useState('');
  const [editFechaBaja, setEditFechaBaja] = useState('');
  const [openEdit, setOpenEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');
  const [openValidationError, setOpenValidationError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- PAGINACIÓN ---
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  // --- FILTRADO ---
  const filteredRows = rows.filter(
    (row) =>
      row.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.claveEmpleado.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // --- FUNCIONES AUXILIARES ---
  // Función para obtener status desde el API
  const fetchStatus = async () => {
    try {
      const response = await consumoApi.get('/api/CatTrabajadores/sp_bw_cat_nomina_status_sel');
      setStatusOptions(response.data || []);
    } catch (error) {
      console.error('Error al obtener status:', error);
      // Valores por defecto si falla el API
    }
  };

  // Función para mapear status numérico a texto (usando datos del API)
  const getStatusText = (status: number | undefined): string => {
    if (status === undefined || status === null) return 'DESCONOCIDO';
    const statusOption = statusOptions.find(option => option.clave_status === status);
    return statusOption?.descripcion || 'DESCONOCIDO';
  };

  // Función para convertir texto de status a número (usando datos del API)
  const getStatusNumber = (status: string | undefined): number => {
    if (!status) return 1; // Por defecto ALTA si no hay status
    const statusOption = statusOptions.find(option => option.descripcion === status);
    return statusOption?.clave_status || 1;
  };

  // Función para formatear fechas de ISO a DD/MM/YYYY (para visualización)
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  };

  // Función para formatear fechas de ISO a YYYY-MM-DD (para inputs type="date")
  const formatDateForInput = (
    dateString: string | null | undefined,
  ): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      // Validate that the date is valid
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  // Función para transformar datos del API al formato de la tabla
  const transformEmpleadoToRow = (
    empleado: any,
    index: number,
  ): TrabajadorRow => {
   
    return {
      id: String(index),
      claveEmpleado: empleado.clave_empleado || '',
      nombre: empleado.nombre || '',
      apellido_paterno: empleado.apellido_paterno || '',
      apellido_materno: empleado.apellido_materno || '',
      idPuesto: empleado.clave_puesto || 0,
      status: typeof empleado.status === 'string' ? getStatusNumber(empleado.status) : (empleado.status !== undefined && empleado.status !== null ? empleado.status : 1),
      rfc: empleado.RFC || '',
      imss: empleado.imss || '',
      sucursal: empleado.clave_departamento || 0,
      fecha_alta: formatDateForInput(empleado.fecha_alta),
      fecha_baja: formatDateForInput(empleado.fecha_baja),
      email: empleado.email || '',
      telefono1: empleado.telefono1 || '',
      idDepartamento: empleado.clave_departamento || 0,
      curp: empleado.CURP || '',
      domicilio: empleado.domicilio || '',
      colonia: empleado.colonia || '',
      poblacion: empleado.poblacion || '',
      estado: empleado.estado || '',
      lugarNacimiento: empleado.lugar_nacimiento || '',
      codigoPostal: empleado.codigo_postal || '',
      telefono2: empleado.telefono2 || '',
      sexo: empleado.sexo || '',
      fechaNacimiento: formatDateForInput(empleado.fecha_nacimiento),
      nivelEscolaridad: empleado.nivel_escolaridad || 0,
      escolaridadConcluido: empleado.escolaridad_concluido || '',
      estadoCivil: empleado.estado_civil || 0,
      motivoBajaEspecificacion: empleado.motivo_baja || '',
      clavePerfil: empleado.clave_forma_pago || 0,
      password: empleado.contraseña || '',
      observaciones: empleado.descripcion_puesto || '',
      confianza: empleado.confianza ? 1 : 0,
      recontratable: empleado.recontratable || 0,
      salarioActual: empleado.salario_actual || 0,
      num_tc: empleado.num_tc || '',
      num_clabe: empleado.num_clabe || '',
      num_cuenta: empleado.num_cuenta || '',
    };
  };

  // --- CARGAS DE DATOS ---
  const fetchStatusOptions = async () => {
    try {
      const response = await consumoApi.get('/api/CatTrabajadores/sp_bw_cat_nomina_status_sel');
      setStatusOptions(response.data || []);
    } catch (error) {
      console.error('Error al obtener status:', error);
      // Valores por defecto si falla el API
      setStatusOptions([
        { clave_status: 1, descripcion: 'ALTA' },
        { clave_status: 2, descripcion: 'BAJA' },
        { clave_status: 3, descripcion: 'REINGRESO' }
      ]);
    }
  };

  const fetchPuestosOptions = async () => {
    try {
      const response = await consumoApi.get('/api/CatTrabajadores/sp_bw_cat_nomina_puestos_sel');
      setPuestosOptions(response.data || []);
    } catch (error) {
      console.error('Error al obtener puestos:', error);
    }
  };

  const fetchFormasPagoOptions = async () => {
    try {
      const response = await consumoApi.get('/api/CatTrabajadores/sp_bw_cat_nomina_forma_pago_sel');
      setFormasPagoOptions(response.data || []);
    } catch (error) {
      console.error('Error al obtener formas de pago:', error);
    }
  };

  const fetchEstadosCivilesOptions = async () => {
    try {
      const response = await consumoApi.get('/api/CatTrabajadores/sp_bw_cat_nomina_edo_civil_sel');
      setEstadosCivilesOptions(response.data || []);
    } catch (error) {
      console.error('Error al obtener estados civiles:', error);
    }
  };

  const fetchTrabajadores = async () => {
    try {
      setLoading(true);
      const response = await consumoApi.get(
        '/api/CatTrabajadores/sp_bw_cat_nomina_trabajadores_sel',
        {
          params: {
            clave_trabajador: 0
          }
        }
      );
      
      console.log('Datos del API:', response.data); // ← AGREGAR ESTE LOG
      
      const data = response.data.map((empleado: any, index: number) => 
        transformEmpleadoToRow(empleado, index)
      );
      
      setRows(data);
      setRowCount(data.length);
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : 'Error desconocido',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNivelesEscolaridad = async () => {
    try {
      const response = await consumoApi.get('/api/CatTrabajadores/sp_bw_cat_nomina_niveles_escolaridad_sel');
      setNivelesEscolaridad(response.data || []);
    } catch (error) {
      console.error('Error al obtener niveles de escolaridad:', error);
    }
  };

  const fetchEscolaridadConcluida = async () => {
    try {
      const response = await consumoApi.get('/api/CatTrabajadores/sp_bw_cat_nomina_escolaridad_sel');
      setEscolaridadConcluidoOptions(response.data || []);
    } catch (error) {
      console.error('Error al obtener escolaridad concluida:', error);
    }
  };

  const fetchDepartamentos = async () => {
    try {
      const response = await consumoApi.get('/api/CatTrabajadores/sp_bw_cat_nomina_departamentos_sel');
      setDepartamentos(response.data || []);
    } catch (error) {
      console.error('Error al obtener departamentos:', error);
    }
  };

  const fetchMotivosBaja = async () => {
    try {
      const response = await consumoApi.get('/api/CatTrabajadores/sp_bw_cat_nomina_motivo_baja_sel');
      setMotivosBajaOptions(response.data || []);
    } catch (error) {
      console.error('Error al obtener motivos de baja:', error);
    }
  };

  const fetchactivarTrabajador = async (clave) => {
    try {
      const response = await consumoApi.post(
        '/api/CatTrabajadores/sp_bw_activar_empleado',
        {}, // Cuerpo vacío según tu curl -d ''
        {
          params: {
            clave_empleado: clave
          }
        }
      );

      // Recargas la lista para ver que ahora aparece como activo
      fetchTrabajadores();
    } catch (error) {
      console.error('Error al activar trabajador:', error);
      alert('Error al activar trabajador');
    }
  };

  const fetchdesactivarTrabajador = async (clave: string) => {
    try {
      const response = await consumoApi.post(
        '/api/CatTrabajadores/sp_bw_desactiva_empleado',
        {}, // Cuerpo vacío según tu curl -d ''
        {
          params: {
            clave_empleado: clave
          }
        }
      );

      fetchTrabajadores();
    } catch (error) {
      console.error('Error al desactivar trabajador:', error);
      alert('Error al desactivar trabajador');
    }
  };

  useEffect(() => {
    fetchTrabajadores();
    fetchStatusOptions();
    fetchPuestosOptions();
    fetchFormasPagoOptions();
    fetchEstadosCivilesOptions();
    fetchNivelesEscolaridad();
    fetchEscolaridadConcluida();
    fetchMotivosBaja();
    fetchDepartamentos();
  }, []);

  // --- ACCIONES DEL MODAL ---
  const handleOpenCreate = () => {
    document.activeElement?.blur();
    console.log('Abriendo diálogo de agregar - initialFormState:', initialFormState);
    setFormData(initialFormState);
    setIsEditing(false);
    setOpenEdit(true);
  };

  const handleOpenEdit = async (trabajador) => {
    try {
      // Obtener datos completos y actualizados del trabajador desde la API
      const response = await consumoApi.get('/api/CatTrabajadores/sp_bw_cat_nomina_trabajadores_sel', {
        params: {
          clave_trabajador: trabajador.claveEmpleado
        }
      });
      
      const trabajadorCompleto = response.data.find(t => t.clave_empleado === trabajador.claveEmpleado);
      
      if (!trabajadorCompleto) {
        console.error('No se encontró el trabajador en la respuesta de la API');
        throw new Error('Trabajador no encontrado');
      }
      
      setFormData({
        claveEmpleado: trabajadorCompleto.claveEmpleado || trabajador.claveEmpleado || '',
        nombre: trabajadorCompleto.nombre || trabajador.nombre || '',
        apellido_paterno: trabajadorCompleto.apellido_paterno || trabajador.apellido_paterno || '',
        apellido_materno: trabajadorCompleto.apellido_materno || trabajador.apellido_materno || '',
        idPuesto: trabajadorCompleto.idPuesto || trabajador.idPuesto || 0,
        status: trabajadorCompleto.status || trabajador.status || 1,
        rfc: trabajadorCompleto.rfc || trabajador.rfc || '',
        imss: trabajadorCompleto.imss || trabajador.imss || '',
        idDepartamento: trabajadorCompleto.idDepartamento || trabajador.idDepartamento || 0,
        fecha_alta: trabajadorCompleto.fecha_alta || trabajador.fecha_alta || '',
        fecha_baja: trabajadorCompleto.fecha_baja || trabajador.fecha_baja || '',
        email: trabajadorCompleto.email || trabajador.email || '',
        telefono1: trabajadorCompleto.telefono1 || trabajador.telefono1 || '',
        telefono2: trabajadorCompleto.telefono2 || trabajador.telefono2 || '',
        sexo: trabajadorCompleto.sexo || trabajador.sexo || '',
        curp: trabajadorCompleto.curp || trabajador.curp || '',
        domicilio: trabajadorCompleto.domicilio || trabajador.domicilio || '',
        colonia: trabajadorCompleto.colonia || trabajador.colonia || '',
        poblacion: trabajadorCompleto.poblacion || trabajador.poblacion || '',
        estado: trabajadorCompleto.estado || trabajador.estado || '',
        codigoPostal: trabajadorCompleto.codigoPostal || trabajador.codigoPostal || '',
        lugarNacimiento: trabajadorCompleto.lugarNacimiento || trabajador.lugarNacimiento || '',
        fechaNacimiento: trabajadorCompleto.fechaNacimiento || trabajador.fechaNacimiento || '',
        nivelEscolaridad: trabajadorCompleto.nivelEscolaridad || trabajador.nivelEscolaridad || 1,
        escolaridad_concluido: trabajadorCompleto.escolaridad_concluido || trabajador.escolaridad_concluido || '1',
        estadoCivil: trabajadorCompleto.estadoCivil || trabajador.estadoCivil || 1,
        motivoBajaEspecificacion: trabajadorCompleto.motivo_baja === 'string' ? '' : (trabajadorCompleto.motivo_baja || ''),
        clavePerfil: trabajadorCompleto.clavePerfil || trabajador.clavePerfil || 1,
        password: trabajadorCompleto.password || trabajador.password || '',
        observaciones: trabajadorCompleto.observaciones || trabajador.observaciones || '',
        confianza: trabajadorCompleto.confianza ? 1 : 0,
        recontratable: trabajadorCompleto.recontratable || trabajador.recontratable || 0,
        salarioActual: trabajadorCompleto.salarioActual || trabajador.salarioActual || 0,
        num_tc: trabajadorCompleto.num_tc || trabajador.num_tc || '',
        num_clabe: trabajadorCompleto.num_clabe || trabajador.num_clabe || '',
        num_cuenta: trabajadorCompleto.num_cuenta || trabajador.num_cuenta || '',
      });
      
      console.log('=== VERIFICACIÓN FINAL ===');
      console.log('FormData final con datos de API:', {
        motivoBajaEspecificacion: trabajadorCompleto.motivo_baja || ''
      });
      console.log('Valor que se asignará a formData.motivoBajaEspecificacion:', trabajadorCompleto.motivo_baja || '');
      
    } catch (error) {
      console.error('Error al obtener datos completos del trabajador:', error);
      // Si falla, usar los datos del DataGrid como fallback
      setFormData({
        claveEmpleado: trabajador.claveEmpleado || '',
        nombre: trabajador.nombre || '',
        apellido_paterno: trabajador.apellido_paterno || '',
        apellido_materno: trabajador.apellido_materno || '',
        idPuesto: trabajador.idPuesto || 0,
        status: trabajador.status || 1,
        rfc: trabajador.rfc || '',
        imss: trabajador.imss || '',
        idDepartamento: trabajador.idDepartamento || 0,
        fecha_alta: trabajador.fecha_alta || '',
        fecha_baja: trabajador.fecha_baja || '',
        email: trabajador.email || '',
        telefono1: trabajador.telefono1 || '',
        telefono2: trabajador.telefono2 || '',
        sexo: trabajador.sexo || '',
        curp: trabajador.curp || '',
        domicilio: trabajador.domicilio || '',
        colonia: trabajador.colonia || '',
        poblacion: trabajador.poblacion || '',
        estado: trabajador.estado || '',
        codigoPostal: trabajador.codigoPostal || '',
        lugarNacimiento: trabajador.lugarNacimiento || '',
        fechaNacimiento: trabajador.fechaNacimiento || '',
        nivelEscolaridad: trabajador.nivelEscolaridad || 1,
        escolaridad_concluido: trabajador.escolaridad_concluido || '1',
        estadoCivil: trabajador.estadoCivil || 1,
        motivoBajaEspecificacion: trabajador.motivoBajaEspecificacion || '',
        clavePerfil: trabajador.clavePerfil || 1,
        password: trabajador.password || '',
        observaciones: trabajador.observaciones || '',
        confianza: trabajador.confianza ? 1 : 0,
        recontratable: trabajador.recontratable || 0,
        salarioActual: trabajador.salarioActual || 0,
        num_tc: trabajador.num_tc || '',
        num_clabe: trabajador.num_clabe || '',
        num_cuenta: trabajador.num_cuenta || '',
      });
    }
  
  setIsEditing(true);
  setOpenEdit(true);
};

  const handleOpenView = (row: TrabajadorRow) => {
    document.activeElement?.blur();
    setViewData(row);
    setOpenViewModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData(initialFormState);
  };

  const handleCloseViewModal = () => {
    setOpenViewModal(false);
    setViewData(null);
  };

  // Helper para obtener descripción del departamento por clave
  const getNombreDepartamento = (clave: number): string => {
    const dpto = departamentosOptions.find(
      (d) => d.clave_departamento === clave,
    );
    return dpto ? dpto.descripcion_departamento : String(clave);
  };

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent<any>,
  ) => {
    const target = e.target;
    const { name, value, checked, type } = target;
    
    // Para inputs de fecha, convertir el valor al formato correcto YYYY-MM-DD
    const processedValue =
      type === 'date' && value ? formatDateForInput(value as string) : value;

    const newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : processedValue,
    };
    
    setFormData(newFormData);
  };

  const saveTrabajador = async () => {
    setSaving(true);

    // Validar campos requeridos antes de enviar
    if (!formData.nombre || formData.nombre.trim() === '') {
      setMessage({ text: 'El nombre es requerido', type: 'error' });
      setSaving(false);
      return;
    }
    if (!formData.apellido_paterno || formData.apellido_paterno.trim() === '') {
      setMessage({ text: 'El apellido paterno es requerido', type: 'error' });
      setSaving(false);
      return;
    }
    if (!formData.claveEmpleado || formData.claveEmpleado.trim() === '') {
      setMessage({ text: 'La clave de empleado es requerida', type: 'error' });
      setSaving(false);
      return;
    }

    const datosParaEnviar = {
      // Eliminamos el campo model ya que el ejemplo de agregar no lo usa
      clave_empleado: formData.claveEmpleado,
      status: formData.status,
      nombre: formData.nombre,
      apellido_paterno: formData.apellido_paterno,
      apellido_materno: formData.apellido_materno,
      clave_puesto: formData.idPuesto,
      rfc: formData.rfc, // minúscula como en el ejemplo
      imss: formData.imss, // minúscula como en el ejemplo
      clave_departamento: formData.idDepartamento,
      fecha_alta: formData.fecha_alta ? new Date(formData.fecha_alta).toISOString() : new Date().toISOString(), // Convertir a DATETIME
      fecha_baja: formData.fecha_baja ? new Date(formData.fecha_baja).toISOString() : null,
      fecha_nacimiento: formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toISOString() : new Date().toISOString(), // Fecha actual si está vacío
      lugar_nacimiento: formData.lugarNacimiento,
      nivel_escolaridad: formData.nivelEscolaridad,
      escolaridad_concluido: formData.escolaridad_concluido,
      sexo: formData.sexo || 'M',
      estado_civil: formData.estadoCivil,
      salario_actual: formData.salarioActual,
      domicilio: formData.domicilio,
      colonia: formData.colonia,
      poblacion: formData.poblacion,
      estado: formData.estado,
      codigo_postal: formData.codigoPostal,
      telefono1: formData.telefono1,
      telefono2: formData.telefono2,
      email: formData.email,
      curp: formData.curp, // minúscula como en el ejemplo
      contraseña: formData.password || (isEditing ? undefined : ''), // En edición, si está vacío no modificar
      confianza: Boolean(formData.confianza), // Convertir number (0/1) a boolean para API Update
      motivo_baja: formData.motivoBajaEspecificacion || null,
      clave_forma_pago: formData.clavePerfil,
      num_cuenta: (formData.num_cuenta || '').trim(),
      num_clabe: formData.num_clabe,
      recontratable: formData.recontratable || 0
    };

    try {
      const response = isEditing 
        ? await consumoApi.put(
            '/api/CatTrabajadores/sp_bw_cat_nomina_trabajadores_upd',
            datosParaEnviar 
          )
        : await consumoApi.post(
            '/api/CatTrabajadores/sp_bw_cat_nomina_trabajadores_add',
            datosParaEnviar 
          );

      console.log('Respuesta completa del backend:', response.data);
      console.log('Headers:', response.headers);
      console.log('Longitud de la respuesta:', response.data?.length);
      
      

      // 2. Validación de respuesta según el formato de tu SP
      if (response.data?.[0]?.codigo === 0) {
        
        const trabajadorActualizado = response.data[0];
        console.log('Usando datos actualizados del stored procedure:', trabajadorActualizado);
        
       
        if (trabajadorActualizado.password) {
          console.log('Contraseña actualizada en frontend:', trabajadorActualizado.password);
    
        }
        
        await fetchTrabajadores(); 
        setOpenEdit(false);     
        setMessage({ text: isEditing ? 'Trabajador actualizado exitosamente' : 'Trabajador agregado exitosamente', type: 'success' });
      } else {
        setMessage({ text: response.data?.[0]?.mensaje1 || 'Error al actualizar trabajador', type: 'error' });
      }
    } catch (err) {
      console.error('Error al actualizar trabajador:', err);
      
      // Mostrar detalles del error 400 si está disponible
      if (err.response) {
        console.log('Error response data:', err.response.dconsoleata);
        console.log('Error response headers:', err.response.headers);
        
        // Mostrar errores de validación específicos
        if (err.response.data?.errors) {
          console.log('Validation errors object:', err.response.data.errors);
          console.log('Keys in errors:', Object.keys(err.response.data.errors));
          
          const errors = err.response.data.errors;
          let errorMessages = [];
          
          // Intentar diferentes formatos de errores
          if (typeof errors === 'object') {
            for (const [key, value] of Object.entries(errors)) {
              console.log(`Error key: ${key}, value:`, value);
              if (Array.isArray(value)) {
                errorMessages.push(...value);
              } else {
                errorMessages.push(`${key}: ${value}`);
              }
            }
          }
          
          const finalErrorMessages = errorMessages.length > 0 
            ? errorMessages.join(', ')
            : 'Errores de validación no especificados';
            
          setMessage({ text: `Error de validación: ${finalErrorMessages}`, type: 'error' });
        } else if (err.response.data?.mensaje) {
          setMessage({ text: err.response.data.mensaje, type: 'error' });
        } else if (err.response.data?.[0]?.mensaje1) {
          setMessage({ text: err.response.data[0].mensaje1, type: 'error' });
        } else {
          setMessage({ text: `Error ${err.response.status}: ${err.response.statusText}`, type: 'error' });
        }
      } else {
        setMessage({ text: 'Error de red al intentar actualizar el trabajador', type: 'error' });
      }
    } finally {
      setSaving(false);
    }
  };

  // --- COLUMNAS DE LA TABLA ---
  const columns: GridColDef[] = [
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 100,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title='Editar'>
            <IconButton
              size='small'
              color='primary'
              onClick={() => handleOpenEdit(params.row)}
            >
              <EditIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: 'claveEmpleado',
      headerName: 'Clave',
      width: 70,
      sortable: true,
    },
    {
      field: 'status',
      headerName: 'Estado',
      width: 90,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            padding: '4px 8px',
            borderRadius: '4px',
            color: 'black',
            fontSize: '12px',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          {getStatusText(params.row.status)}
        </Box>
      ),
    },
    {
      field: 'nombreCompleto',
      headerName: 'Nombre',
      flex: 1,
      minWidth: 240,
      sortable: true,
      renderCell: (params) => {
        if (!params || !params.row) return '';
        const apellidoPaterno = params.row.apellido_paterno || '';
        const apellidoMaterno = params.row.apellido_materno || '';
        const nombre = params.row.nombre || '';
        return `${apellidoPaterno} ${apellidoMaterno} ${nombre}`.trim();
      },
    },
    {
      field: 'observaciones',
      headerName: 'Puesto',
      width: 150,
      sortable: true,
    },
    {
      field: 'rfc',
      headerName: 'RFC',
      width: 120,
      sortable: true,
    },
    {
      field: 'imss',
      headerName: 'IMSS',
      width: 120,
      sortable: true,
    },
    {
      field: 'sucursal',
      headerName: 'Suc',
      width: 130,
      sortable: true,
      renderCell: (params: GridRenderCellParams) =>
        getNombreDepartamento(Number(params.row.sucursal)),
    },
    {
      field: 'fecha_alta',
      headerName: 'F. Alta',
      width: 110,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ textAlign: 'center' }}>
          {formatDateForInput(params.row.fecha_alta)}
        </Box>
      ),
    },
    {
      field: 'fecha_baja',
      headerName: 'F. Baja',
      width: 110,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ textAlign: 'center' }}>
          {formatDateForInput(params.row.fecha_baja)}
        </Box>
      ),
    },
    {
      field: 'bajaAction',
      headerName: 'Baja',
      width: 80,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Tooltip title='Dar de baja'>
            <span>
              <IconButton
                size='small'
                color='error'
                disabled={params.row.status === 2}
                onClick={() =>
                  fetchdesactivarTrabajador(params.row.claveEmpleado)
                }
              >
                <RestoreIcon fontSize='small' />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: 'reactivarAction',
      headerName: 'Reactivar',
      width: 100,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Tooltip title='Reactivar'>
            <span>
              <IconButton
                size='small'
                color='success'
                disabled={params.row.status !== 2}
                onClick={() => fetchactivarTrabajador(params.row.claveEmpleado)}
              >
                <RestoreIcon fontSize='small' />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <>
      <Box sx={{ width: '100%', p: 3, backgroundColor: '#ececec', minHeight: '100vh' }}>
        
        <style>{`
          .swal2-container {
            z-index: 9999 !important;
          }
        `}</style>

        {/* CONTENEDOR BLANCO SUPERIOR (ENCABEZADO + FILTROS) */}
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)', mb: 3 }}>
          
          {/* RECUADRO INTERIOR ELEGANTE (SOLO TÍTULO Y DATOS) */}
          <Box sx={{ border: '1px solid #2c3e50', p: 1.5, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem', textTransform: 'uppercase' }}>
                      CATÁLOGO DE TRABAJADORES
                  </Typography>
                 
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                      {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replaceAll('/', '-')}
                  </Typography>
                  
              </Box>
          </Box>

          {/* FILTROS Y BOTÓN DE AGREGAR */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <Typography sx={{ fontWeight: 'bold', color: '#333' }}>
                FILTRAR POR:
              </Typography>
              <TextField
                {...commonProps}
                placeholder='Nombre o Clave'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ ...commonProps.sx, maxWidth: '300px', '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Box>
            
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{
                height: '45px',
                backgroundColor: '#333333',
                color: 'white',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(51, 51, 51, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: '#555555',
                  transform: 'translateY(-1px)'
                },
              }}
            >
              + AGREGAR TRABAJADOR
            </Button>
          </Box>
        </Box>

        {/* CONTENEDOR DE LA TABLA ESTILO ELEGANTE */}
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
          <Box sx={{ height: 600, width: '100%', display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (
              <DataGrid
                rows={filteredRows}
                columns={columns}
                pageSizeOptions={[10, 25, 50, 100]}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                disableRowSelectionOnClick
                sx={{
                  border: 'none',
                  height: '100%',
                  fontSize: '0.95rem',
                  '& .MuiDataGrid-columnHeaders': { 
                    borderBottom: '2px solid #000',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5'
                  },
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #e0e0e000',
                    cursor: 'pointer'
                  },
                  '& .MuiDataGrid-row': { cursor: 'pointer', transition: 'all 0.2s ease' },
                  '& .MuiDataGrid-row:hover': { bgcolor: '#fafafa' }
                }}
              />
            )}
          </Box>
        </Box>

       

        
      {/* DIÁLOGO DE EDICIÓN/AGREGAR */}
      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#000000', 
          borderBottom: '1px solid #333',
          py: 2
        }}>
          <Typography sx={{ color: '#ffffff', fontWeight: 600, fontSize: '1.25rem' }}>
            {isEditing 
              ? `Editar - ${formData.nombre || ''} ${formData.apellido_paterno || ''} ${formData.apellido_materno || ''} - ${formData.claveEmpleado || ''}`
              : 'Agregar Nuevo Trabajador'
            }
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Tabs
            value={activeEditTab}
            onChange={(e, newValue) => setActiveEditTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '14px',
                minHeight: '40px'
              }
            }}
          >
            <Tab label="Generales" />
            <Tab label="Laborales" />
            <Tab label="Salario" />
            <Tab label="Personales" />
            <Tab label="Identificadores" />
            <Tab label="Vacaciones y Permisos" />
            <Tab label="Bitácora" />
          </Tabs>
          {/* Tab Generales - Edición */}
          {activeEditTab === 0 && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Clave Empleado"
                  name="claveEmpleado"
                  value={formData.claveEmpleado || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Nombre'
                  name='nombre'
                  value={formData.nombre || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Apellido Paterno'
                  name='apellido_paterno'
                  value={formData.apellido_paterno || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Apellido Materno'
                  name='apellido_materno'
                  value={formData.apellido_materno || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>

              {/* Segunda fila */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='RFC'
                  name='rfc'
                  value={formData.rfc || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='IMSS'
                  name='imss'
                  value={formData.imss || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>

              {/* Tercera fila */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Fecha de Nacimiento'
                  name='fechaNacimiento'
                  type='date'
                  InputLabelProps={{ shrink: true }}
                  value={formatDateForInput(formData.fechaNacimiento) || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='escolaridad-label'>Escolaridad</InputLabel>
                  <Select
                    labelId='escolaridad-label'
                    name='nivelEscolaridad'
                    value={formData.nivelEscolaridad || ''}
                    onChange={handleInputChange}
                    {...commonProps}
                  >
                    {nivelesEscolaridad.map((option) => (
                      <MenuItem
                        key={option.clave_nivel}
                        value={option.clave_nivel}
                      >
                        {option.descripcion_escolaridad}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='escolaridad-concluida-label'>
                    Escolaridad Concluida
                  </InputLabel>
                  <Select
                    labelId='escolaridad-concluida-label'
                    label='Escolaridad Concluida'
                    name='escolaridad_concluido'
                    value={formData.escolaridad_concluido || ''}
                    onChange={handleInputChange}
                    {...commonProps}
                  >
                    <MenuItem value=''>-- Seleccionar --</MenuItem>
                    {escolaridadConcluidoOptions.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.descripcion}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Cuarta fila */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Lugar de Nacimiento'
                  name='lugarNacimiento'
                  value={formData.lugarNacimiento || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='CURP'
                  name='curp'
                  value={formData.curp || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='estado-civil-label'>Estado Civil</InputLabel>
                  <Select
                    labelId='estado-civil-label'
                    label='Estado Civil'
                    name='estadoCivil'
                    value={formData.estadoCivil || ''}
                    onChange={handleInputChange}
                    {...commonProps}
                  >
                    <MenuItem value=''>-- Seleccionar --</MenuItem>
                    {estadosCivilesOptions.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.descripcion}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='sexo-label'>Sexo</InputLabel>
                  <Select
                    labelId='sexo-label'
                    name='sexo'
                    // Tu JSON usa "M" y "F"
                    value={formData.sexo || ''}
                    label='Sexo'
                    onChange={handleInputChange}
                    {...commonProps}
                  >
                    <MenuItem value='M'>Masculino</MenuItem>
                    <MenuItem value='F'>Femenino</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper
                  variant='outlined'
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'flex-start', // Alinea el checkbox arriba si el texto es largo
                    borderRadius: 2,
                    backgroundColor: '#fcfcfc', 
                  }}
                >
                  <Checkbox
                    name='confianza'
                    checked={!!formData.confianza}
                    onChange={(e) => {
                      handleInputChange({
                        target: { name: 'confianza', value: e.target.checked },
                      });
                    }}
                    sx={{ p: 0, mr: 2, mt: 0.5 }} // Quita el padding del checkbox para pegarlo al borde
                  />
                  <Box>
                    <Typography
                      variant='subtitle1'
                      sx={{
                        fontWeight: 'bold',
                        color: '#000000ff',
                        lineHeight: 1.2,
                      }}
                    >
                      Confianza
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Tab Laborales - Edición */}
          {activeEditTab === 1 && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Fecha de Alta'
                  name='fecha_alta'
                  type='date'
                  InputLabelProps={{ shrink: true }}
                  value={formatDateForInput(formData.fecha_alta) || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Fecha de Baja'
                  name='fecha_baja'
                  type='date'
                  InputLabelProps={{ shrink: true }}
                  value={formatDateForInput(formData.fecha_baja) || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='puesto-label'>Puesto</InputLabel>
                  <Select
                    labelId='puesto-label'
                    name='idPuesto'
                    value={formData.idPuesto || ''}
                    onChange={handleInputChange}
                    {...commonProps}
                  >
                    {puestosOptions.map((option) => (
                      <MenuItem
                        key={option.clave_puesto}
                        value={option.clave_puesto}
                      >
                        {option.descripcion_puesto}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='departamento-label'>Departamento</InputLabel>
                  <Select
                    labelId='departamento-label'
                    name='idDepartamento'
                    value={formData.idDepartamento || ''}
                    onChange={handleInputChange}
                    {...commonProps}
                  >
                    {departamentosOptions.map((option) => (
                      <MenuItem
                        key={option.clave_departamento}
                        value={option.clave_departamento}
                      >
                        {option.descripcion_departamento}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='status-label'>Estado</InputLabel>
                  <Select
                    labelId='status-label'
                    name='status'
                    value={formData.status || ''}
                    onChange={handleInputChange}
                    {...commonProps}
                  >
                    {statusOptions.map((option) => (
                      <MenuItem
                        key={option.clave_status}
                        value={option.clave_status}
                      >
                        {option.descripcion}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='recontratable-label'>
                    Recontratable
                  </InputLabel>
                  <Select
                    labelId='recontratable-label'
                    name='recontratable'
                    value={formData.recontratable || 1}
                    label='Recontratable'
                    onChange={handleInputChange}
                    {...commonProps}
                  >
                    <MenuItem value={1}>SÍ</MenuItem>
                    <MenuItem value={2}>NO</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='motivo-baja-label'>Motivo de Baja</InputLabel>
                  <Select
                    labelId='motivo-baja-label'
                    name='motivoBajaEspecificacion'
                    value={formData.motivoBajaEspecificacion === 'string' ? '' : (formData.motivoBajaEspecificacion || '')}
                    onChange={handleInputChange}
                    {...commonProps}
                  >
                    <MenuItem value=''>-- Seleccionar --</MenuItem>
                    {motivosBajaOptions.map((option) => (
                      <MenuItem
                        key={option.descripcion}
                        value={option.descripcion}
                      >
                        {option.descripcion}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {/* Tab Salario - Edición */}
          {activeEditTab === 2 && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Salario Actual'
                  name='salarioActual'
                  value={formData.salarioActual?.toString() || ''}
                  onChange={handleInputChange}
                  size='small'
                  InputProps={{
                    startAdornment: '$',
                    ...commonProps.InputProps,
                  }}
                  {...commonProps}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='forma-pago-label'>Forma de Pago</InputLabel>
                  <Select
                    labelId='forma-pago-label'
                    name='clavePerfil'
                    value={formData.clavePerfil || ''}
                    onChange={handleInputChange}
                    {...commonProps}
                  >
                    {formasPagoOptions.map((option) => (
                      <MenuItem
                        key={option.clave_forma_pago}
                        value={option.clave_forma_pago}
                      >
                        {option.descripcion_forma_pago}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Número Cta Tarjeta'
                  name='num_tc'
                  value={formData.num_tc || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Número CLABE'
                  name='num_clabe'
                  value={formData.num_clabe || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Número Cuenta'
                  name='num_cuenta'
                  value={formData.num_cuenta || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
            </Grid>
          )}

          {/* Tab Personales - Edición */}
          {activeEditTab === 3 && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Domicilio'
                  name='domicilio'
                  value={formData.domicilio || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Colonia'
                  name='colonia'
                  value={formData.colonia || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Población'
                  name='poblacion'
                  value={formData.poblacion || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Estado'
                  name='estado'
                  value={formData.estado || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Código Postal'
                  name='codigoPostal'
                  value={formData.codigoPostal || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Teléfono 1'
                  name='telefono1'
                  value={formData.telefono1 || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Teléfono 2'
                  name='telefono2'
                  value={formData.telefono2 || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Email'
                  name='email'
                  type='email'
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  size='small'
                  {...commonProps}
                />
              </Grid>
            </Grid>
          )}

          {/* Tab Identificadores - Edición */}
          {activeEditTab === 4 && (
            <Grid container spacing={2}>
              <Grid
                item xs={12} md={4}
                sx={{ display: 'flex', justifyContent: 'center' }}
              >
                <TextField
                  label='Contraseña'
                  name='password'
                  type='password'
                  value={formData.password || ''}
                  onChange={handleInputChange}
                  size='small'
                  inputProps={{ maxLength: 12 }} //Permite escribir solo 12 caracteres
                  {...commonProps}
                />
              </Grid>
              <Grid
                item xs={12} md={4}
                sx={{ display: 'flex', justifyContent: 'center' }}
              >
                <Typography
                  variant='h7'
                  sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}
                >
                  Máximo 12 caracteres
                </Typography>
              </Grid>
              <Grid
                item xs={12} md={4}
                sx={{ display: 'flex', justifyContent: 'center' }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant='outlined'
                    size='small'
                    sx={{
                      minWidth: 100,
                      textTransform: 'none',
                      backgroundColor: '#797878a9',
                    }}
                  >
                    Registro de Huella Digital
                  </Button>
                  <Button
                    variant='outlined'
                    size='small'
                    sx={{
                      minWidth: 100,
                      textTransform: 'none',
                      backgroundColor: '#797878a9',
                    }}
                  >
                    Consulta y Registro de Fotografías
                  </Button>
                  <Button
                    variant='outlined'
                    size='small'
                    sx={{
                      minWidth: 100,
                      textTransform: 'none',
                      backgroundColor: '#797878a9',
                    }}
                  >
                    Consulta y Registro de Firma
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Tab Vacaciones y Permisos - Edición */}
          {activeEditTab === 5 && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography
                  variant='h6'
                  sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}
                >
                  Vacaciones y Permisos
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box
                  sx={{
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: '#f9f9f9',
                  }}
                >
                  <Typography variant='body2' sx={{ color: '#666' }}>
                    No hay información de vacaciones y permisos disponible
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Tab Bitácora - Edición */}
          {activeEditTab === 6 && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography
                  variant='h6'
                  sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}
                >
                  Bitácora de Cambios
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box
                  sx={{
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    p: 3,
                    minHeight: 200,
                    backgroundColor: '#f9f9f9',
                  }}
                >
                  <Typography
                    variant='body2'
                    sx={{ color: '#666', textAlign: 'center' }}
                  >
                    No hay información en la bitácora
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEdit(false)} variant='outlined'>
            Cancelar
          </Button>
          <Button
            onClick={saveTrabajador}
            variant='contained'
            sx={{ backgroundColor: '#333333' }}
          >
            {isEditing ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
   </Dialog>
    </Box>
  </>
  );
}