import { useEffect, useState } from 'react'
import { Box, CircularProgress, Alert, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, IconButton } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import Swal from 'sweetalert2'
import useConsumoApi from '../../../hooks/useConsumoApi'
import { useSessionContext } from '../../../context/SessionProvider'
import PWABadge from '../../../PWABadge'

// --- ESTILOS BERLLANO ELEGANTE ---
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
          '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderColor: '#999' }
      },
      '& .MuiInputLabel-root': { transform: 'translate(14px, 14px) scale(1)', color: '#666', fontWeight: 500 },
      '& .MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.75)', color: '#333', fontWeight: 600 },
      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0', borderWidth: '1.5px' }
  }
};

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
      editable: true,
      renderCell: (params) => (
        <Checkbox 
          checked={!!params.value} 
          sx={{ 
            color: '#333',
            '&.Mui-checked': { color: '#333' }
          }}
        />
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

  const handleDeleteOpen = async (row: DescuentoProveedor) => {
    const result = await Swal.fire({
      title: '¿Confirmar eliminación?',
      html: `¿Está seguro que desea eliminar el descuento<br/><strong>"${row.descripcion}"</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#999999',
      reverseButtons: true
    })

    if (result.isConfirmed) {
      try {
        const response = await consumoApi.delete(
          '/api/CatDescuentoProveedores/sp_bw_cat_proveedores_descuentos_del',
          {
            params: {
              id_descuento: row.id_descuento,
            }
          }
        )

        if (response.data?.[0]?.codigo === 0) {
          await fetchDescuentos()
          await Swal.fire({
            title: '¡Eliminado!',
            text: 'El descuento ha sido eliminado correctamente',
            icon: 'success',
            confirmButtonColor: '#000000',
            timer: 2000,
            showConfirmButton: false
          })
        } else {
          await Swal.fire({
            title: 'Error',
            text: response.data?.[0]?.mensaje1 || 'Error al eliminar',
            icon: 'error',
            confirmButtonColor: '#000000'
          })
        }
      } catch (err) {
        console.error('Error al eliminar descuento:', err)
        await Swal.fire({
          title: 'Error',
          text: 'Error al eliminar el descuento',
          icon: 'error',
          confirmButtonColor: '#000000'
        })
      }
    }
  }

  const handleDeleteClose = () => {
    setOpenDelete(false)
    setSelectedRow(null)
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
        await Swal.fire({
          title: '¡Éxito!',
          text: 'Descuento agregado correctamente',
          icon: 'success',
          confirmButtonColor: '#000000',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        await Swal.fire({
          title: 'Error',
          text: response.data?.[0]?.mensaje1 || 'Error al agregar',
          icon: 'error',
          confirmButtonColor: '#000000'
        })
      }
    } catch (err) {
      console.error('Error al agregar descuento:', err)
      await Swal.fire({
        title: 'Error',
        text: 'Error al agregar el descuento',
        icon: 'error',
        confirmButtonColor: '#000000'
      })
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
        await Swal.fire({
          title: '¡Éxito!',
          text: 'Descuento actualizado correctamente',
          icon: 'success',
          confirmButtonColor: '#000000',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        await Swal.fire({
          title: 'Error',
          text: response.data?.[0]?.mensaje1 || 'Error al actualizar',
          icon: 'error',
          confirmButtonColor: '#000000'
        })
      }
    } catch (err) {
      console.error('Error al actualizar descuento:', err)
      await Swal.fire({
        title: 'Error',
        text: 'Error al actualizar el descuento',
        icon: 'error',
        confirmButtonColor: '#000000'
      })
    }
  }

  const handleProcessRowUpdate = async (newRow: DescuentoProveedor, oldRow: DescuentoProveedor) => {
    try {
      const params = {
        id_descuento: newRow.id_descuento,
        descripcion: newRow.descripcion,
        aplica_costo: newRow.aplica_costo
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
        return newRow
      } else {
        setError(response.data?.[0]?.mensaje1 || 'Error al actualizar')
        return oldRow
      }
    } catch (err) {
      console.error('Error al actualizar descuento:', err)
      setError('Error al actualizar el descuento')
      return oldRow
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
          <Box sx={{ border: '1px solid #000000ff', p: 1.5, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000ff', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
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
              processRowUpdate={handleProcessRowUpdate}
              onProcessRowUpdateError={(error) => {
                console.error('Error al actualizar fila:', error)
                setError('Error al actualizar el registro')
              }}
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

      
        
      </Box>

     {/* --- MODAL AGREGAR --- */}
      <Dialog 
        open={openAdd} 
        onClose={handleAddClose} 
        maxWidth="sm" 
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
        <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Agregar Nuevo Descuento
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Complete la información del descuento de proveedor en el sistema
            </Typography>
          </Box>
          <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
          <IconButton 
            onClick={handleAddClose}
            sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            
            {/* Información del Descuento */}
            <Box>
              <Typography variant='subtitle1' sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} />
                Información del Descuento
              </Typography>
              <TextField
                {...commonProps}
                label="Descripción *"
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </Box>

            {/* Opciones */}
            <Box>
              
              <Box sx={{ 
                display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2,
                borderRadius: '8px', border: '1.5px solid #e0e0e0', bgcolor: '#f8f9fa',
                transition: 'all 0.3s ease', '&:hover': { borderColor: '#999', bgcolor: '#f5f5f5' }
              }}>
                <Checkbox
                  checked={!!formData.aplica_costo}
                  onChange={(e) => setFormData({ ...formData, aplica_costo: e.target.checked })}
                  sx={{ color: '#333', p: 0, mt: 0.5, '&.Mui-checked': { color: '#333' } }}
                />
                <Box>
                  <Typography variant='body2' sx={{ fontWeight: 600, color: '#333' }}>
                    Costo Neto
                  </Typography>
                  <Typography variant='caption' sx={{ color: '#666' }}>
                    Aplicar descuento al costo neto del producto
                  </Typography>
                </Box>
              </Box>
            </Box>

          </Box>
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
          <Button 
            onClick={handleAddClose}
            color="inherit"
            sx={{ borderRadius: '8px', fontWeight: 500, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAdd} 
            variant="contained"
            sx={{ 
              bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
              '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL EDITAR --- */}
      <Dialog 
        open={openEdit} 
        onClose={handleEditClose} 
        maxWidth="sm" 
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
        <Box sx={{ background: 'linear-gradient(135deg, #333333 0%, #555555 100%)', color: 'white', p: 3, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Editar Descuento: {formData.id_descuento}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Modifique la información del descuento seleccionado
            </Typography>
          </Box>
          <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
          <IconButton 
            onClick={handleEditClose}
            sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, backgroundColor: '#ffffff' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            
            {/* Información del Descuento */}
            <Box>
              <Typography variant='subtitle1' sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} />
                Información del Descuento
              </Typography>
              <TextField
                {...commonProps}
                label="Descripción *"
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </Box>

            {/* Opciones */}
            <Box>
              <Typography variant='subtitle1' sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} />
                Opciones
              </Typography>
              <Box sx={{ 
                display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2,
                borderRadius: '8px', border: '1.5px solid #e0e0e0', bgcolor: '#f8f9fa',
                transition: 'all 0.3s ease', '&:hover': { borderColor: '#999', bgcolor: '#f5f5f5' }
              }}>
                <Checkbox
                  checked={!!formData.aplica_costo}
                  onChange={(e) => setFormData({ ...formData, aplica_costo: e.target.checked })}
                  sx={{ color: '#333', p: 0, mt: 0.5, '&.Mui-checked': { color: '#333' } }}
                />
                <Box>
                  <Typography variant='body2' sx={{ fontWeight: 600, color: '#333' }}>
                    Costo Neto
                  </Typography>
                  <Typography variant='caption' sx={{ color: '#666' }}>
                    Aplicar descuento al costo neto del producto
                  </Typography>
                </Box>
              </Box>
            </Box>

          </Box>
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
          <Button 
            onClick={handleEditClose}
            color="inherit"
            sx={{ borderRadius: '8px', fontWeight: 500, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleEdit} 
            variant="contained"
            sx={{ 
              bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
              '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }
            }}
          >
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>
     <PWABadge />
    </>
  )
}
