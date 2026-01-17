import PWABadge from '../../../PWABadge';

export default function Catalogos() {
  return (
    <>
      <div>MENU DE CATALOGOS</div>
      <h2>hola mundo</h2>

      <button onClick={() => (window.location.href = '/cat_Areas')}>
        cat_Areas
      </button>

      <button onClick={() => (window.location.href = '/cat_Marcas')}>
        cat_Marcas
      </button>

      <button onClick={() => (window.location.href = '/cat_Sucursales')}>
        cat_Sucursales
      </button>

      <PWABadge />
    </>
  );
}
