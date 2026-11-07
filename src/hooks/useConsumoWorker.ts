import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import Swal from "sweetalert2";
import type {
  IRecursoResuelto,
  ITicketLinea,
  IWorkerIdentidad,
  TipoRecursoWorker,
} from "../interfaces/workerInterfaces";
import { useWorkerStore } from "../context/useWorkerStore";

const WORKER_KEY = import.meta.env.VITE_WORKER_KEY ?? "CAMBIAR_EN_INSTALACION";
const TIMEOUT_MS_DEFAULT = 30_000;

const esErrorRed = (error: AxiosError): boolean =>
  !error.response &&
  (error.code === "ERR_NETWORK" ||
    error.code === "ECONNABORTED" ||
    error.message === "Network Error");

const headersWorker = () => ({
  "Content-Type": "application/json",
  "X-Worker-Key": WORKER_KEY,
});

const mostrarError = (error: AxiosError): void => {
  const status = error.response?.status;
  const mensajeServidor =
    (error.response?.data as { mensaje?: string } | undefined)?.mensaje ?? "";

  if (status === 503) {
    Swal.fire({
      icon: "warning",
      title: "Hardware desconectado",
      text: mensajeServidor || "Verifica que la impresora esté encendida y conectada por USB.",
    });
  } else if (status === 423) {
    Swal.fire({
      icon: "info",
      title: "Recurso ocupado",
      text: mensajeServidor || "Espera un momento, la impresora está procesando otro trabajo.",
    });
  } else if (status === 408) {
    Swal.fire({
      icon: "warning",
      title: "Tiempo de espera agotado",
      text: mensajeServidor || "Vuelve a intentar la operación.",
    });
  } else if (status === 422) {
    Swal.fire({
      icon: "error",
      title: "Error de configuración",
      text: mensajeServidor || "La impresora asignada a esta caja no fue encontrada.",
    });
  } else if (status === 401) {
    Swal.fire({
      icon: "error",
      title: "Sin autorización",
      text: "La llave del worker no coincide. Revisa la configuración (VITE_WORKER_KEY).",
    });
  } else {
    Swal.fire({
      icon: "error",
      title: "Sin conexión al Worker",
      text:
        mensajeServidor ||
        "No se pudo conectar con el Worker de la caja seleccionada. Verifica que tu dispositivo esté en la misma red Wi-Fi de la sucursal.",
    });
  }
};

// Ejecuta una peticion contra el worker intentando primero la IP LAN y, si
// falla por red, una vez mas contra el hostname mDNS (.local) que sirve de
// respaldo para tablets/iPads en el mismo Wi-Fi.
const ejecutarPeticionWorker = async (
  resuelto: IRecursoResuelto,
  config: Omit<AxiosRequestConfig, "baseURL">,
  timeoutMs = TIMEOUT_MS_DEFAULT
): Promise<AxiosResponse> => {
  const cfg = (base: string): AxiosRequestConfig => ({
    ...config,
    baseURL: base,
    timeout: timeoutMs,
    headers: { ...headersWorker(), ...(config.headers as object) },
  });

  try {
    return await axios.request(cfg(resuelto.urlPrimaria));
  } catch (e) {
    const error = e as AxiosError;
    if (esErrorRed(error) && resuelto.urlFallbackMdns) {
      return await axios.request(cfg(resuelto.urlFallbackMdns));
    }
    throw error;
  }
};

export const useConsumoWorker = () => {
  const { resolverRecurso } = useWorkerStore();

  const resolverYMostrar = (tipo: TipoRecursoWorker): IRecursoResuelto | null => {
    const resuelto = resolverRecurso(tipo);
    if (!resuelto) {
      Swal.fire({
        icon: "info",
        title: "Selecciona una caja",
        text: "No hay un equipo/worker configurado para esta operación. Elige la caja a utilizar.",
      });
    }
    return resuelto;
  };

  const imprimirTicketWorker = async (lineas: ITicketLinea[]): Promise<boolean> => {
    const resuelto = resolverYMostrar("Tickets");
    if (!resuelto) return false;

    try {
      await ejecutarPeticionWorker(resuelto, {
        method: "POST",
        url: "/api/impresion/ticket",
        data: {
          recurso: resuelto.nombreDispositivo ?? "",
          ticket_dataset: lineas,
        },
      });
      return true;
    } catch (e) {
      mostrarError(e as AxiosError);
      return false;
    }
  };

  const imprimirDocumentoWorker = async (
    urlFile: string,
    recursoOverride?: string
  ): Promise<boolean> => {
    const resuelto = resolverYMostrar("Documentos");
    if (!resuelto) return false;

    try {
      await ejecutarPeticionWorker(resuelto, {
        method: "POST",
        url: "/api/impresion/documento",
        data: {
          url_file: urlFile,
          recurso: recursoOverride ?? resuelto.nombreDispositivo ?? "",
        },
      });
      return true;
    } catch (e) {
      mostrarError(e as AxiosError);
      return false;
    }
  };

  // Health check puntual hacia un worker (para el badge "En linea" del modal).
  const verificarEstadoWorker = async (
    ipWorker: string,
    puerto: number
  ): Promise<IWorkerIdentidad | null> => {
    try {
      const { data } = await axios.get<IWorkerIdentidad>(
        `http://${ipWorker}:${puerto}/api/sistema/identidad`,
        { timeout: 2000 }
      );
      return data;
    } catch {
      try {
        // segundo intento por si la IP esta obsoleta y el hostname si responde
        const fila = useWorkerStore
          .getState()
          .recursosSucursal.find((r) => r.ipWorker === ipWorker);
        if (!fila?.hostWorker) return null;
        const { data } = await axios.get<IWorkerIdentidad>(
          `http://${fila.hostWorker}:${puerto}/api/sistema/identidad`,
          { timeout: 2000 }
        );
        return data;
      } catch {
        return null;
      }
    }
  };

  return {
    imprimirTicketWorker,
    imprimirDocumentoWorker,
    verificarEstadoWorker,
  };
};

export default useConsumoWorker;
