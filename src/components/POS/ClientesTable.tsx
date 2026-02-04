import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
} from "@mui/material";

type Cliente = {
  No_cliente: string;
  nombre: string;
  ap_paterno?: string | null;
  ap_materno?: string | null;
};

type Props = {
  data: Cliente[];
  onSelect: (clave: string) => void;
};

export default function ClientesTable({ data, onSelect }: Props) {
  return (
    <Paper variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Clave</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Paterno</TableCell>
            <TableCell>Materno</TableCell>
            <TableCell align="center">Acción</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {data.map((c) => (
            <TableRow key={c.No_cliente} hover>
              <TableCell>{c.No_cliente}</TableCell>
              <TableCell>{c.nombre}</TableCell>
              <TableCell>{c.ap_paterno}</TableCell>
              <TableCell>{c.ap_materno}</TableCell>
              <TableCell align="center">
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => onSelect(c.No_cliente)}
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
