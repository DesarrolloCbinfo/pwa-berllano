import { create } from "zustand"
import { persist } from "zustand/middleware"

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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
      usuarioUUID: generateUUID(),
      createNewUsuarioUUID: () => set({ usuarioUUID: generateUUID() }),
      setUsuarioUUID: (usuarioUUID: string) => set({ usuarioUUID }),
      idCliente: "",
      setIdCliente: (idCliente: string) => set({ idCliente, usuarioUUID: generateUUID()  }),
      nombreCliente: "",
      setNombreCliente: (nombreCliente: string) => set({ nombreCliente, usuarioUUID: generateUUID() }),
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
