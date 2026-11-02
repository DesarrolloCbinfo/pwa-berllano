import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';

const require = createRequire(import.meta.url);
const compilado = buildSync({
  entryPoints: [fileURLToPath(new URL('../src/app/pages/ReporteRecepcionMercancias/exportarPdf.ts', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
});
const modulo = { exports: {} };
new Function('module', 'exports', 'require', compilado.outputFiles[0].text)(modulo, modulo.exports, require);
const { crearPdfRecepciones } = modulo.exports;

const periodo = { fechaInicial: '2026-01-01', fechaFinal: '2026-10-30' };
const sucursal = { cve_sucursal: 1, nombre: 'ARAUCARIAS' };
const fila = { clave: '000025', nombre: 'ALFAPAR', fecha: '2026-03-16T22:11:41', subtotal: 111824.7091, iva: 17891.953456000003, total: 129716.662556 };

function textoPdf(doc) {
  const contenido = Buffer.from(doc.output('arraybuffer')).toString('latin1');
  assert.ok(contenido.startsWith('%PDF-'));
  return [...contenido.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)]
    .map((coincidencia) => inflateSync(Buffer.from(coincidencia[1], 'latin1')).toString('latin1')).join('\n');
}

test('el PDF por sucursales usa carta vertical y conserva encabezado, periodo e importes', () => {
  const doc = crearPdfRecepciones({ ...periodo, nivel: 'sucursales' }, [{ ...fila, clave: '1', nombre: 'ARAUCARIAS' }]);
  assert.equal(doc.getNumberOfPages(), 1);
  assert.ok(Math.abs(doc.internal.pageSize.getWidth() - 215.9) < 0.01);
  assert.ok(Math.abs(doc.internal.pageSize.getHeight() - 279.4) < 0.01);
  const texto = textoPdf(doc);
  assert.ok(texto.includes('Recepción de mercancías por sucursal'));
  assert.ok(texto.includes('Del 01-ene.-26   al 30-oct.-26'));
  assert.ok(texto.includes('ARAUCARIAS'));
  assert.ok(texto.includes('$111,824.71'));
  assert.ok(texto.includes('$17,891.95'));
  assert.ok(texto.includes('$129,716.66'));
  assert.ok(texto.includes('Totales:'));
  assert.ok(texto.includes('Página 1 de 1'));
});

test('el PDF por proveedores identifica la sucursal y suma el reporte completo', () => {
  const doc = crearPdfRecepciones({ ...periodo, nivel: 'proveedores', sucursal }, [
    fila,
    { ...fila, clave: '000024', nombre: 'AMERICAN CREW', subtotal: 23205.605749984174, iva: 3712.896919997469, total: 26918.502669981637 },
  ]);
  const texto = textoPdf(doc);
  assert.ok(texto.includes('Recepción de mercancías por proveedor'));
  assert.ok(texto.includes('Sucursal: ARAUCARIAS'));
  assert.ok(texto.includes('ALFAPAR'));
  assert.ok(texto.includes('AMERICAN CREW'));
  assert.ok(texto.includes('$156,635.17'));
});

test('el PDF por folios conserva el proveedor con ceros iniciales y la fecha de recepción', () => {
  const doc = crearPdfRecepciones({
    ...periodo, nivel: 'folios', sucursal, proveedor: { id: '000025', nombre: 'ALFAPAR' },
  }, [{ ...fila, clave: '649' }]);
  const texto = textoPdf(doc);
  assert.ok(texto.includes('Recepción de mercancías por folios'));
  assert.ok(texto.includes('Proveedor: 000025 - ALFAPAR'));
  assert.ok(texto.includes('Fecha'));
  assert.ok(texto.includes('Folio'));
  assert.ok(texto.includes('16/03/2026'));
  assert.ok(texto.includes('(649)'));
});

test('los reportes largos exportan todas las filas, repiten encabezados y muestran totales una sola vez', () => {
  const filas = Array.from({ length: 220 }, (_, indice) => ({
    ...fila, clave: String(indice + 1), nombre: `PROV${String(indice + 1).padStart(4, '0')}`,
    subtotal: 100, iva: 16, total: 116,
  }));
  const doc = crearPdfRecepciones({ ...periodo, nivel: 'proveedores', sucursal }, filas);
  const paginas = doc.getNumberOfPages();
  assert.ok(paginas > 1);
  const texto = textoPdf(doc);
  assert.equal((texto.match(/PROV\d{4}/g) ?? []).length, 220);
  assert.equal(texto.split('Totales:').length - 1, 1);
  assert.equal(texto.split('Sucursal: ARAUCARIAS').length - 1, paginas);
  assert.ok(texto.includes('$25,520.00'));
  assert.ok(texto.includes(`Página ${paginas} de ${paginas}`));
});

test('no se genera un PDF cuando la consulta no tiene resultados', () => {
  assert.throws(() => crearPdfRecepciones({ ...periodo, nivel: 'sucursales' }, []), /No hay registros/);
});
