import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, FormControl, 
  InputLabel, Select, MenuItem, Checkbox, FormControlLabel, 
  Snackbar, Alert, CircularProgress, Paper,
  Tabs, Tab 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { 
  DataGrid, 
  GridColDef, 
  GridRenderCellParams, 
  GridToolbar, 
  GridPaginationModel, 
  GridPagination 
} from '@mui/x-data-grid';

import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Home as HomeIcon, 
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material';

import useConsumoApi from '../../../hooks/useConsumoApi'; 
import { useSessionContext } from '../../../context/SessionProvider'; 
import Swal from 'sweetalert2';

// --- INTERFACES ---
interface ClienteRow {
  id: string;
  nombre_completo: string;
  fecha_alta: string;
  fecha_act?: string;
  fecha_act_formateada?: string;
  sucursal_nombre: string;
  ciudad: string;
  TotalRegistros?: number;
  nombre?: string;
  ap_paterno?: string;
  ap_materno?: string;
  email?: string;
  telefono?: string;
  estado?: string;
  cp?: string;
  colonia?: string;
  id_sucursal?: number;
  genero?: string;
  suspenso?: boolean;
  domicilio?: string;
  No_cliente?: string;
}

interface CatalogoItem {
  id: number | string;
  descripcion: string;
}

interface CatClienteProps {
  embedded?: boolean;
  onClienteGuardado?: (cliente: ClienteRow) => void;
  onClose?: () => void;
  openModal?: boolean;
  onOpenModal?: (open: boolean) => void;
}

interface CatalogoItem {
  id: number | string;
  descripcion: string;
}

const initialFormState = {
  clave_cliente: '',
  id_cliente: '', // Agregar id_cliente para edición
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  email: '',
  telefono: '',
  domicilio: '', 
  ciudad: '',
  estado: '',
  cp: '',
  colonia: '',
  sucursal_id: '' as string | number, 
  genero: '',
  clave_registro: '',
  suspendido: false,
  fecha_alta: '',
  fecha_act: '',
};

// --- PAGINACIÓN PERSONALIZADA ---
function CustomPagination() {
  return (
    <GridPagination />
  );
}

// --- ESTILOS BERLLANO ELEGANTE (TONALIDADES NEUTRAS) ---
// 1. Estilo General (Altura fija de 50px con detalles elegantes)
const commonProps = {
  fullWidth: true,
  size: "small" as const,
  variant: "outlined" as const,
  sx: {
      '& .MuiInputBase-root': { 
          height: '50px', 
          alignItems: 'center',
          borderRadius: '8px',
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            borderColor: '#999'
          }
      },
      '& .MuiInputLabel-root': { 
          transform: 'translate(14px, 14px) scale(1)',
          color: '#666',
          fontWeight: 500
      },
      '& .MuiInputLabel-shrink': { 
          transform: 'translate(14px, -9px) scale(0.75)',
          color: '#333',
          fontWeight: 600
      },
      '& .MuiOutlinedInput-notchedOutline': {
          borderColor: '#e0e0e0',
          borderWidth: '1.5px'
      }
  }
};

// 2. Estilo SOLO para Selects (Hereda el general pero agrega ancho mínimo)
const selectProps = {
  ...commonProps,
  sx: {
      ...commonProps.sx,
      minWidth: '220px', // <--- ESTO FUERZA QUE SIEMPRE SEAN LARGOS
  }
};

export default function CatClientes({ embedded = false, onClienteGuardado, onClose, openModal: externalOpenModal, onOpenModal, clienteToEdit }: CatClienteProps) {
  const { consumoApi } = useConsumoApi();
  const { session } = useSessionContext();

  // --- ESTADOS ---
  const [rows, setRows] = useState<ClienteRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sucursales, setSucursales] = useState<CatalogoItem[]>([]);
  const [colonias, setColonias] = useState<CatalogoItem[]>([]);

  // --- PAGINACIÓN ---
  const [rowCount, setRowCount] = useState(0); 
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,      
    pageSize: 10 
  });

  const [internalOpenModal, setInternalOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  
  // Usar estado externo si está en modo embebido, sino usar estado interno
  const openModal = embedded && externalOpenModal !== undefined ? externalOpenModal : internalOpenModal;
  const setOpenModal = (open: boolean) => {
    if (embedded && onOpenModal) {
      onOpenModal(open);
    } else {
      setInternalOpenModal(open);
    }
  };
  
  // Estado para Pestañas
  const [tabValue, setTabValue] = useState(0);

  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

 
  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  // --- CARGAS DE DATOS ---
  const fetchSucursales = async () => {
    try {
      const response = await consumoApi.get('/api/CatClientesSuc/sp_bw_cat_clientes_suc');
      setSucursales(response.data);
    } catch (error) {
      console.error("Error cargando sucursales", error);
    }
  };

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const pageToSend = paginationModel.page + 1; 
      const response = await consumoApi.get('/api/CatClientesSuc/sp_bw_cat_clientes_sel', {
        params: {
            page: pageToSend,
            pageSize: paginationModel.pageSize,
            busqueda: searchTerm 
        },
        timeout: 120000 
      });

      // Mapear los datos de la API al formato esperado por el DataGrid
      const mappedData = response.data.map((item: any, index: number) => {
        // Convertir fecha_act_formateada (dd/mm/yyyy) a formato ISO (yyyy-mm-dd)
        let fechaActISO = '';
        if (item.fecha_act_formateada) {
          const parts = item.fecha_act_formateada.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            fechaActISO = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }
        
        // Convertir fecha_alta_formateada (dd/mm/yyyy) a formato ISO (yyyy-mm-dd)
        let fechaAltaISO = '';
        if (item.fecha_alta_formateada) {
          const parts = item.fecha_alta_formateada.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            fechaAltaISO = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }
        
        return {
          ...item,
          No_cliente: item.id, // El campo 'id' de la API es el No_cliente (00001, 00002, etc.)
          fecha_act: fechaActISO, // Convertir fecha_act_formateada a ISO
          fecha_alta: fechaAltaISO, // Convertir fecha_alta_formateada a ISO
          id: item.rfc || `temp-${index}`, // Usar rfc como id único para el DataGrid
        };
      });
      
      setRows(mappedData);

      if (mappedData && mappedData.length > 0 && mappedData[0].TotalRegistros) {
          setRowCount(mappedData[0].TotalRegistros);
      } else {
          if (paginationModel.page === 0) setRowCount(0);
      }
    } catch (error: any) {
      console.error("Error:", error);
      if (error.code === 'ECONNABORTED') {
         setMessage({ text: 'El servidor tardó demasiado en responder', type: 'error' });
      } else {
         setMessage({ text: 'Error al cargar clientes', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    if (paginationModel.page === 0) fetchClientes();
  };

// Cargar datos del cliente cuando se pasa clienteToEdit
useEffect(() => {
  if (clienteToEdit && clienteToEdit.No_cliente) {
    const cargarDatosCliente = async () => {
      try {
        const response = await consumoApi.get('/api/CatClientes/sp_bw_cat_clientes_suc_sel', {
          params: { No_cliente: clienteToEdit.No_cliente }
        });
        
        if (response.data && response.data.length > 0) {
          const cliente = response.data[0];
          
          // Buscar el ID de la sucursal por nombre
          const sucursalEncontrada = sucursales.find(s => s.descripcion === cliente.sucursal_nombre);
          
          setFormData({
            clave_cliente: cliente.No_cliente || '',
            id_cliente: cliente.No_cliente || '',
            nombre: cliente.nombre || '',
            apellido_paterno: cliente.ap_paterno || '',
            apellido_materno: cliente.ap_materno || '',
            email: cliente.email || '',
            telefono: cliente.telefono || '',
            domicilio: cliente.domicilio || '',
            ciudad: cliente.ciudad || '',
            estado: cliente.estado || '',
            cp: cliente.cp || '',
            colonia: cliente.colonia || '',
            sucursal_id: sucursalEncontrada?.id || '', // ← USAR EL ID ENCONTRADO
            genero: cliente.genero || '',
            clave_registro: '',
            suspendido: cliente.suspendido || false,
            fecha_alta: cliente.fecha_alta ? cliente.fecha_alta.split('T')[0] : '',
            fecha_act: cliente.fecha_act ? cliente.fecha_act.split('T')[0] : '',
          });
          setIsEditing(true);
          setOpenModal(true);
        }
      } catch (error) {
        console.error('Error cargando datos del cliente:', error);
      }
    };
    
    cargarDatosCliente();
  }
}, [clienteToEdit?.No_cliente, sucursales]); // ← solo reacciona al cambio de No_cliente, no a cambios de referencia


  useEffect(() => { fetchClientes(); }, [paginationModel]); 
  useEffect(() => { fetchSucursales(); }, []);

  // --- LÓGICA FORMULARIO ---
  const fetchColonias = async (cp: string) => {
    if (!cp || cp.length < 4) {
      setColonias([]);
      return;
    }
    try {
      const response = await consumoApi.get('/api/CatClientesSuc/sp_bw_cat_clientes_col', {
        params: { cp: cp }
      });
      setColonias(response.data);
    } catch (error) {
      console.error("Error cargando colonias");
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value, checked, type } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));

    if (name === 'cp') {
      fetchColonias(newValue);
      if (!isEditing || (isEditing && newValue !== formData.cp)) {
         setFormData(prev => ({ ...prev, [name]: newValue, colonia: '' }));
      }
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenAdd = () => {
    const fechaActual = new Date().toISOString().split('T')[0];
    setFormData({
      ...initialFormState,
      fecha_alta: fechaActual
    });
    setColonias([]); 
    setIsEditing(false);
    setTabValue(0); 
    setOpenModal(true);
  };

  const handleOpenEdit = (row: ClienteRow) => {
    // Validar y convertir el ID de forma segura
    const idCliente = row.No_cliente ? String(row.No_cliente).trim() : (row.id ? String(row.id).trim() : '');
    
    setFormData({
      clave_cliente: idCliente, 
      id_cliente: idCliente, // Mantener como string para evitar NaN
      nombre: row.nombre || '',    
      apellido_paterno: row.ap_paterno || '',
      apellido_materno: row.ap_materno || '',
      email: row.email || '',
      telefono: row.telefono || '',
      domicilio: row.domicilio || '',
      ciudad: row.ciudad || '',
      estado: row.estado || '',
      cp: row.cp || '',
      colonia: row.colonia || '', 
      sucursal_id: row.id_sucursal || '',
      genero: row.genero || '',
      clave_registro: '',
      suspendido: row.suspendido || false,
      fecha_alta: row.fecha_alta || '',
      fecha_act: row.fecha_act || '',
    });
    if (row.cp) fetchColonias(row.cp);
    setIsEditing(true);
    setTabValue(0);
    setOpenModal(true);
  };

const handleSave = async () => {
    if (!formData.nombre || !formData.sucursal_id) {
      Swal.fire('Atención', 'El Nombre y Sucursal son obligatorios', 'warning');
      return;
    }
    
    // Parámetros base para ambos casos
    const baseParams = {
        nombre: formData.nombre,
        sucursal_id: Number(formData.sucursal_id),
        suspendido: formData.suspendido,
        ap_paterno: formData.apellido_paterno,
        ap_materno: formData.apellido_materno,
        email: formData.email,
        telefono: formData.telefono,
        ciudad: formData.ciudad,
        cp: formData.cp,
        colonia: formData.colonia,
        estado: formData.estado,
        domicilio: formData.domicilio,
        genero: formData.genero
    };
    
    try {
      if (isEditing) {
        // Validar que id_cliente no esté vacío antes de convertir
        if (!formData.id_cliente || formData.id_cliente.trim() === '') {
          Swal.fire('Error', 'No se puede actualizar: ID de cliente no válido', 'error');
          return;
        }
        
        // Para actualización: agregar no_cliente y enviar en body JSON
        const updateParams = {
          no_cliente: formData.id_cliente.trim(),
          ...baseParams
        };
        
        await consumoApi.put('/api/CatClientesSuc/sp_bw_cat_clientes_upd', updateParams);
        await Swal.fire({ title: '¡Éxito!', text: 'Cliente actualizado correctamente', icon: 'success', confirmButtonColor: '#333333' });
        
        if (embedded && onClienteGuardado) {
          const clienteActualizado: ClienteRow = {
            id: formData.id_cliente || formData.clave_cliente,
            nombre_completo: `${formData.nombre} ${formData.apellido_paterno || ''} ${formData.apellido_materno || ''}`.trim(),
            nombre: formData.nombre,
            ap_paterno: formData.apellido_paterno,
            ap_materno: formData.apellido_materno,
            email: formData.email,
            telefono: formData.telefono,
            domicilio: formData.domicilio,
            ciudad: formData.ciudad,
            estado: formData.estado,
            cp: formData.cp,
            colonia: formData.colonia,
            id_sucursal: Number(formData.sucursal_id),
            genero: formData.genero,
            No_cliente: formData.id_cliente || formData.clave_cliente,
            fecha_alta: formData.fecha_alta || '',
            sucursal_nombre: '',
          };
          onClienteGuardado(clienteActualizado);
        }
      } else {
        // Para inserción: capturar el número de cliente generado
        const response = await consumoApi.post('/api/CatClientesSuc/sp_bw_cat_clientes_ins', baseParams);
        const nuevoNoCliente = response.data?.idGenerado || 'N/A';
        
        Swal.fire({ 
          title: '¡Éxito!', 
          text: `Cliente creado correctamente.\nNúmero de Cliente: ${nuevoNoCliente}`, 
          icon: 'success', 
          confirmButtonColor: '#333333' 
        });
        
        if (embedded && onClienteGuardado) {
          const nombreCompleto = `${formData.nombre} ${formData.apellido_paterno || ''} ${formData.apellido_materno || ''}`.trim();
          const clienteCreado: ClienteRow = {
            id: nuevoNoCliente,
            nombre_completo: nombreCompleto,
            nombre: formData.nombre,
            ap_paterno: formData.apellido_paterno,
            ap_materno: formData.apellido_materno,
            email: formData.email,
            telefono: formData.telefono,
            domicilio: formData.domicilio,
            ciudad: formData.ciudad,
            estado: formData.estado,
            cp: formData.cp,
            colonia: formData.colonia,
            id_sucursal: Number(formData.sucursal_id),
            genero: formData.genero,
            No_cliente: nuevoNoCliente,
            fecha_alta: new Date().toISOString().split('T')[0],
            sucursal_nombre: '',
          };
          onClienteGuardado(clienteCreado);
        }
      }
      setOpenModal(false);
      fetchClientes(); 
    } catch (error: any) {
        const errorMsg = error.response?.data?.mensaje || 'Error al guardar';
        Swal.fire('Error', errorMsg, 'error');
    }
  };

const handleDelete = async (id: string) => {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar cliente?',
      text: `¿Estás seguro de eliminar al cliente ${id}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#333333',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await consumoApi.delete('/api/CatClientesSuc/sp_bw_cat_clientes_del', { params: { No_cliente: id } });
      Swal.fire({ title: '¡Éxito!', text: 'Cliente eliminado correctamente', icon: 'success', confirmButtonColor: '#333333' });
      fetchClientes();
    } catch (error: any) {
      const errorMsg = error.response?.data?.mensaje || 'Error al eliminar';
      Swal.fire('Error', errorMsg, 'error');
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'acciones', headerName: 'Acci.', width: 100, sortable: false, filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(params.row)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.No_cliente || params.row.id)}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ),
    },
    { field: 'No_cliente', headerName: 'Clave', width: 100 },
    { field: 'nombre_completo', headerName: 'Nombre', flex: 1, minWidth: 250 },
    { field: 'fecha_alta', headerName: 'Fecha Alta', width: 200 },
    { field: 'sucursal_nombre', headerName: 'Sucursal', width: 180 },
    { field: 'ciudad', headerName: 'Ciudad', width: 180 },
  ];

return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
      
      {/* MAGIA CSS: Forzamos a SweetAlert a saltar al frente de los modales de MUI */}
      <style>{`
        .swal2-container {
          z-index: 9999 !important;
        }
      `}</style>

      {/* PAPER 1: ENCABEZADO Y TÍTULO */}
      <Paper sx={{ p: 3, borderRadius: '8px', mb: 3 }}>
        {/* ENCABEZADO */}
        <Box sx={{ border: '1px solid #000000ff', p: 1.5, mb: 2, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000ff', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                    CATÁLOGO DE CLIENTES
                </Typography>
                
            </Box>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                    {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                </Typography>
                
            </Box>
        </Box>
        
        {/* BOTONES DE ACCIÓN */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleOpenAdd} 
              sx={{ 
                backgroundColor: '#333333', 
                color: 'white', 
                borderRadius: '8px',
                fontWeight: 600,
                textTransform: 'none',
                padding: '10px 20px',
                boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  backgroundColor: '#555555',
                  boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              CREAR CLIENTE
            </Button>
            <Button 
              variant="outlined" 
              onClick={fetchClientes}
              sx={{ 
                borderRadius: '8px',
                borderColor: '#e0e0e0',
                borderWidth: '1.5px',
                color: '#666',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  borderColor: '#999',
                  color: '#333',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }
              }}
            >
              <RefreshIcon />
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              sx={{ 
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }
                }
              }}
            />
            <Button 
              variant="outlined" 
              onClick={handleSearch} 
              sx={{ 
                minWidth: 'auto', 
                px: 2,
                borderRadius: '8px',
                borderColor: '#e0e0e0',
                borderWidth: '1.5px',
                color: '#666',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  borderColor: '#999',
                  color: '#333',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }
              }}
            >
              <SearchIcon />
            </Button>
          </Box>
        </Box>
      </Paper>

 {/* PAPER 2: TABLA PRINCIPAL */}
      <Paper sx={{ p: 3, mt: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid 
            rows={rows} 
            columns={columns} 
            getRowId={(row) => row.id} 
            loading={loading}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50, 100]}
            rowCount={rowCount}
            paginationMode="server"
            density="compact"
            disableRowSelectionOnClick
            slots={{ toolbar: GridToolbar, pagination: CustomPagination }}
            slotProps={{ toolbar: { showQuickFilter: true } }}
            sx={{ 
              border: 'none', 
              '& .MuiDataGrid-columnHeaders': { 
                borderBottom: '2px solid #000', 
                textAlign: 'center', 
                fontSize: '1rem', 
                fontWeight: 'bold',
                backgroundColor: '#f5f5f5'
              },
              '& .MuiDataGrid-cell': { 
                borderBottom: '1px solid #e0e0e000' 
              }
            }}
          />
        </Box>

      </Paper>

     <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)} 
        maxWidth="md" // <--- Cambiado a "md" para el estándar de 3 campos por fila
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            border: '1px solid #e0e0e0',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
          }
        }}
      >
        {/* ENCABEZADO ELEGANTE */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #333333 0%, #555555 100%)',
          color: 'white',
          p: 3,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
              {isEditing ? `Editar Cliente: ${formData.clave_cliente}` : 'Nuevo Cliente'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Complete la información del cliente en los campos correspondientes
            </Typography>
          </Box>
          <Box sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            zIndex: 1
          }} />
          <IconButton 
            onClick={() => setOpenModal(false)}
            sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* --- PESTAÑAS (TABS) --- */}
        <Box sx={{ 
          backgroundColor: '#f8f9fa',
          borderBottom: '2px solid #e0e0e0',
          px: 3,
          py: 1
        }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="tabs cliente"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                minHeight: 48,
                color: '#666',
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: '#333',
                  backgroundColor: 'rgba(51, 51, 51, 0.04)'
                },
                '&.Mui-selected': {
                  color: '#333',
                  backgroundColor: 'rgba(51, 51, 51, 0.08)'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#333333',
                height: 3,
                borderRadius: '3px 3px 0 0'
              }
            }}
          >
            <Tab label="Información General" sx={{ fontWeight: 600 }} />
            <Tab label="Contacto y Dirección" sx={{ fontWeight: 600 }} />
          </Tabs>
        </Box>

        <DialogContent sx={{ 
          p: 3, 
          backgroundColor: '#ffffff',
          minHeight: 400,
          '& .MuiDialogContent-dividers': {
            borderColor: '#e0e0e0'
          }
        }}>
          
          {/* --- PESTAÑA 1: INFORMACIÓN GENERAL --- */}
          {tabValue === 0 && (
            <Box sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
              {/* Sección: Información Personal */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} />
                  Información Personal
                </Typography>
                <Grid container spacing={2}>
                  {/* Fila 1: 3 campos */}
                  <Grid item xs={12} md={4}>
                    <TextField 
                      {...commonProps} 
                      label='Nombre *' 
                      name="nombre" 
                      value={formData.nombre} 
                      onChange={handleInputChange} 
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField 
                      {...commonProps} 
                      label='Apellido Paterno' 
                      name="apellido_paterno" 
                      value={formData.apellido_paterno} 
                      onChange={handleInputChange} 
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField 
                      {...commonProps} 
                      label='Apellido Materno' 
                      name="apellido_materno" 
                      value={formData.apellido_materno} 
                      onChange={handleInputChange} 
                    />
                  </Grid>
                  
                  {/* Fila 2: 1 campo */}
                  <Grid item xs={12} md={4}>
                    <TextField 
                      {...selectProps} 
                      select 
                      label="Género" 
                      name="genero" 
                      value={formData.genero} 
                      onChange={handleInputChange}
                    >
                      <MenuItem value="MASCULINO">MASCULINO</MenuItem>
                      <MenuItem value="FEMENINO">FEMENINO</MenuItem>
                      <MenuItem value="EMPRESA">EMPRESA</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Box>

              {/* Sección: Configuración */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} />
                  Configuración y Estatus
                </Typography>
                <Grid container spacing={2}>
                  {/* Fila 1: 3 campos */}
                  <Grid item xs={12} md={4}>
                    <TextField 
                      {...commonProps} 
                      type="date"
                      label='Fecha Alta' 
                      name="fecha_alta" 
                      value={formatDateForInput(formData.fecha_alta)} 
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: true }}
                      sx={{
                        ...commonProps.sx,
                        '& .MuiInputBase-root': {
                          ...commonProps.sx?.['& .MuiInputBase-root'],
                          backgroundColor: '#f5f5f5',
                          cursor: 'not-allowed'
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField 
                      {...commonProps} 
                      type="date"
                      label='Fecha Actualización' 
                      name="fecha_act" 
                      value={formatDateForInput(formData.fecha_act)} 
                      InputLabelProps={{ shrink: true }}
                      InputProps={{ readOnly: true }}
                      sx={{
                        ...commonProps.sx,
                        '& .MuiInputBase-root': {
                          ...commonProps.sx?.['& .MuiInputBase-root'],
                          backgroundColor: '#f5f5f5',
                          cursor: 'not-allowed'
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField 
                      {...selectProps} 
                      select 
                      label="Sucursal Asignada *" 
                      name="sucursal_id" 
                      value={formData.sucursal_id} 
                      onChange={handleInputChange}
                    >
                      {sucursales.map((suc) => (
                        <MenuItem key={suc.id} value={suc.id}>
                          {suc.descripcion}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  
                  {/* Fila 2: 1 campo */}
                  <Grid item xs={12} md={4}>
                    <Box sx={{
                      p: 2,
                      border: '1.5px solid #e0e0e0',
                      borderRadius: '8px',
                      backgroundColor: '#f8f9fa',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      height: '50px',
                      boxSizing: 'border-box',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#999',
                        backgroundColor: '#f5f5f5'
                      }
                    }}>
                      <Checkbox 
                        checked={formData.suspendido} 
                        onChange={handleInputChange} 
                        name="suspendido"
                        sx={{
                          color: '#333',
                          p: 0,
                          '&.Mui-checked': { color: '#333' }
                        }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#333', lineHeight: 1.2 }}>
                          Cliente Suspendido
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Desactivar temporalmente
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}

          {/* --- PESTAÑA 2: CONTACTO Y DIRECCIÓN --- */}
          {tabValue === 1 && (
            <Box sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
              {/* Sección: Contacto */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} />
                  Información de Contacto
                </Typography>
                <Grid container spacing={2}>
                  {/* 2 campos que llenan todo (6 + 6) */}
                  <Grid item xs={12} md={6}>
                    <TextField 
                      {...commonProps} 
                      label='Email' 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange}
                      type="email"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField 
                      {...commonProps} 
                      label='Teléfono' 
                      name="telefono" 
                      value={formData.telefono} 
                      onChange={handleInputChange} 
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Sección: Dirección */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} />
                  Dirección del Cliente
                </Typography>
                <Grid container spacing={2}>
                  {/* Fila 1: Domicilio completo */}
                  <Grid item xs={12} md={12}>
                    <TextField 
                      {...commonProps} 
                      label='Domicilio (Calle y Número)' 
                      name="domicilio" 
                      value={formData.domicilio || ''} 
                      onChange={handleInputChange} 
                    />
                  </Grid>
                  
                  {/* Fila 2: 3 campos */}
                  <Grid item xs={12} md={4}>
                    <TextField 
                      {...commonProps} 
                      label='C.P.' 
                      name="cp" 
                      value={formData.cp} 
                      onChange={handleInputChange} 
                      helperText={isEditing ? '' : 'Buscar colonias'}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField 
                      {...selectProps} 
                      select 
                      label='Colonia' 
                      name="colonia" 
                      value={formData.colonia} 
                      onChange={handleInputChange} 
                      disabled={colonias.length === 0}
                    >
                      {colonias.map((col) => (
                        <MenuItem key={col.id} value={col.id}>
                          {col.descripcion}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField 
                      {...commonProps} 
                      label='Ciudad' 
                      name="ciudad" 
                      value={formData.ciudad} 
                      onChange={handleInputChange} 
                    />
                  </Grid>
                  
                  {/* Fila 3: 1 campo */}
                  <Grid item xs={12} md={4}>
                    <TextField 
                      {...commonProps} 
                      label='Estado' 
                      name="estado" 
                      value={formData.estado} 
                      onChange={handleInputChange} 
                    />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}

        </DialogContent>
        
        {/* Footer con acciones */}
        <DialogActions sx={{ 
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #e0e0e0',
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
              Los campos marcados con * son obligatorios
            </Typography>
            <Button 
              onClick={() => console.log('Email APP clicked')}
              variant="outlined"
              sx={{
                borderRadius: '8px',
                fontWeight: 600,
                px: 3,
                py: 1,
                borderColor: '#222222ff',
                color: '#000000ff',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: '#131313ff',
                  color: 'white',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 8px rgba(151, 151, 151, 0.3)'
                }
              }}
            >
              Email APP
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              onClick={() => setOpenModal(false)} 
              color="inherit"
              sx={{
                borderRadius: '8px',
                fontWeight: 600,
                px: 3,
                py: 1,
                backgroundColor: '#e0e0e0',
                color: '#333',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: '#d0d0d0',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              variant="contained" 
              color="primary"
              sx={{
                borderRadius: '8px',
                fontWeight: 600,
                textTransform: 'none',
                px: 4,
                py: 1,
                backgroundColor: '#333333',
                boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: '#555555',
                  boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {isEditing ? 'Actualizar Cliente' : 'Crear Cliente'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}