export type FormularioRespuesta = {
  id?: number
  respuesta?: string
  comentario?: string
  fecha?: Date
  sucursal?: number
  pregunta?: number
  pregunta_select?: number
  usuario?: string
  tipo: "respuesta" | "comentario"
}