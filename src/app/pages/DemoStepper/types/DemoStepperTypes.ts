export type Ficha = {
  id: number
  cia: number
  nombre: string
  descripcion: string
  sucursalId: number
}

export type FichaStepper = {
  fichaId: number
  cia: number
  nombre: string
  descripcion: string
  secciones: SeccionStepper[]
}

export const initialDataFichaStepper: FichaStepper = {
  fichaId: 0,
  cia: 0,
  nombre: '',
  descripcion: '',
  secciones: []
}

export type SeccionStepper = {
  seccionId: number
  nombre: string
  orden: number
  requerido: boolean
  descripcion: string
  preguntas: PreguntasStepper[]
}

export type BasePreguntasStepper = {
  id: number
  label: string
  orden: number
  comentario: boolean
  requerido: boolean
  respuestaPlaceholder?: string
  comentarioPlaceholder?: string
}

export type PreguntasStepper = {
  id: number
  label: string
  orden: number
  comentario: boolean
  requerido: boolean
  name: string
  type: string
  respuestaPlaceholder?: string
  comentarioPlaceholder?: string
  es_multiple: boolean
  opciones: OptionStepper[]
}

export type PreguntasSelectStepper = {
  id: number
  es_multiple: boolean
  label: string
  name: string
  orden: number
  comentario: boolean
  requerido: boolean
  respuestaPlaceholder?: string
  comentarioPlaceholder?: string
  opciones: OptionStepper[]
}

export type OptionStepper = {
  opcion_id: number
  imagen: string
  text: string
  value: string
}