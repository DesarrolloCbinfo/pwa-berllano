import axios from "axios";

export function obtenerMensajeError(
  error: unknown,
  mensajeDefault: string
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { mensaje?: string; mensaje2?: string; detalle?: string }
      | undefined;

    const mensaje = data?.mensaje?.trim();
    const mensaje2 = data?.mensaje2?.trim();
    if (mensaje || mensaje2) {
      return [mensaje, mensaje2].filter(Boolean).join(". ");
    }

    return data?.detalle || error.message || mensajeDefault;
  }

  if (error instanceof Error) {
    return error.message || mensajeDefault;
  }

  return mensajeDefault;
}

export function esConflicto(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 409;
}
