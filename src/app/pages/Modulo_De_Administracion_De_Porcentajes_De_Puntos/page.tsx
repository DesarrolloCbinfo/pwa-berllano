import { useEffect, useState } from 'react'
import { Box, CircularProgress, Alert, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, IconButton, TextField } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import DeleteIcon from '@mui/icons-material/Delete'
import useConsumoApi from '../../../hooks/useConsumoApi'
import PWABadge from '../../../PWABadge'

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
    { field: 'porcentaje', headerName: 'Porcentaje', width: 120 },
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
      <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: 1, boxShadow: 1 }}>
          <Typography variant="h6" sx={{ color: '#999', mb: 0.5, fontSize: '0.9rem' }}>
            Módulo de
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, borderBottom: '3px solid black', pb: 1 }}>
            Administración de Porcentajes de puntos
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Sucursal</InputLabel>
              <Select
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

            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Área</InputLabel>
              <Select
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

            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Depto.</InputLabel>
              <Select
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

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Forma Pago</InputLabel>
              <Select
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

            <TextField
              label="Porcentaje"
              type="number"
              value={porcentaje}
              onChange={(e) => setPorcentaje(e.target.value)}
              sx={{ width: 120 }}
              inputProps={{ step: "0.01", min: "0", max: "1" }}
            />

            <Button
              variant="contained"
              onClick={handleAdd}
              disabled={!selectedSucursal || !selectedArea || !selectedDepto || !selectedFormaPago || !porcentaje || saving}
              sx={{ height: 56 }}
            >
              {saving ? 'Guardando...' : 'Ingresar'}
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>Error: {error}</Alert>}

          {/* Seleccionado */}
          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[5, 10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 10,
                },
              },
            }}
            sx={{ 
              height: 500,
              backgroundColor: 'white',
              '& .MuiDataGrid-row:nth-of-type(even)': {
                backgroundColor: '#f9f9f9',
              },
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleSalir}
              sx={{ minWidth: 100 }}
            >
              Salir
            </Button>
          </Box>

          <Typography sx={{ mt: 3, fontSize: '0.85rem', color: '#666' }}>
            ADMINISTRACIÓN DE PORCENTAJES DE PUNTOS, {new Date().toLocaleDateString('es-MX')}, USR:ADMIN
          </Typography>
        </Box>

        <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
          <DialogTitle>Eliminar Porcentaje</DialogTitle>

          <DialogContent>
            <Typography>
              ¿Seguro que deseas eliminar este registro?
            </Typography>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenDelete(false)}>
              Cancelar
            </Button>

            <Button
              color="error"
              variant="contained"
              onClick={handleDelete}
              disabled={deleting}
            >
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      <PWABadge />
    </>
  )
}

