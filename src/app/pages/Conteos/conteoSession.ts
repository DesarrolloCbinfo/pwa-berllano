export interface SucursalConteoSel {
  id: number;
  nombre: string;
}

const KEY = "conteoSucursal";

export const getSucursalConteo = (): SucursalConteoSel | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SucursalConteoSel) : null;
  } catch {
    return null;
  }
};

export const setSucursalConteo = (sucursal: SucursalConteoSel) => {
  sessionStorage.setItem(KEY, JSON.stringify(sucursal));
};
