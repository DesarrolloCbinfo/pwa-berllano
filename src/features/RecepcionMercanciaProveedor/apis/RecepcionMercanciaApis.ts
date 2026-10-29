export const RecepcionMercanciaApis = {
  pedidosARecepcionar: (
    proveedor: string | undefined,
    pageNumber: number,
    pageSize: number
  ) => {
    const pagina = Math.max(1, Math.trunc(pageNumber) || 1);
    const tamanoPagina = Math.min(100, Math.max(1, Math.trunc(pageSize) || 10));
    const params = new URLSearchParams({
      proveedor: proveedor?.trim() ?? "",
      pageNumber: String(pagina),
      pageSize: String(tamanoPagina),
    });
    return `/api/RecepcionMercancia/pedidos-a-recepcionar?${params.toString()}`;
  },
  pedidoDetalle: (folio: number) => `/api/RecepcionMercancia/pedido/${folio}`,
  intermediaBase: "/api/RecepcionMercancia/intermedia",
  intermedia: (folio: number) => `/api/RecepcionMercancia/intermedia/${folio}`,
  intermediaPorId: (id: number) => `/api/RecepcionMercancia/intermedia/${id}`,
  finalizar: "/api/RecepcionMercancia/finalizar",
};
