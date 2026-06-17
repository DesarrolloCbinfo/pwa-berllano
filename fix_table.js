const fs = require('fs');
const path = 'c:/APIS/Berllano_Web/PWA-Berllano/pwa-berllano/src/app/pages/POS.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Encontrar inicio del bloque a reemplazar: linea con {/* Encabezados */}
const startIdx = lines.findIndex(l => l.trim() === '{/* Encabezados */}');
// Encontrar fin: la linea con "        ))}" que cierra el map
let endIdx = -1;
for (let i = startIdx + 1; i < lines.length; i++) {
  if (lines[i].trim() === '))}' && lines[i].startsWith('        ')) {
    endIdx = i;
    break;
  }
}

if (startIdx >= 0 && endIdx >= 0) {
  const newLines = [
    "        <Table size=\"small\" sx={{ tableLayout: 'fixed', width: '100%' }}",
    "          <TableHead>",
    "            <TableRow sx={{ backgroundColor: '#e0e0e0' }}",
    "              <TableCell sx={{ width: 40, p: '4px 8px' }}></TableCell>",
    "              <TableCell sx={{ p: '4px 8px', fontSize: '0.7rem', fontWeight: 'bold' }}>Producto</TableCell>",
    "              <TableCell align=\"center\" sx={{ width: 60, p: '4px 8px', fontSize: '0.7rem', fontWeight: 'bold' }}>Cant</TableCell>",
    "              <TableCell align=\"center\" sx={{ width: 55, p: '4px 8px', fontSize: '0.7rem', fontWeight: 'bold' }}>Validado</TableCell>",
    "              <TableCell align=\"center\" sx={{ width: 75, p: '4px 8px', fontSize: '0.7rem', fontWeight: 'bold' }}>Validar</TableCell>",
    "              <TableCell align=\"center\" sx={{ width: 120, p: '4px 8px', fontSize: '0.7rem', fontWeight: 'bold' }}>Observaci\u00f3n</TableCell>",
    "            </TableRow>",
    "          </TableHead>",
    "          <TableBody>",
    "            {insumosSeleccionados.map((item) => (",
    "              <TableRow key={item.producto.clave_prod} sx={{ '& td': { p: '4px 8px', borderBottom: '1px solid #e0e0e0' } }}",
    "                <TableCell sx={{ width: 40 }}",
    "                  <IconButton",
    "                    size=\"small\"",
    "                    color=\"error\"",
    "                    onClick={() => handleSeleccionarInsumo(item.producto)}",
    "                    sx={{ width: 24, height: 24, p: 0 }}",
    "                  >",
    "                    <Delete fontSize=\"small\" sx={{ fontSize: '1rem' }} />",
    "                  </IconButton>",
    "                </TableCell>",
    "                <TableCell>",
    "                  <Typography variant=\"body2\" noWrap sx={{ fontSize: '0.7rem' }}",
    "                    {item.producto.clave_prod} - {item.producto.descripcion}",
    "                  </Typography>",
    "                </TableCell>",
    "                <TableCell align=\"center\">",
    "                  <FormControl size=\"small\" sx={{ width: 55 }}",
    "                    <Select",
    "                      value={item.cantidad}",
    "                      onChange={(e) => handleCantidadInsumo(item.producto.clave_prod, Number(e.target.value))}",
    "                      sx={{",
    "                        '& .MuiInputBase-root': {",
    "                          height: 22,",
    "                          fontSize: '0.7rem'",
    "                        }",
    "                      }}",
    "                    >",
    "                      {insumoCargandoCantidades === item.producto.clave_prod && loadingCantidades ? (",
    "                        <MenuItem disabled sx={{ fontSize: '0.7rem' }}>Cargando...</MenuItem>",
    "                      ) : (",
    "                        (cantidadesCache[item.producto.clave_prod] || [1]).map((cantidad) => (",
    "                          <MenuItem key={cantidad} value={cantidad} sx={{ fontSize: '0.7rem', py: 0.25, minHeight: '22px' }}",
    "                            {cantidad}",
    "                          </MenuItem>",
    "                        ))",
    "                      )}",
    "                    </Select>",
    "                  </FormControl>",
    "                </TableCell>",
    "                <TableCell align=\"center\">",
    "                  <Typography variant=\"caption\" sx={{ fontSize: '0.7rem', color: item.validado ? 'green' : 'text.secondary', fontWeight: item.validado ? 'bold' : 'normal' }}",
    "                    {item.validado ? 'S\u00ed' : 'No'}",
    "                  </Typography>",
    "                </TableCell>",
    "                <TableCell align=\"center\">",
    "                  <Button",
    "                    size=\"small\"",
    "                    variant={item.validado ? \"contained\" : \"outlined\"}",
    "                    color={item.validado ? \"success\" : \"primary\"}",
    "                    onClick={() => handleValidarInsumo(item.producto.clave_prod)}",
    "                    sx={{ minWidth: 50, py: 0, fontSize: '0.65rem', height: 22 }}",
    "                  >",
    "                    Validar",
    "                  </Button>",
    "                </TableCell>",
    "                <TableCell align=\"center\">",
    "                  <TextField",
    "                    size=\"small\"",
    "                    value={item.observacion}",
    "                    onChange={(e) => handleObservacionInsumo(item.producto.clave_prod, e.target.value)}",
    "                    placeholder=\"Obs...\"",
    "                    sx={{",
    "                      width: 100,",
    "                      '& .MuiInputBase-root': {",
    "                        height: 22,",
    "                        fontSize: '0.7rem'",
    "                      }",
    "                    }}",
    "                  />",
    "                </TableCell>",
    "              </TableRow>",
    "            ))}",
    "          </TableBody>",
    "        </Table>"
  ];
  lines.splice(startIdx, endIdx - startIdx + 1, ...newLines);
  fs.writeFileSync(path, lines.join('\n'), 'utf8');
  console.log('Replaced block from line', startIdx + 1, 'to', endIdx + 1);
} else {
  console.log('Could not find block. startIdx=', startIdx, 'endIdx=', endIdx);
}
