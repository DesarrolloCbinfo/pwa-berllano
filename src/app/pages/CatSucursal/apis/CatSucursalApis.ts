import { UsuarioEjecuta } from "../../../types/UsuarioEjecuta"

export const CatSucursalApis = {
  get: "/api/Sucursal/sucursal?sucursal=0",
  post: (usuario: UsuarioEjecuta) => `/api/Sucursal?usuarioEjecuta=${usuario}`,
  put: (usuario: UsuarioEjecuta) => `/api/Sucursal?usuarioEjecuta=${usuario}`,
  delete: (id: number, usuario: UsuarioEjecuta) => `/api/Sucursal/${id}?usuarioEjecuta=${usuario}`, 
}