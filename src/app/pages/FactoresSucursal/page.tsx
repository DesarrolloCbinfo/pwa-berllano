import { useState } from 'react'
import { Box, CircularProgress, Alert, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Grid } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/Edit'
import useConsumoApi from '../../../hooks/useConsumoApi'
import PWABadge from '../../../PWABadge'

interface FactorSucursal {
  id: number
  fecha: string
  reventa_ara: number
  reventa_p1: number
  reventa_p2: number
  reventa_ver: number
  reventa_dor: number
  reventa_and: number
  reventa_leju: number
  servicio_ara: number
  servicio_p1: number
  servicio_p2: number
  servicio_ver: number
  servicio_dor: number
  servicio_and: number
  servicio_leju: number
}

export default function FactoresSucursal() {
  const { consumoApi } = useConsumoApi()
  const [rows, setRows] = useState<FactorSucursal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  
  const [anio, setAnio] = useState(currentYear.toString())
  const [mes, setMes] = useState(currentMonth.toString())
  
  const [openEdit, setOpenEdit] = useState(false)
  const [openView, setOpenView] = useState(false)
  const [editingRow, setEditingRow] = useState<FactorSucursal | null>(null)
  const [viewData, setViewData] = useState<FactorSucursal | null>(null)
  const [saving, setSaving] = useState(false)

  const columns: GridColDef[] = [
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const [day, month, year] = params.row.fecha.split('/')
        const rowDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        rowDate.setHours(0, 0, 0, 0)
        
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const isEditable = rowDate >= today
        
        return (
          <IconButton 
            onClick={(e) => { e.stopPropagation(); handleEditOpen(params.row); }} 
            size="small"
            disabled={!isEditable}
            title={!isEditable ? 'Solo se pueden editar fechas actuales o futuras' : 'Editar'}
          >
            <EditIcon />
          </IconButton>
        )
      },
    },
    { 
      field: 'fecha', 
      headerName: 'fecha', 
      width: 110,
      headerAlign: 'center',
      align: 'center',
    },
    { 
      field: 'reventa_ara', 
      headerName: 'Reventa_Ara', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'reventa_p1', 
      headerName: 'Reventa_P1', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'reventa_p2', 
      headerName: 'Reventa_P2', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'reventa_ver', 
      headerName: 'Reventa_Ver', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'reventa_dor', 
      headerName: 'Reventa_Dor', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'reventa_and', 
      headerName: 'Reventa_And', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'reventa_leju', 
      headerName: 'Reventa_Leju', 
      width: 110,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'servicio_ara', 
      headerName: 'Servicio_Ara', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'servicio_p1', 
      headerName: 'Servicio_P1', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'servicio_p2', 
      headerName: 'Servicio_P2', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'servicio_ver', 
      headerName: 'Servicio_Ver', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'servicio_dor', 
      headerName: 'Servicio_Dor', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'servicio_and', 
      headerName: 'Servicio_And', 
      width: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
    { 
      field: 'servicio_leju', 
      headerName: 'Servicio_Leju', 
      width: 110,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (value) => {
        const val = value ?? 0;
        return `${(val * 100).toFixed(1)}%`;
      },
    },
  ]

  const handleConsultar = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const res = await consumoApi.get('/api/CatFactoresSucursal/sp_bw_porcentajesCross_sel', {
        params: {
          a: parseInt(anio),
          m: parseInt(mes),
        }
      })
      
      const data = res.data.map((item: any, index: number) => ({
        id: index,
        fecha: new Date(item.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        reventa_ara: item.Reventa_Ara ?? 0,
        reventa_p1: item.Reventa_P1 ?? 0,
        reventa_p2: item.Reventa_P2 ?? 0,
        reventa_ver: item.Reventa_Ver ?? 0,
        reventa_dor: item.Reventa_Dor ?? 0,
        reventa_and: item.Reventa_And ?? 0,
        reventa_leju: item.Reventa_Leju ?? 0,
        servicio_ara: item.Servicio_Ara ?? 0,
        servicio_p1: item.Servicio_P1 ?? 0,
        servicio_p2: item.Servicio_P2 ?? 0,
        servicio_ver: item.Servicio_Ver ?? 0,
        servicio_dor: item.Servicio_Dor ?? 0,
        servicio_and: item.Servicio_And ?? 0,
        servicio_leju: item.Servicio_Leju ?? 0,
      }))

      setRows(data)
    } catch (err) {
      console.error('Error al consultar factores:', err)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleViewOpen = (row: FactorSucursal) => {
    setViewData({ ...row })
    setOpenView(true)
  }

  const handleViewClose = () => {
    setOpenView(false)
    setViewData(null)
  }

  const handleEditOpen = (row: FactorSucursal) => {
    setEditingRow({ ...row })
    setOpenEdit(true)
  }

  const handleEditClose = () => {
    setOpenEdit(false)
    setEditingRow(null)
  }

  const handleFieldChange = (field: keyof FactorSucursal, value: string) => {
    if (editingRow) {
      setEditingRow({
        ...editingRow,
        [field]: parseFloat(value) || 0,
      })
    }
  }

  const handleSave = async () => {
    if (!editingRow) return

    try {
      setSaving(true)
      
      const response = await consumoApi.put(
        '/api/CatFactoresSucursal/sp_bw_porcentajesCross_upd',
        {
          fecha: editingRow.fecha,
          reventa_ara: editingRow.reventa_ara,
          reventa_p1: editingRow.reventa_p1,
          reventa_p2: editingRow.reventa_p2,
          reventa_ver: editingRow.reventa_ver,
          reventa_dor: editingRow.reventa_dor,
          reventa_and: editingRow.reventa_and,
          reventa_leju: editingRow.reventa_leju,
          servicio_ara: editingRow.servicio_ara,
          servicio_p1: editingRow.servicio_p1,
          servicio_p2: editingRow.servicio_p2,
          servicio_ver: editingRow.servicio_ver,
          servicio_dor: editingRow.servicio_dor,
          servicio_and: editingRow.servicio_and,
          servicio_leju: editingRow.servicio_leju,
        }
      )

      const result = response.data?.[0]
      
      if (result?.codigo === 0) {
        setRows(rows.map(row => 
          row.id === editingRow.id ? editingRow : row
        ))
        handleEditClose()
        setError(null)
      } else {
        setError(result?.mensaje1 || 'Error al actualizar')
      }
    } catch (err) {
      console.error('Error al actualizar:', err)
      setError('Error al actualizar los datos')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Box sx={{ width: '100%', p: 2, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: 1, boxShadow: 1 }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
            Factores por Sucursal
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography>Año</Typography>
              <TextField
                size="small"
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                type="number"
                sx={{ width: 100 }}
                inputProps={{ min: 2000, max: 2100 }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography>Mes</Typography>
              <TextField
                size="small"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                type="number"
                sx={{ width: 80 }}
                inputProps={{ min: 1, max: 12 }}
              />
            </Box>

            <Button
              variant="contained"
              onClick={handleConsultar}
              disabled={loading}
            >
              Consultar
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={rows}
                columns={columns}
                pageSizeOptions={[10, 25, 50, 100]}
                onRowClick={(params) => handleViewOpen(params.row)}
                sx={{
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#f5f5f5',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                  },
                  '& .MuiDataGrid-cell': {
                    fontSize: '0.75rem',
                  },
                  '& .MuiDataGrid-row': {
                    cursor: 'pointer',
                  },
                  '& .MuiDataGrid-row:nth-of-type(even)': {
                    backgroundColor: '#f9f9f9',
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </Box>

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
            Detalles de Factores: {viewData?.fecha}
          </Typography>
          <Typography variant='body2' sx={{ color: '#e0e0e0', mt: 0.5 }}>
            Información completa de factores por sucursal
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#fafafa' }}>
          {viewData && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Factores de Reventa */}
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
                    Factores de Reventa
                  </Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Reventa Ara</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>
                      {((viewData.reventa_ara ?? 0) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Reventa P1</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>
                      {((viewData.reventa_p1 ?? 0) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Reventa P2</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>
                      {((viewData.reventa_p2 ?? 0) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Reventa Ver</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>
                      {((viewData.reventa_ver ?? 0) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Reventa Dor</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>
                      {((viewData.reventa_dor ?? 0) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Reventa And</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>
                      {((viewData.reventa_and ?? 0) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Reventa Leju</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>
                      {((viewData.reventa_leju ?? 0) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Factores de Servicio */}
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
                    Factores de Servicio
                  </Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Servicio Ara</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>
                      {((viewData.servicio_ara ?? 0) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Servicio P1</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>
                      {((viewData.servicio_p1 ?? 0) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Servicio P2</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>
                      {((viewData.servicio_p2 ?? 0) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Servicio Ver</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>
                      {((viewData.servicio_ver ?? 0) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Servicio Dor</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>
                      {((viewData.servicio_dor ?? 0) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Servicio And</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>
                      {((viewData.servicio_and ?? 0) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' sx={{ color: '#666' }}>Servicio Leju</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>
                      {((viewData.servicio_leju ?? 0) * 100).toFixed(1)}%
                    </Typography>
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

      <Dialog open={openEdit} onClose={handleEditClose} maxWidth="md" fullWidth>
        <DialogTitle>Editar Factores</DialogTitle>
        <DialogContent>
          {editingRow && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                Fecha: {editingRow.fecha}
              </Typography>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Reventa</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4}>
                  <TextField
                    fullWidth
                    label="Reventa Ara"
                    type="number"
                    value={editingRow.reventa_ara}
                    onChange={(e) => handleFieldChange('reventa_ara', e.target.value)}
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField
                    fullWidth
                    label="Reventa P1"
                    type="number"
                    value={editingRow.reventa_p1}
                    onChange={(e) => handleFieldChange('reventa_p1', e.target.value)}
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField
                    fullWidth
                    label="Reventa P2"
                    type="number"
                    value={editingRow.reventa_p2}
                    onChange={(e) => handleFieldChange('reventa_p2', e.target.value)}
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField
                    fullWidth
                    label="Reventa Ver"
                    type="number"
                    value={editingRow.reventa_ver}
                    onChange={(e) => handleFieldChange('reventa_ver', e.target.value)}
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField
                    fullWidth
                    label="Reventa Dor"
                    type="number"
                    value={editingRow.reventa_dor}
                    onChange={(e) => handleFieldChange('reventa_dor', e.target.value)}
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField
                    fullWidth
                    label="Reventa And"
                    type="number"
                    value={editingRow.reventa_and}
                    onChange={(e) => handleFieldChange('reventa_and', e.target.value)}
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField
                    fullWidth
                    label="Reventa Leju"
                    type="number"
                    value={editingRow.reventa_leju}
                    onChange={(e) => handleFieldChange('reventa_leju', e.target.value)}
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Servicio</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4}>
                  <TextField
                    fullWidth
                    label="Servicio Ara"
                    type="number"
                    value={editingRow.servicio_ara}
                    onChange={(e) => handleFieldChange('servicio_ara', e.target.value)}
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField
                    fullWidth
                    label="Servicio P1"
                    type="number"
                    value={editingRow.servicio_p1}
                    onChange={(e) => handleFieldChange('servicio_p1', e.target.value)}
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField
                    fullWidth
                    label="Servicio P2"
                    type="number"
                    value={editingRow.servicio_p2}
                    onChange={(e) => handleFieldChange('servicio_p2', e.target.value)}
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField
                    fullWidth
                    label="Servicio Ver"
                    type="number"
                    value={editingRow.servicio_ver}
                    onChange={(e) => handleFieldChange('servicio_ver', e.target.value)}
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField
                    fullWidth
                    label="Servicio Dor"
                    type="number"
                    value={editingRow.servicio_dor}
                    onChange={(e) => handleFieldChange('servicio_dor', e.target.value)}
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField
                    fullWidth
                    label="Servicio And"
                    type="number"
                    value={editingRow.servicio_and}
                    onChange={(e) => handleFieldChange('servicio_and', e.target.value)}
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField
                    fullWidth
                    label="Servicio Leju"
                    type="number"
                    value={editingRow.servicio_leju}
                    onChange={(e) => handleFieldChange('servicio_leju', e.target.value)}
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <PWABadge />
    </>
  )
}
