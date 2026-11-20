import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aCentavos,
  cotizarCargoBanorteCentavos,
  puedeCancelarBanorte,
  saldoBanorteCentavos,
} from '../src/components/POS/banorteSaldo.ts';

test('el cargo deja como efectivo el remanente tras los aprobados', () => {
  const total = aCentavos(1000);
  // Primer TC de 400 -> quedan 600 en efectivo.
  const c1 = cotizarCargoBanorteCentavos(total, [], aCentavos(400));
  assert.deepEqual(c1, { ok: true, efectivoRestanteCentavos: 60000 });
  // Segundo TC de 250 con 400 ya aprobados -> quedan 350.
  const c2 = cotizarCargoBanorteCentavos(total, [aCentavos(400)], aCentavos(250));
  assert.deepEqual(c2, { ok: true, efectivoRestanteCentavos: 35000 });
});

test('cargos que cubren el total dejan efectivo en cero', () => {
  const total = aCentavos(1000);
  const completo = cotizarCargoBanorteCentavos(total, [], aCentavos(1000));
  assert.deepEqual(completo, { ok: true, efectivoRestanteCentavos: 0 });
  const ultimo = cotizarCargoBanorteCentavos(total, [aCentavos(400), aCentavos(250)], aCentavos(350));
  assert.deepEqual(ultimo, { ok: true, efectivoRestanteCentavos: 0 });
});

test('los centavos evitan falsos excedentes por precision flotante', () => {
  // 0.01 + 0.09 === 0.10 solo en centavos enteros.
  const total = aCentavos(0.10);
  const c = cotizarCargoBanorteCentavos(total, [aCentavos(0.01)], aCentavos(0.09));
  assert.deepEqual(c, { ok: true, efectivoRestanteCentavos: 0 });
});

test('rechaza cargos no positivos o que exceden el saldo aprobado', () => {
  const total = aCentavos(1000);
  for (const cargo of [0, -1, aCentavos(0), aCentavos(-5), Number.NaN]) {
    const c = cotizarCargoBanorteCentavos(total, [], cargo);
    assert.equal(c.ok, false);
  }
  // 600 aprobados, quedan 400: 400.01 excede, 400 no.
  const excede = cotizarCargoBanorteCentavos(total, [aCentavos(600)], aCentavos(400) + 1);
  assert.equal(excede.ok, false);
  const exacto = cotizarCargoBanorteCentavos(total, [aCentavos(600)], aCentavos(400));
  assert.equal(exacto.ok, true);
});

test('una tarjeta declinada no reduce el saldo disponible', () => {
  const total = aCentavos(1000);
  // Declinada: el slot no entra a aprobados, el saldo sigue completo.
  assert.equal(saldoBanorteCentavos(total, []), total);
  const c = cotizarCargoBanorteCentavos(total, [], aCentavos(1000));
  assert.deepEqual(c, { ok: true, efectivoRestanteCentavos: 0 });
});

test('puedeCancelarBanorte solo es true en reposo con token y sin TC aprobada', () => {
  const base = {
    hayToken: true,
    cargoEnCurso: false,
    cierreEnCurso: false,
    cancelacionEnCurso: false,
    tieneTarjetaAprobada: false,
    requiereConciliacion: false,
  };
  assert.equal(puedeCancelarBanorte(base), true);
  for (const guardia of [
    'hayToken',
    'cargoEnCurso',
    'cierreEnCurso',
    'cancelacionEnCurso',
    'tieneTarjetaAprobada',
    'requiereConciliacion',
  ]) {
    assert.equal(puedeCancelarBanorte({ ...base, [guardia]: !base[guardia] }), false, guardia);
  }
});
