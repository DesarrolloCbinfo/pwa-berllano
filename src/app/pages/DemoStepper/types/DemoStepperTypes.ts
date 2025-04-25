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
  preguntasSelect: PreguntasSelectStepper[]
}

export type PreguntasStepper = {
  preguntaId: number
  label: string
  orden: number
  requerido: boolean
  name: string
  type: string
}

export type PreguntasSelectStepper = {
  preguntaSelectId: number
  es_multiple: boolean
  label: string
  name: string
  orden: number
  requerido: boolean
  opciones: OptionStepper[]
}

export type OptionStepper = {
  opcion_id: number
  imagen: string
  text: string
  value: string
}