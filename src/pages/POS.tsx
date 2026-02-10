import React, { useEffect } from "react";
import TextField from "@mui/material/TextField";
import useConsumoApi from "../hooks/useConsumoApi";
import { useServerTable } from "../hooks/useServerTable";
import ClientesTable from "../components/POS/ClientesTable";
import PaginationControls from "../components/POS/PaginationControl";
import { Box, Button, Dialog, DialogContent, DialogTitle, Divider, FormControl, Input, InputLabel, MenuItem, Select, useTheme, useMediaQuery, Typography } from "@mui/material";
import ProductosTable from "../components/POS/ProductosTable";
import DetalleVentasTable from "../components/POS/DetalleVentasTable";
import SideBarHorizontal from "../components/SideBarHorizontal";

type Cliente = {
  No_cliente: string;
  nombre: string;
  ap_paterno?: string | null;
  ap_materno?: string | null;
  total_registros?: number;
};

type Estilista = {
  clave_empleado: string;
  nombre: string;
};

type Producto = {
  clave_prod: string;
  descripcion: string;
  Precio?:number;
  costo_unitario?: number;
  tasa_iva?: number;
  inventariable?: boolean;
  es_insumo?: boolean;
  es_servicio?: boolean;
  es_producto?: boolean;
  controlado?: boolean;
  tiempo?: string;
  total_registros?: number;

};

type Auxiliar = {
  clave_empleado: string;
  nombre: string;
};

type DetalleVenta = {
  id: string;
  estilista: string;
  d_estilista: string;
  hora: string;
  clave_prod: string;
  d_producto: string;
  tiempo: string;
  Cant: number;
  precio: number;
  importe: number;
  descuento: number;
  auxiliar: string;
  d_auxiliar: string;
  insumos?: DetalleVenta[]; // Insumos asociados
};

export default function POS() {
  const { consumoApi } = useConsumoApi();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [searchText, setSearchText] = React.useState("");
  const [modalClienteOpen, setModalClienteOpen] = React.useState(false);

  const [productoSeleccionado, setProductoSeleccionado] = React.useState<Producto | null>(null);
  const [modalProductoOpen, setModalProductoOpen] = React.useState(false);
  const [modalInsumosOpen, setModalInsumosOpen] = React.useState(false);
  const [productoPrincipal, setProductoPrincipal] = React.useState<Producto | null>(null);
  const [insumosSeleccionados, setInsumosSeleccionados] = React.useState<Array<{producto: Producto, cantidad: number}>>([]);

  const [clienteSeleccionado, setClienteSeleccionado] = React.useState<
  Cliente | null
>(null);

const [estilistas, setEstilistas] = React.useState<Estilista[]>([]);
const [estilistaSeleccionado, setEstilistaSeleccionado] = React.useState("");
const [estilistaAuxiliar,setEstilistaAuxiliar] = React.useState<Auxiliar[]>([]);
const [auxiliarSeleccionado,setAuxiliarSeleccionado] = React.useState<string>("");
const [esInsumo, setEsInsumo] = React.useState(false);

const [detallesVenta, setDetallesVenta] = React.useState<DetalleVenta[]>([]);

  // Función para cargar datos desde JSON (para desarrollo/pruebas)
  const cargarDatosDesdeJSON = () => {
    const datosEjemplo = [
      {
        id: "1",
        estilista: "EMP001",
        d_estilista: "Juan Pérez",
        hora: "14:30",
        clave_prod: "SERV001",
        d_producto: "Corte de Cabello",
        tiempo: "01:00",
        Cant: 1,
        precio: 150.00,
        importe: 150.00,
        descuento: 0,
        auxiliar: "EMP003",
        d_auxiliar: "María López",
        insumos: [
          {
            id: "1-1",
            estilista: "EMP001",
            d_estilista: "Juan Pérez",
            hora: "14:30",
            clave_prod: "INS001",
            d_producto: "Shampoo Profesional",
            tiempo: "00:15",
            Cant: 1,
            precio: 25.00,
            importe: 25.00,
            descuento: 0,
            auxiliar: "EMP003",
            d_auxiliar: "María López"
          },
          {
            id: "1-2",
            estilista: "EMP001",
            d_estilista: "Juan Pérez",
            hora: "14:30",
            clave_prod: "INS002",
            d_producto: "Acondicionador",
            tiempo: "00:10",
            Cant: 2,
            precio: 15.00,
            importe: 30.00,
            descuento: 0,
            auxiliar: "EMP003",
            d_auxiliar: "María López"
          }
        ]
      },
      {
        id: "2",
        estilista: "EMP002",
        d_estilista: "Ana García",
        hora: "15:00",
        clave_prod: "SERV002",
        d_producto: "Manicure",
        tiempo: "00:45",
        Cant: 1,
        precio: 80.00,
        importe: 80.00,
        descuento: 0,
        auxiliar: "",
        d_auxiliar: ""
      }
    ];
    
    setDetallesVenta(datosEjemplo);
  };

  // Función para guardar datos en JSON
  const guardarDatosEnJSON = () => {
    try {
      // Crear objeto con todos los datos
      const datosCompletos = {
        cliente: clienteSeleccionado ? {
          No_cliente: clienteSeleccionado.No_cliente,
          nombre: clienteSeleccionado.nombre,
          ap_paterno: clienteSeleccionado.ap_paterno,
          ap_materno: clienteSeleccionado.ap_materno
        } : null,
        detalles: detallesVenta,
        fecha: new Date().toISOString(),
        sucursal: 1,
        total: detallesVenta.reduce((sum, detalle) => sum + detalle.importe, 0),
        estilista: estilistaSeleccionado,
        auxiliar: auxiliarSeleccionado
      };

      // Convertir a JSON string con formato bonito
      const jsonString = JSON.stringify(datosCompletos, null, 2);
      
      // Crear blob y descargar
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Crear enlace de descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = `venta_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Datos guardados exitosamente');
    } catch (error) {
      console.error('Error guardando datos:', error);
      alert('Error al guardar los datos');
    }
  };

  // Función para cargar desde archivo JSON externo
  const cargarDatosDesdeArchivo = async () => {
    try {
      const response = await fetch('/datos-ejemplo.json');
      const datos = await response.json();
      setDetallesVenta(datos);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos');
    }
  };

  const handleRegistrar = () => {
    // Validar que se hayan seleccionado los datos necesarios
    if (!estilistaSeleccionado || !productoSeleccionado) {
      alert('Por favor selecciona un estilista y un producto');
      return;
    }

    // Verificar si el producto es controlado y es servicio
    if (productoSeleccionado.controlado && productoSeleccionado.es_servicio) {
      // Guardar el producto principal y abrir modal de insumos
      setProductoPrincipal(productoSeleccionado);
      setModalInsumosOpen(true);
      return;
    }

    // Si no es controlado, proceder normalmente
    registrarProducto(productoSeleccionado);
  };

  const registrarProducto = (producto: Producto, esInsumoAdicional = false) => {
    // Obtener nombres del estilista y auxiliar
    const estilistaNombre = estilistas.find((e: Estilista) => e.clave_empleado === estilistaSeleccionado)?.nombre || '';
    const auxiliarNombre = auxiliarSeleccionado ? 
      estilistaAuxiliar?.find((e: Auxiliar) => e.clave_empleado === auxiliarSeleccionado)?.nombre || '' : '';

    // Crear nuevo detalle de venta
    const nuevoDetalle: DetalleVenta = {
      id: Date.now().toString(), // ID único temporal
      estilista: estilistaSeleccionado,
      d_estilista: estilistaNombre,
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      clave_prod: producto.clave_prod,
      d_producto: producto.descripcion,
      tiempo: producto.tiempo || '00:00', // Usar tiempo del producto o por defecto
      Cant: 1,
      precio: producto.Precio || 0,
      importe: producto.Precio || 0,
      descuento: 0,
      auxiliar: auxiliarSeleccionado || '',
      d_auxiliar: auxiliarNombre,
    };

    // Agregar a la lista de detalles
    setDetallesVenta(prev => [...prev, nuevoDetalle]);

    // Limpiar selección de producto para poder agregar otro
    setProductoSeleccionado(null);
    
    // Si era un insumo adicional, cerrar el modal
    if (esInsumoAdicional) {
      setModalInsumosOpen(false);
      setProductoPrincipal(null);
    }
  };

  const handleSeleccionarInsumo = (insumo: Producto) => {
    // Verificar si el insumo ya está seleccionado
    const existe = insumosSeleccionados.some(item => item.producto.clave_prod === insumo.clave_prod);
    
    if (existe) {
      // Eliminar de la selección
      setInsumosSeleccionados(prev => prev.filter(item => item.producto.clave_prod !== insumo.clave_prod));
    } else {
      // Agregar a la selección con cantidad 1
      setInsumosSeleccionados(prev => [...prev, { producto: insumo, cantidad: 1 }]);
    }
  };

  const handleCantidadInsumo = (clave_prod: string, cantidad: number) => {
    setInsumosSeleccionados(prev => 
      prev.map(item => 
        item.producto.clave_prod === clave_prod 
          ? { ...item, cantidad: Math.max(1, cantidad) }
          : item
      )
    );
  };

  const handleConfirmarInsumos = () => {
    if (!productoPrincipal || insumosSeleccionados.length === 0) {
      alert('Por favor selecciona al menos un insumo');
      return;
    }

    // Primero registrar el producto principal si no está ya registrado
    const productoYaRegistrado = detallesVenta.some(d => d.clave_prod === productoPrincipal.clave_prod);
    
    let productoActualizado: DetalleVenta;
    if (!productoYaRegistrado) {
      // Crear el producto principal con los insumos seleccionados
      productoActualizado = {
        id: Date.now().toString(),
        estilista: estilistaSeleccionado,
        d_estilista: estilistas.find((e: Estilista) => e.clave_empleado === estilistaSeleccionado)?.nombre || '',
        hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        clave_prod: productoPrincipal.clave_prod,
        d_producto: productoPrincipal.descripcion,
        tiempo: productoPrincipal.tiempo || '00:00',
        Cant: 1,
        precio: productoPrincipal.Precio || 0,
        importe: productoPrincipal.Precio || 0,
        descuento: 0,
        auxiliar: auxiliarSeleccionado || '',
        d_auxiliar: auxiliarSeleccionado ? 
          estilistaAuxiliar?.find((e: Auxiliar) => e.clave_empleado === auxiliarSeleccionado)?.nombre || '' : '',
        insumos: insumosSeleccionados.map(item => ({
          id: Date.now().toString() + Math.random(),
          estilista: estilistaSeleccionado,
          d_estilista: estilistas.find((e: Estilista) => e.clave_empleado === estilistaSeleccionado)?.nombre || '',
          hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          clave_prod: item.producto.clave_prod,
          d_producto: item.producto.descripcion,
          tiempo: item.producto.tiempo || '00:00',
          Cant: item.cantidad,
          precio: item.producto.Precio || 0,
          importe: (item.producto.Precio || 0) * item.cantidad,
          descuento: 0,
          auxiliar: auxiliarSeleccionado || '',
          d_auxiliar: auxiliarSeleccionado ? 
            estilistaAuxiliar?.find((e: Auxiliar) => e.clave_empleado === auxiliarSeleccionado)?.nombre || '' : '',
        }))
      };
      
      // Agregar el producto principal a la lista
      setDetallesVenta(prev => [...prev, productoActualizado]);
    } else {
      // Encontrar el producto principal existente y agregarle los insumos
      setDetallesVenta(prev => prev.map(detalle => {
        if (detalle.clave_prod === productoPrincipal.clave_prod) {
          const nuevosInsumos = insumosSeleccionados.map(item => ({
            id: Date.now().toString() + Math.random(),
            estilista: estilistaSeleccionado,
            d_estilista: estilistas.find((e: Estilista) => e.clave_empleado === estilistaSeleccionado)?.nombre || '',
            hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            clave_prod: item.producto.clave_prod,
            d_producto: item.producto.descripcion,
            tiempo: item.producto.tiempo || '00:00',
            Cant: item.cantidad,
            precio: item.producto.Precio || 0,
            importe: (item.producto.Precio || 0) * item.cantidad,
            descuento: 0,
            auxiliar: auxiliarSeleccionado || '',
            d_auxiliar: auxiliarSeleccionado ? 
              estilistaAuxiliar?.find((e: Auxiliar) => e.clave_empleado === auxiliarSeleccionado)?.nombre || '' : '',
          }));
          
          return {
            ...detalle,
            insumos: [...(detalle.insumos || []), ...nuevosInsumos]
          };
        }
        return detalle;
      }));
    }
    
    // Cerrar el modal y limpiar estados
    setModalInsumosOpen(false);
    setProductoPrincipal(null);
    setInsumosSeleccionados([]);
  };

  const fetchClientes = async ({ page, pageSize, search }: any) => {
    const res = await consumoApi.get(
      `/api/PuntoDeVenta/sp_cat_clientes_suc_paginado?pagina=${page}&registros=${pageSize}&Busqueda=${encodeURIComponent(search)}`
    );

    const data = res.data ?? [];
    return {
      data,
      total: data[0]?.total_registros ?? 0,
    };
  };


 const fetchEstilistas = async () => {
  const res = await consumoApi.get(`/api/PuntoDeVenta/sp_pos_estilistas_listado?sucursal=1`);
  setEstilistas(res.data ?? []);


 };


  const fetchAuxiliares = async () => {
  const res = await consumoApi.get(`/api/PuntoDeVenta/sp_pos_auxiliar_listado?sucursal=1`);
  setEstilistaAuxiliar(res.data ?? []);


 };


 
const fetchProductos = async ({ page, pageSize, search }: any) => {
  const res = await consumoApi.get(
    `/api/PuntoDeVenta/sp_busca_productos_paginado?clave_desc=${encodeURIComponent(search)}&insumo=${esInsumo ? 'true' : 'false'}&pagina=${page}&registros=${pageSize}`
  );

  const data = res.data ?? [];
  return {
    data,
    total: data[0]?.total_registros ?? 0,
  };
};

const fetchInsumos = async ({ page, pageSize, search }: any) => {
  const res = await consumoApi.get(
    `/api/PuntoDeVenta/sp_busca_productos_paginado?clave_desc=${encodeURIComponent(search)}&insumo=true&pagina=${page}&registros=${pageSize}`
  );

  const data = res.data ?? [];
  return {
    data,
    total: data[0]?.total_registros ?? 0,
  };
};


 useEffect(() => {
  fetchEstilistas();
  fetchAuxiliares();
 }, []);

  const {
    data: clients,
    page,
    pageSize,
    total,
    setPage,
    setSearch,
  } = useServerTable<Cliente>(fetchClientes, 20);


  const {
  data: productos,
  page: pageProductos,
  pageSize: pageSizeProductos,
  total: totalProductos,
  setPage: setPageProductos,
  setSearch: setSearchProductos,
} = useServerTable<Producto>(fetchProductos, 10);

const {
  data: insumos,
  page: pageInsumos,
  pageSize: pageSizeInsumos,
  total: totalInsumos,
  setPage: setPageInsumos,
  setSearch: setSearchInsumos,
} = useServerTable<Producto>(fetchInsumos, 10);

  return (
    <>

<Box sx={{ p: { xs: 2, sm: 3 } }}>
  {/* Sección de cliente */}
  <Box sx={{ 
    display: 'flex', 
    flexDirection: { xs: 'column', sm: 'row' },
    gap: { xs: 2, sm: 2 }, 
    alignItems: { xs: 'stretch', sm: 'center' },
    mb: { xs: 3, sm: 4 }
  }}>
    <TextField
      size={isMobile ? "medium" : "small"}
      label="Cliente"
      value={clienteSeleccionado ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.ap_paterno || ''} ${clienteSeleccionado.ap_materno || ''}`.trim() : ""}
      fullWidth
      sx={{ 
        flex: 1,
        '& .MuiInputBase-root': {
          height: { xs: 56, sm: 40 }, // Altura consistente
        }
      }}
    />
    <Box sx={{ 
      display: 'flex', 
      gap: { xs: 1, sm: 2 },
      flexDirection: { xs: 'row', sm: 'row' }
    }}>
      <Button
        size={isMobile ? "medium" : "small"}
        variant="contained"
        onClick={() => {
          setSearchText("");
          setSearch("");
          setPage(0);
          setModalClienteOpen(true);
        }}
        sx={{ 
          minWidth: { xs: 120, sm: 'auto' },
          height: { xs: 56, sm: 'auto' }
        }}
      >
        Seleccionar
      </Button>
      <Button 
        size={isMobile ? "medium" : "small"} 
        variant="outlined" 
        sx={{ 
          minWidth: { xs: 56, sm: 'auto' },
          height: { xs: 56, sm: 'auto' }
        }}
      >
        +
      </Button>
    </Box>
  </Box>

  <Divider sx={{ mb: { xs: 3, sm: 4 } }} />

  {/* Sección de agregar venta */}
  <Box sx={{ mb: { xs: 3, sm: 4 } }}>
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: { 
        xs: '1fr', 
        sm: 'repeat(2, 1fr)', 
        lg: 'repeat(3, 1fr)' 
      }, 
      gap: { xs: 2, sm: 2 } 
    }}>
      {/* Estilista */}
      <Box>
        <FormControl size={isMobile ? "medium" : "small"} fullWidth>
          <InputLabel id="estilista-label">Estilista</InputLabel>
          <Select
            labelId="estilista-label"
            label="Estilista"
            value={estilistaSeleccionado}
            onChange={(e) => setEstilistaSeleccionado(e.target.value)}
            sx={{
              '& .MuiInputBase-root': {
                height: { xs: 56, sm: 40 },
              }
            }}
          >
            <MenuItem value="">
              <em>Selecciona</em>
            </MenuItem>
            {estilistas.map((est) => (
              <MenuItem key={est.clave_empleado} value={est.clave_empleado}>
                {est.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Producto */}
      <Box sx={{ display: "flex", gap: { xs: 1, sm: 1 }, alignItems: "center" }}>
        <TextField
          size={isMobile ? "medium" : "small"}
          type="text"
          value={productoSeleccionado ? `${productoSeleccionado.descripcion}  ` : ""}
          fullWidth
          placeholder="Seleccionar producto"
          sx={{
            '& .MuiInputBase-root': {
              height: { xs: 56, sm: 40 },
            }
          }}
        />
        <Button 
          size={isMobile ? "medium" : "small"} 
          variant="outlined" 
          onClick={() => {
            setPageProductos(0);
            setSearchProductos("");
            setEsInsumo(false);
            setModalProductoOpen(true);
          }}
          sx={{ 
            minWidth: { xs: 80, sm: 'auto' },
            height: { xs: 56, sm: 'auto' },
            whiteSpace: 'nowrap'
          }}
        >
          prod
        </Button>
      </Box>

      {/* Auxiliar */}
      <Box sx={{ display: "flex", gap: { xs: 1, sm: 1 }, alignItems: "center" }}>
        <FormControl size={isMobile ? "medium" : "small"} fullWidth>
          <InputLabel id="auxiliar-label">Auxiliar</InputLabel>
          <Select
            labelId="auxiliar-label"
            label="Auxiliar"
            value={auxiliarSeleccionado}
            onChange={(e) => setAuxiliarSeleccionado(e.target.value)}
            sx={{
              '& .MuiInputBase-root': {
                height: { xs: 56, sm: 40 },
              }
            }}
          >
            <MenuItem value="">
              <em>Selecciona</em>
            </MenuItem>
            {estilistaAuxiliar?.map((est) => (
              <MenuItem key={est.clave_empleado} value={est.clave_empleado}>
                {est.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button 
          size={isMobile ? "medium" : "small"} 
          variant="outlined"
          onClick={handleRegistrar}
          sx={{ 
            minWidth: { xs: 100, sm: 'auto' },
            height: { xs: 56, sm: 'auto' },
            whiteSpace: 'nowrap'
          }}
        >
          registrar
        </Button>
      </Box>
    </Box>
  </Box>

  {/* Tabla de detalles - responsive */}
  <Box sx={{ 
    overflowX: 'auto', // Para scroll horizontal en móviles
    '& .MuiPaper-root': {
      minWidth: { xs: 600, sm: 'auto' } // Ancho mínimo para la tabla
    }
  }}>
    <DetalleVentasTable 
      data={detallesVenta} 
      onSelect={(id: string) => {
        setDetallesVenta(prev => prev.filter(detalle => detalle.id !== id));
      }} 
    />

<Box sx={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "flex-end",
      mt: { xs: 2, sm: 3 },
      gap: { xs: 2, sm: 3 }
    }}>
      <Box sx={{ 
        display: "flex", 
        gap: { xs: 1, sm: 2 }, 
        flexWrap: "wrap" 
      }}>
        <Button 
          variant="contained" 
          sx={{ 
            backgroundColor: 'grey.500',
            color: 'black',
            '&:hover': {
              backgroundColor: 'grey.600',
            }
          }}
          onClick={guardarDatosEnJSON}
        >
          Guardar
        </Button>
        <Button 
          variant="contained" 
          sx={{ 
            backgroundColor: 'grey.500',
            color: 'black',
            '&:hover': {
              backgroundColor: 'grey.600',
            }
          }}
        >
          Cobrar
        </Button>
        <Button 
          variant="contained" 
          sx={{ 
            backgroundColor: 'grey.500',
            color: 'black',
            '&:hover': {
              backgroundColor: 'grey.600',
            }
          }}
        >
          Cobrar varios Ctes Tc
        </Button>
        <Button 
          variant="contained" 
          sx={{ 
            backgroundColor: 'grey.500',
            color: 'black',
            '&:hover': {
              backgroundColor: 'grey.600',
            }
          }}
        >
          En proceso
        </Button>
        <Button 
          variant="contained" 
          sx={{ 
            backgroundColor: 'grey.500',
            color: 'black',
            '&:hover': {
              backgroundColor: 'grey.600',
            }
          }}
        >
          Cambiar cliente
        </Button>
        <Button 
          variant="contained" 
          sx={{ 
            backgroundColor: 'grey.500',
            color: 'black',
            '&:hover': {
              backgroundColor: 'grey.600',
            }
          }}
        >
          Salir
        </Button>
        <Button 
          variant="contained" 
          color="secondary"
          onClick={cargarDatosDesdeJSON}
          sx={{ 
            '&:hover': {
              backgroundColor: 'grey.700',
            }
          }}
        >
          Cargar JSON
        </Button>
        <Button 
          variant="contained" 
          color="warning"
          onClick={cargarDatosDesdeArchivo}
          sx={{ 
            '&:hover': {
              backgroundColor: 'orange.700',
            }
          }}
        >
          Cargar Archivo
        </Button>
      </Box>
      
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        TOTAL: ${total.toFixed(2)}
      </Typography>
    </Box>

    
  </Box>
</Box>

{/* modals */}
<Dialog 
  maxWidth={isMobile ? "sm" : "lg"} 
  fullWidth
  open={modalClienteOpen} 
  onClose={() => setModalClienteOpen(false)}
  PaperProps={{
    sx: {
      m: { xs: 1, sm: 2 },
      maxHeight: { xs: '90vh', sm: '85vh' }
    }
  }}
>
  <DialogTitle>Seleccionar Cliente</DialogTitle>
  <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
    <TextField
      size={isMobile ? "medium" : "small"}
      label="Buscar cliente"
      fullWidth
      sx={{ 
        mb: { xs: 2, sm: 2 },
        '& .MuiInputBase-root': {
          height: { xs: 56, sm: 40 },
        }
      }}
      value={searchText}
      onChange={(e) => {
        const value = e.target.value;
        setSearchText(value);
        setPage(0);
        setSearch(value);
      }}
    />
    <Box sx={{ mb: { xs: 2, sm: 2 } }}>
      <ClientesTable
        data={clients}
        onSelect={(cliente) => {
          setClienteSeleccionado(cliente);
          setModalClienteOpen(false);
        }}
      />
    </Box>
    <PaginationControls
      page={page}
      total={total}
      pageSize={pageSize}
      onChange={setPage}
    />
  </DialogContent>
</Dialog>

<Dialog 
  maxWidth={isMobile ? "sm" : "lg"} 
  fullWidth
  open={modalProductoOpen} 
  onClose={() => setModalProductoOpen(false)}
  PaperProps={{
    sx: {
      m: { xs: 1, sm: 2 },
      maxHeight: { xs: '90vh', sm: '85vh' }
    }
  }}
>
  <DialogTitle>Seleccionar {esInsumo ? "Insumo" : "Producto"}</DialogTitle>
  <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
    <TextField
      size={isMobile ? "medium" : "small"}
      label="Buscar producto"
      fullWidth
      sx={{ 
        mb: { xs: 2, sm: 2 },
        '& .MuiInputBase-root': {
          height: { xs: 56, sm: 40 },
        }
      }}
      onChange={(e) => {
        setPageProductos(0);
        setSearchProductos(e.target.value);
      }}
    />

    <Box sx={{ mb: { xs: 2, sm: 2 } }}>
      <ProductosTable
        data={productos}
        onSelect={(producto) => {
          setProductoSeleccionado(producto);
          setModalProductoOpen(false);
        }}
      />
    </Box>
    <PaginationControls
      page={pageProductos}
      total={totalProductos}
      pageSize={pageSizeProductos}
      onChange={setPageProductos}
    />
  </DialogContent>
</Dialog>

{/* Modal de selección de insumos para productos controlados */}
<Dialog 
  maxWidth={isMobile ? "md" : "lg"} 
  fullWidth
  open={modalInsumosOpen} 
  onClose={() => {
    setModalInsumosOpen(false);
    setProductoPrincipal(null);
    setInsumosSeleccionados([]);
  }}
  PaperProps={{
    sx: {
      m: { xs: 1, sm: 2 },
      maxHeight: { xs: '90vh', sm: '85vh' }
    }
  }}
>
  <DialogTitle>
    Seleccionar Insumos para: {productoPrincipal?.descripcion}
  </DialogTitle>
  <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      Este servicio requiere insumos adicionales. Por favor selecciona los insumos necesarios y ajusta las cantidades.
    </Typography>
    
    <TextField
      size={isMobile ? "medium" : "small"}
      label="Buscar insumo"
      fullWidth
      sx={{ 
        mb: { xs: 2, sm: 2 },
        '& .MuiInputBase-root': {
          height: { xs: 56, sm: 40 },
        }
      }}
      onChange={(e) => {
        setPageInsumos(0);
        setSearchInsumos(e.target.value);
      }}
    />

    {/* Tabla de insumos disponibles */}
    <Box sx={{ mb: { xs: 2, sm: 2 }, maxHeight: 300, overflow: 'auto' }}>
      <ProductosTable
        data={insumos}
        onSelect={handleSeleccionarInsumo}
      />
    </Box>
    <PaginationControls
      page={pageInsumos}
      total={totalInsumos}
      pageSize={pageSizeInsumos}
      onChange={setPageInsumos}
    />

    {/* Lista de insumos seleccionados */}
    {insumosSeleccionados.length > 0 && (
      <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
          Insumos Seleccionados:
        </Typography>
        {insumosSeleccionados.map((item, index) => (
          <Box key={item.producto.clave_prod} sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 1,
            px: 2,
            borderBottom: index < insumosSeleccionados.length - 1 ? '1px solid #e0e0e0' : 'none'
          }}>
            <Typography variant="body2" sx={{ flex: 1 }}>
              {item.producto.clave_prod} - {item.producto.descripcion}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                size="small"
                type="number"
                label="Cant"
                value={item.cantidad}
                onChange={(e) => handleCantidadInsumo(item.producto.clave_prod, parseInt(e.target.value) || 1)}
                sx={{ 
                  width: 80,
                  '& .MuiInputBase-root': {
                    height: 32,
                  }
                }}
                inputProps={{ min: 1 }}
              />
              <Button
                size="small"
                color="error"
                variant="outlined"
                onClick={() => handleSeleccionarInsumo(item.producto)}
              >
                X
              </Button>
            </Box>
          </Box>
        ))}
        
        <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
          Total Insumos: ${insumosSeleccionados.reduce((sum, item) => sum + (item.producto.Precio || 0) * item.cantidad, 0).toFixed(2)}
        </Typography>
      </Box>
    )}
    
    <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
      <Button 
        variant="outlined" 
        onClick={() => {
          setModalInsumosOpen(false);
          setProductoPrincipal(null);
          setInsumosSeleccionados([]);
        }}
      >
        Cancelar
      </Button>
      <Button 
        variant="contained" 
        color="primary"
        onClick={handleConfirmarInsumos}
        disabled={insumosSeleccionados.length === 0}
      >
        Confirmar Insumos ({insumosSeleccionados.length})
      </Button>
    </Box>
  </DialogContent>
</Dialog>

    </>


  );
}
