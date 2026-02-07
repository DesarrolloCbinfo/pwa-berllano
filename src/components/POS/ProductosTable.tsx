import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
} from "@mui/material";

type Producto = {
  clave_prod: string;
  descripcion: string;
  Precio?:number;
  costo_unitario?: number;
  tasa_iva?: number;
  total_registros?: number;
};

type Props = {
  data: Producto[];
  onSelect: (producto: Producto) => void;
};

export default function ProductosTable({ data, onSelect }: Props) {
  return (
    <Paper variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Clave</TableCell>
            <TableCell>Descripcion</TableCell>
            <TableCell>Precio</TableCell>
        
            <TableCell align="center">Acción</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {data.map((c) => (
            <TableRow key={c.clave_prod} hover>
              <TableCell>{c.clave_prod}</TableCell>
              <TableCell>{c.descripcion}</TableCell>
              <TableCell>{c.Precio}</TableCell>
              <TableCell align="center">
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => onSelect(c)}
                >
                  Seleccionar
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center">
                Sin resultados
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}
