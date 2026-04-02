import { useEffect, useState } from 'react'
import { Box, CircularProgress, Alert, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, IconButton, TextField, Paper, Grid } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import useConsumoApi from '../../../hooks/useConsumoApi'
import { useSessionContext } from '../../../context/SessionProvider'
import PWABadge from '../../../PWABadge'

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

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido')
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
        <Paper sx={{ p: 3, borderRadius: '8px' }}>
          {/* ENCABEZADO */}
          <Box sx={{ border: '1px solid #2c3e50', p: 1.5, mb: 2, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                    Administración de Porcentajes de Puntos
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
              <FormControl fullWidth>
                <InputLabel>Sucursal</InputLabel>
                <Select
                  {...selectProps}
                  value={selectedSucursal}
                  onChange={(e) => {
                    setSelectedSucursal(e.target.value)
                  }}
                  label="Sucursal"
                >
                  {sucursales.map((sucursal) => (
                    <MenuItem key={sucursal.cve_sucursal} value={String(sucursal.cve_sucursal)}> 
                      {sucursal.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2.5}>
              <FormControl fullWidth>
                <InputLabel>Área</InputLabel>
                <Select
                  {...selectProps}
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  label="Área"
                >
                  {areas.map((area) => (
                    <MenuItem key={area.area} value={area.area}>
                      {area.descripcion}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2.5}>
              <FormControl fullWidth>
                <InputLabel>Depto.</InputLabel>
                <Select
                  {...selectProps}
                  value={selectedDepto}
                  onChange={(e) => setSelectedDepto(e.target.value)}
                  label="Depto."
                >
                  {departamentos.map((depto) => (
                    <MenuItem key={depto.depto} value={depto.depto}>
                      {depto.descripcion}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Forma Pago</InputLabel>
                <Select
                  {...selectProps}
                  value={selectedFormaPago}
                  onChange={(e) => setSelectedFormaPago(e.target.value)}
                  label="Forma Pago"
                >
                  {formasPago.map((forma) => (
                    <MenuItem key={forma.tipo} value={String(forma.tipo)}>
                      {forma.descripcion}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={1.5}>
              <TextField
                {...commonProps}
                label="Porcentaje"
                type="number"
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value)}
                inputProps={{ step: "0.01", min: "0", max: "1" }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Button 
                variant="contained" 
                onClick={handleAdd} 
                disabled={!selectedSucursal || !selectedArea || !selectedDepto || !selectedFormaPago || !porcentaje || saving}
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
                {saving ? 'Guardando...' : 'AGREGAR'}
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
          <Button 
            variant="contained" 
            onClick={handleSalir}
            sx={{ 
              backgroundColor: '#e0e0e0', 
              color: '#000', 
              fontWeight: 'bold', 
              px: 4, 
              mb: 2, 
              '&:hover': { backgroundColor: '#d0d0d0' } 
            }}
          >
            Salir
          </Button>
          
        </Box>

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
              disabled={deleting}
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
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      <PWABadge />
    </>
  )
}

