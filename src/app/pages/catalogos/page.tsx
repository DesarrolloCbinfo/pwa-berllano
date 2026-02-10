import PWABadge from '../../../PWABadge';

export default function Catalogos() {
  return (
    <>
      <div>MENU DE CATALOGOS</div>
      <h2>hola mundo</h2>

      <button onClick={() => (window.location.href = '/cat_Proveedores')}>
        cat_proveedores
      </button>
      <button onClick={() => (window.location.href = '/cat_Clientes')}>
        cat_Clientes
      </button>
      <button onClick={() => (window.location.href = '/cat_Tipo_Descuento')}>
        cat_Tipo_descuento
      </button>
      <button onClick={() => (window.location.href = '/cat_Compradores')}>
        cat_Compradores
      </button>
      <button onClick={() => (window.location.href = '/cat_Areas')}>
        cat_Areas
      </button>
      <button onClick={() => (window.location.href = '/cat_Marcas')}>
        cat_Marcas
      </button>
      <button onClick={() => (window.location.href = '/cat_Sucursales')}>
        cat_Sucursales
      </button>
      <button onClick={() => (window.location.href = '/AsignacionHorarios')}>
        AsignacionHorarios
      </button>
      <button onClick={() => (window.location.href = '/Cat_Marcas-Familias')}>
        Cat_Marcas-Familias
      </button>
      <button onClick={() => (window.location.href = '/cat_clientes')}>
        Cat_Clientes
      </button>
      <button onClick={() => (window.location.href = '/cat_Proveedores')}>
        Cat_Proveedores
      </button>
      <button
        onClick={() => (window.location.href = '/modulo-servicios-insumos')}
      >
        Modulo_Servicios_Insumos
      </button>
      <button
        onClick={() => (window.location.href = '/modulo_porcentajes_puntos')}
      >
        Modulo_De_Administracion_De_Porcentajes_De_Puntos
      </button>

      <button
        onClick={() =>
          (window.location.href = '/config_promociones_descuento_porcentual')
        }
      >
        ConfiguracionPromocionesDescuentoPorcentual
      </button>

      <PWABadge />
    </>
  );
}
