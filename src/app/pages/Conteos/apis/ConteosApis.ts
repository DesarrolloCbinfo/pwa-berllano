export const ConteosApis = {
  sucursales: "/api/Conteos/sucursales",
  lista: (suc: number, usuario: string) =>
    `/api/Conteos/sp_ConteosLista?suc=${suc}&usuario=${encodeURIComponent(usuario)}`,
  productos: (id: number, claveProd?: string) =>
    `/api/Conteos/sp_ConteosListaProductos?id=${id}` +
    (claveProd ? `&clave_prod=${encodeURIComponent(claveProd)}` : ""),
  registro: "/api/Conteos/sp_ConteosRegistro",
  registroMasivo: "/api/Conteos/registroMasivo",
  elimina: "/api/Conteos/sp_ConteosElimina",
  validaUsuario: (usuario: string, pass: string) =>
    `/api/Conteos/sp_validausuario?usuario=${encodeURIComponent(usuario)}&pass=${encodeURIComponent(pass)}`,

  // Administracion de conteos (ex-formulario MP de Access)
  usuarios: "/api/Conteos/usuarios",
  marcas: "/api/Conteos/marcas",
  familias: (idMarca: number, suc: number) =>
    `/api/Conteos/familias?idMarca=${idMarca}&suc=${suc}`,
  transito: (suc: number) => `/api/Conteos/transito?suc=${suc}`,
  inicializa: "/api/Conteos/inicializa",
  sincro: "/api/Conteos/sincro",
  activos: (suc: number) => `/api/Conteos/activos?suc=${suc}`,
  cambiaUsuario: "/api/Conteos/cambiaUsuario",
  eliminaConteo: "/api/Conteos/eliminaConteo",
  cierraConteo: "/api/Conteos/cierraConteo",
};
