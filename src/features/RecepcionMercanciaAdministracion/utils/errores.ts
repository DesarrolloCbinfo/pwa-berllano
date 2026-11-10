import axios from "axios";

export function obtenerMensajeError(
  error: unknown,
  mensajeDefault: string
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { mensaje?: string; detalle?: string }
      | undefined;

    return data?.mensaje || data?.detalle || error.message || mensajeDefault;
  }

  if (error instanceof Error) {
    return error.message || mensajeDefault;
  }

  return mensajeDefault;
}
