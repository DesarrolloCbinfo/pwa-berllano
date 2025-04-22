import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { TextField } from '@mui/material';

type Pregunta = {
  nombre: string
}

type Secciones = {
  id: number,
  nombre: string,
  preguntas: Pregunta[]
}

function createPregunta(nombre: string): Pregunta {
  return {
    nombre
  }
}

function createSecciones(id: number, nombre: string, preguntas: Pregunta[]): Secciones {
  return {
    id,
    nombre,
    preguntas
  }
}

const secciones: Secciones[] = [
  createSecciones(1, "Sección 1", [
    createPregunta("Pregunta 1"),
    createPregunta("Pregunta 2"),
    createPregunta("Pregunta 3"),
    createPregunta("Pregunta 4"),
    createPregunta("Pregunta 5"),
  ]),
  createSecciones(2, "Sección 2", [
    createPregunta("Pregunta 1"),
  ]),
  createSecciones(3, "Sección 3", [
    createPregunta("Pregunta 1"),
    createPregunta("Pregunta 2"),
    createPregunta("Pregunta 3"),
  ]),
  createSecciones(4, "Sección 4", [
    createPregunta("Pregunta 1"),
    createPregunta("Pregunta 2"),
  ]),
]

export default function StepperFichas() {
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set<number>());

  const isStepOptional = (step: number) => {
    //agregar secciones opcionales
    return step === 1;
  };

  const isStepSkipped = (step: number) => {
    return skipped.has(step);
  };

  const handleNext = () => {
    let newSkipped = skipped;

    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      // You probably want to guard against something like this,
      // it should never occur unless someone's actively trying to break something.
      throw new Error("You can't skip a step that isn't optional.");
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep}>
        {secciones.map((seccion, index) => {
          const stepProps: { completed?: boolean } = {};
          const labelProps: {
            optional?: React.ReactNode;
          } = {};
          if (isStepOptional(index)) {
            labelProps.optional = (
              <Typography variant="caption">Opcional</Typography>
            );
          }
          if (isStepSkipped(index)) {
            stepProps.completed = false;
          }
          return (
            <Step key={seccion.id} {...stepProps}>
              <StepLabel {...labelProps}>{seccion.nombre}</StepLabel>
            </Step>
          );
        })}
      </Stepper>
      {activeStep === secciones.length ? (
        <React.Fragment>
          <Typography sx={{ mt: 2, mb: 1 }}>
            Ficha Finalizada
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button onClick={handleReset}>Reset</Button>
          </Box>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Typography sx={{ mt: 2, mb: 1 }}>{ secciones[activeStep]?.nombre }</Typography>
          {
            secciones[activeStep]?.preguntas.map((pregunta, index) => (
              <TextField id={index.toString()} label={pregunta.nombre} variant="outlined" sx={{ mx: 2 }} />
            ))
          }
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Anterior
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            {isStepOptional(activeStep) && (
              <Button color="inherit" onClick={handleSkip} sx={{ mr: 1 }}>
                Omitir
              </Button>
            )}
            <Button onClick={handleNext}>
              {activeStep === secciones.length - 1 ? 'Finalizar' : 'Siguiente'}
            </Button>
          </Box>
        </React.Fragment>
      )}
    </Box>
  );
}