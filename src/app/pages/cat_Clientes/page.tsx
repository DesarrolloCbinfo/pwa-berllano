import { useEffect, useState } from 'react'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { 
  Box, CircularProgress, Alert, Typography, Button, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, 
  IconButton, Divider, InputAdornment 
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import useConsumoApi from '../../../hooks/useConsumoApi'
import PWABadge from "../../../PWABadge"

// 1. Interfaz con todos los campos del JSON
interface CatCliente {
  No_cliente: string;
  nombre: string;
  ap_paterno: string;
  ap_materno: string | null;
  domicilio: string;
  Calle: string | null;
  Num_Exterior: string | null;
  Num_Interior: string | null;
  ciudad: string | null;
  Municipio: string | null;
  estado: string | null;
  colonia: string | null;
  cp: string | null;
  rfc: string;
  curp: string | null;
  telefono: string | null;
  email: string | null;
  nombre_fiscal: string | null;
  limite_credito: number;
  persona_fisica: boolean;
  mayoreo: boolean;
  suspendido: boolean;
  especial: boolean;
  plus: boolean;
}

const initialState: CatCliente = {
  No_cliente: '', nombre: '', ap_paterno: '', ap_materno: '',
  domicilio: '', Calle: '', Num_Exterior: '', Num_Interior: '',
  ciudad: '', Municipio: '', estado: '', colonia: '', cp: '',
  rfc: '', curp: '', telefono: '', email: '', nombre_fiscal: '',
  limite_credito: 0, persona_fisica: true, mayoreo: false,
  suspendido: false, especial: false, plus: false
};

export default function CatClientes() {
  const { consumoApi } = useConsumoApi()
  const [rows, setRows] = useState<CatCliente[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Control de búsqueda (0 para todos, o ID específico para rapidez)
  const [searchId, setSearchId] = useState('0')

  // Estados de formularios
  const [openForm, setOpenForm] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [formData, setFormData] = useState<CatCliente>(initialState)
  const [openDelete, setOpenDelete] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  // 2. Función SEL (Carga de datos)
  const fetchClientes = async (idBusqueda: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await consumoApi.get(`/api/CatClientes/sp_bw_cat_clientes_suc_sel?No_cliente=${idBusqueda}`)
      
      // Validar si la respuesta es array u objeto
      const data = Array.isArray(response.data) ? response.data : [response.data];
      setRows(data)
    } catch (err) {
      setError('No se encontraron resultados o hubo un error de conexión.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClientes('0') // Carga inicial
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClientes(searchId);
  }

  // 3. Definición de Columnas
  const columns: GridColDef[] = [
    { field: 'No_cliente', headerName: 'ID', width: 90 },
    { field: 'nombre', headerName: 'Nombre', width: 220 },
    { field: 'ap_paterno', headerName: 'Apellido', width: 150 },
    { field: 'rfc', headerName: 'RFC', width: 140 },
    { field: 'Municipio', headerName: 'Municipio', width: 130 },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 110,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => { setFormData(params.row); setIsEdit(true); setOpenForm(true); }} color="primary"><EditIcon /></IconButton>
          <IconButton size="small" onClick={() => { setSelectedId(params.row.No_cliente); setOpenDelete(true); }} color="error"><DeleteIcon /></IconButton>
        </Box>
      ),
    },
  ]

  // 4. Guardar (ADD / UPD)
  const handleSave = async () => {
    if (!formData.No_cliente || !formData.nombre) return alert('No_cliente y Nombre son obligatorios')
    
    setProcessing(true)
    const endpoint = isEdit ? '/api/CatClientes/sp_bw_cat_clientes_suc_upd' : '/api/CatClientes/sp_bw_cat_clientes_suc_add'
    
    try {
      const response = await (isEdit 
        ? consumoApi.put(endpoint, null, { params: formData }) 
        : consumoApi.post(endpoint, null, { params: formData }))
      
      const result = response.data?.[0];
      if (result?.codigo === 0) {
        setOpenForm(false);
        fetchClientes(formData.No_cliente); // Refresca con el registro actual
      } else {
        alert(result?.mensaje1 || 'Error en el servidor');
      }
    } catch (err) {
      alert('Error de red');
    } finally {
      setProcessing(false);
    }
  }

  // 5. Eliminar (DEL)
  const handleDelete = async () => {
    setProcessing(true)
    try {
      const response = await consumoApi.delete('/api/CatClientes/sp_bw_cat_clientes_suc_del', { 
        params: { No_cliente: selectedId } 
      })
      if (response.data?.[0]?.codigo === 0) {
        setOpenDelete(false);
        fetchClientes('0');
      }
    } catch (err) { alert('Error al eliminar'); } finally { setProcessing(false); }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1976d2' }}>
        Catálogo de Clientes
      </Typography>

      {/* CABECERA: Búsqueda y Botón Nuevo */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center', bgcolor: '#f8f9fa', p: 2, borderRadius: 2 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
          <TextField 
            size="small"
            label="Buscar por ID"
            variant="outlined"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            }}
            sx={{ bgcolor: 'white' }}
          />
          <Button variant="contained" type="submit" color="info">Buscar</Button>
        </form>
        
        <Box sx={{ flexGrow: 1 }} />

        <Button variant="contained" color="primary" onClick={() => { setFormData(initialState); setIsEdit(false); setOpenForm(true); }}>
          Nuevo Cliente
        </Button>
      </Box>

      {/* DATA GRID */}
      <Box sx={{ height: 600, width: '100%', bgcolor: 'white' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="info">{error}</Alert>
        ) : (
          <DataGrid 
            rows={rows} 
            columns={columns} 
            getRowId={(row) => row.No_cliente} 
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          />
        )}
      </Box>

      {/* FORMULARIO DIALOG (ADD/EDIT) - USANDO CSS GRID NATIVO */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #eee' }}>
          {isEdit ? `Editando Cliente: ${formData.No_cliente}` : 'Registrar Nuevo Cliente'}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
            gap: 2.5, 
            pt: 2 
          }}>
            <TextField label="No. Cliente" fullWidth disabled={isEdit} value={formData.No_cliente} onChange={(e) => setFormData({...formData, No_cliente: e.target.value})} />
            <TextField label="RFC" fullWidth value={formData.rfc} onChange={(e) => setFormData({...formData, rfc: e.target.value})} />
            
            <Box sx={{ gridColumn: { sm: 'span 2' } }}>
              <TextField label="Nombre o Razón Social" fullWidth value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
            </Box>

            <TextField label="Apellido Paterno" fullWidth value={formData.ap_paterno} onChange={(e) => setFormData({...formData, ap_paterno: e.target.value})} />
            <TextField label="Apellido Materno" fullWidth value={formData.ap_materno || ''} onChange={(e) => setFormData({...formData, ap_materno: e.target.value})} />

            <Box sx={{ gridColumn: { sm: 'span 2' } }}>
              <Divider sx={{ my: 1 }}><Typography variant="caption" sx={{ fontWeight: 'bold', color: 'gray' }}>DIRECCIÓN Y LOCALIZACIÓN</Typography></Divider>
            </Box>

            <Box sx={{ gridColumn: { sm: 'span 2' } }}>
              <TextField label="Calle" fullWidth value={formData.Calle || ''} onChange={(e) => setFormData({...formData, Calle: e.target.value})} />
            </Box>

            <TextField label="Municipio" fullWidth value={formData.Municipio || ''} onChange={(e) => setFormData({...formData, Municipio: e.target.value})} />
            <TextField label="Estado" fullWidth value={formData.estado || ''} onChange={(e) => setFormData({...formData, estado: e.target.value})} />
            <TextField label="Email" fullWidth value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            <TextField label="Teléfono" fullWidth value={formData.telefono || ''} onChange={(e) => setFormData({...formData, telefono: e.target.value})} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #eee' }}>
          <Button onClick={() => setOpenForm(false)} color="inherit">Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={processing}>
            {processing ? 'Procesando...' : 'Guardar Cliente'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRMAR ELIMINAR */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>¿Eliminar registro?</DialogTitle>
        <DialogContent>Confirma que deseas eliminar al cliente <b>{selectedId}</b>. Esta acción no se puede deshacer.</DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDelete(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={processing}>Confirmar Eliminación</Button>
        </DialogActions>
      </Dialog>

      <PWABadge />
    </Box>
  )
}