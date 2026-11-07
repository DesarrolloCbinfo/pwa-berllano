import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import type {
  IRecursoResuelto,
  IRecursoWorker,
  IWorkerIdentidad,
  TipoRecursoWorker,
} from "../interfaces/workerInterfaces";

export const API_CENTRAL_BASE_URL = "http://217.216.95.62:8079/";

const apiCentral = axios.create({
  baseURL: API_CENTRAL_BASE_URL,
  timeout: 15000,
});

// La respuesta del SP viene con nombres de columna en PascalCase;
// el front los normaliza a camelCase.
const mapearRecurso = (row: Record<string, unknown>): IRecursoWorker => ({
  idRecurso: Number(row.IdRecurso) || 0,
  idEmpresa: Number(row.IdEmpresa) || 0,
  idSucursal: Number(row.IdSucursal) || 0,
  equipo: String(row.Equipo ?? ""),
  recurso: String(row.Recurso ?? "") as TipoRecursoWorker,
  ipWorker: String(row.IpWorker ?? ""),
  hostWorker: (row.HostWorker as string) ?? null,
  puerto: Number(row.Puerto) || 5000,
  nombreDispositivoLocal: (row.NombreDispositivoLocal as string) ?? null,
  activo: Boolean(row.Activo),
  fechaRegistro: (row.FechaRegistro as string) ?? null,
});

// Intenta detectar si ESTA maquina corre un worker (PC de caja) consultando
// su propio localhost. Si responde, devuelve la identidad para cruzarla con
// la tabla de recursos y asignar el equipo automaticamente.
const detectarWorkerLocal = async (): Promise<IWorkerIdentidad | null> => {
  try {
    const { data } = await axios.get<IWorkerIdentidad>(
      "http://localhost:5000/api/sistema/identidad",
      { timeout: 1200 }
    );
    return data;
  } catch {
    return null;
  }
};

interface WorkerStore {
  idEmpresaActiva: number | null;
  idSucursalActiva: number | null;
  equipoActivo: string | null;
  equiposPorContexto: Record<string, string>;
  recursosSucursal: IRecursoWorker[];
  esDispositivoMovil: boolean;
  modalSeleccionAbierto: boolean;
  sincronizando: boolean;

  sincronizarContexto: (idEmpresa: number, idSucursal: number) => Promise<void>;
  seleccionarEquipoManual: (equipo: string) => void;
  resolverRecurso: (tipo: TipoRecursoWorker) => IRecursoResuelto | null;
  abrirModal: () => void;
  cerrarModal: () => void;
}

export const useWorkerStore = create<WorkerStore>()(
  persist(
    (set, get) => ({
      idEmpresaActiva: null,
      idSucursalActiva: null,
      equipoActivo: null,
      equiposPorContexto: {},
      recursosSucursal: [],
      esDispositivoMovil: false,
      modalSeleccionAbierto: false,
      sincronizando: false,

      sincronizarContexto: async (idEmpresa, idSucursal) => {
        set({
          idEmpresaActiva: idEmpresa,
          idSucursalActiva: idSucursal,
          sincronizando: true,
        });

        const claveContexto = `${idEmpresa}_${idSucursal}`;

        try {
          const { data } = await apiCentral.get<Record<string, unknown>[]>(
            "/api/RecursosWorker/sp_cat_RecursosWorker_Obtener",
            { params: { idEmpresa, idSucursal } }
          );

          const recursos = Array.isArray(data) ? data.map(mapearRecurso) : [];
          const equipos = [...new Set(recursos.map((r) => r.equipo))];

          set({ recursosSucursal: recursos });

          // 1) equipo guardado para este contexto y que siga existiendo
          const guardado = get().equiposPorContexto[claveContexto];
          if (guardado && equipos.includes(guardado)) {
            set({ equipoActivo: guardado, esDispositivoMovil: false, modalSeleccionAbierto: false });
            return;
          }

          // 2) una sola caja en la sucursal -> se elige sola
          if (equipos.length === 1) {
            set({
              equipoActivo: equipos[0],
              esDispositivoMovil: false,
              modalSeleccionAbierto: false,
              equiposPorContexto: { ...get().equiposPorContexto, [claveContexto]: equipos[0] },
            });
            return;
          }

          // 3) auto-deteccion por worker local (PC de caja)
          const identidad = await detectarWorkerLocal();
          if (identidad) {
            const recursoLocal = recursos.find(
              (r) => identidad.ipsLan.includes(r.ipWorker)
            );
            if (recursoLocal) {
              set({
                equipoActivo: recursoLocal.equipo,
                esDispositivoMovil: false,
                modalSeleccionAbierto: false,
                equiposPorContexto: {
                  ...get().equiposPorContexto,
                  [claveContexto]: recursoLocal.equipo,
                },
              });
              return;
            }
          }

          // 4) tablet/movil o PC no registrada -> elegir manualmente
          set({ esDispositivoMovil: true, modalSeleccionAbierto: equipos.length > 0 });
        } finally {
          set({ sincronizando: false });
        }
      },

      seleccionarEquipoManual: (equipo) => {
        const { idEmpresaActiva, idSucursalActiva, equiposPorContexto } = get();
        const claveContexto = `${idEmpresaActiva}_${idSucursalActiva}`;
        set({
          equipoActivo: equipo,
          modalSeleccionAbierto: false,
          equiposPorContexto: { ...equiposPorContexto, [claveContexto]: equipo },
        });
      },

      resolverRecurso: (tipo) => {
        const { recursosSucursal, equipoActivo } = get();

        if (!equipoActivo) {
          set({ modalSeleccionAbierto: true });
          return null;
        }

        const fila = recursosSucursal.find(
          (r) => r.equipo === equipoActivo && r.recurso === tipo
        );

        if (!fila) {
          set({ modalSeleccionAbierto: true });
          return null;
        }

        return {
          urlPrimaria: `http://${fila.ipWorker}:${fila.puerto}`,
          urlFallbackMdns: fila.hostWorker ? `http://${fila.hostWorker}:${fila.puerto}` : null,
          nombreDispositivo: fila.nombreDispositivoLocal,
          equipo: fila.equipo,
        };
      },

      abrirModal: () => set({ modalSeleccionAbierto: true }),
      cerrarModal: () => set({ modalSeleccionAbierto: false }),
    }),
    {
      name: "WorkerStore",
      partialize: (state) => ({
        equipoActivo: state.equipoActivo,
        equiposPorContexto: state.equiposPorContexto,
      }),
    }
  )
);
