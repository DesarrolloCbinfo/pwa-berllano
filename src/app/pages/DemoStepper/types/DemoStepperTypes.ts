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

export type PreguntasStepper = {
  preguntaId: number
  label: string
  orden: number
  requerido: boolean
  name: string
  type: string
}