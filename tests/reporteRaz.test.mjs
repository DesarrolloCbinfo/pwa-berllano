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

test('Excel usa una tabla UNION con las mismas columnas y bloques que Access', () => {
  const filas = normalizarRaz(muestra);
  const hoja = filasExcelRaz(filas);
  assert.deepEqual(hoja[0], [
    'dato', 'fecha', 'Ara', 'P1', 'P2', 'Ver', 'Dor', 'Anda', 'Leju', 'Ofi',
    'AraProd', 'P1Prod', 'P2Prod', 'VerProd', 'DorProd', 'AndProd', 'LejuProd', 'OfiProd',
    'AraServ', 'P1Serv', 'P2Serv', 'VerServ', 'DorServ', 'AndServ', 'LejuServ', 'OfiServ',
  ]);
  assert.equal(hoja.length, 13);
  assert.ok(hoja.every((fila) => fila.length === 26));
  assert.deepEqual(hoja.slice(1).map((fila) => fila[0]), [
    '1Real', '1Real', '2Puntos', '2Puntos', '3Raz', '3Raz',
    '4Fiscal', '4Fiscal', '5Tarjetas', '5Tarjetas', '6Depositos', '6Depositos',
  ]);
  assert.equal(hoja[1][1], 46024);
  assert.equal(hoja[2][1], 46025);
  assert.equal(hoja[1][2], 23289);
  assert.equal(hoja[5][2], 1840);
  assert.equal(hoja[7][2], 21449);
  assert.equal(hoja[9][2], 21449);
  assert.equal(hoja[3][9], 0);
});

test('las fechas se ordenan y presentan sin desfase de zona horaria', () => {
  const filas = normalizarRaz({ data: [...muestra].reverse() });
  assert.deepEqual(filas.map((fila) => fila.fecha), ['2026-01-02', '2026-01-03']);
  assert.equal(formatoFechaRaz(filas[0].fecha), '02/01/2026');
});

test('Depositos reproduce los importes diarios de Access como Fiscal menos Tarjeta', () => {
  const filas = normalizarRaz([
    {
      fecha: '2026-01-14', Ara_2: 20168, tarjetaAra: 20104,
      P1_2: 6592, tarjetaP1: 6592, P2_2: 6280, tarjetaP2: 6280,
      Dor_2: 11782, tarjetaDor: 11608, Anda_2: 24230.8, tarjetaAnD: 24031,
      Leju_2: 250, tarjetaLeju: 250, Ofi_2: 0,
    },
    {
      fecha: '2026-01-16', P1_2: 13604, tarjetaP1: 10804,
      Leju_2: 456, tarjetaLeju: 335,
    },
  ]);
  for (const [campo, esperado] of [['Ara_2', '64.00'], ['P1_2', '0.00'], ['P2_2', '0.00'], ['Dor_2', '174.00'], ['Anda_2', '199.80'], ['Leju_2', '0.00']]) {
    assert.equal(formatoNumeroRaz(valorRaz(filas[0], columna('depositos', campo))), esperado);
  }
  assert.equal(valorRaz(filas[1], columna('depositos', 'P1_2')), 2800);
  assert.equal(valorRaz(filas[1], columna('depositos', 'Leju_2')), 121);
  assert.equal(totalColumnaRaz(filas, columna('depositos', 'P1_2')), 2800);
  assert.equal(totalColumnaRaz(filas, columna('depositos', 'Leju_2')), 121);
  assert.equal(valorRaz(filas[0], columna('depositos', 'Ofi_2')), null);
});

test('Depositos se exporta con sus importes y diferencias negativas en el bloque 6Depositos', () => {
  const filas = normalizarRaz([
    { fecha: '2026-01-02', Ara_2: 21449, tarjetaAra: 21449 },
    { fecha: '2026-01-03', Ara_2: 29762, tarjetaAra: 29362 },
    { fecha: '2026-01-04', Ara_2: 90, tarjetaAra: 100 },
  ]);
  const bloque = filasExcelRaz(filas).filter((fila) => fila[0] === '6Depositos');
  assert.deepEqual(bloque.map((fila) => fila[2]), [0, 400, -10]);
  assert.equal(bloque[0][9], 0);
  assert.ok(bloque.every((fila) => fila.slice(10).every((valor) => valor === 0)));
});

test('la UNION conserva las columnas fiscales de Leju en Puntos y Tarjetas como Access', () => {
  const filas = normalizarRaz([{
    fecha: '2026-01-04', puntosLeju: 0, tarjetaLeju: 3900, LejuProd2: 1280, LejuServ2: 2620,
  }]);
  const hoja = filasExcelRaz(filas);
  for (const tipo of ['2Puntos', '5Tarjetas']) {
    const registro = hoja.find((fila) => fila[0] === tipo);
    assert.equal(registro[16], 1280);
    assert.equal(registro[24], 2620);
    assert.equal(registro[10], 0);
    assert.equal(registro[18], 0);
  }
  assert.equal(hoja.find((fila) => fila[0] === '2Puntos')[8], 0);
  assert.equal(hoja.find((fila) => fila[0] === '5Tarjetas')[8], 3900);
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
