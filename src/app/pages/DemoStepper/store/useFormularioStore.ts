import { create } from "zustand"
import { persist } from "zustand/middleware"

type Store = {
  usuarioUUID: string
  createNewUsuarioUUID: () => void
  setUsuarioUUID: (usuarioUUID: string) => void
  idCliente: string
  setIdCliente: (idCliente: string) => void
  nombreCliente: string
  setNombreCliente: (nombreCliente: string) => void
  idFicha: string
  setIdFicha: (idFicha: string) => void
}

export const useFormularioStore = create<Store>()(
  persist(
    (set) => ({
      usuarioUUID: crypto.randomUUID(),
      createNewUsuarioUUID: () => set({ usuarioUUID: crypto.randomUUID() }),
      setUsuarioUUID: (usuarioUUID: string) => set({ usuarioUUID }),
      idCliente: "",
      setIdCliente: (idCliente: string) => set({ idCliente }),
      nombreCliente: "",
      setNombreCliente: (nombreCliente: string) => set({ nombreCliente }),
      idFicha: "",
      setIdFicha: (idFicha: string) => set({ idFicha })
    }),
    {
      name: "FormularioStore",
      partialize: (state) => ({
        usuarioUUID: state.usuarioUUID as `${string}-${string}-${string}-${string}-${string}`,
        idCliente: state.idCliente,
        nombreCliente: state.nombreCliente,
        idFicha: state.idFicha
      })
    }
  )
)