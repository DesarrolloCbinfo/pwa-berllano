import { useEffect, useState } from 'react'
import { Box, CircularProgress, Alert, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, IconButton, TextField } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import DeleteIcon from '@mui/icons-material/Delete'
import useConsumoApi from '../../../hooks/useConsumoApi'
import PWABadge from '../../../PWABadge'

interface Promocion {
  id: number
  nombrePromo: string
  sucursal: string
  f1: string
  f2: string
  area: string
  depto: string
  marca: string
  familia: string
  clave_prod: string
  cantidad: number
  descuento: number
  idDescuento: string
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
  id: number
  marca: string
}

interface Familia {
  clave: number
  descripcion: string
}

interface Producto {
  clave_prod: string
  descripcion: string
}

interface TipoDescuento {
  tipo_descuento: number
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
  const [tiposDescuento, setTiposDescuento] = useState<TipoDescuento[]>([])

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
  const [selectedTipoDescuento, setSelectedTipoDescuento] = useState('')

  const [saving, setSaving] = useState(false)

  const [openDelete, setOpenDelete] = useState(false)
  const [rowToDelete, setRowToDelete] = useState<Promocion | null>(null)
  const [deleting, setDeleting] = useState(false)

  const columns: GridColDef[] = [
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 90,
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
    { field: 'nombrePromo', headerName: 'Nombre Promo', width: 130 },
    { field: 'sucursal', headerName: 'Sucursal', width: 100 },
    { field: 'f1', headerName: 'Del', width: 90 },
    { field: 'f2', headerName: 'Al', width: 90 },
    { field: 'area', headerName: 'Area', width: 120 },
    { field: 'depto', headerName: 'Depto', width: 180 },
    { field: 'marca', headerName: 'Marca', width: 120 },
    { field: 'familia', headerName: 'Familia', width: 120 },
    { field: 'clave_prod', headerName: 'Producto', width: 200 },
    { field: 'cantidad', headerName: 'Cant', width: 60 },
    { field: 'descuento', headerName: 'Desc %', width: 80 },
    { field: 'idDescuento', headerName: 'Descuento', width: 120 },
  ]

  const fetchSucursales = async () => {
    try {
      const res = await consumoApi.get('/api/CatConfigPromoDescPorcen/sp_bw_cat_sucursales_sel')
      setSucursales(res.data)
    } catch (err) {
      console.error('Error al cargar sucursales:', err)
    }
  }

  const fetchAreas = async () => {
    try {
      const res = await consumoApi.get('/api/CatConfigPromoDescPorcen/sp_bw_cat_areas_sel?area=0')
      setAreas(res.data)
    } catch (err) {
      console.error('Error al cargar áreas:', err)
    }
  }

  const fetchDepartamentos = async (area: string) => {
    try {
      const res = await consumoApi.get(`/api/CatConfigPromoDescPorcen/sp_bw_cat_deptos_sel?area=${area}`)
      setDepartamentos(res.data)
    } catch (err) {
      console.error('Error al cargar departamentos:', err)
    }
  }

  const fetchMarcas = async () => {
    try {
      const res = await consumoApi.get('/api/CatConfigPromoDescPorcen/sp_bw_cat_marcas_sel?id=0')
      setMarcas(res.data)
    } catch (err) {
      console.error('Error al cargar marcas:', err)
    }
  }

  const fetchFamilias = async (id_marca: number) => {
    try {
      const res = await consumoApi.get(`/api/CatConfigPromoDescPorcen/sp_bw_cat_marcaFam1_sel?id_marca=${id_marca}`)
      setFamilias(res.data)
    } catch (err) {
      console.error('Error al cargar familias:', err)
    }
  }

  const fetchProductos = async () => {
    try {
      const res = await consumoApi.get('/api/CatConfigPromoDescPorcen/sp_bw_cat_productos_servicios_sel')
      setProductos(res.data)
    } catch (err) {
      console.error('Error al cargar productos:', err)
    }
  }

  const fetchTiposDescuento = async () => {
    try {
      const res = await consumoApi.get('/api/CatConfigPromoDescPorcen/sp_bw_cat_tipos_descuento_sel')
      setTiposDescuento(res.data)
    } catch (err) {
      console.error('Error al cargar tipos de descuento:', err)
    }
  }

  const fetchPromociones = async () => {
    try {
      const res = await consumoApi.get('/api/CatConfigPromoDescPorcen/sp_bw_t_promocionesDescuentos_sel')
      const data = res.data.map((item: any, index: number) => ({ 
        ...item, 
        id: item.id ?? index 
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
      await fetchProductos()
      await fetchTiposDescuento()
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

  useEffect(() => {
    if (selectedMarca) {
      const marca = marcas.find(m => m.marca === selectedMarca)
      if (marca) {
        fetchFamilias(marca.id)
        setSelectedFamilia('')
      }
    } else {
      setFamilias([])
      setSelectedFamilia('')
    }
  }, [selectedMarca])

  const handleAdd = async () => {
    if (!nombrePromo || !selectedSucursal || !fechaDel || !fechaAl || !selectedArea || !selectedDepto || !selectedMarca || !selectedFamilia || !selectedProducto || !cantidad || !descPorcentaje || !descuento || !selectedTipoDescuento) return

    try {
      setSaving(true)

      // Encontrar el ID del tipo de descuento seleccionado
      const tipoDescuento = tiposDescuento.find(t => t.descripcion === selectedTipoDescuento)
      if (!tipoDescuento) {
        throw new Error('Tipo de descuento no válido')
      }

      const response = await consumoApi.post(
        `/api/CatConfigPromoDescPorcen/sp_bw_t_promocionesDescuentos_upd`,
        '',
        {
          params: {
            nombrePromo: nombrePromo,
            sucursal: selectedSucursal,
            f1: fechaDel,
            f2: fechaAl,
            area: selectedArea,
            depto: selectedDepto,
            marca: selectedMarca,
            familia: selectedFamilia,
            clave_prod: selectedProducto,
            cantidad: parseInt(cantidad),
            descuento: parseFloat(descPorcentaje),
            idDescuento: tipoDescuento.tipo_descuento,
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
      setSelectedTipoDescuento('')
      setDepartamentos([])
      setFamilias([])
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
        `/api/CatConfigPromoDescPorcen/sp_bw_t_promocionesDescuentos_del`,
        {
          params: {
            id: rowToDelete.id,
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
      <Box sx={{ width: '100%', p: 1, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Box sx={{ backgroundColor: 'white', p: 2, borderRadius: 1, boxShadow: 1, width: '100%', maxWidth: '100%' }}>
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
                  <MenuItem key={marca.id} value={marca.marca}>
                    {marca.marca}
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
                disabled={!selectedMarca}
              >
                {familias.map((familia) => (
                  <MenuItem key={familia.clave} value={familia.descripcion}>
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
                  <MenuItem key={producto.clave_prod} value={producto.clave_prod}>
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

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Tipo Descuento</InputLabel>
              <Select
                value={selectedTipoDescuento}
                onChange={(e) => setSelectedTipoDescuento(e.target.value)}
                label="Tipo Descuento"
              >
                {tiposDescuento.map((tipo) => (
                  <MenuItem key={tipo.tipo_descuento} value={tipo.descripcion}>
                    {tipo.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleAdd}
              disabled={!nombrePromo || !selectedSucursal || !fechaDel || !fechaAl || !selectedArea || !selectedDepto || !selectedMarca || !selectedFamilia || !selectedProducto || !cantidad || !descPorcentaje || !descuento || !selectedTipoDescuento || saving}
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
