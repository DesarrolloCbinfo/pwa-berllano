import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow, Typography } from '@mui/material';
import { formatoFechaRaz, formatoNumeroRaz, totalColumnaRaz, valorRaz } from '../reporte';
import type { FilaRaz, SeccionRaz } from '../reporte';

type Props = { seccion: SeccionRaz; filas: FilaRaz[] };

export default function RazSection({ seccion, filas }: Props) {
  const columnas = seccion.grupos.flatMap((grupo) => grupo.columnas);
  const gruposInicio = new Set(seccion.grupos.slice(1).map((grupo) => grupo.columnas[0].campo));
  const colorGrupo = (indice: number) => ['#f2f4f5', '#eef5f2', '#f6f3fa'][indice % 3];

  return (
    <Paper component="section" variant="outlined" aria-labelledby={`raz-${seccion.id}`} sx={{ overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography id={`raz-${seccion.id}`} variant="h6">{seccion.titulo}</Typography>
        <Typography variant="body2" sx={{ color: 'grey.700' }}>{seccion.descripcion}</Typography>
      </Box>
      <TableContainer tabIndex={0} role="region" aria-label={`Tabla de ${seccion.titulo}`} sx={{ maxHeight: 350 }}>
        <Table size="small" stickyHeader aria-label={seccion.titulo} sx={{
          minWidth: 112 + columnas.length * 108,
          '& .MuiTableCell-root': { px: 1.25, py: 0.75, whiteSpace: 'nowrap', fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' },
        }}>
          <TableHead>
            <TableRow sx={{ height: 36 }}>
              <TableCell rowSpan={2} sx={{ left: 0, zIndex: 5, minWidth: 112, backgroundColor: '#f2f4f5', borderRight: '1px solid', borderColor: 'divider' }}>Fecha</TableCell>
              {seccion.grupos.map((grupo, indice) => (
                <TableCell key={grupo.titulo} colSpan={grupo.columnas.length} align="center" scope="colgroup" sx={{ backgroundColor: colorGrupo(indice), fontWeight: 700 }}>
                  {grupo.titulo}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              {seccion.grupos.flatMap((grupo, indice) => grupo.columnas.map((columna) => (
                <TableCell key={columna.campo} align="right" scope="col" sx={{
                  top: 36, backgroundColor: colorGrupo(indice), fontWeight: 700,
                  ...(gruposInicio.has(columna.campo) ? { borderLeft: '2px solid', borderLeftColor: 'grey.400' } : {}),
                }}>{columna.etiqueta}</TableCell>
              )))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filas.map((fila, indice) => (
              <TableRow hover key={`${fila.fecha}-${indice}`} sx={{ backgroundColor: indice % 2 ? 'grey.50' : 'background.paper' }}>
                <TableCell component="th" scope="row" sx={{ position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'inherit', borderRight: '1px solid', borderColor: 'divider' }}>
                  {formatoFechaRaz(fila.fecha)}
                </TableCell>
                {columnas.map((columna) => (
                  <TableCell key={columna.campo} align="right" sx={{
                    ...(gruposInicio.has(columna.campo) ? { borderLeft: '2px solid', borderLeftColor: 'grey.400' } : {}),
                  }}>{formatoNumeroRaz(valorRaz(fila, columna))}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter sx={{
            '& .MuiTableCell-root': { position: 'sticky', bottom: 0, zIndex: 2, backgroundColor: '#e9ecef', color: 'text.primary', fontWeight: 700, borderTop: '2px solid', borderTopColor: 'grey.400' },
            '& .raz-total-fecha': { left: 0, zIndex: 3 },
          }}>
            <TableRow>
              <TableCell className="raz-total-fecha">TOTALES</TableCell>
              {columnas.map((columna) => (
                <TableCell key={columna.campo} align="right" sx={{
                  ...(gruposInicio.has(columna.campo) ? { borderLeft: '2px solid', borderLeftColor: 'grey.400' } : {}),
                }}>{formatoNumeroRaz(totalColumnaRaz(filas, columna))}</TableCell>
              ))}
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </Paper>
  );
}
