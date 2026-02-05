
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
} from "@mui/material";

type DetalleVenta = {
    id:string;
  estilista: string;
d_estilista: string;
hora: string;
clave_prod: string;
d_producto: string;
tiempo:string;
Cant:number;
precio:number;
importe:number;
descuento:number;
auxiliar:string;
d_auxiliar:string;
};

type Props = {
  data: DetalleVenta[];
  onSelect: (id: string) => void;
};

export default function ClientesTable({ data, onSelect }: Props) {
  return (
    <Paper variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Estilista</TableCell>
            <TableCell>Hora</TableCell>
            <TableCell>Clave</TableCell>
            <TableCell>Descripcion</TableCell>
            <TableCell>Tiempo</TableCell>
            <TableCell>Cantidad</TableCell>
            <TableCell>Precio</TableCell>
            <TableCell>Importe</TableCell>
            <TableCell>Descuento</TableCell>
            <TableCell>Auxiliar</TableCell>
            <TableCell align="center">Acción</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {data.map((c) => (
            <TableRow key={c.id} hover>
                
         
              <TableCell align="center">
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => onSelect(c.id)}
                >
                  X
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
