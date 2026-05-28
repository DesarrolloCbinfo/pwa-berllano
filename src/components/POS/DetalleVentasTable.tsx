import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { Button, Typography, useTheme, useMediaQuery, Box, MenuItem, Select } from "@mui/material";
import React, { useMemo } from "react";

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
  onBuscarProducto?: () => void; 
};

export default function DetalleVentasTable({ 
  data, 
  estilistasLista = [], 
  auxiliaresLista = [], 
  onSelect, 
  onAgregarInsumos, 
  onEditarRenglon,
  onBuscarProducto 
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
        onBlur: (e) => {
          onEditarRenglon(row.original.id, "clave_prod", e.target.value);
          table.setEditingCell(null);
        },
      }),
    },
 {
      accessorKey: "d_producto",
      header: "Descripción",
      size: 100,
      minSize: 100,
      maxSize: 150,
      // 🔥 Quitamos el Typography y usamos un Box simple para heredar el tamaño exacto del renglón
      Cell: ({ cell }: any) => (
        <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
      }),
    },
    {
      accessorKey: "precio",
      header: "Precio",
      size: 100,
      minSize: 80,
      maxSize: 120,
      Cell: ({ cell }: any) => `$${Number(cell.getValue()).toFixed(2)}`,
      muiEditTextFieldProps: ({ cell, row, table }) => ({
        type: "number",
        inputProps: { min: 0, step: "0.01" },
        onBlur: (e) => {
          onEditarRenglon(row.original.id, "precio", Math.max(0, Number(e.target.value)));
          table.setEditingCell(null);
        },
      }),
    },
 {
      accessorKey: "importe",
      header: "Importe",
      size: 100,
      minSize: 80,
      maxSize: 120,
      enableEditing: false, 
      // 🔥 Eliminamos el Typography fontWeight="medium" que hacía los números gigantes
      Cell: ({ cell }: any) => `$${Number(cell.getValue()).toFixed(2)}`,
    },
    !isMobile && {
      accessorKey: "descuento",
      header: "Descuento",
      size: 100,
      minSize: 80,
      maxSize: 120,
      Cell: ({ cell }: any) => `$${Number(cell.getValue()).toFixed(2)}`,
      muiEditTextFieldProps: ({ cell, row, table }) => ({
        type: "number",
        inputProps: { min: 0, step: "0.01" },
        onBlur: (e) => {
          onEditarRenglon(row.original.id, "descuento", Math.max(0, Number(e.target.value)));
          table.setEditingCell(null);
        },
      }),
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
    <MaterialReactTable
      columns={columns}
      data={data}
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
          // 🔥 Evitamos bloquear el clic en la columna de botones
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
              onBuscarProducto();
            }
          } 
          else if (cell.column.id !== "importe" && cell.column.id !== "mrt-row-actions") {
            table.setEditingCell(cell);
          }
        },
      })}

      displayColumnDefOptions={{
        "mrt-row-actions": {
          header: "Acción",
          // 🔥 Ensanchamos la columna para que los botones entren y no se recorten
          size: 150, 
          minSize: 120,
          maxSize: 200,
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
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onAgregarInsumos && (
            <Button
              color="primary"
              variant="outlined"
              size="small"
              onClick={() => onAgregarInsumos(row.original)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Insumos
            </Button>
          )}
          {/* 🔥 Restauramos el botón de cancelar garantizando su visibilidad */}
          <Button
            color="error"
            variant="contained"
            size="small"
            onClick={() => onSelect(row.original)}
            sx={{ whiteSpace: 'nowrap' }}
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
            minWidth: { xs: 600, sm: 'auto' },
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
          d_producto: 100,
          Cant: 60,
          precio: 100,
          importe: 100,
        },
      }}
    />
  );
}