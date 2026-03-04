"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, Grid, 
  MenuItem, Checkbox, FormControlLabel, Paper,
  Tabs, Tab, Divider, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton
} from '@mui/material';
import { Save as SaveIcon, Close as CloseIcon, Settings as SettingsIcon } from '@mui/icons-material';

// --- ESTILOS ---
const sectionStyle = { p: 3, bgcolor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const commonInputProps = { fullWidth: true, size: "small" as const, variant: "outlined" as const };

// --- INTERFACES ---
interface ProductoForm {
  clave_prod: string;
  descripcion: string;
  descripcion_corta: string;
  marca: string;
  familia: string;
  area: string;
  depto: string;
  clase: string;
  observacion: string;
  // Costos
  costo_sin_iva: number;
  tasa_iva: number; 
  costo_con_iva: number;
  unidad_paq: number;
  costo_unitario: number;
  costo_unitario_iva: number;
  // Promoción
  en_promocion: boolean;
  precio_promocion: number;
  fecha_inicio_promo: string;
  fecha_final_promo: string;
  // Flags
  es_insumo: boolean;
  es_servicio: boolean;
  inventariable: boolean;
  entrega_directa: boolean;
  fraccionable: boolean;
  obsoleto: boolean;
  es_producto: boolean;
  es_kit: boolean;
  controlado: boolean;
  producto_libre: boolean;
  // Datos Proveedor
  clave_proveedor: string;
  clave_sas: string;
  clave_sap: string;
  sucursal_origen: string;
}

const initialState: ProductoForm = {
  clave_prod: '3474636858033',
  descripcion: 'SH-KE GENESIS BAIN RICHE 250ML',
  descripcion_corta: 'SH-KE GENESIS BAIN RICHE',
  marca: 'KERASTASE',
  familia: 'GENESIS',
  area: '3',
  depto: '1',
  clase: '1',
  observacion: '',
  costo_sin_iva: 1419.00,
  tasa_iva: 0.16,
  costo_con_iva: 0,
  unidad_paq: 3,
  costo_unitario: 0,
  costo_unitario_iva: 0,
  en_promocion: true,
  precio_promocion: 716,
  fecha_inicio_promo: '2023-05-27',
  fecha_final_promo: '2023-05-28',
  es_insumo: false,
  es_servicio: false,
  inventariable: true,
  entrega_directa: true,
  fraccionable: false,
  obsoleto: false,
  es_producto: true,
  es_kit: false,
  controlado: true,
  producto_libre: true,
  clave_proveedor: '',
  clave_sas: '3474636858033',
  clave_sap: 'E3245501',
  sucursal_origen: 'ARAUCARIAS'
};

// --- COMPONENTE PRINCIPAL ---
export default function EditarProducto() {
  const [formData, setFormData] = useState<ProductoForm>(initialState);
  const [tabValue, setTabValue] = useState(0);

  // --- LÓGICA DE NEGOCIO ---
  useEffect(() => {
    const costo = Number(formData.costo_sin_iva) || 0;
    const tasa = Number(formData.tasa_iva) || 0;
    const paq = Number(formData.unidad_paq) || 1;

    setFormData(prev => ({
        ...prev,
        costo_con_iva: costo * (1 + tasa),
        costo_unitario: costo / paq,
        costo_unitario_iva: (costo / paq) * (1 + tasa)
    }));
  }, [formData.costo_sin_iva, formData.tasa_iva, formData.unidad_paq]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    console.log("Guardando datos...", formData);
    alert("Datos guardados (Simulación)");
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      
      {/* HEADER FIJO */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
            <Typography variant="h5" fontWeight="bold">Detalles del Producto</Typography>
            <Typography variant="subtitle1" color="text.secondary">Clave: {formData.clave_prod}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<CloseIcon />} color="error">Salir</Button>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} sx={{ bgcolor: '#333' }}>Guardar Datos</Button>
        </Box>
      </Paper>

      {/* NAVEGACIÓN POR PESTAÑAS */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} textColor="primary" indicatorColor="primary">
          <Tab label="Información General" />
          <Tab label="Costos y Precios" />
          <Tab label="Configuración" />
          <Tab label="Logística" />
          <Tab label="Herramientas" icon={<SettingsIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* --- PESTAÑA 0: GENERAL --- */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
                <Box sx={sectionStyle}>
                    <Typography variant="h6" gutterBottom>Datos Básicos</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField {...commonInputProps} label="Descripción" name="descripcion" value={formData.descripcion} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField {...commonInputProps} label="Descripción Corta" name="descripcion_corta" value={formData.descripcion_corta} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField {...commonInputProps} label="Marca" name="marca" value={formData.marca} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField {...commonInputProps} label="Familia" name="familia" value={formData.familia} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField {...commonInputProps} label="Observación" name="observacion" multiline rows={2} value={formData.observacion} onChange={handleChange} />
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
            <Grid item xs={12} md={4}>
                <Box sx={sectionStyle}>
                    <Typography variant="h6" gutterBottom>Clasificación</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField {...commonInputProps} select label="Área" name="area" value={formData.area} onChange={handleChange}>
                                <MenuItem value="3">REVENTA</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField {...commonInputProps} select label="Depto" name="depto" value={formData.depto} onChange={handleChange}>
                                <MenuItem value="1">Shampoo</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField {...commonInputProps} select label="Clase" name="clase" value={formData.clase} onChange={handleChange}>
                                <MenuItem value="1">Kerastase</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
        </Grid>
      )}

      {/* --- PESTAÑA 1: COSTOS Y PRECIOS --- */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
                <Box sx={sectionStyle}>
                    <Typography variant="h6" gutterBottom>Estructura de Costos</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField {...commonInputProps} label="Costo sin IVA" type="number" name="costo_sin_iva" value={formData.costo_sin_iva} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField {...commonInputProps} label="Costo con IVA" value={formData.costo_con_iva.toFixed(2)} disabled />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField {...commonInputProps} label="Costo Unitario" value={formData.costo_unitario.toFixed(2)} disabled />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField {...commonInputProps} label="Cto. Unit c/IVA" value={formData.costo_unitario_iva.toFixed(2)} disabled />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField {...commonInputProps} label="Tasa IVA %" name="tasa_iva" value={formData.tasa_iva} onChange={handleChange} />
                        </Grid>
                    </Grid>
                    
                    <Divider sx={{ my: 3 }} />
                    
                    <Typography variant="h6" gutterBottom color="primary">Promoción</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControlLabel control={<Checkbox checked={formData.en_promocion} name="en_promocion" onChange={handleChange} />} label="Activar Promoción" />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField {...commonInputProps} type="date" label="Inicio" name="fecha_inicio_promo" value={formData.fecha_inicio_promo} InputLabelProps={{ shrink: true }} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField {...commonInputProps} type="date" label="Final" name="fecha_final_promo" value={formData.fecha_final_promo} InputLabelProps={{ shrink: true }} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField {...commonInputProps} label="Precio Promoción" type="number" name="precio_promocion" value={formData.precio_promocion} onChange={handleChange} />
                        </Grid>
                    </Grid>
                </Box>
            </Grid>

            <Grid item xs={12} md={7}>
                <Box sx={sectionStyle}>
                    <Typography variant="h6" gutterBottom>Listas de Precios</Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee' }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#333' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'white' }}>Lista</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Descripción</TableCell>
                                    <TableCell sx={{ color: 'white' }} align="right">Precio</TableCell>
                                    <TableCell sx={{ color: 'white' }} align="right">Margen</TableCell>
                                    <TableCell sx={{ color: 'white' }} align="right">Real</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>1</TableCell>
                                    <TableCell>PRECIO PUBLICO</TableCell>
                                    <TableCell align="right">$835.00</TableCell>
                                    <TableCell align="right">100.00%</TableCell>
                                    <TableCell align="right">52.18%</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>2</TableCell>
                                    <TableCell>PRECIO LEIKO</TableCell>
                                    <TableCell align="right">$835.00</TableCell>
                                    <TableCell align="right">50.00%</TableCell>
                                    <TableCell align="right">52.18%</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>3</TableCell>
                                    <TableCell>PRECIO VERACRUZ</TableCell>
                                    <TableCell align="right">$1,107.00</TableCell>
                                    <TableCell align="right">80.00%</TableCell>
                                    <TableCell align="right">101.76%</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Grid>
        </Grid>
      )}

      {/* --- PESTAÑA 2: CONFIGURACIÓN --- */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Box sx={sectionStyle}>
                    <Typography variant="h6" gutterBottom>Banderas y Atributos</Typography>
                    <Grid container>
                        <Grid item xs={6}><FormControlLabel control={<Checkbox checked={formData.es_insumo} name="es_insumo" onChange={handleChange}/>} label="Insumo" /></Grid>
                        <Grid item xs={6}><FormControlLabel control={<Checkbox checked={formData.fraccionable} name="fraccionable" onChange={handleChange}/>} label="Fraccionable" /></Grid>
                        <Grid item xs={6}><FormControlLabel control={<Checkbox checked={formData.es_servicio} name="es_servicio" onChange={handleChange}/>} label="Servicios" /></Grid>
                        <Grid item xs={6}><FormControlLabel control={<Checkbox checked={formData.obsoleto} name="obsoleto" onChange={handleChange}/>} label="Obsoleto" /></Grid>
                        <Grid item xs={6}><FormControlLabel control={<Checkbox checked={formData.inventariable} name="inventariable" onChange={handleChange}/>} label="Inventariable" /></Grid>
                        <Grid item xs={6}><FormControlLabel control={<Checkbox checked={formData.es_producto} name="es_producto" onChange={handleChange}/>} label="Producto" /></Grid>
                        <Grid item xs={6}><FormControlLabel control={<Checkbox checked={formData.entrega_directa} name="entrega_directa" onChange={handleChange}/>} label="Entrega Directa Prov." /></Grid>
                        <Grid item xs={6}><FormControlLabel control={<Checkbox checked={formData.es_kit} name="es_kit" onChange={handleChange}/>} label="Es Kit" /></Grid>
                        <Grid item xs={6}><FormControlLabel control={<Checkbox checked={formData.controlado} name="controlado" onChange={handleChange}/>} label="Controlado" /></Grid>
                        <Grid item xs={6}><FormControlLabel control={<Checkbox checked={formData.producto_libre} name="producto_libre" onChange={handleChange}/>} label="Producto Libre" /></Grid>
                    </Grid>
                </Box>
            </Grid>
            <Grid item xs={12} md={6}>
                <Box sx={sectionStyle}>
                    <Typography variant="h6" gutterBottom>Datos Externos</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField {...commonInputProps} label="Clave Proveedor" name="clave_proveedor" value={formData.clave_proveedor} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField {...commonInputProps} label="Clave SAS" name="clave_sas" value={formData.clave_sas} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField {...commonInputProps} label="Clave SAP" name="clave_sap" value={formData.clave_sap} onChange={handleChange} />
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
        </Grid>
      )}

      {/* --- PESTAÑA 3: LOGÍSTICA --- */}
      {tabValue === 3 && (
        <Box sx={sectionStyle}>
            <Typography variant="h6" gutterBottom>Datos Logísticos</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <TextField {...commonInputProps} label="Sucursal Origen" select name="sucursal_origen" value={formData.sucursal_origen} onChange={handleChange}>
                        <MenuItem value="ARAUCARIAS">ARAUCARIAS</MenuItem>
                        <MenuItem value="MATRIZ">MATRIZ</MenuItem>
                    </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField {...commonInputProps} label="Unidades por Paquete" type="number" name="unidad_paq" value={formData.unidad_paq} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField {...commonInputProps} label="Fecha de Alta" value="2021-02-16" disabled />
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField {...commonInputProps} label="Última Actualización" value="2024-02-27" disabled />
                </Grid>
            </Grid>
        </Box>
      )}

      {/* --- PESTAÑA 4: HERRAMIENTAS --- */}
      {tabValue === 4 && (
        <Box sx={sectionStyle}>
            <Typography variant="h6" gutterBottom>Herramientas y Acciones</Typography>
            <Grid container spacing={2}>
                {[
                    "Generar Clon", "Sustitutos", "Componentes KIT", "Stock",
                    "Bloqueo en RM's", "Bloqueo en Trasp.", "Conv. Paq Pzas", "Programación Costos",
                    "Proveedores", "Productos Bloqueados", "IEPS", "Niveles de May.",
                    "Ofertas Esp. Sucursal", "Increm. por Suc.", "Bitácora de la Clave",
                    "Kardex", "Info Stock", "Ofertas Esp. Cia", "Bitácora de Precios"
                ].map((text, index) => (
                    <Grid item xs={6} md={3} key={index}>
                        <Button 
                            fullWidth 
                            variant="outlined" 
                            sx={{ color: '#555', borderColor: '#ddd', height: '50px', '&:hover': { borderColor: '#333', bgcolor: '#f9f9f9' } }}
                            onClick={() => alert(`Acción: ${text}`)}
                        >
                            {text}
                        </Button>
                    </Grid>
                ))}
            </Grid>
        </Box>
      )}

    </Box>
  );
}