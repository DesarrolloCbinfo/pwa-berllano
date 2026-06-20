const fs = require('fs');
const path = 'c:/APIS/Berllano_Web/PWA-Berllano/pwa-berllano/src/app/pages/POS.tsx';

const contenido = fs.readFileSync(path, 'utf8');
const lineas = contenido.split('\n');

const idx = lineas.findIndex(l => l.includes('const handleConfirmarInsumos = async () => {'));
if (idx === -1) {
  console.log('No se encontró handleConfirmarInsumos');
  process.exit(1);
}

const nuevaFuncion = [
  '  const guardarInsumosEnProceso = async (listaInsumos: typeof insumosSeleccionados) => {',
  '    if (!clienteSeleccionado) return;',
  '    try {',
  '      const bodyPayload = {',
  '        cia: 1,',
  '        sucursal: sucursal,',
  '        cve_cliente: clienteSeleccionado.No_cliente,',
  "        d_cliente: `${clienteSeleccionado.nombre} ${clienteSeleccionado.ap_paterno || ''} ${clienteSeleccionado.ap_materno || ''}`.trim(),",
  '        totalVenta: listaInsumos.reduce((sum, item) => sum + (item.producto.Precio || 0) * item.cantidad, 0),',
  '        insumos: listaInsumos.map(item => ({',
  '          clave_prod: item.producto.clave_prod,',
  '          descripcion: item.producto.descripcion,',
  '          cantidad: item.cantidad,',
  '          precio: item.producto.Precio || 0,',
  '          validado: item.validado,',
  '          observacion: item.observacion',
  '        }))',
  '      };',
  '',
  "      const response = await consumoApi.post('/api/PuntoDeVenta/sp_bw_pos_guardar_venta_proceso', bodyPayload);",
  "      if (response.data?.status === 1 || response.data?.[0]?.status === 1) {",
  "        console.log('Auto-guardado exitoso en proceso');",
  '      } else {',
  "        console.error('Respuesta del servidor:', response.data?.message || response.data);",
  '      }',
  '    } catch (error) {',
  "      console.error('Error en el auto-guardado de insumos:', error);",
  '    }',
  '  };',
  ''
];

lineas.splice(idx, 0, ...nuevaFuncion);
fs.writeFileSync(path, lineas.join('\n'), 'utf8');
console.log('Función insertada en línea', idx + 1);
