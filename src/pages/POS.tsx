import React, { useEffect } from "react";
import TextField from "@mui/material/TextField";
import useConsumoApi from "../hooks/useConsumoApi";
import { useServerTable } from "../hooks/useServerTable";
import ClientesTable from "../components/POS/ClientesTable";
import PaginationControls from "../components/POS/PaginationControl";
import { Box, Button, Dialog, DialogContent, DialogTitle, Divider, FormControl, Input, InputLabel, MenuItem, Select } from "@mui/material";
import ProductosTable from "../components/POS/ProductosTable";

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
  total_registros?: number;
};

type Auxiliar = {
  clave_empleado: string;
  nombre: string;
};

export default function POS() {
  const { consumoApi } = useConsumoApi();
  const [searchText, setSearchText] = React.useState("");
  const [modalClienteOpen, setModalClienteOpen] = React.useState(false);

  const [productoSeleccionado, setProductoSeleccionado] = React.useState<Producto | null>(null);
  const [modalProductoOpen, setModalProductoOpen] = React.useState(false);

  const [clienteSeleccionado, setClienteSeleccionado] = React.useState<
  Cliente | null
>(null);

const [estilistas, setEstilistas] = React.useState<Estilista[]>([]);
const [estilistaSeleccionado, setEstilistaSeleccionado] = React.useState("");
const [estilistaAuxiliar,setEstilistaAuxiliar] = React.useState<Auxiliar | null>(null);
const [auxiliarSeleccionado,setAuxiliarSeleccionado] = React.useState<Auxiliar | null>(null);
const [esInsumo, setEsInsumo] = React.useState(false);

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
    `/api/PuntoDeVenta/sp_busca_productos_paginado?clave_desc=${encodeURIComponent(search)}&insumo=${esInsumo}&pagina=${page}&registros=${pageSize}`
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


  return (
    <>
   

<Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
  <TextField
    size="small"
    label="Cliente"
    value={clienteSeleccionado ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.ap_paterno || ''} ${clienteSeleccionado.ap_materno || ''}`.trim() : ""}
   
  />

  <Button
    size="small"
    variant="contained"
    onClick={() => {
      setSearchText("");
      setSearch("");
      setPage(0);
      setModalClienteOpen(true);
    }}
  >
    Seleccionar
  </Button>

  <Button size="small" variant="outlined">
    +
  </Button>
</Box>

<Divider sx={{ my: 2 }} />


{/* barra de agregar venta */}
<Box>
<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
  <Box>
<FormControl size="small" fullWidth>
  <InputLabel id="estilista-label">Estilista</InputLabel>
  <Select
    labelId="estilista-label"
    label="Estilista"
    value={estilistaSeleccionado}
    onChange={(e) => setEstilistaSeleccionado (e.target.value)}
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
<Box sx={{ display: "flex", gap: 0, alignItems: "center" }}>
   <TextField
    size="small"
    type="text"
    value={productoSeleccionado? `${productoSeleccionado.descripcion}  ` : ""}
    fullWidth
   />
   <Button size="small" variant="outlined" 
   onClick={() => {
  setPageProductos(0);
  setSearchProductos("");
  setEsInsumo(false);
  setModalProductoOpen(true);
}}
   >
  prod
  </Button>
  </Box>
  

  <Box sx={{ display: "flex", gap: 0, alignItems: "center" }}>
<FormControl size="small" fullWidth>
  <InputLabel id="estilista-label">Estilista auxiliar</InputLabel>
  <Select
    labelId="estilista-label"
    label="Estilista"
    value={auxiliarSeleccionado}
    onChange={(e) => setAuxiliarSeleccionado (e.target.value)}
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
<Button size="small" variant="outlined">
  registrar
</Button>

  
  </Box>
  




</Box>
</Box>



{/* modals */}
<Dialog maxWidth="lg" open={modalClienteOpen} onClose={() => setModalClienteOpen(false)}>
  <DialogTitle>Seleccionar Cliente</DialogTitle>
  <DialogContent>
    <TextField
  size="small"
  label="Buscar cliente"
  fullWidth
  sx={{ mb: 1 }}
  value={searchText}
  onChange={(e) => {
    const value = e.target.value;
    setSearchText(value);

    setPage(0);      // 🔥 SIEMPRE volver a página 1
    setSearch(value);
  }}
/>
    <ClientesTable
      data={clients}
      onSelect={(cliente) => {
        setClienteSeleccionado(cliente);
        setModalClienteOpen(false);
      }}
    />
     <PaginationControls
        page={page}
        total={total}
        pageSize={pageSize}
        onChange={setPage}
      />
  </DialogContent>
</Dialog>

<Dialog maxWidth="lg" open={modalProductoOpen} onClose={() => setModalProductoOpen(false)}>
  <DialogTitle>Seleccionar {esInsumo ? "Insumo" : "Producto"}</DialogTitle>
  <DialogContent>
    <TextField
      size="small"
      label="Buscar producto"
      fullWidth
      sx={{ mb: 1 }}
      onChange={(e) => {
        setPageProductos(0);
        setSearchProductos(e.target.value);
      }}
    />

<ProductosTable
  data={productos}
  onSelect={(producto) => {
    setProductoSeleccionado(producto);
    setModalProductoOpen(false);
  }}
/>
  <PaginationControls
  page={pageProductos}
  total={totalProductos}
  pageSize={pageSizeProductos}
  onChange={setPageProductos}
/>
  </DialogContent>
</Dialog>

    </>


  );
}
