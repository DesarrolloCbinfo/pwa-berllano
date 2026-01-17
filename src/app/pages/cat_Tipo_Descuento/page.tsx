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
interface TipoDescuento {
  tipo_descuento: number
  descripcion: string
  min_descto: number
  max_descto: number
}

export default function CatTipoDescuentos() {
  const { consumoApi } = useConsumoApi()
  
  // Estados principales
  const [rows, setRows] = useState<TipoDescuento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- 2. Estados para "Agregar" ---
  const [openAdd, setOpenAdd] = useState(false)
  const [formData, setFormData] = useState({ 
    descripcion: '', 
    min_descto: 0, 
    max_descto: 0 
  })
  const [saving, setSaving] = useState(false)

  // --- 3. Estados para "Editar" ---
  const [openEdit, setOpenEdit] = useState(false)
  const [editFormData, setEditFormData] = useState<TipoDescuento>({
    tipo_descuento: 0,
    descripcion: '',
    min_descto: 0,
    max_descto: 0
  })
  const [savingEdit, setSavingEdit] = useState(false)

  // --- 4. Estados para "Eliminar" ---
  const [openDelete, setOpenDelete] = useState(false)
  const [deleteRow, setDeleteRow] = useState<TipoDescuento | null>(null)
  const [deleting, setDeleting] = useState(false)

  // --- 5. Definición de Columnas ---
  const columns: GridColDef[] = [
    { field: 'tipo_descuento', headerName: 'ID', width: 70 },
    { field: 'descripcion', headerName: 'Descripción', width: 300 },
    { 
      field: 'min_descto', 
      headerName: 'Min Dto', 
      width: 100, 
      valueFormatter: (value: number) => {
        if (value == null) return '0%';
        return `${(value * 100).toFixed(0)}%`;
      }
    },
    { 
      field: 'max_descto', 
      headerName: 'Max Dto', 
      width: 100,
      valueFormatter: (value: number) => {
        if (value == null) return '0%';
        return `${(value * 100).toFixed(0)}%`;
      }
    },
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

  // --- 6. Funciones de API ---

  const fetchDescuentos = async () => {
    try {
      setLoading(true)
      const response = await consumoApi.get('/api/CatTipoDescuento/sp_bw_cat_tipos_descuento_sel?tipo_descuento=0')
      setRows(response.data)
    } catch (err) {
      setError('Error al cargar los descuentos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDescuentos() }, [])

  const handleAdd = async () => {
    if (!formData.descripcion) return;
    try {
      setSaving(true);
      const response = await consumoApi.post('/api/CatTipoDescuento/sp_bw_cat_tipos_descuento_add', null, {
        params: {
          descripcion: formData.descripcion,
          min_descto: formData.min_descto,
          max_descto: formData.max_descto,
        },
      });
      if (response.data?.[0]?.codigo === 0) {
        setOpenAdd(false);
        setFormData({ descripcion: '', min_descto: 0, max_descto: 0 });
        fetchDescuentos();
      } else {
        alert(response.data?.[0]?.mensaje1 || 'Error al guardar');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    try {
      setSavingEdit(true)
      const response = await consumoApi.put('/api/CatTipoDescuento/sp_bw_cat_tipos_descuento_upd', null, {
        params: {
          tipo_descuento: editFormData.tipo_descuento,
          descripcion: editFormData.descripcion,
          min_descto: editFormData.min_descto,
          max_descto: editFormData.max_descto,
        },
      })
      if (response.data?.[0]?.codigo === 0) {
        setOpenEdit(false)
        fetchDescuentos()
      } else {
        alert(response.data?.[0]?.mensaje1 || 'Error al actualizar')
      }
    } catch (err) {
      alert('Error de conexión')
    } finally { setSavingEdit(false) }
  }

  const handleDelete = async () => {
    if (!deleteRow) return;
    try {
      setDeleting(true);
      const response = await consumoApi.delete('/api/CatTipoDescuento/sp_bw_cat_tipos_descuento_del', {
        params: { tipo_descuento: deleteRow.tipo_descuento },
      });
      if (response.data?.[0]?.codigo === 0) {
        setOpenDelete(false);
        fetchDescuentos();
      } else {
        alert(response.data?.[0]?.mensaje1 || 'Error al eliminar');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally { setDeleting(false); }
  };

  // --- 7. Renderizado ---

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
  if (error) return <Alert severity="error">{error}</Alert>

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Catálogo Tipos de Descuento</Typography>
      
      <Button variant="contained" onClick={() => setOpenAdd(true)} sx={{ mb: 2 }}>
        Nuevo Descuento
      </Button>

      <DataGrid 
        rows={rows} 
        columns={columns} 
        getRowId={(row) => row.tipo_descuento} 
        autoHeight
        sx={{ backgroundColor: 'white', borderRadius: 2, boxShadow: 1 }}
      />

      {/* --- MODAL AGREGAR --- */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="xs">
        <DialogTitle>Agregar Nuevo Descuento</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField 
            label="Descripción" 
            fullWidth
            value={formData.descripcion}
            onChange={(e) => setFormData({...formData, descripcion: e.target.value})} 
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField 
              label="Min Dto (Ej: 0.1)" type="number" inputProps={{ step: "0.01" }}
              value={formData.min_descto}
              onChange={(e) => setFormData({...formData, min_descto: parseFloat(e.target.value) || 0})} 
            />
            <TextField 
              label="Max Dto (Ej: 1.0)" type="number" inputProps={{ step: "0.01" }}
              value={formData.max_descto}
              onChange={(e) => setFormData({...formData, max_descto: parseFloat(e.target.value) || 0})} 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancelar</Button>
          <Button onClick={handleAdd} variant="contained" disabled={saving}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL EDITAR --- */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="xs">
        <DialogTitle>Editar Descuento</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="ID" disabled fullWidth value={editFormData.tipo_descuento} />
          <TextField 
            label="Descripción" fullWidth
            value={editFormData.descripcion}
            onChange={(e) => setEditFormData({...editFormData, descripcion: e.target.value})} 
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField 
              label="Min Dto" type="number" inputProps={{ step: "0.01" }}
              value={editFormData.min_descto}
              onChange={(e) => setEditFormData({...editFormData, min_descto: parseFloat(e.target.value) || 0})} 
            />
            <TextField 
              label="Max Dto" type="number" inputProps={{ step: "0.01" }}
              value={editFormData.max_descto}
              onChange={(e) => setEditFormData({...editFormData, max_descto: parseFloat(e.target.value) || 0})} 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancelar</Button>
          <Button onClick={handleUpdate} variant="contained" disabled={savingEdit}>Actualizar</Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL ELIMINAR --- */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Eliminar</DialogTitle>
        <DialogContent>¿Deseas eliminar el descuento: <strong>{deleteRow?.descripcion}</strong>?</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      <PWABadge />
    </Box>
  )
}