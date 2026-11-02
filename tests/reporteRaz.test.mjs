import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filasExcelRaz, formatoFechaRaz, formatoNumeroRaz, normalizarRaz,
  parametrosRaz, seccionesRaz, totalColumnaRaz, valorRaz,
} from '../src/app/pages/ReporteRaz/reporte.ts';

// Valores del 2 y 3 de enero de 2026 proporcionados por la API y Access.
const muestra = [
  {
    fecha: '2026-01-02T00:00:00',
    Ara: 23289, AraProd: 11559, AraServ: 11730,
    Ara_2: 21449, AraProd2: 9767.941176, AraServ2: 11681.058824,
    P1: 15584, P1_2: 8914, P2: 24103, P2_2: 10390,
    Anda: 35277, Anda_2: 25797.999999, AndProd: 8668, AndProd2: 5259.6092659999995,
    Leju: 530, Leju_2: 530, Ofi: 0, Ofi_2: 0,
    puntosAra: 80, puntosAnd: 765, tarjetaAra: 21449, tarjetaAnD: 25798,
  },
  {
    fecha: '2026-01-03T00:00:00',
    Ara: 31532, AraProd: 10662, AraServ: 20870,
    Ara_2: 29762, AraProd2: 10662, AraServ2: 19100,
    puntosAra: 0, puntosAnd: 0, tarjetaAra: 29362, tarjetaAnD: 34135,
  },
];

function columna(seccionId, campo) {
  const seccion = seccionesRaz.find((item) => item.id === seccionId);
  const resultado = seccion?.grupos.flatMap((grupo) => grupo.columnas).find((item) => item.campo === campo);
  assert.ok(resultado, `Columna ${campo} no encontrada en ${seccionId}`);
  return resultado;
}

test('la consulta envia los enteros a y m y rechaza periodos invalidos', () => {
  assert.deepEqual(parametrosRaz({ anio: 2026, mes: 1 }), { a: 2026, m: 1 });
  for (const periodo of [{ anio: NaN, mes: 1 }, { anio: 2026.5, mes: 1 }, { anio: 0, mes: 1 }, { anio: 2026, mes: 13 }, { anio: 2026, mes: 0 }]) {
    assert.throws(() => parametrosRaz(periodo));
  }
});

test('Venta real y Fiscal conservan sus importes y Raz reproduce Access', () => {
  const [fila] = normalizarRaz(muestra);
  assert.equal(valorRaz(fila, columna('venta-real', 'Ara')), 23289);
  assert.equal(valorRaz(fila, columna('fiscal', 'Ara_2')), 21449);
  assert.equal(valorRaz(fila, columna('raz', 'Ara')), 1840);
  assert.equal(valorRaz(fila, columna('raz', 'P1')), 6670);
  assert.equal(valorRaz(fila, columna('raz', 'P2')), 13713);
  assert.equal(formatoNumeroRaz(valorRaz(fila, columna('raz', 'AraProd'))), '1,791.06');
  assert.equal(formatoNumeroRaz(valorRaz(fila, columna('raz', 'AraServ'))), '48.94');
  assert.equal(formatoNumeroRaz(valorRaz(fila, columna('raz', 'Anda'))), '9,479.00');
  assert.equal(valorRaz(fila, columna('raz', 'Leju')), 0);
});

test('Puntos y Tarjeta usan sus campos de Andamar y distinguen cero de dato ausente', () => {
  const [fila] = normalizarRaz(muestra);
  assert.equal(valorRaz(fila, columna('puntos', 'puntosAnd')), 765);
  assert.equal(valorRaz(fila, columna('tarjeta', 'tarjetaAnD')), 25798);
  assert.equal(valorRaz(fila, columna('venta-real', 'Ofi')), 0);
  assert.equal(valorRaz(fila, columna('puntos', 'puntosOfi')), null);
  assert.equal(valorRaz(fila, columna('tarjeta', 'tarjetaOfi')), null);
  assert.equal(formatoNumeroRaz(null), '—');
  assert.equal(formatoNumeroRaz(0), '0.00');
});

test('los totales suman todos los dias sin mezclar real, fiscal, puntos ni tarjetas', () => {
  const filas = normalizarRaz(muestra);
  assert.equal(totalColumnaRaz(filas, columna('venta-real', 'Ara')), 54821);
  assert.equal(totalColumnaRaz(filas, columna('fiscal', 'Ara_2')), 51211);
  assert.equal(totalColumnaRaz(filas, columna('raz', 'Ara')), 3610);
  assert.equal(totalColumnaRaz(filas, columna('puntos', 'puntosAra')), 80);
  assert.equal(totalColumnaRaz(filas, columna('tarjeta', 'tarjetaAra')), 50811);
  assert.equal(totalColumnaRaz(filas, columna('puntos', 'puntosOfi')), null);
});

test('Excel conserva cifras numericas, grupos, periodo y totales', () => {
  const filas = normalizarRaz(muestra);
  const seccion = seccionesRaz.find((item) => item.id === 'raz');
  const hoja = filasExcelRaz(filas, seccion, { anio: 2026, mes: 1 });
  assert.equal(hoja[1][0], 'Enero de 2026');
  assert.equal(hoja[3][1], 'Total por sucursal');
  assert.equal(hoja[3][9], 'Productos');
  assert.equal(hoja[3][17], 'Servicios');
  assert.equal(hoja[5][0], '02/01/2026');
  assert.equal(hoja[5][1], 1840);
  assert.equal(hoja.at(-1)[0], 'TOTALES');
  assert.equal(hoja.at(-1)[1], 3610);
});

test('las fechas se ordenan y presentan sin desfase de zona horaria', () => {
  const filas = normalizarRaz({ data: [...muestra].reverse() });
  assert.deepEqual(filas.map((fila) => fila.fecha), ['2026-01-02', '2026-01-03']);
  assert.equal(formatoFechaRaz(filas[0].fecha), '02/01/2026');
});

test('las respuestas vacias, errores, nulos y diferencias negativas se interpretan correctamente', () => {
  assert.deepEqual(normalizarRaz([]), []);
  assert.throws(() => normalizarRaz({ detail: 'Fallo del servidor' }));
  assert.throws(() => normalizarRaz([null]));
  assert.throws(() => normalizarRaz([{ Ara: 100 }]));
  const [fila] = normalizarRaz([{ fecha: '2026-01-02', Ara: '12.50', Ara_2: 20, puntosAra: null, tarjetaAra: '' }]);
  assert.equal(valorRaz(fila, columna('raz', 'Ara')), -7.5);
  assert.equal(valorRaz(fila, columna('puntos', 'puntosAra')), null);
  assert.equal(valorRaz(fila, columna('tarjeta', 'tarjetaAra')), null);
  assert.equal(formatoNumeroRaz(-12.345), '-12.35');
  assert.equal(formatoNumeroRaz(-0.000001), '0.00');
});
