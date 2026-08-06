import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { Button, Typography, useTheme, useMediaQuery, Box, MenuItem, Select, Dialog, DialogTitle, DialogContent, TextField } from "@mui/material";
import React, { useMemo, useState } from "react";
import useConsumoApi from "../../hooks/useConsumoApi";
import Swal from "sweetalert2";

type Estilista = {
  clave_empleado: string;
  nombre: string;
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
  insumos?: DetalleVenta[];
};

type Props = {
  data: DetalleVenta[];
  estilistasLista?: Estilista[]; 
  auxiliaresLista?: Auxiliar[];  
  onSelect: (detalle: DetalleVenta) => void;
  onAgregarInsumos?: (detalle: DetalleVenta) => void;
  onEditarRenglon: (id: string, campo: string, nuevoValor: any) => void;
  onBuscarProducto?: (detalle: DetalleVenta) => void;
  onAplicarDescuento?: (id: string, descuento: number, tipoDescuento: number, observacion: string) => void;
};

export default function DetalleVentasTable({ 
  data, 
  estilistasLista = [], 
  auxiliaresLista = [], 
  onSelect, 
  onAgregarInsumos, 
  onEditarRenglon,
  onBuscarProducto,
  onAplicarDescuento
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { consumoApi } = useConsumoApi();

  const [modalAutorizacionOpen, setModalAutorizacionOpen] = useState(false);
  const [usuarioAutorizacion, setUsuarioAutorizacion] = useState("");
  const [passwordAutorizacion, setPasswordAutorizacion] = useState("");
  const [detalleParaDescuento, setDetalleParaDescuento] = useState<DetalleVenta | null>(null);
  const [nuevoDescuento, setNuevoDescuento] = useState<number>(0);
  const [modalTiposDescuentoOpen, setModalTiposDescuentoOpen] = useState(false);
  const [tipoDescuentoSeleccionado, setTipoDescuentoSeleccionado] = useState<number>(0);
  const [tiposDescuento, setTiposDescuento] = useState<any[]>([]);
  const [descuentoManual, setDescuentoManual] = useState<string>("");
  const [observacionManual, setObservacionManual] = useState<string>("");

  const cargarTiposDescuento = async () => {
  try {
    const response = await consumoApi.get('/api/PuntoDeVenta/sp_bw_cat_tipos_descuento_sel');
    const responseData = Array.isArray(response.data) ? response.data : [];
    setTiposDescuento(responseData);
  } catch (error) {
    console.error('Error al cargar tipos de descuento:', error);
    setTiposDescuento([]);
  }
};

  const handleAutorizarDescuento = async () => {
    if (!usuarioAutorizacion || !passwordAutorizacion) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Debes ingresar usuario y contraseña',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
    
    try {
      // 💡 Rellenamos con ceros a la izquierda hasta tener 5 caracteres (ej: "2" -> "00002")
      // Esto previene que falle la búsqueda exacta en la tabla cat_usuarios
      const usuarioFormateado = usuarioAutorizacion.trim().padStart(5, '0');

      // 💡 Si 'consumoApi' te da problemas, puedes usar directamente 'axios.post' 
      // apuntando a la URL de tu entorno de desarrollo (ej. https://localhost:7119)
      // 💡 Cambiamos el puerto 7119 por tu puerto real 5001
      const response = await consumoApi.post('/api/PuntoDeVenta/autorizar-supervisor', {
        usuario: usuarioFormateado,
        contrasena: passwordAutorizacion,
        permiso: "autoriza_descuento"
      });

      const responseData = Array.isArray(response.data) ? response.data[0] : response.data;

      if (responseData?.autorizado === true) {
        setModalAutorizacionOpen(false);
        setUsuarioAutorizacion("");
        setPasswordAutorizacion("");
        
      // Cargar tipos de descuento y abrir modal de selección
await cargarTiposDescuento();
setModalTiposDescuentoOpen(true);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Acceso denegado',
          text: responseData?.mensaje || 'No tienes permisos para autorizar descuentos',
          confirmButtonText: 'Aceptar'
        });
      }
    } catch (error: any) {
      console.error('Error al autorizar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'Error al validar las credenciales',
        confirmButtonText: 'Aceptar'
      });
    }
  };


const handleAplicarDescuento = () => {
  const opcionElegida = tiposDescuento.find(d => d.tipo_descuento === tipoDescuentoSeleccionado);
  const porcentajeDescuento = descuentoManual ? parseFloat(descuentoManual) : 0;
  
  if (opcionElegida && porcentajeDescuento > 0) {
    const descuentoDecimal = porcentajeDescuento / 100;

    if (descuentoDecimal < opcionElegida.min_descto || descuentoDecimal > opcionElegida.max_descto) {
      Swal.fire(
        "Rango Inválido", 
        `El porcentaje permitido está entre ${(opcionElegida.min_descto * 100).toFixed(0)}% y ${(opcionElegida.max_descto * 100).toFixed(0)}%`, 
        "error"
      );
      return;
    }

    if (detalleParaDescuento) {
      const importeBase = detalleParaDescuento.precio * detalleParaDescuento.Cant;
      const descuentoEnDinero = importeBase * descuentoDecimal;

      if (onAplicarDescuento) {
        onAplicarDescuento(detalleParaDescuento.id, descuentoEnDinero, opcionElegida.tipo_descuento, observacionManual.trim());
      } else {
        onEditarRenglon(detalleParaDescuento.id, "descuento", descuentoEnDinero);
        onEditarRenglon(detalleParaDescuento.id, "tipo_descuento", opcionElegida.tipo_descuento);
        onEditarRenglon(detalleParaDescuento.id, "observacion_descuento", observacionManual.trim());
        Swal.fire({
          icon: 'success',
          title: 'Descuento aplicado',
          text: `Se aplicó un descuento de $${descuentoEnDinero.toFixed(2)}`,
          confirmButtonText: 'Aceptar'
        });
      }
    }
  } else {
    if (detalleParaDescuento) {
      if (onAplicarDescuento) {
        onAplicarDescuento(detalleParaDescuento.id, 0, 0, "");
      } else {
        onEditarRenglon(detalleParaDescuento.id, "descuento", 0);
        onEditarRenglon(detalleParaDescuento.id, "tipo_descuento", 0);
        onEditarRenglon(detalleParaDescuento.id, "observacion_descuento", "");
      }
    }
  }

  setModalTiposDescuentoOpen(false);
  setTipoDescuentoSeleccionado(0);
  setDescuentoManual("");
  setObservacionManual("");
  setDetalleParaDescuento(null);
};

  const columns = useMemo<MRT_ColumnDef<DetalleVenta>[]>(() => [
    !isMobile && {
      accessorKey: "d_estilista",
      header: "Estilista",
      size: 150,
      minSize: 120,
      maxSize: 200,
      Edit: ({ cell, row, table }) => {
        const currentId = row.original.estilista; 
        
        return (
          <Select
            size="small"
            value={currentId || ""}
            autoFocus
            sx={{ width: '100%', minWidth: '120px' }}
            onChange={(e) => {
              const newId = e.target.value as string;
              const estilistaEncontrado = estilistasLista.find(est => est.clave_empleado === newId);
              
              if (estilistaEncontrado) {
                onEditarRenglon(row.original.id, "estilista", newId);
                onEditarRenglon(row.original.id, "d_estilista", estilistaEncontrado.nombre);
              }
              table.setEditingCell(null); 
            }}
            onBlur={() => table.setEditingCell(null)}
          >
            {estilistasLista.map((est) => (
              <MenuItem key={est.clave_empleado} value={est.clave_empleado}>
                {est.nombre}
              </MenuItem>
            ))}
          </Select>
        );
      },
    },
    !isMobile && {
      accessorKey: "hora",
      header: "Hora",
      size: 100,
      minSize: 80,
      maxSize: 120,
      muiEditTextFieldProps: ({ cell, row, table }) => ({
        onBlur: (e) => {
          onEditarRenglon(row.original.id, "hora", e.target.value);
          table.setEditingCell(null);
        },
      }),
    },
    {
      accessorKey: "clave_prod",
      header: "Clave",
      size: 80,
      minSize: 60,
      maxSize: 100,
      muiEditTextFieldProps: ({ cell, row, table }) => ({
        onFocus: () => {
          table.setEditingCell(null);
          if (onBuscarProducto) onBuscarProducto(row.original);
        },
        inputProps: { readOnly: true, style: { cursor: 'pointer' } },
      }),
    },
    {
      accessorKey: "d_producto",
      header: "Descripción",
      size: 250,
      minSize: 180,
      maxSize: 1000,
      Cell: ({ cell }: any) => (
        <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem', fontWeight: 500 }}>
          {cell.getValue()}
        </Box>
      ),
      muiEditTextFieldProps: ({ cell, row, table }) => ({
        onBlur: (e) => {
          onEditarRenglon(row.original.id, "d_producto", e.target.value);
          table.setEditingCell(null);
        },
      }),
    },
    !isMobile && {
      accessorKey: "tiempo",
      header: "Tiempo",
      size: 80,
      minSize: 60,
      maxSize: 100,
      muiEditTextFieldProps: ({ cell, row, table }) => ({
        onBlur: (e) => {
          onEditarRenglon(row.original.id, "tiempo", e.target.value);
          table.setEditingCell(null);
        },
      }),
    },
    {
      accessorKey: "Cant",
      header: "Cant",
      size: 60,
      minSize: 50,
      maxSize: 80,
      muiEditTextFieldProps: ({ cell, row, table }) => ({
        type: "number",
        inputProps: { min: 0.001, step: "any" },
        onBlur: (e) => {
          onEditarRenglon(row.original.id, "Cant", Math.max(0.001, Number(e.target.value)));
          table.setEditingCell(null);
        },
        onKeyDown: (e) => {
          if (e.key === 'Enter') {
            onEditarRenglon(row.original.id, "Cant", Math.max(0.001, Number((e.target as HTMLInputElement).value)));
            table.setEditingCell(null);
          }
        },
      }),
    },
    {
      accessorKey: "precio",
      header: "Precio",
      size: 100,
      minSize: 80,
      maxSize: 120,
      enableEditing: false,
      Cell: ({ cell }: any) => `$${Number(cell.getValue()).toFixed(2)}`,
    },
    {
      accessorKey: "importe",
      header: "Importe",
      size: 100,
      minSize: 80,
      maxSize: 120,
      enableEditing: false, 
      Cell: ({ cell }: any) => `$${Number(cell.getValue()).toFixed(2)}`,
    },
    !isMobile && {
      accessorKey: "descuento",
      header: "Descuento",
      size: 100,
      minSize: 80,
      maxSize: 120,
      enableEditing: false,
      Cell: ({ cell }: any) => `$${Number(cell.getValue()).toFixed(2)}`,
    },
    !isMobile && {
      accessorKey: "d_auxiliar",
      header: "Auxiliar",
      size: 120,
      minSize: 100,
      maxSize: 150,
      Edit: ({ cell, row, table }) => {
        const currentId = row.original.auxiliar; 
        
        return (
          <Select
            size="small"
            value={currentId || ""}
            autoFocus
            displayEmpty
            sx={{ width: '100%', minWidth: '100px' }}
            onChange={(e) => {
              const newId = e.target.value as string;
              
              if (newId === "") {
                onEditarRenglon(row.original.id, "auxiliar", "");
                onEditarRenglon(row.original.id, "d_auxiliar", "");
              } else {
                const auxiliarEncontrado = auxiliaresLista.find(aux => aux.clave_empleado === newId);
                if (auxiliarEncontrado) {
                  onEditarRenglon(row.original.id, "auxiliar", newId);
                  onEditarRenglon(row.original.id, "d_auxiliar", auxiliarEncontrado.nombre);
                }
              }
              table.setEditingCell(null); 
            }}
            onBlur={() => table.setEditingCell(null)}
          >
            <MenuItem value=""><em>Ninguno</em></MenuItem>
            {auxiliaresLista.map((aux) => (
              <MenuItem key={aux.clave_empleado} value={aux.clave_empleado}>
                {aux.nombre}
              </MenuItem>
            ))}
          </Select>
        );
      },
    },
  ].filter(Boolean) as MRT_ColumnDef<DetalleVenta>[], [isMobile, onEditarRenglon, estilistasLista, auxiliaresLista]);

  return (
    <>
    <MaterialReactTable
      columns={columns}
      data={data}
      layoutMode="grid"
      autoResetPageIndex={false}
      autoResetExpanded={false}
      enablePagination={true}
      enableColumnActions={false}
      enableDensityToggle={false}
      enableFullScreenToggle={false}
      enableHiding={false}
      enableColumnResizing={false}
      enableColumnOrdering={false}
      enableSorting={false}
      enableFilters={false}
      enableExpanding={true}
      enableRowVirtualization={false}
      enableRowActions={true}
      positionActionsColumn="last"
      
      enableEditing={true}
      editDisplayMode="cell"
      muiTableBodyCellProps={({ cell, table }) => ({
        onClick: (event) => {
          if (cell.column.id !== 'mrt-row-actions') {
            event.stopPropagation();
          }
        },
        onDoubleClick: (event) => {
          if (cell.column.id !== 'mrt-row-actions') {
            event.stopPropagation();
          }
          
          if (cell.column.id === "clave_prod" || cell.column.id === "d_producto") {
            if (onBuscarProducto) {
              onBuscarProducto(cell.row.original);
            }
          } 
          else if (cell.column.id === "descuento") {
            setDetalleParaDescuento(cell.row.original);
            setNuevoDescuento(cell.row.original.descuento);
            setModalAutorizacionOpen(true);
          }
          else if (cell.column.id !== "importe" && cell.column.id !== "precio" && cell.column.id !== "mrt-row-actions") {
            table.setEditingCell(cell);
          }
        },
      })}

      displayColumnDefOptions={{
        "mrt-row-actions": {
          header: "Acción",
          size: 120, 
          minSize: 100,
          maxSize: 180,
        },
      }}
      renderDetailPanel={({ row }) => {
        const insumos = row.original.insumos || [];
        if (insumos.length === 0) return null;
        
        return (
          <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Insumos asociados:
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              borderBottom: '2px solid #e0e0e0',
              pb: 1,
              mb: 1,
              fontSize: '0.875rem',
              fontWeight: 'medium'
            }}>
              <Box sx={{ flex: 1, minWidth: 150 }}>Clave - Descripción</Box>
              <Box sx={{ minWidth: 80, textAlign: 'right' }}>Precio</Box>
              <Box sx={{ minWidth: 50, textAlign: 'center' }}>Cant</Box>
              <Box sx={{ minWidth: 90, textAlign: 'right', fontWeight: 'bold' }}>Importe</Box>
            </Box>
            
            {insumos.map((insumo, index) => (
              <Box key={insumo.id} sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                py: 0.75,
                px: 2,
                borderBottom: index < insumos.length - 1 ? '1px solid #e0e0e0' : 'none',
                '&:hover': { backgroundColor: 'grey.100' }
              }}>
                <Typography variant="body2" sx={{ flex: 1, fontSize: '0.875rem' }}>
                  {insumo.clave_prod} - {insumo.d_producto}
                </Typography>
                <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'right', fontSize: '0.875rem' }}>
                  ${insumo.precio.toFixed(2)}
                </Typography>
                <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center', fontSize: '0.875rem' }}>
                  {insumo.Cant}
                </Typography>
                <Typography variant="body2" sx={{ minWidth: 90, textAlign: 'right', fontWeight: 'medium', fontSize: '0.875rem' }}>
                  ${insumo.importe.toFixed(2)}
                </Typography>
              </Box>
            ))}
          </Box>
        );
      }}
           renderRowActions={({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap' }}>
          {onAgregarInsumos && (
            <Button
              color="primary"
              variant="outlined"
              size="small"
              onClick={() => onAgregarInsumos(row.original)}
              sx={{ whiteSpace: 'nowrap', minWidth: 'auto', px: 0.75, py: 0.25, fontSize: '0.68rem' }}
            >
              Insumos
            </Button>
          )}
          <Button
            color="error"
            variant="contained"
            size="small"
            onClick={() => onSelect(row.original)}
            sx={{ whiteSpace: 'nowrap', minWidth: 'auto', px: 0.75, py: 0.25, fontSize: '0.68rem' }}
          >
            Cancelar
          </Button>
        </Box>
      )}
      localization={{
        noRecordsToDisplay: "Sin resultados",
      }}
            muiTablePaperProps={{
        variant: "outlined",
        sx: {
          width: '100% !important',
          maxWidth: 'none !important',
          marginLeft: '0 !important',
          marginRight: '0 !important',
          '& .MuiTable-root': {
            width: '100% !important',
            tableLayout: 'fixed',      // ← FUERZA AJUSTE
          },
          '& .MuiTableCell-root': {     // ← REDUCE PADDING GLOBAL
            padding: '4px 6px !important',
          },
          '& .MuiTableCell-head': {
            padding: '4px 6px !important',
          }
        }
      }}
      muiTableContainerProps={{
        sx: {
          width: '100%',
          overflowX: 'auto',
        }
      }}
      initialState={{
        density: "compact",
        columnSizing: {
          clave_prod: 80,
          d_producto: 250,
          Cant: 60,
          precio: 100,
          importe: 100,
          'mrt-row-actions': 120,
        },
      }}
    />
    
    {/* Diálogo de autorización de descuento al estilo Access original */}
    <Dialog
      open={modalAutorizacionOpen}
      onClose={() => setModalAutorizacionOpen(false)}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          border: '2px solid black',
          borderRadius: 0,
          boxShadow: '0px 4px 10px rgba(0,0,0,0.3)'
        }
      }}
    >
      <DialogTitle sx={{ 
        textAlign: 'center', 
        backgroundColor: '#f0f0f0',
        borderBottom: '2px solid black',
        py: 1
      }}>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Escriba los datos de un usuario con acceso a este módulo.
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ minWidth: '140px', fontWeight: 'bold' }}>
            Nombre de usuario:
          </Typography>
          <TextField
            size="small"
            fullWidth
            value={usuarioAutorizacion}
            onChange={(e) => setUsuarioAutorizacion(e.target.value)}
            sx={{ backgroundColor: 'white' }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ minWidth: '140px', fontWeight: 'bold' }}>
            Password:
          </Typography>
          <TextField
            size="small"
            type="password"
            fullWidth
            value={passwordAutorizacion}
            onChange={(e) => setPasswordAutorizacion(e.target.value)}
            sx={{ backgroundColor: 'white' }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleAutorizarDescuento}
            sx={{ 
              minWidth: 100,
              backgroundColor: '#e0e0e0',
              color: 'black',
              border: '1px solid #999',
              '&:hover': { backgroundColor: '#d0d0d0' }
            }}
          >
            Aceptar
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setModalAutorizacionOpen(false);
              setUsuarioAutorizacion("");
              setPasswordAutorizacion("");
              setDetalleParaDescuento(null);
              setNuevoDescuento(0);
            }}
            sx={{ 
              minWidth: 100,
              backgroundColor: '#e0e0e0',
              color: 'black',
              border: '1px solid #999',
              '&:hover': { backgroundColor: '#d0d0d0' }
            }}
          >
            Cancelar
          </Button>
        </Box>
      </DialogContent>
    </Dialog>

    {/* Diálogo de selección de tipos de descuento */}
<Dialog
  open={modalTiposDescuentoOpen}
  onClose={() => {
  setModalTiposDescuentoOpen(false);
  setTipoDescuentoSeleccionado(0);
  setDescuentoManual("");
  setObservacionManual("");
  setDetalleParaDescuento(null);
}}
  maxWidth="md"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: '12px',
      border: '2px solid black',
    }
  }}
>
  <DialogTitle sx={{ 
    backgroundColor: 'black',
    color: 'white',
    py: 2,
    textAlign: 'center'
  }}>
    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
      Seleccione Tipo de Descuento
    </Typography>
  </DialogTitle>
  
  <DialogContent sx={{ p: 3 }}>
    <Box sx={{ 
      maxHeight: 400, 
      overflowY: 'auto',
      border: '1px solid #ccc',
      borderRadius: '4px'
    }}>
    <Box sx={{ 
  display: 'flex', 
  backgroundColor: '#f5f5f5',
  borderBottom: '2px solid black',
  fontWeight: 'bold',
  py: 1,
  px: 2
}}>
  <Box sx={{ flex: 2 }}>Descripción</Box>
  <Box sx={{ flex: 1 }}>Descuento</Box>
  <Box sx={{ flex: 1 }}>Observación</Box>
  <Box sx={{ flex: 1, textAlign: 'right' }}>Min</Box>
  <Box sx={{ flex: 1, textAlign: 'right' }}>Max</Box>
</Box>

{tiposDescuento.map((tipo) => (
  <Box
    key={tipo.tipo_descuento}
    onClick={() => {
      setTipoDescuentoSeleccionado(tipo.tipo_descuento);
      setDescuentoManual((tipo.max_descto * 100).toFixed(2));
      setObservacionManual("");
    }}
    sx={{
      display: 'flex',
      py: 1,
      px: 2,
      cursor: 'pointer',
      backgroundColor: tipoDescuentoSeleccionado === tipo.tipo_descuento ? '#e3f2fd' : 'white',
      borderBottom: '1px solid #e0e0e0',
      '&:hover': { backgroundColor: '#f5f5f5' }
    }}
  >
    <Box sx={{ flex: 2 }}>{tipo.descripcion}</Box>
<TextField
  size="small"
  type="number"
  inputProps={{ 
    min: 0,
    step: 0.01,
    max: tipoDescuentoSeleccionado === tipo.tipo_descuento ? (tipo.max_descto * 100) : 100
  }}
  value={tipoDescuentoSeleccionado === tipo.tipo_descuento ? descuentoManual : '0.00'}
  onChange={(e) => {
    const value = e.target.value;
    // Solo permitir números
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      // Validar rango si hay un tipo seleccionado
      if (tipoDescuentoSeleccionado === tipo.tipo_descuento) {
        const numValue = parseFloat(value);
        const min = tipo.min_descto * 100;
        const max = tipo.max_descto * 100;
        if (numValue >= min && numValue <= max) {
          setDescuentoManual(value);
        }
      } else {
        setDescuentoManual(value);
      }
    }
  }}
  onClick={(e) => {
    e.stopPropagation();
    // Seleccionar la fila al hacer clic en el TextField
    if (tipoDescuentoSeleccionado !== tipo.tipo_descuento) {
      setTipoDescuentoSeleccionado(tipo.tipo_descuento);
      setDescuentoManual((tipo.max_descto * 100).toFixed(2));
      setObservacionManual("");
    }
  }}
  onFocus={(e) => {
    // Seleccionar la fila al recibir foco
    if (tipoDescuentoSeleccionado !== tipo.tipo_descuento) {
      setTipoDescuentoSeleccionado(tipo.tipo_descuento);
      setDescuentoManual((tipo.max_descto * 100).toFixed(2));
      setObservacionManual("");
    }
  }}
  sx={{ flex: 1, mx: 0.5 }}
  InputProps={{
    endAdornment: <span>%</span>
  }}
/>
<TextField
  size="small"
  value={tipoDescuentoSeleccionado === tipo.tipo_descuento ? observacionManual : ''}
  onChange={(e) => setObservacionManual(e.target.value)}
  onClick={(e) => e.stopPropagation()}
  sx={{ flex: 1, mx: 0.5 }}
/>
<Box sx={{ flex: 1, textAlign: 'right' }}>{(tipo.min_descto * 100).toFixed(0)}%</Box>
<Box sx={{ flex: 1, textAlign: 'right' }}>{(tipo.max_descto * 100).toFixed(0)}%</Box>
  </Box>
))}
</Box>
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
      <Button
        variant="contained"
        onClick={handleAplicarDescuento}
        sx={{ 
          minWidth: 120,
          backgroundColor: '#808080',
          color: 'white',
          '&:hover': { backgroundColor: '#666666' }
        }}
      >
        Aceptar
      </Button>
      <Button
        variant="contained"
       onClick={() => {
          setModalTiposDescuentoOpen(false);
          setTipoDescuentoSeleccionado(0);
          setDescuentoManual("");
          setObservacionManual("");
          setDetalleParaDescuento(null);
        }}
        sx={{ 
          minWidth: 120,
          backgroundColor: '#808080',
          color: 'white',
          '&:hover': { backgroundColor: '#666666' }
        }}
      >
        Cancelar
      </Button>
    </Box>
  </DialogContent>
</Dialog>
    </>
  );
}