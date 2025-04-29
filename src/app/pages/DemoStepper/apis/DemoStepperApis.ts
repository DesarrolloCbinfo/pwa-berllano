export const DemoStepperApis = {
  getFicha: (cia: number) => `/api/FormularioFicha?cia=${cia}`,
  getSeccion: (fichaId: number) => `/api/FormularioSeccion?fichaId=${fichaId}`,
  getPregunta: (seccionId: number) => `/api/FormularioPreguntaInput?seccionId=${seccionId}`,
  getOpcion: (preguntaSelectId: number) => `/api/FormularioOpcion?preguntaSelectId=${preguntaSelectId}`,
  getFichaStepper: (fichaId: number, usuario: string) => `/api/FormularioStepperFrontend?fichaId=${fichaId}&usuario=${usuario}`,
};
