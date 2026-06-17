const fs = require('fs');
const path = 'c:/APIS/Berllano_Web/PWA-Berllano/pwa-berllano/src/app/pages/POS.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// 1. Remove duplicate TextField import
const dupIdx = lines.findIndex(l => l.trim() === 'import TextField from "@mui/material/TextField";');
if (dupIdx >= 0) {
  lines.splice(dupIdx, 1);
  console.log('Removed duplicate TextField import at line', dupIdx + 1);
}

// 2. Find JSX block start and end
let startIdx = lines.findIndex(l => l.includes('{/* Lista de insumos seleccionados */}'));
let endIdx = -1;
if (startIdx >= 0) {
  // Find the closing of the Box after Total Insumos
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].trim() === '    )}') {
      endIdx = i;
      break;
    }
  }
}

if (startIdx >= 0 && endIdx >= 0) {
  const newBlock = [
    "    {/* Lista de insumos seleccionados */}",
    "    {insumosSeleccionados.length > 0 && (",
    "      <Box sx={{ mt: 2, p: 1, backgroundColor: 'grey.50', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>",
    "        <Typography variant=\"subtitle2\" sx={{ mb: 1, fontWeight: 'bold' }}>",
    "          Insumos Seleccionados:",
    "        </Typography>",
    "        {/* Encabezados */}",
    "        <Box sx={{ display: 'flex', alignItems: 'center', px: 1, py: 0.5, borderBottom: '1px solid #ccc', backgroundColor: '#e0e0e0' }}>",
    "          <Box sx={{ width: 36 }} />",
    "          <Typography variant=\"caption\" sx={{ flex: 1, fontWeight: 'bold', fontSize: '0.7rem' }}>Producto</Typography>",
    "          <Typography variant=\"caption\" sx={{ width: 60, fontWeight: 'bold', fontSize: '0.7rem', textAlign: 'center' }}>Cant</Typography>",
    "          <Typography variant=\"caption\" sx={{ width: 50, fontWeight: 'bold', fontSize: '0.7rem', textAlign: 'center' }}>Validado</Typography>",
    "          <Typography variant=\"caption\" sx={{ width: 70, fontWeight: 'bold', fontSize: '0.7rem', textAlign: 'center' }}>Validar</Typography>",
    "          <Typography variant=\"caption\" sx={{ width: 120, fontWeight: 'bold', fontSize: '0.7rem', textAlign: 'center', mr: 1 }}>Observaci\u00f3n</Typography>",
    "        </Box>",
    "        {insumosSeleccionados.map((item, index) => (",
    "          <Box key={item.producto.clave_prod} sx={{",
    "            display: 'flex',",
    "            alignItems: 'center',",
    "            py: 0.5,",
    "            px: 1,",
    "            borderBottom: index < insumosSeleccionados.length - 1 ? '1px solid #e0e0e0' : 'none'",
    "          }}>",
    "            <IconButton",
    "              size=\"small\"",
    "              color=\"error\"",
    "              onClick={() => handleSeleccionarInsumo(item.producto)}",
    "              sx={{ width: 28, height: 28, mr: 0.5 }}",
    "            >",
    "              <Delete fontSize=\"small\" />",
    "            </IconButton>",
    "            <Typography variant=\"body2\" sx={{ flex: 1, fontSize: '0.75rem' }}>",
    "              {item.producto.clave_prod} - {item.producto.descripcion}",
    "            </Typography>",
    "            <Box sx={{ width: 60, textAlign: 'center' }}>",
    "              <FormControl size=\"small\" sx={{ width: 55 }}>",
    "                <Select",
    "                  value={item.cantidad}",
    "                  onChange={(e) => handleCantidadInsumo(item.producto.clave_prod, Number(e.target.value))}",
    "                  sx={{",
    "                    '& .MuiInputBase-root': {",
    "                      height: 22,",
    "                      fontSize: '0.7rem'",
    "                    }",
    "                  }}",
    "                >",
    "                  {insumoCargandoCantidades === item.producto.clave_prod && loadingCantidades ? (",
    "                    <MenuItem disabled sx={{ fontSize: '0.7rem' }}>Cargando...</MenuItem>",
    "                  ) : (",
    "                    (cantidadesCache[item.producto.clave_prod] || [1]).map((cantidad) => (",
    "                      <MenuItem key={cantidad} value={cantidad} sx={{ fontSize: '0.7rem', py: 0.25, minHeight: '22px' }}>",
    "                        {cantidad}",
    "                      </MenuItem>",
    "                    ))",
    "                  )}",
    "                </Select>",
    "              </FormControl>",
    "            </Box>",
    "            <Box sx={{ width: 50, textAlign: 'center' }}>",
    "              <Typography variant=\"caption\" sx={{ fontSize: '0.7rem', color: item.validado ? 'green' : 'text.secondary', fontWeight: item.validado ? 'bold' : 'normal' }}>",
    "                {item.validado ? 'S\u00ed' : 'No'}",
    "              </Typography>",
    "            </Box>",
    "            <Box sx={{ width: 70, textAlign: 'center' }}>",
    "              <Button",
    "                size=\"small\"",
    "                variant={item.validado ? \"contained\" : \"outlined\"}",
    "                color={item.validado ? \"success\" : \"primary\"}",
    "                onClick={() => handleValidarInsumo(item.producto.clave_prod)}",
    "                sx={{ minWidth: 50, py: 0, fontSize: '0.65rem', height: 22 }}",
    "              >",
    "                Validar",
    "              </Button>",
    "            </Box>",
    "            <Box sx={{ width: 120, textAlign: 'center' }}>",
    "              <TextField",
    "                size=\"small\"",
    "                value={item.observacion}",
    "                onChange={(e) => handleObservacionInsumo(item.producto.clave_prod, e.target.value)}",
    "                placeholder=\"Obs...\"",
    "                sx={{",
    "                  width: 110,",
    "                  '& .MuiInputBase-root': {",
    "                    height: 22,",
    "                    fontSize: '0.7rem'",
    "                  }",
    "                }}",
    "              />",
    "            </Box>",
    "          </Box>",
    "        ))}",
    "        ",
    "        <Typography variant=\"subtitle1\" sx={{ mt: 2, fontWeight: 'bold' }}>",
    "          Total Insumos: ${insumosSeleccionados.reduce((sum, item) => sum + (item.producto.Precio || 0) * item.cantidad, 0).toFixed(2)}",
    "        </Typography>",
    "      </Box>",
    "    )}"
  ];
  lines.splice(startIdx, endIdx - startIdx + 1, ...newBlock);
  fs.writeFileSync(path, lines.join('\n'), 'utf8');
  console.log('Replaced JSX block from line', startIdx + 1, 'to', endIdx + 1);
} else {
  console.log('Could not find block boundaries. startIdx=', startIdx, 'endIdx=', endIdx);
}
