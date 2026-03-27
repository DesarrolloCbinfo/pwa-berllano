import { useEffect, useState } from 'react'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { 
  Box, CircularProgress, Alert, Typography, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, IconButton, Paper, Grid 
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import Swal from 'sweetalert2'
import useConsumoApi from '../../../hooks/useConsumoApi'
import { useSessionContext } from '../../../context/SessionProvider'
import PWABadge from "../../../PWABadge"

// Props comunes para campos de formulario estilo Berllano Elegante
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

// --- 1. Interfaz de Datos ---
interface Comprador {
  clave_comprador: string | number
  nombre: string
}

export default function CatCompradores() {
  const { consumoApi } = useConsumoApi()
  const { session } = useSessionContext()
  
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
    if (!formData.clave_comprador || !formData.nombre) {
      Swal.fire('Atención', 'Todos los campos son obligatorios', 'warning');
      return;
    }
    try {
      setActionLoading(true);
      const response = await consumoApi.post('/api/CatCompradores/sp_bw_cat_compradores_add', null, {
        params: formData
      });
      if (response.data?.[0]?.codigo === 0) {
        Swal.fire({ title: '¡Éxito!', text: 'Comprador agregado correctamente', icon: 'success', timer: 2000, showConfirmButton: false });
        setOpenAdd(false);
        setFormData({ clave_comprador: '', nombre: '' });
        fetchCompradores();
      } else {
        Swal.fire('Error', response.data?.[0]?.mensaje1 || 'Error al guardar', 'error');
      }
    } catch (err) { Swal.fire('Error', 'Error de conexión', 'error'); } 
    finally { setActionLoading(false); }
  };;

// UPD - Actualizar
  const handleUpdate = async () => {
    if (!editFormData.nombre) {
      Swal.fire('Atención', 'El nombre es obligatorio', 'warning');
      return;
    }
    try {
      setActionLoading(true)
      const response = await consumoApi.put('/api/CatCompradores/sp_bw_cat_compradores_upd', null, {
        params: editFormData
      })
      if (response.data?.[0]?.codigo === 0) {
        Swal.fire({ title: '¡Éxito!', text: 'Comprador actualizado correctamente', icon: 'success', timer: 2000, showConfirmButton: false });
        setOpenEdit(false)
        fetchCompradores()
      } else {
        Swal.fire('Error', response.data?.[0]?.mensaje1 || 'Error al actualizar', 'error')
      }
    } catch (err) { Swal.fire('Error', 'Error de conexión', 'error') } 
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
        Swal.fire({ title: '¡Éxito!', text: 'Comprador eliminado correctamente', icon: 'success', timer: 2000, showConfirmButton: false });
        setOpenDelete(false);
        fetchCompradores();
      } else {
        Swal.fire('Error', response.data?.[0]?.mensaje1 || 'Error al eliminar', 'error');
      }
    } catch (err) { Swal.fire('Error', 'Error de conexión', 'error'); } 
    finally { setActionLoading(false); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>

return (
    <>
      {/* MAGIA CSS: Forzamos a SweetAlert a saltar al frente de los modales */}
      <style>{`
        .swal2-container {
          z-index: 9999 !important;
        }
      `}</style>
      <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
        <Paper sx={{ p: 3, borderRadius: '8px' }}>
          {/* ENCABEZADO */}
          <Box sx={{ border: '1px solid #2c3e50', p: 1.5, mb: 2, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                    Catálogo de Compradores
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', mt: 0.2, fontSize: '0.75rem' }}>
                    Sucursal: {session?.dSucursal || 'Cargando...'}
                </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                    {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', mt: 0.2, fontSize: '0.75rem' }}>
                    Usuario: {session?.nombre || 'Cargando...'}
                </Typography>
            </Box>
          </Box>

          <Grid container spacing={2} justifyContent="flex-start" alignItems="center" sx={{ mb: 0.5 }}>
            <Grid item xs={12} md={2}>
              <Button 
                variant="contained" 
                onClick={() => setOpenAdd(true)}
                fullWidth
                startIcon={<AddIcon />}
                sx={{ 
                  height: '50px', 
                  backgroundColor: '#333333', 
                  color: 'white', 
                  fontWeight: 600, 
                  textTransform: 'none', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)', 
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    backgroundColor: '#555555', 
                    boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)', 
                    transform: 'translateY(-1px)' 
                  }
                }}
              >
                AGREGAR
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* TABLA PRINCIPAL */}
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ 
            p: 3, 
            width: '100%', 
            maxHeight: 600, 
            mb: 3, 
            borderRadius: '8px', 
            boxShadow: '0 4px 8px rgba(0,0,0,0.08)' 
          }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>Error: {error}</Alert>}

            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row.clave_comprador}
              pageSizeOptions={[5, 10, 25, 50]}
              density="compact"
              disableRowSelectionOnClick
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 10,
                  },
                },
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  borderBottom: '2px solid #000',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  textAlign: 'center'
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #e0e0e000'
                }
              }}
            />
          </Paper>
        </Box>

        {/* PIE DE PÁGINA */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            CAT_COMPRADORES, ARAUCARIAS, {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}, USR:{session?.nombre || 'ADMIN'}
          </Typography>
        </Box>

        {/* MODAL AGREGAR */}
        <Dialog 
          open={openAdd} 
          onClose={() => setOpenAdd(false)} 
          fullWidth 
          maxWidth="xs"
          PaperProps={{
            sx: {
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              border: '1px solid #e0e0e0'
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', 
            color: 'white',
            fontFamily: 'Georgia, "Times New Roman", serif'
          }}>
            Agregar Comprador
          </DialogTitle>
          <DialogContent sx={{ p: 3, bgcolor: '#fff', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField 
              {...commonProps}
              label="Clave Comprador"
              value={formData.clave_comprador}
              onChange={(e) => setFormData({...formData, clave_comprador: e.target.value})} 
            />
            <TextField 
              {...commonProps}
              label="Nombre Completo"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f5f5f5', borderTop: '1px solid #e0e0e0' }}>
            <Button 
              onClick={() => setOpenAdd(false)}
              sx={{ 
                backgroundColor: '#e0e0e0', 
                color: '#000', 
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  backgroundColor: '#d0d0d0' 
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAdd} 
              variant="contained" 
              disabled={actionLoading}
              sx={{ 
                backgroundColor: '#333333',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  backgroundColor: '#555555',
                  boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {actionLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* MODAL EDITAR */}
        <Dialog 
          open={openEdit} 
          onClose={() => setOpenEdit(false)} 
          fullWidth 
          maxWidth="xs"
          PaperProps={{
            sx: {
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              border: '1px solid #e0e0e0'
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', 
            color: 'white',
            fontFamily: 'Georgia, "Times New Roman", serif'
          }}>
            Editar Comprador
          </DialogTitle>
          <DialogContent sx={{ p: 3, bgcolor: '#fff', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField 
              {...commonProps}
              label="Clave" 
              disabled 
              fullWidth 
              value={editFormData.clave_comprador} 
            />
            <TextField 
              {...commonProps}
              label="Nombre"
              value={editFormData.nombre}
              onChange={(e) => setEditFormData({...editFormData, nombre: e.target.value})} 
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f5f5f5', borderTop: '1px solid #e0e0e0' }}>
            <Button 
              onClick={() => setOpenEdit(false)}
              sx={{ 
                backgroundColor: '#e0e0e0', 
                color: '#000', 
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  backgroundColor: '#d0d0d0' 
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate} 
              variant="contained" 
              disabled={actionLoading}
              sx={{ 
                backgroundColor: '#333333',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  backgroundColor: '#555555',
                  boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {actionLoading ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* MODAL ELIMINAR */}
        <Dialog 
          open={openDelete} 
          onClose={() => setOpenDelete(false)}
          PaperProps={{
            sx: {
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              border: '1px solid #e0e0e0'
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)', 
            color: 'white',
            fontFamily: 'Georgia, "Times New Roman", serif'
          }}>
            Eliminar Registro
          </DialogTitle>
          <DialogContent sx={{ p: 3, bgcolor: '#fff' }}>
            <Typography sx={{ fontSize: '1.1rem', mb: 2 }}>
              ¿Seguro que deseas eliminar este registro?
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Comprador: <strong>{deleteRow?.nombre}</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
              Esta acción no se puede deshacer.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f5f5f5', borderTop: '1px solid #e0e0e0' }}>
            <Button 
              onClick={() => setOpenDelete(false)}
              sx={{ 
                backgroundColor: '#e0e0e0', 
                color: '#000', 
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  backgroundColor: '#d0d0d0' 
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              color='error'
              variant='contained'
              onClick={handleDelete}
              disabled={actionLoading}
              sx={{ 
                backgroundColor: '#d32f2f',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  backgroundColor: '#b71c1c',
                  boxShadow: '0 6px 16px rgba(211, 47, 47, 0.4)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {actionLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      <PWABadge />
    </>
  )
}