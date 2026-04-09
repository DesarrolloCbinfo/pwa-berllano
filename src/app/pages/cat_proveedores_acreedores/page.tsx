import { useEffect, useState } from 'react'
import { Box, CircularProgress, Alert, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import Swal from 'sweetalert2'
import useConsumoApi from '../../../hooks/useConsumoApi'
import { useSessionContext } from '../../../context/SessionProvider'
import PWABadge from '../../../PWABadge'

interface Proveedor {
  id: number
  cve_prov: string
  nombre: string
  rfc: string | null
  telefono: string | null
  fecha_alta: string | null
}

export default function CatProveedoresAcreedores() {
  const { consumoApi } = useConsumoApi()
  const { session } = useSessionContext()
  const [rows, setRows] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')

  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openView, setOpenView] = useState(false)
  const [viewData, setViewData] = useState<any>(null)

  const [formData, setFormData] = useState({
    cve_prov: '',
    nombre: '',
    rfc: '',
    calle: '',
    colonia: '',
    telefono: '',
    ciudad: '',
    estado: '',
    cp: '',
    contacto: '',
    fax: '',
    email: '',
    observaciones: '',
    nombre_fiscal: '',
    cuenta_contable: '',
  })

  const columns: GridColDef[] = [
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <IconButton onClick={(e) => { e.stopPropagation(); handleEditOpen(params.row); }} size="small">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton color="error" onClick={(e) => { e.stopPropagation(); handleDeleteOpen(params.row); }} size="small">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
    { 
      field: 'cve_prov', 
      headerName: 'Clave', 
      width: 150,
      type: 'string' 
    },
    { 
      field: 'nombre', 
      headerName: 'Nombre', 
      width: 300,
      type: 'string' 
    },
    { 
      field: 'rfc', 
      headerName: 'RFC', 
      width: 200,
      type: 'string' 
    },
    { 
      field: 'telefono', 
      headerName: 'Teléfono', 
      width: 200,
      type: 'string' 
    },
    { 
      field: 'fecha_alta', 
      headerName: 'Fecha Alta', 
      width: 180,
      renderCell: (params) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        return date.toLocaleString('es-MX', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    },
  ]

  const fetchProveedores = async () => {
    try {
      setLoading(true)
      
      const res = await consumoApi.get('/api/CatProveedores_Acreedores/sp_bw_cat_proveedores_admon_sel/0')
      
      console.log('Respuesta del API:', res.data)
      
      if (!res.data || !Array.isArray(res.data)) {
        console.error('La respuesta no es un array:', res.data)
        setError('Formato de respuesta inválido')
        setRows([])
        return
      }

      const data = res.data.map((item: any, index: number) => ({
        id: index,
        cve_prov: item.cve_prov || '',
        nombre: item.nombre || '',
        rfc: item.rfc || '',
        telefono: item.telefono || '',
        fecha_alta: item.fecha_alta || null,
      }))

      console.log('Datos procesados:', data)
      setRows(data)
      setError(null)
    } catch (err: any) {
      console.error('Error al cargar proveedores:', err)
      console.error('Detalles del error:', err.response?.data || err.message)
      setError(`Error al cargar los datos: ${err.response?.data?.message || err.message || 'Error desconocido'}`)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProveedores()
  }, [])

  const handleAddOpen = () => {
    setFormData({
      cve_prov: '',
      nombre: '',
      rfc: '',
      calle: '',
      colonia: '',
      telefono: '',
      ciudad: '',
      estado: '',
      cp: '',
      contacto: '',
      fax: '',
      email: '',
      observaciones: '',
      nombre_fiscal: '',
      cuenta_contable: '',
    })
    setOpenAdd(true)
  }

  const handleAddClose = () => {
    setOpenAdd(false)
  }

  const handleViewOpen = async (row: Proveedor) => {
    try {
      setLoading(true)
      
      const response = await consumoApi.get(
        `/api/CatProveedores_Acreedores/sp_bw_cat_proveedores_admon_sel/${row.cve_prov}`
      )
      
      if (response.data && response.data.length > 0) {
        setViewData(response.data[0])
        setOpenView(true)
      } else {
        setError('No se pudieron cargar los datos del proveedor')
      }
    } catch (err) {
      console.error('Error al cargar datos del proveedor:', err)
      setError('Error al cargar los datos del proveedor')
    } finally {
      setLoading(false)
    }
  }

  const handleViewClose = () => {
    setOpenView(false)
    setViewData(null)
  }

  const handleEditOpen = async (row: Proveedor) => {
    try {
      setLoading(true)
      
      const response = await consumoApi.get(
        `/api/CatProveedores_Acreedores/sp_bw_cat_proveedores_admon_sel/${row.cve_prov}`
      )
      
      if (response.data && response.data.length > 0) {
        const proveedorData = response.data[0]
        setFormData({
          cve_prov: proveedorData.cve_prov || '',
          nombre: proveedorData.nombre || '',
          rfc: proveedorData.rfc || '',
          calle: proveedorData.calle || '',
          colonia: proveedorData.colonia || '',
          telefono: proveedorData.telefono || '',
          ciudad: proveedorData.ciudad || '',
          estado: proveedorData.estado || '',
          cp: proveedorData.cp || '',
          contacto: proveedorData.contacto || '',
          fax: proveedorData.fax || '',
          email: proveedorData.email || '',
          observaciones: proveedorData.observaciones || '',
          nombre_fiscal: proveedorData.nombre_fiscal || '',
          cuenta_contable: proveedorData.cuenta_contable || '',
        })
        setOpenEdit(true)
      } else {
        setError('No se pudieron cargar los datos del proveedor')
      }
    } catch (err) {
      console.error('Error al cargar datos del proveedor:', err)
      setError('Error al cargar los datos del proveedor')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClose = () => {
    setOpenEdit(false)
  }

  const handleDeleteOpen = async (row: Proveedor) => {
    const result = await Swal.fire({
      title: '¿Eliminar Proveedor?',
      html: `
        <p style="font-size: 16px; margin-bottom: 10px;">¿Está seguro que desea eliminar este proveedor?</p>
        <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-top: 15px;">
          <p style="margin: 0; color: #666; font-size: 14px;"><strong>Clave:</strong> ${row.cve_prov}</p>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;"><strong>Nombre:</strong> ${row.nombre}</p>
        </div>
        <p style="color: #5f5f5fff; font-size: 14px; margin-top: 15px;"><strong> Esta acción no se puede deshacer</strong></p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#000000ff',
      cancelButtonColor: '#757575',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      const response = await consumoApi.delete(
        '/api/CatProveedores_Acreedores/sp_bw_cat_proveedores_admon_del',
        {
          params: {
            cve_prov: row.cve_prov,
          }
        }
      )

      if (response.data?.[0]?.codigo === 0) {
        await fetchProveedores()
        
        Swal.fire({
          title: '¡Eliminado!',
          text: 'El proveedor ha sido eliminado correctamente.',
          icon: 'success',
          confirmButtonColor: '#333333',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        Swal.fire({
          title: 'Error',
          text: response.data?.[0]?.mensaje1 || 'Error al eliminar el proveedor',
          icon: 'error',
          confirmButtonColor: '#333333'
        })
      }
    } catch (err: any) {
      console.error('Error al eliminar proveedor:', err)
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.mensaje1 || 'Error al eliminar el proveedor',
        icon: 'error',
        confirmButtonColor: '#333333'
      })
    }
  }

  const handleAdd = async () => {
    try {
      const params = {
        nombre: formData.nombre,
        rfc: formData.rfc || '',
        calle: formData.calle || '',
        colonia: formData.colonia || '',
        telefono: formData.telefono || '',
        ciudad: formData.ciudad || '',
        estado: formData.estado || '',
        cp: formData.cp || '',
        contacto: formData.contacto || '',
        fax: formData.fax || '',
        email: formData.email || '',
        observaciones: formData.observaciones || '',
        nombre_fiscal: formData.nombre_fiscal || '',
        cuenta_contable: formData.cuenta_contable || '',
      }

      const response = await consumoApi.post(
        '/api/CatProveedores_Acreedores/sp_bw_cat_proveedores_admon_add',
        {},
        {
          params
        }
      )

      if (response.data?.codigo === 0) {
        await fetchProveedores()
        handleAddClose()
        
        Swal.fire({
          title: '¡Éxito!',
          html: `
            <p style="font-size: 16px; margin-bottom: 15px;">El proveedor ha sido registrado exitosamente.</p>
            <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 15px; border-radius: 8px; margin-top: 10px;">
              <p style="color: white; font-size: 14px; margin: 0; opacity: 0.9;">Nueva Clave Asignada</p>
              <p style="color: white; font-size: 24px; font-weight: bold; margin: 5px 0 0 0;">${response.data.nuevaClave}</p>
            </div>
          `,
          icon: 'success',
          confirmButtonColor: '#333333',
          confirmButtonText: 'Aceptar'
        })
      } else {
        Swal.fire({
          title: 'Error',
          text: response.data?.mensaje1 || 'Error al agregar el proveedor',
          icon: 'error',
          confirmButtonColor: '#333333'
        })
      }
    } catch (err: any) {
      console.error('Error al agregar proveedor:', err)
      Swal.fire('Error', err.response?.data?.mensaje1 || 'Error al agregar el proveedor', 'error')
    }
  }

  const handleEdit = async () => {
    try {
      if (!formData.cve_prov) {
        Swal.fire('Error', 'No se pudo identificar el proveedor a actualizar', 'error')
        return
      }

      const body = {
        cve_prov: formData.cve_prov || '',
        nombre: formData.nombre || '',
        rfc: formData.rfc || '',
        calle: formData.calle || '',
        colonia: formData.colonia || '',
        telefono: formData.telefono || '',
        ciudad: formData.ciudad || '',
        estado: formData.estado || '',
        cp: formData.cp || '',
        contacto: formData.contacto || '',
        fax: formData.fax || '',
        email: formData.email || '',
        observaciones: formData.observaciones || '',
        nombre_fiscal: formData.nombre_fiscal || '',
        cuenta_contable: formData.cuenta_contable || '',
      }

      console.log('Datos de actualización:', body)

      const response = await consumoApi.put(
        '/api/CatProveedores_Acreedores/sp_bw_cat_proveedores_admon_upd',
        body
      )

      if (response.data?.codigo === 0) {
        await fetchProveedores()
        handleEditClose()
        
        Swal.fire({
          title: '¡Actualizado!',
          text: 'El proveedor ha sido actualizado correctamente.',
          icon: 'success',
          confirmButtonColor: '#333333',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        Swal.fire({
          title: 'Error',
          text: response.data?.mensaje1 || 'Error al actualizar el proveedor',
          icon: 'error',
          confirmButtonColor: '#333333'
        })
      }
    } catch (err: any) {
      console.error('Error al actualizar proveedor:', err)
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.mensaje1 || 'Error al actualizar el proveedor',
        icon: 'error',
        confirmButtonColor: '#333333'
      })
    }
  }

  const filteredRows = rows.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchText.toLowerCase())
    )
  )

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
        
        {/* ENCABEZADO ESTILO ELEGANTE */}
        <Box sx={{ p: 3, borderRadius: '8px', mb: 3, boxShadow: '0 4px 8px rgba(0,0,0,0.05)', bgcolor: 'white' }}>
          
          <Box sx={{ border: '1px solid #000000ff', p: 1.5, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000ff', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                      CATÁLOGO DE PROVEEDORES (ACREEDORES)
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

          {/* BOTÓN Y BUSCADOR DENTRO DEL CONTENEDOR BLANCO */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button 
              variant='contained' 
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
              + CREAR PROVEEDOR
            </Button>

            <Box sx={{ flexGrow: 1 }} />

            <TextField
              placeholder="Buscar..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="small"
              sx={{ 
                width: 300,
                '& .MuiInputBase-root': {
                  height: '45px',
                  borderRadius: '8px',
                }
              }}
            />
          </Box>
        </Box>

        {/* CONTENEDOR DE LA TABLA */}
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
          <Box sx={{ height: 600, width: '100%' }}>
             <DataGrid
              rows={filteredRows}
              columns={columns}
              pageSizeOptions={[10, 25, 50, 100]}
              onRowClick={(params) => handleViewOpen(params.row)}
              density="compact"
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold',
                  borderBottom: '2px solid #000',
                  fontSize: '1rem',
                  textAlign: 'center'
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #e0e0e000'
                },
                '& .MuiDataGrid-row': {
                  cursor: 'pointer',
                }
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Dialog Agregar */}
      <Dialog 
        open={openAdd} 
        onClose={handleAddClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#333333', 
          color: 'white',
          py: 2.5,
          px: 3,
          borderBottom: '1px solid #e0e0e0'
        }}>
          <Box>
            <Typography variant='h6' component="div" sx={{ fontWeight: 600 }}>
              Agregar Nuevo Proveedor (Acreedor)
            </Typography>
            <Typography variant='body2' component="div" sx={{ color: '#e0e0e0', mt: 0.5 }}>
              Complete la información del proveedor en los campos correspondientes
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#fafafa' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Información General */}
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
                  Información General
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Nombre *"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    fullWidth
                    size='small'
                    sx={{ bgcolor: 'white' }}
                  />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="RFC"
                    value={formData.rfc}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                    fullWidth
                    size='small'
                    sx={{ bgcolor: 'white' }}
                  />
                  <TextField
                    label="Nombre Fiscal"
                    value={formData.nombre_fiscal}
                    onChange={(e) => setFormData({ ...formData, nombre_fiscal: e.target.value })}
                    fullWidth
                    size='small'
                    sx={{ bgcolor: 'white' }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Dirección */}
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
                  Dirección
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Calle"
                  value={formData.calle}
                  onChange={(e) => setFormData({ ...formData, calle: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
                <TextField
                  label="Colonia"
                  value={formData.colonia}
                  onChange={(e) => setFormData({ ...formData, colonia: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
                <TextField
                  label="Ciudad"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
                <TextField
                  label="Estado"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
                <TextField
                  label="Código Postal"
                  value={formData.cp}
                  onChange={(e) => setFormData({ ...formData, cp: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
              </Box>
            </Box>

            {/* Contacto */}
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
                  Contacto
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Teléfono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
                <TextField
                  label="Fax"
                  value={formData.fax}
                  onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
                <TextField
                  label="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
                <TextField
                  label="Contacto"
                  value={formData.contacto}
                  onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
              </Box>
            </Box>

            {/* Información Contable */}
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
                  Información Contable
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Cuenta Contable"
                  value={formData.cuenta_contable}
                  onChange={(e) => setFormData({ ...formData, cuenta_contable: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
                <TextField
                  label="Observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ gridColumn: '1 / -1', bgcolor: 'white' }}
                  multiline
                  rows={2}
                />
              </Box>
            </Box>

          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={handleAddClose}
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              color: '#666',
              '&:hover': {
                color: '#333',
                backgroundColor: 'rgba(0,0,0,0.04)'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAdd} 
            variant="contained"
            sx={{ 
              backgroundColor: '#333333',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)',
              transition: 'all 0.3s ease',
              px: 4,
              '&:hover': { 
                backgroundColor: '#555555',
                boxShadow: '0 6px 16px rgba(51, 51, 51, 0.4)',
                transform: 'translateY(-1px)'
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
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#333333', 
          color: 'white',
          py: 2.5,
          px: 3,
          borderBottom: '1px solid #e0e0e0'
        }}>
          <Box>
            <Typography variant='h6' component="div" sx={{ fontWeight: 600 }}>
              Editar Proveedor: {formData.cve_prov}
            </Typography>
            <Typography variant='body2' component="div" sx={{ color: '#e0e0e0', mt: 0.5 }}>
              Modifique la información del proveedor según sea necesario
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#fafafa' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Información General */}
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
                  Información General
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Clave"
                  value={formData.cve_prov}
                  onChange={(e) => setFormData({ ...formData, cve_prov: e.target.value })}
                  fullWidth
                  disabled
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
                <TextField
                  label="Nombre *"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
                <TextField
                  label="RFC"
                  value={formData.rfc}
                  onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
                <TextField
                  label="Nombre Fiscal"
                  value={formData.nombre_fiscal}
                  onChange={(e) => setFormData({ ...formData, nombre_fiscal: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
              </Box>
            </Box>

            {/* Dirección */}
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
                  Dirección
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Calle"
                  value={formData.calle}
                  onChange={(e) => setFormData({ ...formData, calle: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
                <TextField
                  label="Colonia"
                  value={formData.colonia}
                  onChange={(e) => setFormData({ ...formData, colonia: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
                <TextField
                  label="Ciudad"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
                <TextField
                  label="Estado"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
                <TextField
                  label="Código Postal"
                  value={formData.cp}
                  onChange={(e) => setFormData({ ...formData, cp: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
              </Box>
            </Box>

            {/* Contacto */}
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
                  Contacto
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Teléfono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
                <TextField
                  label="Fax"
                  value={formData.fax}
                  onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
                <TextField
                  label="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
                <TextField
                  label="Contacto"
                  value={formData.contacto}
                  onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
              </Box>
            </Box>

            {/* Información Contable */}
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
                  Información Contable
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Cuenta Contable"
                  value={formData.cuenta_contable}
                  onChange={(e) => setFormData({ ...formData, cuenta_contable: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ bgcolor: 'white' }}
                />
                <TextField
                  label="Observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  fullWidth
                  size='small'
                  sx={{ gridColumn: '1 / -1', bgcolor: 'white' }}
                  multiline
                  rows={2}
                />
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

      {/* Dialog Ver Detalles */}
      <Dialog 
        open={openView} 
        onClose={handleViewClose} 
        maxWidth="md" 
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
            Detalles del Proveedor: {viewData?.cve_prov}
          </Typography>
          <Typography variant='body2' sx={{ color: '#e0e0e0', mt: 0.5 }}>
            Información completa del proveedor
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#fafafa' }}>
          {viewData && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Información General */}
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
                    Información General
                  </Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Clave</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>{viewData.cve_prov || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Nombre</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>{viewData.nombre || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>RFC</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>{viewData.rfc || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Nombre Fiscal</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>{viewData.nombre_fiscal || '-'}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Dirección */}
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
                    Dirección
                  </Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Calle</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>{viewData.calle || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Colonia</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>{viewData.colonia || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Ciudad</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>{viewData.ciudad || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Estado</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>{viewData.estado || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Código Postal</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>{viewData.cp || '-'}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Contacto */}
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
                    Contacto
                  </Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Teléfono</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>{viewData.telefono || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Fax</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>{viewData.fax || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Email</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>{viewData.email || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Contacto</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>{viewData.contacto || '-'}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Información Contable */}
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
                    Información Contable
                  </Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Cuenta Contable</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>{viewData.cuenta_contable || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Observaciones</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>{viewData.observaciones || '-'}</Typography>
                  </Box>
                </Box>
              </Box>

            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={handleViewClose}
            sx={{ textTransform: 'uppercase', fontWeight: 600 }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

   <PWABadge />
    </>
  )
}
