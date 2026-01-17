import PWABadge from "../../../PWABadge"

export default function Catalogos() {
  return (
    <>
      <div>MENU DE CATALOGOS</div>
      <h2>hola mundo</h2>

      <button onClick={() => window.location.href = "/cat_Areas"}>cat_Areas</button>
      
      <button onClick={() => window.location.href = "/cat_Proveedores"}>cat_proveedores</button>
      <button onClick={() => window.location.href = "/cat_Clientes"}>cat_Clientes</button>
      <button onClick={() => window.location.href = "/cat_Tipo_descuento"}>cat_Tipo_descuento</button>
      <button onClick={() => window.location.href = "/cat_Compradores"}>cat_Compradores</button>
      <PWABadge />
    </>
  )
}