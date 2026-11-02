export const ConteosApis = {
  sucursales: "/api/Conteos/sucursales",
  lista: (suc: number, usuario: string) =>
    `/api/Conteos/sp_ConteosLista?suc=${suc}&usuario=${encodeURIComponent(usuario)}`,
  productos: (id: number, claveProd?: string) =>
    `/api/Conteos/sp_ConteosListaProductos?id=${id}` +
    (claveProd ? `&clave_prod=${encodeURIComponent(claveProd)}` : ""),
  registro: "/api/Conteos/sp_ConteosRegistro",
  elimina: "/api/Conteos/sp_ConteosElimina",
  validaUsuario: (usuario: string, pass: string) =>
    `/api/Conteos/sp_validausuario?usuario=${encodeURIComponent(usuario)}&pass=${encodeURIComponent(pass)}`,
};
