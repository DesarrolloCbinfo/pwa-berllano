import { useEffect, useState } from 'react'
import { Box, CircularProgress, Alert, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, IconButton, TextField, Paper, Grid } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import useConsumoApi from '../../../hooks/useConsumoApi'
import { useSessionContext } from '../../../context/SessionProvider'
import PWABadge from '../../../PWABadge'
import Swal from 'sweetalert2'

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

// Estilo SOLO para Selects (Hereda el general pero agrega ancho mínimo)
const selectProps = {
  ...commonProps,
  sx: {
      ...commonProps.sx,
      minWidth: '220px',
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
  }
};

interface PorcentajePunto {
  id: string
  cve_sucursal: number
  sucursal: string
  cve_area: string
  area: string
  cve_depto: string
  depto: string
  tipo_forma_pago: number
  forma_pago: string
  porcentaje: number
}

interface Sucursal {
  cve_sucursal: number
  nombre: string
}

interface Area {
  area: string
  descripcion: string
}

interface Departamento {
  depto: string
  descripcion: string
}

interface FormaPago {
  tipo: number
  descripcion: string
}

export default function AdministracionPorcentajesPuntos() {
  const { consumoApi } = useConsumoApi()
  const { session } = useSessionContext()
  const [rows, setRows] = useState<PorcentajePunto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  //Mostrar datos en la tabla central
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [formasPago, setFormasPago] = useState<FormaPago[]>([])

  const [selectedSucursal, setSelectedSucursal] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedDepto, setSelectedDepto] = useState('')
  const [selectedFormaPago, setSelectedFormaPago] = useState('')
  const [porcentaje, setPorcentaje] = useState('')
  const [celdaSeleccionada, setCeldaSeleccionada] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [openAdd, setOpenAdd] = useState(false)

  const [openDelete, setOpenDelete] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const columns: GridColDef[] = [
    {
      field: 'acciones',
      headerName: '',
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          color="error"
          onClick={() => handleDeleteOpen(params.row)}
          size="small"
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
    { field: 'sucursal', headerName: 'Sucursal', width: 150 },
    { field: 'area', headerName: 'Área', width: 200 },
    { field: 'depto', headerName: 'Depto.', width: 200 },
    { field: 'forma_pago', headerName: 'Forma Pago', width: 150 },
    { 
      field: 'porcentaje', 
      headerName: 'Porcentaje', 
      width: 120,
      renderCell: (params) => {
        const valor = params.row.porcentaje || 0;
        const rowId = params.row.id;
        const esSeleccionada = celdaSeleccionada === rowId;
        
        return (
          <Box
            onClick={() => setCeldaSeleccionada(esSeleccionada ? null : rowId)}
            sx={{
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: esSeleccionada ? '#c5c5c5ff' : 'transparent',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              },
              transition: 'all 0.2s ease',
              fontSize: '0.875rem',
              fontWeight: esSeleccionada ? 600 : 400,
              color: esSeleccionada ? '#252525ff' : 'inherit'
            }}
          >
            {esSeleccionada ? valor.toFixed(2) : `${Math.round(valor * 100)}%`}
          </Box>
        );
      }
    },
  ]

  const fetchSucursales = async () => {
    try {
      const res = await consumoApi.get('/api/CatAdminPorcenPuntos/sp_bw_cat_sucursales_sel')
      setSucursales(res.data)
    } catch (err) {
      console.error('Error al cargar sucursales:', err)
    }
  }

  const fetchAreas = async () => {
    try {
      const res = await consumoApi.get('/api/CatAdminPorcenPuntos/sp_bw_cat_areas_sel')
      setAreas(res.data)
    } catch (err) {
      console.error('Error al cargar áreas:', err)
    }
  }

  const fetchDepartamentos = async (area: string) => {
    try {
      const res = await consumoApi.get('/api/CatAdminPorcenPuntos/sp_bw_cat_deptos_sel', {
        params: { area }
      })

      setDepartamentos(res.data)
    } catch (err) {
      console.error('Error al cargar departamentos:', err)
    }
  }

  const fetchFormasPago = async (sucursal: string) => {
    try {
      const res = await consumoApi.get('/api/CatAdminPorcenPuntos/sp_bw_cat_tipos_formas_pagos_sel', {
        params: { sucursal }
      })
      setFormasPago(res.data)
    } catch (err) {
      console.error('Error al cargar formas de pago:', err)
    }
  }

  const fetchPorcentajesPuntos = async () => {
    try {
      const res = await consumoApi.get(
        '/api/CatAdminPorcenPuntos/sp_bw_administracion_porcentajes_puntos_sel'
      )
      
      const data = res.data.map((item: any, index: number) => ({
        id: index,
        cve_sucursal: item.cve_sucursal,
        sucursal: item.sucursal,
        cve_area: item.cve_area,
        area: item.area,
        cve_depto: item.cve_depto,
        depto: item.depto,
        tipo_forma_pago: item.tipo_forma_pago,
        forma_pago: item.forma_pago,
        porcentaje: item.porcentaje_puntos,
      }))

      setRows(data)
    } catch (err) {
      console.error('Error al cargar porcentajes:', err)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await fetchSucursales()
      await fetchAreas()
      await fetchPorcentajesPuntos()
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (selectedArea) {
      fetchDepartamentos(selectedArea)
      setSelectedDepto('')
    } else {
      setDepartamentos([])
      setSelectedDepto('')
    }
  }, [selectedArea])

  useEffect(() => {
    if (selectedSucursal) {
      fetchFormasPago(selectedSucursal)
      setSelectedFormaPago('')
    } else {
      setFormasPago([])
      setSelectedFormaPago('')
    }
  }, [selectedSucursal])

  const handleAdd = async () => {
    if (!selectedSucursal || !selectedArea || !selectedDepto || !selectedFormaPago || !porcentaje) return

    try {
      setSaving(true)

      const response = await consumoApi.post(
        `/api/CatAdminPorcenPuntos/sp_bw_administracion_porcentajes_puntos_add`,
        '',
        {
          params: {
            sucursal: parseInt(selectedSucursal),
            area: selectedArea,
            depto: selectedDepto,
            forma_pago: parseInt(selectedFormaPago),
            porcentaje_puntos: parseFloat(porcentaje),
          },
        }
      )

      const result = response.data?.[0]

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al guardar')
      }

      await fetchPorcentajesPuntos()
      
      setSelectedSucursal('')
      setSelectedArea('')
      setSelectedDepto('')
      setDepartamentos([])
      setSelectedFormaPago('')
      setPorcentaje('')
      setOpenAdd(false)

      // SweetAlert de éxito
      Swal.fire({
        title: '¡Éxito!',
        text: 'Porcentaje de puntos agregado correctamente',
        icon: 'success',
        confirmButtonColor: '#000000ff',
        timer: 2500,
        showConfirmButton: false
      })

    } catch (err) {
      // SweetAlert de error
      Swal.fire({
        title: 'Error',
        text: err instanceof Error ? err.message : 'Error desconocido',
        icon: 'error',
        confirmButtonColor: '#000000ff'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOpen = (row: PorcentajePunto) => {
    setDeleteId(row.id)
    setOpenDelete(true)
  }

  const handleDelete = async () => {
    if (deleteId === null) return

    try {
      setDeleting(true)

      const rowToDelete = rows.find(r => r.id === deleteId)
      if (!rowToDelete) return

      const response = await consumoApi.delete(
        `/api/CatAdminPorcenPuntos/sp_bw_administracion_porcentajes_puntos_del`,
        {
          params: {
            sucursal: rowToDelete.cve_sucursal,
            area: rowToDelete.cve_area,
            depto: rowToDelete.cve_depto,
            forma_pago: rowToDelete.tipo_forma_pago,
          },
        }
      )

      const result = response.data?.[0]

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje || 'Error al eliminar')
      }

      setOpenDelete(false)
      setDeleteId(null)
      await fetchPorcentajesPuntos()

    } catch (err) {
      console.error('Error completo al eliminar:', err)
      alert(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setDeleting(false)
    }
  }

  const handleSalir = () => {
    window.history.back()
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

return (
    <>
      <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#ececec' }}>
        
        {/* ENCABEZADO Y BOTÓN AGREGAR */}
        <Paper sx={{ p: 3, borderRadius: '8px', mb: 3, boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}>
          <Box sx={{ border: '1px solid #000000ff', p: 1.5, mb: 3, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000ff', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem', textTransform: 'uppercase' }}>
                    Administración de Porcentajes de Puntos
                </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                    {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button 
              variant="contained" 
              onClick={() => setOpenAdd(true)}
              startIcon={<AddIcon />}
              sx={{ 
                height: '45px', 
                backgroundColor: '#333333', 
                color: 'white', 
                fontWeight: 600, 
                textTransform: 'none', 
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(51, 51, 51, 0.2)', 
                transition: 'all 0.3s ease',
                '&:hover': { 
                  backgroundColor: '#555555', 
                  transform: 'translateY(-1px)' 
                }
              }}
            >
              AGREGAR PORCENTAJE
            </Button>
          </Box>
        </Paper>

        {/* TABLA PRINCIPAL */}
        <Paper sx={{ p: 3, width: '100%', maxHeight: 600, mb: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>Error: {error}</Alert>}
          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[5, 10, 25, 50]}
            density="compact"
            disableRowSelectionOnClick
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                borderBottom: '2px solid #000',
                fontSize: '1rem',
                fontWeight: 'bold',
                textAlign: 'center'
              },
              '& .MuiDataGrid-cell': { borderBottom: '1px solid #e0e0e000' },
              '& .MuiDataGrid-row:hover': { bgcolor: '#f5f5f5' }
            }}
          />
        </Paper>

        {/* --- MODAL PARA AGREGAR NUEVO PORCENTAJE --- */}
        <Dialog 
          open={openAdd} 
          onClose={() => setOpenAdd(false)} 
          maxWidth="md" 
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
                Nuevo Porcentaje de Puntos
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
                Seleccione las opciones correspondientes para asignar el porcentaje
              </Typography>
            </Box>
            <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
            <IconButton 
              onClick={() => setOpenAdd(false)}
              sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 3, bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

<DialogContent sx={{ p: 4, backgroundColor: '#ffffff' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              <TextField
                select
                fullWidth
                {...commonProps}
                label="Sucursal"
                value={selectedSucursal}
                onChange={(e) => setSelectedSucursal(e.target.value)}
              >
                {sucursales.map((sucursal) => (
                  <MenuItem key={sucursal.cve_sucursal} value={String(sucursal.cve_sucursal)}> 
                    {sucursal.nombre}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                {...commonProps}
                label="Área"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
              >
                {areas.map((area) => (
                  <MenuItem key={area.area} value={area.area}>
                    {area.descripcion}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                {...commonProps}
                label="Departamento"
                value={selectedDepto}
                onChange={(e) => setSelectedDepto(e.target.value)}
                disabled={!selectedArea}
              >
                {departamentos.map((depto) => (
                  <MenuItem key={depto.depto} value={depto.depto}>
                    {depto.descripcion}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                {...commonProps}
                label="Forma de Pago"
                value={selectedFormaPago}
                onChange={(e) => setSelectedFormaPago(e.target.value)}
                disabled={!selectedSucursal}
              >
                {formasPago.map((forma) => (
                  <MenuItem key={forma.tipo} value={String(forma.tipo)}>
                    {forma.descripcion}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                {...commonProps}
                label="Porcentaje"
                type="number"
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value)}
                inputProps={{ step: "0.01", min: "0", max: "1" }}
                InputProps={{
                  endAdornment: <Typography sx={{ color: '#666', fontWeight: 'bold' }}>%</Typography>
                }}
                helperText="Ej: 0.15 para 15%"
                sx={{ 
                  ...commonProps.sx, 
                  '& .MuiFormHelperText-root': { ml: 0, fontWeight: 500, mt: 1 } 
                }}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ borderTop: '1px solid #e0e0e0', pt: 2, px: 3, pb: 2, backgroundColor: '#f8f9fa' }}>
            <Button 
              onClick={() => setOpenAdd(false)} 
              color="inherit"
              sx={{ borderRadius: '8px', fontWeight: 600, transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#e0e0e0', color: '#333' } }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAdd} 
              variant="contained" 
              disabled={!selectedSucursal || !selectedArea || !selectedDepto || !selectedFormaPago || !porcentaje || saving}
              sx={{ 
                bgcolor: '#000000ff', color: 'white', borderRadius: '8px', fontWeight: 600, textTransform: 'none', px: 4,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease',
                '&:hover': { bgcolor: '#333333', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' },
                '&:disabled': { bgcolor: '#999999', color: '#fff' }
              }}
            >
              {saving ? "Guardando..." : "Guardar Porcentaje"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* MODAL DE ELIMINAR */}
        <Dialog 
          open={openDelete} 
          onClose={() => setOpenDelete(false)}
          PaperProps={{
            sx: { borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.18)', border: '1px solid #e0e0e0' }
          }}
        >
          <Box sx={{ background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)', color: 'white', p: 2, position: 'relative', overflow: 'hidden' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', position: 'relative', zIndex: 2 }}>
              ⚠️ Eliminar Registro
            </Typography>
            <Box sx={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', zIndex: 1 }} />
          </Box>

          <DialogContent sx={{ p: 4, bgcolor: '#fff', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1.1rem', mb: 1, fontWeight: 500, color: '#333' }}>
              ¿Seguro que deseas eliminar este porcentaje?
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Esta acción no se puede deshacer.
            </Typography>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #e0e0e0', justifyContent: 'center', gap: 2 }}>
            <Button 
              onClick={() => setOpenDelete(false)}
              sx={{ color: '#333', fontWeight: 600, borderRadius: '8px', '&:hover': { bgcolor: '#e0e0e0' } }}
            >
              Cancelar
            </Button>
            <Button
              color='error'
              variant='contained'
              onClick={handleDelete}
              disabled={deleting}
              sx={{ fontWeight: 600, borderRadius: '8px', px: 3, boxShadow: '0 2px 8px rgba(211, 47, 47, 0.3)' }}
            >
              {deleting ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      <PWABadge />
    </>
  )
}


