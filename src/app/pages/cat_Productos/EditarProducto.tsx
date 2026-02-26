import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, Grid, 
  MenuItem, Checkbox, FormControlLabel, Paper,
  Tabs, Tab, IconButton, Divider
} from '@mui/material';
import { Save as SaveIcon, Close as CloseIcon, Settings as SettingsIcon } from '@mui/icons-material';

// --- 1. ESTILOS "ANTI-BAILE" & DISEÑO BERLLANO ---
const commonProps = {
  fullWidth: true,
  size: "small" as const,
  variant: "outlined" as const,
  sx: {
      width: '100%',
      '& .MuiInputBase-root': { 
          height: '50px', // Altura elegante del modal
          borderRadius: '8px',
          bgcolor: 'white',
          width: '100%', 
          maxWidth: '100%', 
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            borderColor: '#999'
          }
      },
      '& .MuiInputLabel-root': { 
          transform: 'translate(14px, 14px) scale(1)',
          color: '#666',
          fontWeight: 500
      },
      '& .MuiInputLabel-shrink': { 
          transform: 'translate(14px, -9px) scale(0.75)',
          color: '#333',
          fontWeight: 600
      },
      '& .MuiInputBase-input': {
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
      }
  }
};

const selectProps = {
  ...commonProps,
  SelectProps: {
    MenuProps: { PaperProps: { sx: { maxHeight: 300 } } }, 
  },
  sx: {
      ...commonProps.sx,
      '& .MuiSelect-select': { 
          display: 'block !important', 
          whiteSpace: 'nowrap !important', 
          overflow: 'hidden !important', 
          textOverflow: 'ellipsis !important', 
          paddingRight: '30px !important', 
          minHeight: 'auto !important' 
      }
  }
};

// Estilo para secciones internas (tarjetas blancas)
const sectionStyle = { 
    p: 3, 
    bgcolor: 'white', 
    borderRadius: '12px', 
    border: '1px solid #e0e0e0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)' 
};

// --- 2. INTERFACES DE PRODUCTO ---
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
  clave_prod: '',
  descripcion: '',
  descripcion_corta: '',
  marca: '',
  familia: '',
  area: '3',
  depto: '1',
  clase: '1',
  observacion: '',
  costo_sin_iva: 0,
  tasa_iva: 0.16,
  costo_con_iva: 0,
  unidad_paq: 1,
  costo_unitario: 0,
  costo_unitario_iva: 0,
  en_promocion: false,
  precio_promocion: 0,
  fecha_inicio_promo: '',
  fecha_final_promo: '',
  es_insumo: false,
  es_servicio: false,
  inventariable: true,
  entrega_directa: true,
  fraccionable: false,
  obsoleto: false,
  es_producto: true,
  es_kit: false,
  controlado: false,
  producto_libre: true,
  clave_proveedor: '',
  clave_sas: '',
  clave_sap: '',
  sucursal_origen: 'ARAUCARIAS'
};

// Props que recibe del padre (CatProductos)
interface Props {
    claveProd: string | null;
    onClose: () => void;
}

// --- 3. COMPONENTE PRINCIPAL ---
export default function EditarProducto({ claveProd, onClose }: Props) {
  const [formData, setFormData] = useState<ProductoForm>(initialState);
  const [tabValue, setTabValue] = useState(0);
  const isEditing = !!claveProd;

  // --- Cargar Datos (Simulación) ---
  useEffect(() => {
    if (claveProd) {
        // AQUÍ HARÍAS LA PETICIÓN A LA API PARA OBTENER EL PRODUCTO POR ID
        // Por ahora simulamos cargar datos
        setFormData({
            ...initialState,
            clave_prod: claveProd,
            descripcion: 'PRODUCTO CARGADO DE EJEMPLO',
            marca: 'LOREAL',
            costo_sin_iva: 100
        });
    } else {
        setFormData(initialState);
    }
  }, [claveProd]);

  // --- Cálculos Automáticos de Costos ---
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
    // AQUÍ VA TU LLAMADA A LA API (INSERT O UPDATE)
    onClose();
  };

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* --- A. HEADER CON GRADIENTE --- */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #333333 0%, #555555 100%)',
        color: 'white',
        p: 3,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0
      }}>
        <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {isEditing ? `Editar Producto` : 'Nuevo Producto'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
                    {isEditing ? `Clave: ${claveProd}` : 'Generación de nueva clave'}
                </Typography>
            </Box>
            <IconButton onClick={onClose} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                <CloseIcon />
            </IconButton>
        </Box>
        {/* Decoración circular */}
        <Box sx={{ position: 'absolute', top: -20, right: -20, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
      </Box>

      {/* --- B. PESTAÑAS (TABS) --- */}
      <Box sx={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', px: 3, flexShrink: 0 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, v) => setTabValue(v)} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', minHeight: 56, color: '#666',
              '&:hover': { color: '#333', backgroundColor: 'rgba(51, 51, 51, 0.04)' },
              '&.Mui-selected': { color: '#333', backgroundColor: 'rgba(51, 51, 51, 0.08)' }
            },
            '& .MuiTabs-indicator': { backgroundColor: '#333333', height: 3, borderRadius: '3px 3px 0 0' }
          }}
        >
          <Tab label="General" />
          <Tab label="Costos y Precios" />
          <Tab label="Configuración" />
          <Tab label="Logística" />
          <Tab label="Herramientas" icon={<SettingsIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* --- C. CONTENIDO CON SCROLL --- */}
      <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
        
        {/* PESTAÑA 0: GENERAL */}
        {tabValue === 0 && (
            <Grid container spacing={3} sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                <Grid item xs={12} md={8}>
                    <Box sx={sectionStyle}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} />
                            Datos Básicos
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField {...commonProps} label="Descripción Completa" name="descripcion" value={formData.descripcion} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField {...commonProps} label="Descripción Corta (Ticket)" name="descripcion_corta" value={formData.descripcion_corta} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField {...commonProps} label="Marca" name="marca" value={formData.marca} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField {...commonProps} label="Familia" name="familia" value={formData.familia} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField {...commonProps} label="Observaciones" name="observacion" multiline rows={2} value={formData.observacion} onChange={handleChange} sx={{ ...commonProps.sx, '& .MuiInputBase-root': { height: 'auto', py: 1.5 } }} />
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Box sx={sectionStyle}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} />
                            Clasificación
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField {...selectProps} select label="Área" name="area" value={formData.area} onChange={handleChange}>
                                    <MenuItem value="3">REVENTA</MenuItem>
                                    <MenuItem value="1">SERVICIOS</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField {...selectProps} select label="Depto" name="depto" value={formData.depto} onChange={handleChange}>
                                    <MenuItem value="1">Shampoo</MenuItem>
                                    <MenuItem value="2">Acondicionador</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField {...selectProps} select label="Clase" name="clase" value={formData.clase} onChange={handleChange}>
                                    <MenuItem value="1">Kerastase</MenuItem>
                                    <MenuItem value="2">Loreal</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
            </Grid>
        )}

        {/* PESTAÑA 1: COSTOS */}
        {tabValue === 1 && (
            <Grid container spacing={3} sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                <Grid item xs={12} md={6}>
                    <Box sx={sectionStyle}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} />
                            Estructura de Costos
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField {...commonProps} label="Costo sin IVA" type="number" name="costo_sin_iva" value={formData.costo_sin_iva} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField {...commonProps} label="Tasa IVA (0.16)" type="number" name="tasa_iva" value={formData.tasa_iva} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField {...commonProps} label="Costo con IVA" value={formData.costo_con_iva.toFixed(2)} disabled />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField {...commonProps} label="Unidades x Paquete" type="number" name="unidad_paq" value={formData.unidad_paq} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12}><Divider /></Grid>
                            <Grid item xs={6}>
                                <TextField {...commonProps} label="Costo Unitario" value={formData.costo_unitario.toFixed(2)} disabled />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField {...commonProps} label="Costo Unit. con IVA" value={formData.costo_unitario_iva.toFixed(2)} disabled />
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                    <Box sx={sectionStyle}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} />
                            Promociones
                        </Typography>
                        <Box sx={{ p: 2, borderRadius: '8px', bgcolor: '#f8f9fa', border: '1px solid #eee', mb: 2 }}>
                            <FormControlLabel control={<Checkbox checked={formData.en_promocion} name="en_promocion" onChange={handleChange} />} label="Activar Promoción" />
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField {...commonProps} type="date" label="Inicio" name="fecha_inicio_promo" value={formData.fecha_inicio_promo} InputLabelProps={{ shrink: true }} onChange={handleChange} disabled={!formData.en_promocion} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField {...commonProps} type="date" label="Final" name="fecha_final_promo" value={formData.fecha_final_promo} InputLabelProps={{ shrink: true }} onChange={handleChange} disabled={!formData.en_promocion} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField {...commonProps} label="Precio Promoción" type="number" name="precio_promocion" value={formData.precio_promocion} onChange={handleChange} disabled={!formData.en_promocion} />
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
            </Grid>
        )}

        {/* PESTAÑA 2: CONFIGURACIÓN */}
        {tabValue === 2 && (
            <Box sx={{ ...sectionStyle, animation: 'fadeIn 0.3s ease-in-out' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} />
                    Banderas y Permisos
                </Typography>
                <Grid container spacing={2}>
                    {[
                        { label: "Es Insumo", name: "es_insumo" },
                        { label: "Es Servicio", name: "es_servicio" },
                        { label: "Inventariable", name: "inventariable" },
                        { label: "Entrega Directa", name: "entrega_directa" },
                        { label: "Fraccionable", name: "fraccionable" },
                        { label: "Obsoleto", name: "obsoleto" },
                        { label: "Es Producto", name: "es_producto" },
                        { label: "Es Kit", name: "es_kit" },
                        { label: "Controlado", name: "controlado" },
                        { label: "Producto Libre", name: "producto_libre" },
                    ].map((item) => (
                        <Grid item xs={6} md={3} key={item.name}>
                            <Box sx={{ p: 1.5, border: '1px solid #eee', borderRadius: '8px', '&:hover': { bgcolor: '#f9f9f9' } }}>
                                <FormControlLabel 
                                    control={<Checkbox checked={(formData as any)[item.name]} name={item.name} onChange={handleChange} sx={{ color: '#333', '&.Mui-checked': { color: '#333' } }} />} 
                                    label={<Typography variant="body2" fontWeight={500}>{item.label}</Typography>} 
                                />
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        )}

        {/* PESTAÑA 3: LOGÍSTICA */}
        {tabValue === 3 && (
            <Grid container spacing={3} sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                <Grid item xs={12} md={6}>
                    <Box sx={sectionStyle}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} />
                            Datos Externos
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField {...commonProps} label="Clave Proveedor" name="clave_proveedor" value={formData.clave_proveedor} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField {...commonProps} label="Clave SAS" name="clave_sas" value={formData.clave_sas} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField {...commonProps} label="Clave SAP" name="clave_sap" value={formData.clave_sap} onChange={handleChange} />
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Box sx={sectionStyle}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} />
                            Control Interno
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField {...selectProps} select label="Sucursal Origen" name="sucursal_origen" value={formData.sucursal_origen} onChange={handleChange}>
                                    <MenuItem value="ARAUCARIAS">ARAUCARIAS</MenuItem>
                                    <MenuItem value="MATRIZ">MATRIZ</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={6}>
                                <TextField {...commonProps} label="Fecha de Alta" value="2024-01-01" disabled />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField {...commonProps} label="Última Modificación" value="2024-03-15" disabled />
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
            </Grid>
        )}

        {/* PESTAÑA 4: HERRAMIENTAS */}
        {tabValue === 4 && (
            <Box sx={{ ...sectionStyle, animation: 'fadeIn 0.3s ease-in-out' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 4, height: 20, backgroundColor: '#333333', borderRadius: 2 }} />
                    Acciones Rápidas
                </Typography>
                <Grid container spacing={2}>
                    {[
                        "Generar Clon", "Sustitutos", "Componentes KIT", "Stock",
                        "Bloqueo en RM's", "Bloqueo en Trasp.", "Conv. Paq Pzas", "Programación Costos",
                        "Proveedores", "Productos Bloqueados", "IEPS", "Niveles de May.",
                        "Ofertas Esp. Sucursal", "Increm. por Suc.", "Bitácora de la Clave",
                        "Kardex", "Info Stock", "Ofertas Esp. Cia", "Bitácora de Precios"
                    ].map((text, index) => (
                        <Grid item xs={6} sm={4} md={3} key={index}>
                            <Button 
                                fullWidth 
                                variant="outlined" 
                                sx={{ 
                                    color: '#555', 
                                    borderColor: '#e0e0e0', 
                                    height: '50px', 
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    borderRadius: '8px',
                                    '&:hover': { borderColor: '#333', bgcolor: '#f9f9f9', color: '#333' } 
                                }}
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

      {/* --- D. FOOTER DE ACCIONES --- */}
      <Box sx={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0', p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
          * Revise los datos antes de guardar
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            onClick={onClose} 
            color="inherit"
            sx={{
              borderRadius: '8px', fontWeight: 600, px: 3, py: 1, backgroundColor: '#e0e0e0', color: '#333',
              transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#d0d0d0', transform: 'translateY(-1px)' }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            startIcon={<SaveIcon />}
            sx={{
              borderRadius: '8px', fontWeight: 600, textTransform: 'none', px: 4, py: 1, backgroundColor: '#333333',
              transition: 'all 0.3s ease', '&:hover': { backgroundColor: '#555555', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(51, 51, 51, 0.3)' }
            }}
          >
            Guardar Cambios
          </Button>
        </Box>
      </Box>

    </Box>
  );
}