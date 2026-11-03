export type EstatusColor = "default" | "info" | "warning" | "success";

export function colorEstatus(estatus: string): EstatusColor {
  const valor = String(estatus ?? "").trim().toLowerCase();
  if (valor === "edicion") return "warning";
  if (valor === "aplicadas") return "success";
  if (valor === "finalizadas") return "default";
  return "info";
}
