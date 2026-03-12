import { useEffect, useState } from 'react'
import { Box, CircularProgress, Alert, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import useConsumoApi from '../../../hooks/useConsumoApi'
import PWABadge from '../../../PWABadge'

interface Plastico {
  id: number
  plastico: string
}

export default function CatPlasticosAutorizados() {
  const { consumoApi } = useConsumoApi()
  const [rows, setRows] = useState<Plastico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [openReasignacion, setOpenReasignacion] = useState(false)
  const [openReporte, setOpenReporte] = useState(false)

  const columns: GridColDef[] = [
    { 
      field: 'plastico', 
      headerName: 'Plástico', 
      flex: 1,
      minWidth: 200,
      headerAlign: 'center',
      align: 'center',
    },
  ]

  const fetchPlasticos = async () => {
    try {
      setLoading(true)
      const res = await consumoApi.get('/api/CatPlasticos_Autorizados/sp_bw_cat_config_plasticos_autorizados_sel')
      
      const data = res.data.map((item: any) => ({
        id: item.id,
        plastico: item.num_plastico,
      }))

      setRows(data)
      setError(null)
    } catch (err) {
      console.error('Error al cargar plásticos:', err)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlasticos()
  }, [])

  const handleReasignacion = () => {
    setOpenReasignacion(true)
  }

  const handleReporte = () => {
    setOpenReporte(true)
  }

  const handleSalir = () => {
    window.history.back()
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <>
      <Box sx={{ width: '100%', p: 2, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: 1, boxShadow: 1 }}>
          <Typography variant="h6" sx={{ mb: 1, color: '#666' }}>
            Módulo de
          </Typography>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
            Alta de Plásticos Autorizados
          </Typography>

          <Box sx={{ height: 500, width: '100%', mb: 3 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              sx={{
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold',
                },
                '& .MuiDataGrid-row:nth-of-type(even)': {
                  backgroundColor: '#f9f9f9',
                },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              onClick={handleReasignacion}
              sx={{ minWidth: 200 }}
            >
              Reasignación de Plasticos
            </Button>
            <Button
              variant="contained"
              onClick={handleReporte}
              sx={{ minWidth: 200 }}
            >
              Reporte de Reasignación de Plasticos
            </Button>
            <Button
              variant="outlined"
              onClick={handleSalir}
              sx={{ minWidth: 120 }}
            >
              Salir
            </Button>
          </Box>

          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#666' }}>
            ALTA DE PLÁSTICOS AUTORIZADOS, ARAUCARIAS, 13/02/2026, USR:ADMIN
          </Typography>
        </Box>
      </Box>

      {/* Dialog de Reasignación */}
      <Dialog open={openReasignacion} onClose={() => setOpenReasignacion(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reasignación de Plásticos</DialogTitle>
        <DialogContent>
          <Typography>Funcionalidad de reasignación de plásticos</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReasignacion(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Reporte */}
      <Dialog open={openReporte} onClose={() => setOpenReporte(false)} maxWidth="md" fullWidth>
        <DialogTitle>Reporte de Reasignación de Plásticos</DialogTitle>
        <DialogContent>
          <Typography>Reporte de reasignación de plásticos</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReporte(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <PWABadge />
    </>
  )
}
