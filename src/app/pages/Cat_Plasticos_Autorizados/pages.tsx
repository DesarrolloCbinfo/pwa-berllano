import { useEffect, useState } from 'react'
import { Box, CircularProgress, Alert, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import useConsumoApi from '../../../hooks/useConsumoApi'
import { useSessionContext } from '../../../context/SessionProvider'
import PWABadge from '../../../PWABadge'

interface Plastico {
  id: number
  plastico: string
}

export default function CatPlasticosAutorizados() {
  const { consumoApi } = useConsumoApi()
  const { session } = useSessionContext() // <--- Agregamos la sesión
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
      <Box sx={{ width: '100%', p: 3, backgroundColor: '#ececec', minHeight: '100vh' }}>
        
        <style>{`
          .swal2-container {
            z-index: 9999 !important;
          }
        `}</style>

        {/* CONTENEDOR BLANCO PRINCIPAL (ENCABEZADO) */}
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)', mb: 3 }}>
          
          {/* RECUADRO INTERIOR ELEGANTE */}
          <Box sx={{ border: '1px solid #2c3e50', p: 1.5, borderRadius: '8px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a365d', fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: 1.1, fontSize: '1.1rem' }}>
                      ALTA DE PLÁSTICOS AUTORIZADOS
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', mt: 0.2, fontSize: '0.75rem' }}>
                      Sucursal: {session?.dSucursal || 'Cargando...'}
                  </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333', lineHeight: 1.1, fontSize: '0.9rem' }}>
                      {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' }).replaceAll('/', '-')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#555', mt: 0.2, fontSize: '0.75rem' }}>
                      Usuario Activo: {session?.nombre || 'Cargando...'}
                  </Typography>
              </Box>
          </Box>
        </Box>

        {/* CONTENEDOR DE LA TABLA */}
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
          <Box sx={{ height: 500, width: '100%', mb: 3 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 50 },
                },
              }}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                height: '100%',
                fontSize: '0.95rem', /* Tamaño de letra general */
                '& .MuiDataGrid-columnHeaders': { 
                  borderBottom: '2px solid #000', 
                  fontSize: '1rem', /* Encabezados un poco más grandes */
                  fontWeight: 'bold', 
                  backgroundColor: '#f5f5f5' 
                },
                '& .MuiDataGrid-cell': { 
                  borderBottom: '1px solid #e0e0e000' /* Quita líneas divisorias de las celdas */
                },
                '& .MuiDataGrid-row': { 
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease' 
                },
                '& .MuiDataGrid-row:hover': { 
                  bgcolor: '#fafafa' /* Efecto sutil al pasar el mouse */
                }
              }}
            />
          </Box>

          {/* BOTONERA INFERIOR */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              onClick={handleReasignacion}
              sx={{ 
                minWidth: 200, 
                bgcolor: '#333333', 
                fontWeight: 600, 
                borderRadius: '8px',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(51,51,51,0.3)',
                '&:hover': { bgcolor: '#555555' }
              }}
            >
              Reasignación de Plásticos
            </Button>
            <Button
              variant="contained"
              onClick={handleReporte}
              sx={{ 
                minWidth: 200, 
                bgcolor: '#333333', 
                fontWeight: 600, 
                borderRadius: '8px',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(51,51,51,0.3)',
                '&:hover': { bgcolor: '#555555' }
              }}
            >
              Reporte de Reasignación
            </Button>
            <Button
              variant="outlined"
              onClick={handleSalir}
              sx={{ 
                minWidth: 120, 
                color: '#333', 
                borderColor: '#333', 
                fontWeight: 600, 
                borderRadius: '8px',
                textTransform: 'none',
                '&:hover': { borderColor: '#555', bgcolor: 'rgba(0,0,0,0.05)' }
              }}
            >
              Salir
            </Button>
          </Box>
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
