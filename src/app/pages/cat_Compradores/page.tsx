import { useEffect, useState } from 'react'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { 
  Box, CircularProgress, Alert, Typography, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, IconButton 
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import useConsumoApi from '../../../hooks/useConsumoApi'
import PWABadge from "../../../PWABadge"

// --- 1. Interfaz de Datos ---
interface Comprador {
  clave_comprador: string | number
  nombre: string
}

export default function CatCompradores() {
  const { consumoApi } = useConsumoApi()
  
  // Estados principales
  const [rows, setRows] = useState<Comprador[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- 2. Estados para Formularios (Agregar / Editar) ---
  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)

  const [formData, setFormData] = useState({ clave_comprador: '', nombre: '' })
  const [editFormData, setEditFormData] = useState<Comprador>({ clave_comprador: '', nombre: '' })
  const [deleteRow, setDeleteRow] = useState<Comprador | null>(null)

  const [actionLoading, setActionLoading] = useState(false)

  // --- 3. Definición de Columnas ---
  const columns: GridColDef[] = [
    { field: 'clave_comprador', headerName: 'Clave', width: 150 },
    { field: 'nombre', headerName: 'Nombre del Comprador', width: 400 },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton 
            color="primary" 
            onClick={() => {
              setEditFormData(params.row);
              setOpenEdit(true);
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton 
            color="error" 
            onClick={() => {
              setDeleteRow(params.row);
              setOpenDelete(true);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ]

  // --- 4. Funciones de API ---

  // SEL - Consultar
  const fetchCompradores = async () => {
    try {
      setLoading(true)
      const response = await consumoApi.get('/api/CatCompradores/sp_bw_cat_compradores_sel?clave_comprador=0')
      setRows(response.data)
    } catch (err) {
      setError('Error al cargar compradores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCompradores() }, [])

  // ADD - Agregar
  const handleAdd = async () => {
    if (!formData.clave_comprador || !formData.nombre) return;
    try {
      setActionLoading(true);
      const response = await consumoApi.post('/api/CatCompradores/sp_bw_cat_compradores_add', null, {
        params: formData
      });
      if (response.data?.[0]?.codigo === 0) {
        setOpenAdd(false);
        setFormData({ clave_comprador: '', nombre: '' });
        fetchCompradores();
      } else {
        alert(response.data?.[0]?.mensaje1 || 'Error al guardar');
      }
    } catch (err) { alert('Error de conexión'); } 
    finally { setActionLoading(false); }
  };

  // UPD - Actualizar
  const handleUpdate = async () => {
    try {
      setActionLoading(true)
      const response = await consumoApi.put('/api/CatCompradores/sp_bw_cat_compradores_upd', null, {
        params: editFormData
      })
      if (response.data?.[0]?.codigo === 0) {
        setOpenEdit(false)
        fetchCompradores()
      } else {
        alert(response.data?.[0]?.mensaje1 || 'Error al actualizar')
      }
    } catch (err) { alert('Error de conexión') } 
    finally { setActionLoading(false) }
  }

  // DEL - Eliminar
  const handleDelete = async () => {
    if (!deleteRow) return;
    try {
      setActionLoading(true);
      const response = await consumoApi.delete('/api/CatCompradores/sp_bw_cat_compradores_del', {
        params: { clave_comprador: deleteRow.clave_comprador },
      });
      if (response.data?.[0]?.codigo === 0) {
        setOpenDelete(false);
        fetchCompradores();
      } else {
        alert(response.data?.[0]?.mensaje1 || 'Error al eliminar');
      }
    } catch (err) { alert('Error de conexión'); } 
    finally { setActionLoading(false); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Catálogo de Compradores</Typography>
      
      <Button variant="contained" onClick={() => setOpenAdd(true)} sx={{ mb: 2 }}>
        Nuevo Comprador
      </Button>

      <DataGrid 
        rows={rows} 
        columns={columns} 
        getRowId={(row) => row.clave_comprador} 
        autoHeight
        sx={{ backgroundColor: 'white', borderRadius: 2, boxShadow: 1 }}
      />

      {/* MODAL AGREGAR */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="xs">
        <DialogTitle>Agregar Comprador</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField 
            label="Clave Comprador" fullWidth
            value={formData.clave_comprador}
            onChange={(e) => setFormData({...formData, clave_comprador: e.target.value})} 
          />
          <TextField 
            label="Nombre Completo" fullWidth
            value={formData.nombre}
            onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancelar</Button>
          <Button onClick={handleAdd} variant="contained" disabled={actionLoading}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL EDITAR */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="xs">
        <DialogTitle>Editar Comprador</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Clave" disabled fullWidth value={editFormData.clave_comprador} />
          <TextField 
            label="Nombre" fullWidth
            value={editFormData.nombre}
            onChange={(e) => setEditFormData({...editFormData, nombre: e.target.value})} 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancelar</Button>
          <Button onClick={handleUpdate} variant="contained" disabled={actionLoading}>Actualizar</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL ELIMINAR */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Eliminar</DialogTitle>
        <DialogContent>¿Eliminar al comprador: <strong>{deleteRow?.nombre}</strong>?</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>No</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={actionLoading}>Sí, Eliminar</Button>
        </DialogActions>
      </Dialog>

      <PWABadge />
    </Box>
  )
}