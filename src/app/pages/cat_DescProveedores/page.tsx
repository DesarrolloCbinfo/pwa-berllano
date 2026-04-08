import { useEffect, useState } from 'react'
import { Box, CircularProgress, Alert, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, IconButton } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import useConsumoApi from '../../../hooks/useConsumoApi'
import { useSessionContext } from '../../../context/SessionProvider'
import PWABadge from '../../../PWABadge'

interface DescuentoProveedor {
  id: number
  id_descuento: number
  descripcion: string
  aplica_costo: boolean
}

export default function CatDescProveedores() {
  const { consumoApi } = useConsumoApi()
  const { session } = useSessionContext() // <--- Extraemos la sesión
  const [rows, setRows] = useState<DescuentoProveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [selectedRow, setSelectedRow] = useState<DescuentoProveedor | null>(null)

  const [formData, setFormData] = useState({
    id_descuento: 0,
    descripcion: '',
    aplica_costo: false,
  })

  const columns: GridColDef[] = [
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => handleEditOpen(params.row)} size="small">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton color="error" onClick={() => handleDeleteOpen(params.row)} size="small">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
    { 
      field: 'descripcion', 
      headerName: 'Descripción', 
      width: 300,
      type: 'string' 
    },
    {
      field: 'aplica_costo',
      headerName: 'Costo Neto',
      width: 150,
      type: 'boolean',
      renderCell: (params) => (
        <Checkbox checked={!!params.value} disabled />
      ),
    },
  ]

  const fetchDescuentos = async () => {
    try {
      setLoading(true)
      const res = await consumoApi.get('/api/CatDescuentoProveedores/sp_bw_cat_proveedores_descuentos_sel')
      
      const data = res.data.map((item: any, index: number) => ({
        id: index,
        id_descuento: item.id_descuento,
        descripcion: item.descripcion,
        aplica_costo: item.aplica_costo,
      }))

      setRows(data)
      setError(null)
    } catch (err) {
      console.error('Error al cargar descuentos de proveedores:', err)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDescuentos()
  }, [])

  const handleAddOpen = () => {
    setFormData({
      id_descuento: 0,
      descripcion: '',
      aplica_costo: false,
    })
    setOpenAdd(true)
  }

  const handleAddClose = () => {
    setOpenAdd(false)
  }

  const handleEditOpen = (row: DescuentoProveedor) => {
    setSelectedRow(row)
    setFormData({
      id_descuento: row.id_descuento,
      descripcion: row.descripcion,
      aplica_costo: row.aplica_costo,
    })
    setOpenEdit(true)
  }

  const handleEditClose = () => {
    setOpenEdit(false)
    setSelectedRow(null)
  }

  const handleDeleteOpen = (row: DescuentoProveedor) => {
    setSelectedRow(row)
    setOpenDelete(true)
  }

  const handleDeleteClose = () => {
    setOpenDelete(false)
    setSelectedRow(null)
  }

  const handleDelete = async () => {
    if (!selectedRow) return

    try {
      const response = await consumoApi.delete(
        '/api/CatDescuentoProveedores/sp_bw_cat_proveedores_descuentos_del',
        {
          params: {
            id_descuento: selectedRow.id_descuento,
          }
        }
      )

      if (response.data?.[0]?.codigo === 0) {
        await fetchDescuentos()
        handleDeleteClose()
      } else {
        setError(response.data?.[0]?.mensaje1 || 'Error al eliminar')
      }
    } catch (err) {
      console.error('Error al eliminar descuento:', err)
      setError('Error al eliminar el descuento')
    }
  }

  const handleAdd = async () => {
    try {
      const params = {
        descripcion: formData.descripcion,
        aplica_costo: formData.aplica_costo
      }
      
      const response = await consumoApi.post(
        '/api/CatDescuentoProveedores/sp_bw_cat_proveedores_descuentos_add',
        {},
        {
          params
        }
      )

      if (response.data?.[0]?.codigo === 0) {
        await fetchDescuentos()
        handleAddClose()
      } else {
        setError(response.data?.[0]?.mensaje1 || 'Error al agregar')
      }
    } catch (err) {
      console.error('Error al agregar descuento:', err)
      setError('Error al agregar el descuento')
    }
  }

  const handleEdit = async () => {
    try {
      const params = {
        id_descuento: formData.id_descuento,
        descripcion: formData.descripcion,
        aplica_costo: formData.aplica_costo
      }
      
      const response = await consumoApi.put(
        '/api/CatDescuentoProveedores/sp_bw_cat_proveedores_descuentos_upd',
        {},
        {
          params
        }
      )

      if (response.data?.[0]?.codigo === 0) {
        await fetchDescuentos()
        handleEditClose()
      } else {
        setError(response.data?.[0]?.mensaje1 || 'Error al actualizar')
      }
    } catch (err) {
      console.error('Error al actualizar descuento:', err)
      setError('Error al actualizar el descuento')
    }
  }
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

return (
    <>
      <Box sx={{ width: '100%', p: 3, backgroundColor: '#ececec', minHeight: '100vh' }}>
        
        {/* MAGIA CSS */}
        <style>{`
          .swal2-container {
            z-index: 9999 !important;
          }
        `}</style>

        {/* CONTENEDOR BLANCO PRINCIPAL (ENCABEZADO Y BOTÓN) */}
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)', mb: 3 }}>
          
          {/* RECUADRO INTERIOR ELEGANTE */}
          <Box sx={{ border: '1px solid #2c3e50', p: 1.5, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                      CATÁLOGO DE DESCUENTOS DE PROVEEDORES
                  </Typography>
                  
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                      {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                  </Typography>
                 
              </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* BOTÓN FUERA DEL RECUADRO PERO DENTRO DEL CONTENEDOR BLANCO */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button 
              variant="contained" 
              onClick={handleAddOpen}
              sx={{
                backgroundColor: '#333333',
                color: '#fff',
                textTransform: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: '#555555',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)'
                }
              }}
            >
              + AGREGAR DESCUENTO
            </Button>
          </Box>
        </Box>

        {/* CONTENEDOR DE LA TABLA ESTILO ELEGANTE */}
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 100 },
                },
              }}
              density="compact"
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                height: '100%',
                '& .MuiDataGrid-columnHeaders': { borderBottom: '2px solid #000', fontSize: '0.9rem', fontWeight: 'bold', backgroundColor: '#f5f5f5' },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid #e0e0e000' },
                '& .MuiDataGrid-row': { cursor: 'pointer', transition: 'all 0.2s ease' },
                '& .MuiDataGrid-row:hover': { bgcolor: '#fafafa' }
              }}
            />
          </Box>
        </Box>

        {/* PIE DE PÁGINA ESTILO ELEGANTE */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
            CAT_DESCPROVEEDORES, {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}, USR: {session?.nombre || 'ADMIN'}
          </Typography>
        </Box>
        
      </Box>

      {/* Dialog Agregar */}
      <Dialog 
        open={openAdd} 
        onClose={handleAddClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#424242', 
          color: 'white',
          py: 2.5,
          px: 3
        }}>
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            Agregar Nuevo Descuento de Proveedor
          </Typography>
          <Typography variant='body2' sx={{ color: '#e0e0e0', mt: 0.5 }}>
            Complete la información del descuento en los campos correspondientes
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#fafafa' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Información del Descuento */}
            <Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 2,
                borderLeft: '3px solid #424242',
                pl: 1.5
              }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                  Información del Descuento
                </Typography>
              </Box>
              <TextField
                label="Descripción *"
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                fullWidth
                size='small'
                sx={{ bgcolor: 'white' }}
              />
            </Box>

            {/* Opciones */}
            <Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 2,
                borderLeft: '3px solid #424242',
                pl: 1.5
              }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                  Opciones
                </Typography>
              </Box>
              <Box sx={{ 
                bgcolor: 'white', 
                p: 2.5, 
                borderRadius: 1,
                border: '1px solid #e0e0e0'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid #f0f0f0',
                  bgcolor: '#fafafa'
                }}>
                  <Checkbox
                    checked={!!formData.aplica_costo}
                    onChange={(e) => setFormData({ ...formData, aplica_costo: e.target.checked })}
                    style={{ marginTop: '2px' }}
                  />
                  <Box>
                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                      Costo Neto
                    </Typography>
                    <Typography variant='caption' sx={{ color: '#666' }}>
                      Aplicar descuento al costo neto del producto
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={handleAddClose}
            sx={{ textTransform: 'uppercase', fontWeight: 600 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAdd} 
            variant="contained"
            sx={{ 
              bgcolor: '#212121',
              textTransform: 'uppercase',
              fontWeight: 600,
              px: 4,
              '&:hover': {
                bgcolor: '#424242'
              }
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog 
        open={openEdit} 
        onClose={handleEditClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#424242', 
          color: 'white',
          py: 2.5,
          px: 3
        }}>
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            Editar Descuento de Proveedor: {formData.id_descuento}
          </Typography>
          <Typography variant='body2' sx={{ color: '#e0e0e0', mt: 0.5 }}>
            Complete la información del descuento en los campos correspondientes
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#fafafa' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Información del Descuento */}
            <Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 2,
                borderLeft: '3px solid #424242',
                pl: 1.5
              }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                  Información del Descuento
                </Typography>
              </Box>
              <TextField
                label="Descripción *"
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                fullWidth
                size='small'
                sx={{ bgcolor: 'white' }}
              />
            </Box>

            {/* Opciones */}
            <Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 2,
                borderLeft: '3px solid #424242',
                pl: 1.5
              }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                  Opciones
                </Typography>
              </Box>
              <Box sx={{ 
                bgcolor: 'white', 
                p: 2.5, 
                borderRadius: 1,
                border: '1px solid #e0e0e0'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid #f0f0f0',
                  bgcolor: '#fafafa'
                }}>
                  <Checkbox
                    checked={!!formData.aplica_costo}
                    onChange={(e) => setFormData({ ...formData, aplica_costo: e.target.checked })}
                    style={{ marginTop: '2px' }}
                  />
                  <Box>
                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                      Costo Neto
                    </Typography>
                    <Typography variant='caption' sx={{ color: '#666' }}>
                      Aplicar descuento al costo neto del producto
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={handleEditClose}
            sx={{ textTransform: 'uppercase', fontWeight: 600 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleEdit} 
            variant="contained"
            sx={{ 
              bgcolor: '#212121',
              textTransform: 'uppercase',
              fontWeight: 600,
              px: 4,
              '&:hover': {
                bgcolor: '#424242'
              }
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={openDelete} onClose={handleDeleteClose}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar el descuento "{selectedRow?.descripcion}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancelar</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

     <PWABadge />
    </>
  )
}
