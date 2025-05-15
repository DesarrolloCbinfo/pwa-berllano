export const BuscadorFichasApis = {
  getFormularioCliente: (usuario: string, usuarioUUID: string, f1: string, f2: string) => `/api/FormularioCliente/usuarios?usuario=${usuario}&usuarioUUID=${usuarioUUID}&f1=${f1}&f2=${f2}`,
}