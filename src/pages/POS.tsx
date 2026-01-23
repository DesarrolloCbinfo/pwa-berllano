import * as React from "react";
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Switch,
  CircularProgress,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import useConsumoApi from "../hooks/useConsumoApi";

type Cliente = {
  No_cliente: string;
  nombre: string;
  ap_paterno?: string | null;
  ap_materno?: string | null;
  total_registros?: number;
};

type Producto = {
  clave_prod: string;
  descripcion: string;
  Precio?: number;
  costo_unitario: number;
  tasa_iva: number;
  total_registros?: number;
};

type CartItem = {
  id: string;
  descripcion: string;
  precio: number;
  cantidad: number;
};

export default function POS() {
  const { consumoApi } = useConsumoApi();
  const [searchInsumos, setSearchInsumos] = React.useState<boolean>(false);
  // Clientes
  const [clients, setClients] = React.useState<Cliente[]>([]);
  const [selectedClient, setSelectedClient] = React.useState<string>("00001");
  const [clientSearchQuery, setClientSearchQuery] = React.useState<string>("");
  const [clientsLoading, setClientsLoading] = React.useState<boolean>(false);
  // Stylists (POS) - datos traídos por API con paginación controlada en cliente
  const getSucursalFromSession = (): number => {
    try {
      const v = sessionStorage.getItem("sucursal_pdv");
      if (v) return Number(v);
    } catch {
      // ignore
    }
    // Valor por defecto si no se encuentra en sesion
    return 5;
  };
  const [stylistsAll, setStylistsAll] = React.useState<{ clave_empleado: string; nombre: string }[]>([]);
  const [stylistDisplayCount, setStylistDisplayCount] = React.useState<number>(10);
  // Estilistas (desde API, con display controlado)
  const [selectedStylist, setSelectedStylist] = React.useState<string>("Sin Estilista");

  // Productos
  const [products, setProducts] = React.useState<Producto[]>([]);
  const [productPage, setProductPage] = React.useState<number>(1);
  const [productQuery, setProductQuery] = React.useState<string>("gel");
  const [productsLoading, setProductsLoading] = React.useState<boolean>(false);

  // Carrito
  const [cart, setCart] = React.useState<CartItem[]>([]);

  // Carga inicial de clientes y productos
  React.useEffect(() => {
    fetchClients(1, 20, "%", true);
  }, []);

  React.useEffect(() => {
    if (clientSearchQuery.trim() === "") return;
    const timer = setTimeout(() => {
      fetchClients(1, 20, clientSearchQuery, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [clientSearchQuery]);

  React.useEffect(() => {
    fetchProducts(productPage, 20, productQuery, false);
  }, [productPage, productQuery]);

  // Carga inicial de estilistas (desde API) y paginado local
  React.useEffect(() => {
    fetchStylistsAll();
  }, []);

  // Fetch helpers
  async function fetchClients(page: number, perPage: number, search: string, _forceRefresh?: boolean) {
    try {
      setClientsLoading(true);
      const url = `/api/PuntoDeVenta/sp_cat_clientes_suc_paginado?pagina=${page}&registros=${perPage}&Busqueda=${encodeURIComponent(search)}`;
      const res = await consumoApi.get(url);
      const data = res.data;
      if (Array.isArray(data)) {
        setClients((prev) => (page === 1 ? data : [...prev, ...data]));
      }
    } catch (e) {
      console.error("Error cargando clientes", e);
    } finally {
      setClientsLoading(false);
    }
  }

  async function fetchProducts(page: number, perPage: number, search: string, _isInsumo?: boolean) {
    try {
      setProductsLoading(true);
      const url2 = `/api/PuntoDeVenta/sp_busca_productos_paginado?clave_desc=${encodeURIComponent(search)}&insumo=${searchInsumos ? 'true' : 'false'}&pagina=${page}&registros=${perPage}`;
      const res = await consumoApi.get(url2);
      const data = res.data;
      if ( Array.isArray(data) ) {
        setProducts((prev) => (page === 1 ? data : [...prev, ...data]));
      }
    } catch (e) {
      console.error("Error cargando productos", e);
    } finally {
      setProductsLoading(false);
    }
  }

  async function fetchStylistsAll() {
    try {
      const suc = getSucursalFromSession();
      const url = `https://cbinfo.no-ip.info:8079/api/PuntoDeVenta/sp_pos_estilistas_listado?sucursal=${suc}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/octet-stream",
        },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        // Guardar toda la lista y luego paginar en el cliente
        setStylistsAll(data.map((u) => ({ clave_empleado: String(u.clave_empleado), nombre: u.nombre })));
      }
    } catch (e) {
      console.error("Error cargando estilistas", e);
    }
  }

  // Carrito
  const addToCart = (p: Producto) => {
    const unitPrice = p.Precio && p.Precio > 0 ? p.Precio : p.costo_unitario;
    setCart((prev) => {
      const found = prev.find((c) => c.id === p.clave_prod);
      if (found) {
        return prev.map((c) =>
          c.id === p.clave_prod ? { ...c, cantidad: c.cantidad + 1 } : c
        );
      }
      return [
        ...prev,
        {
          id: p.clave_prod,
          descripcion: p.descripcion,
          precio: unitPrice,
          cantidad: 1,
        },
      ];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, cantidad: Math.max(1, c.cantidad + delta) } : c))
        .filter((c) => c.cantidad > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  // Totales
  const subtotal = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const taxRate = 0.16;
  const tax = cart.reduce((sum, item) => sum + item.precio * item.cantidad * taxRate, 0);
  const total = subtotal + tax;

  const displayedStylists = stylistsAll.slice(0, stylistDisplayCount);

  return (
    <Box sx={{ padding: 2 }}>
      {/* Header: clientes y estilistas */}
      <Paper sx={{ padding: 2, mb: 2 }}>
        <Box
          sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr' }, gap: 2, alignItems: 'center' }}
        >
          <Box>
            <Autocomplete
              fullWidth
              loading={clientsLoading}
              value={clients.find(c => c.No_cliente === selectedClient) ?? null}
              onChange={(_, newValue) => {
                const v = newValue as Cliente | null;
                setSelectedClient(v?.No_cliente ?? "");
              }}
              onInputChange={(_, value) => {
                setClientSearchQuery(value);
              }}
              getOptionLabel={(option: any) => {
                if (!option) return "";
                const o = option as Cliente;
                const ap = o.ap_paterno ? ` ${o.ap_paterno}` : "";
                const am = o.ap_materno ? ` ${o.ap_materno}` : "";
                return `${o.nombre}${ap}${am}`;
              }}
              isOptionEqualToValue={(o, v) => o?.No_cliente === v?.No_cliente}
              options={clients as any}
              renderInput={(params) => (
                <TextField {...params} label="Cliente" placeholder="Buscar..." />
              )}
            />
          </Box>
          <Box>
            <FormControl fullWidth>
              <InputLabel id="estilista-label">Estilista</InputLabel>
              <Select
                labelId="estilista-label"
                value={selectedStylist}
                label="Estilista"
                onChange={(e) => setSelectedStylist(e.target.value as string)}
              >
                {displayedStylists.map((s) => (
                  <MenuItem key={s.clave_empleado} value={s.clave_empleado}>
                    {s.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Switch checked={searchInsumos} onChange={(e)=> setSearchInsumos(e.target.checked)} />
              <Typography variant="body2">Buscar insumos</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button variant="outlined" onClick={() => setStylistDisplayCount((c) => Math.min(c + 10, stylistsAll.length))}>
                Cargar más estilistas
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Cuerpo: dos paneles */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' }, gap: 2 }}>
        {/* Izquierda: tabla de productos */}
        <Box>
          <Paper sx={{ height: '60vh', overflow: 'auto', padding: 2 }}>
            <Typography variant="h6" gutterBottom>Productos</Typography>
            <Box sx={{ mb: 1 }}>
              <TextField
                label="Buscar producto"
                value={productQuery}
                onChange={(e) => {
                  setProductQuery(e.target.value);
                  setProductPage(1);
                }}
                size="small"
              />
              <Button sx={{ ml: 2 }} variant="outlined" onClick={() => setProductPage((p) => p + 1)}>
                Cargar más
              </Button>
            </Box>
            {productsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Clave</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Precio</TableCell>
                  <TableCell>Costo</TableCell>
                  <TableCell>IVA</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((p) => {
                  const unit = p.Precio && p.Precio > 0 ? p.Precio : p.costo_unitario;
                  return (
                    <TableRow key={p.clave_prod} hover>
                      <TableCell>{p.clave_prod}</TableCell>
                      <TableCell title={p.descripcion}>{p.descripcion}</TableCell>
                      <TableCell>{unit.toFixed(2)}</TableCell>
                      <TableCell>{p.costo_unitario.toFixed(2)}</TableCell>
                      <TableCell>{(p.tasa_iva * 100).toFixed(0)}%</TableCell>
                      <TableCell>
                        <Button size="small" variant="contained" onClick={() => addToCart(p)}>
                          Agregar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            )}
          </Paper>
        </Box>
        {/* Derecha: carrito */}
        <Box>
          <Paper sx={{ padding: 2, height: '60vh', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>Carrito</Typography>
            {cart.length === 0 ? (
              <Typography variant="body2">Sin productos en el carrito.</Typography>
            ) : (
              <Box>
                {cart.map((item) => (
                  <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ flex: 1 }}>{item.descripcion}</Typography>
                    <Button size="small" onClick={() => updateQty(item.id, -1)}>-</Button>
                    <Typography sx={{ width: 40, textAlign: 'center' }}>{item.cantidad}</Typography>
                    <Button size="small" onClick={() => updateQty(item.id, +1)}>+</Button>
                    <Typography sx={{ width: 80, textAlign: 'right', ml: 1 }}>{(item.precio * item.cantidad).toFixed(2)}</Typography>
                    <Button size="small" color="error" onClick={() => removeFromCart(item.id)}>Quitar</Button>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Footer: totales y acciones */}
      <Paper sx={{ mt: 2, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle1">Totales</Typography>
            <Typography variant="body2">Subtotal: {subtotal.toFixed(2)}</Typography>
            <Typography variant="body2">IVA: {tax.toFixed(2)}</Typography>
            <Typography variant="h6">Total: {total.toFixed(2)}</Typography>
          </Box>
          <Box>
            <Button variant="contained" color="primary" sx={{ mr: 1 }}>Guardar</Button>
            <Button variant="contained" color="success" sx={{ mr: 1 }}>Finalizar Venta</Button>
            <Button variant="outlined" color="secondary" sx={{ mr: 1 }}>Cobro</Button>
            <Button variant="outlined" color="inherit">Totales</Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
