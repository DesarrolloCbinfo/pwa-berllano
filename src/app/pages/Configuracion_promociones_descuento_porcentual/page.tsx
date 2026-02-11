import { useEffect, useState } from 'react'
import { Box, CircularProgress, Alert, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, IconButton, TextField } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import DeleteIcon from '@mui/icons-material/Delete'
import useConsumoApi from '../../../hooks/useConsumoApi'
import PWABadge from '../../../PWABadge'

interface Promocion {
  id: string
  nombre_promo: string
  sucursal: string
  del: string
  al: string
  area: string
  depto: string
  marca: string
  familia: string
  producto: string
  cant: number
  desc_porcentaje: number
  descuento: string
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

interface Marca {
  marca: string
  descripcion: string
}

interface Familia {
  familia: string
  descripcion: string
}

interface Producto {
  producto: string
  descripcion: string
}

export default function ConfiguracionPromocionesDescuentoPorcentual() {
  const { consumoApi } = useConsumoApi()
  const [rows, setRows] = useState<Promocion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [familias, setFamilias] = useState<Familia[]>([])
  const [productos, setProductos] = useState<Producto[]>([])

  const [nombrePromo, setNombrePromo] = useState('')
  const [selectedSucursal, setSelectedSucursal] = useState('')
  const [fechaDel, setFechaDel] = useState('')
  const [fechaAl, setFechaAl] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedDepto, setSelectedDepto] = useState('')
  const [selectedMarca, setSelectedMarca] = useState('')
  const [selectedFamilia, setSelectedFamilia] = useState('')
  const [selectedProducto, setSelectedProducto] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [descPorcentaje, setDescPorcentaje] = useState('')
  const [descuento, setDescuento] = useState('')

  const [saving, setSaving] = useState(false)

  const [openDelete, setOpenDelete] = useState(false)
  const [rowToDelete, setRowToDelete] = useState<Promocion | null>(null)
  const [deleting, setDeleting] = useState(false)

  const columns: GridColDef[] = [
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 100,
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
    { field: 'nombre_promo', headerName: 'Nombre Promo', width: 140 },
    { field: 'sucursal', headerName: 'Sucursal', width: 110 },
    { field: 'del', headerName: 'Del', width: 90 },
    { field: 'al', headerName: 'Al', width: 90 },
    { field: 'area', headerName: 'Area', width: 140 },
    { field: 'depto', headerName: 'Depto', width: 190 },
    { field: 'marca', headerName: 'Marca', width: 140 },
    { field: 'familia', headerName: 'Familia', width: 140 },
    { field: 'producto', headerName: 'Producto', width: 1900 },
    { field: 'cant', headerName: 'Cant', width: 70 },
    { field: 'desc_porcentaje', headerName: 'Desc %', width: 80 },
    { field: 'descuento', headerName: 'Descuento', width: 140 },
  ]

  const fetchSucursales = async () => {
    try {
      const res = await consumoApi.get('/api/ConfigPromoDescPorcentual/sp_bw_cat_sucursales_sel')
      setSucursales(res.data)
    } catch (err) {
      console.error('Error al cargar sucursales:', err)
    }
  }

  const fetchAreas = async () => {
    try {
      const res = await consumoApi.get('/api/ConfigPromoDescPorcentual/sp_bw_cat_areas_sel')
      setAreas(res.data)
    } catch (err) {
      console.error('Error al cargar áreas:', err)
    }
  }

  const fetchDepartamentos = async (area: string) => {
    try {
      const res = await consumoApi.get('/api/ConfigPromoDescPorcentual/sp_bw_cat_deptos_sel', {
        params: { area }
      })
      setDepartamentos(res.data)
    } catch (err) {
      console.error('Error al cargar departamentos:', err)
    }
  }

  const fetchMarcas = async () => {
    try {
      const res = await consumoApi.get('/api/ConfigPromoDescPorcentual/sp_bw_cat_marcas_sel')
      setMarcas(res.data)
    } catch (err) {
      console.error('Error al cargar marcas:', err)
    }
  }

  const fetchFamilias = async () => {
    try {
      const res = await consumoApi.get('/api/ConfigPromoDescPorcentual/sp_bw_cat_familias_sel')
      setFamilias(res.data)
    } catch (err) {
      console.error('Error al cargar familias:', err)
    }
  }

  const fetchProductos = async () => {
    try {
      const res = await consumoApi.get('/api/ConfigPromoDescPorcentual/sp_bw_cat_productos_sel')
      setProductos(res.data)
    } catch (err) {
      console.error('Error al cargar productos:', err)
    }
  }

  const fetchPromociones = async () => {
    try {
      const res = await consumoApi.get('/api/ConfigPromoDescPorcentual/sp_bw_config_promo_desc_porcentual_sel')
      
      const data = res.data.map((item: any, index: number) => ({
        id: index,
        nombre_promo: item.nombre_promo,
        sucursal: item.sucursal,
        del: item.del,
        al: item.al,
        area: item.area,
        depto: item.depto,
        marca: item.marca,
        familia: item.familia,
        producto: item.producto,
        cant: item.cant,
        desc_porcentaje: item.desc_porcentaje,
        descuento: item.descuento,
      }))

      setRows(data)
    } catch (err) {
      console.error('Error al cargar promociones:', err)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await fetchSucursales()
      await fetchAreas()
      await fetchMarcas()
      await fetchFamilias()
      await fetchProductos()
      await fetchPromociones()
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

  const handleAdd = async () => {
    if (!nombrePromo || !selectedSucursal || !fechaDel || !fechaAl || !selectedArea || !selectedDepto || !selectedMarca || !selectedFamilia || !selectedProducto || !cantidad || !descPorcentaje || !descuento) return

    try {
      setSaving(true)

      const response = await consumoApi.post(
        `/api/ConfigPromoDescPorcentual/sp_bw_config_promo_desc_porcentual_add`,
        null,
        {
          params: {
            nombre_promo: nombrePromo,
            sucursal: parseInt(selectedSucursal),
            del: fechaDel,
            al: fechaAl,
            area: selectedArea,
            depto: selectedDepto,
            marca: selectedMarca,
            familia: selectedFamilia,
            producto: selectedProducto,
            cant: parseInt(cantidad),
            desc_porcentaje: parseFloat(descPorcentaje),
            descuento: descuento,
          },
        }
      )

      const result = response.data?.[0]

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al guardar')
      }

      await fetchPromociones()
      
      setNombrePromo('')
      setSelectedSucursal('')
      setFechaDel('')
      setFechaAl('')
      setSelectedArea('')
      setSelectedDepto('')
      setSelectedMarca('')
      setSelectedFamilia('')
      setSelectedProducto('')
      setCantidad('')
      setDescPorcentaje('')
      setDescuento('')
      setDepartamentos([])
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOpen = (row: Promocion) => {
    setRowToDelete(row)
    setOpenDelete(true)
  }

  const handleDeleteClose = () => {
    setOpenDelete(false)
    setRowToDelete(null)
  }

  const handleDeleteConfirm = async () => {
    if (!rowToDelete) return

    try {
      setDeleting(true)

      const response = await consumoApi.delete(
        `/api/ConfigPromoDescPorcentual/sp_bw_config_promo_desc_porcentual_del`,
        {
          params: {
            nombre_promo: rowToDelete.nombre_promo,
            sucursal: rowToDelete.sucursal,
            del: rowToDelete.del,
            al: rowToDelete.al,
            area: rowToDelete.area,
            depto: rowToDelete.depto,
            marca: rowToDelete.marca,
            familia: rowToDelete.familia,
            producto: rowToDelete.producto,
            cant: rowToDelete.cant,
            desc_porcentaje: rowToDelete.desc_porcentaje,
            descuento: rowToDelete.descuento,
          },
        }
      )

      const result = response.data?.[0]

      if (result?.codigo !== 0) {
        throw new Error(result?.mensaje1 || 'Error al eliminar')
      }

      await fetchPromociones()
      handleDeleteClose()
    } catch (err: any) {
      setError(err.message || 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  const handleBack = () => {
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
      <Box sx={{ width: '100%', p: {xs:1, md:2}, backgroundColor: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' , justifyContent: 'center'}}>
        <Box sx={{ backgroundColor: 'white', p: 3, borderRadius: 1, boxShadow: 1, width: '100%', mx:'auto' }}>
          <Typography variant="h6" sx={{ color: '#999', mb: 0.5, fontSize: '0.9rem' }}>
            CONFIGURACION DE PROMOCIONES CON DESCUENTOS
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, borderBottom: '3px solid black', pb: 1 }}>
            CONFIGURACION DE PROMOCIONES CON DESCUENTO PORCENTUAL
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 0.1, mb: 3, alignItems: 'center', overflowX: 'auto', pb: 1 }}>
            <TextField
              label="Nombre Promo"
              value={nombrePromo}
              onChange={(e) => setNombrePromo(e.target.value)}
              sx={{ minWidth: 100 }}
            />

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Sucursal</InputLabel>
              <Select
                value={selectedSucursal}
                onChange={(e) => setSelectedSucursal(e.target.value)}
                label="Sucursal"
              >
                {sucursales.map((sucursal) => (
                  <MenuItem key={sucursal.cve_sucursal} value={String(sucursal.cve_sucursal)}>
                    {sucursal.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Del"
              type="date"
              value={fechaDel}
              onChange={(e) => setFechaDel(e.target.value)}
              sx={{ minWidth: 120 }}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Al"
              type="date"
              value={fechaAl}
              onChange={(e) => setFechaAl(e.target.value)}
              sx={{ minWidth: 120 }}
              InputLabelProps={{ shrink: true }}
            />

            <FormControl sx={{ minWidth: 120 }}>
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

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Depto</InputLabel>
              <Select
                value={selectedDepto}
                onChange={(e) => setSelectedDepto(e.target.value)}
                label="Depto"
                disabled={!selectedArea}
              >
                {departamentos.map((depto) => (
                  <MenuItem key={depto.depto} value={depto.depto}>
                    {depto.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Marca</InputLabel>
              <Select
                value={selectedMarca}
                onChange={(e) => setSelectedMarca(e.target.value)}
                label="Marca"
              >
                {marcas.map((marca) => (
                  <MenuItem key={marca.marca} value={marca.marca}>
                    {marca.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Familia</InputLabel>
              <Select
                value={selectedFamilia}
                onChange={(e) => setSelectedFamilia(e.target.value)}
                label="Familia"
              >
                {familias.map((familia) => (
                  <MenuItem key={familia.familia} value={familia.familia}>
                    {familia.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Producto</InputLabel>
              <Select
                value={selectedProducto}
                onChange={(e) => setSelectedProducto(e.target.value)}
                label="Producto"
              >
                {productos.map((producto) => (
                  <MenuItem key={producto.producto} value={producto.producto}>
                    {producto.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Cant"
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              sx={{ width: 100 }}
              inputProps={{ min: "1" }}
            />

            <TextField
              label="Desc %"
              type="number"
              value={descPorcentaje}
              onChange={(e) => setDescPorcentaje(e.target.value)}
              sx={{ width: 120 }}
              inputProps={{ step: "0.01", min: "0", max: "1" }}
            />

            <TextField
              label="Descuento"
              value={descuento}
              onChange={(e) => setDescuento(e.target.value)}
              sx={{ minWidth: 120 }}
            />

            <Button
              variant="contained"
              onClick={handleAdd}
              disabled={!nombrePromo || !selectedSucursal || !fechaDel || !fechaAl || !selectedArea || !selectedDepto || !selectedMarca || !selectedFamilia || !selectedProducto || !cantidad || !descPorcentaje || !descuento || saving}
              sx={{ height: 56 }}
            >
              {saving ? 'Guardando...' : 'Agregar'}
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>Error: {error}</Alert>}

          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[5, 10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 25,
                },
              },
            }}
            sx={{ 
              height: 600,
              backgroundColor: 'white',
              '& .MuiDataGrid-row:nth-of-type(even)': {
                backgroundColor: '#f9f9f9',
              },
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              sx={{ minWidth: 120 }}
            >
              Salir
            </Button>
          </Box>
        </Box>
      </Box>

      <Dialog open={openDelete} onClose={handleDeleteClose}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          ¿Está seguro de que desea eliminar esta promoción?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose} disabled={deleting}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={deleting}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <PWABadge />
    </>
  )
}
