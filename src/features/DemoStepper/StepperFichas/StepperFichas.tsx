import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { FormControl, InputLabel, MenuItem, Select, TextField, Stack } from '@mui/material';
import { FichaStepper } from '../../../app/pages/DemoStepper/types/DemoStepperTypes';
import { FormularioRespuesta } from './types/StepperFichasTypes';
import { useMutation } from '@tanstack/react-query';
import useConsumoApi from '../../../hooks/useConsumoApi';
import { StepperFichasApis } from './apis/StepperFichasApis';

type Props = {
  fichaStepper: FichaStepper
  usuario: number
}

export default function StepperFichas({ fichaStepper, usuario }: Props) {
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set<number>());

  const { consumoApi } = useConsumoApi();

  const { mutate: upsertFomularioRespuesta } = useMutation({
    mutationFn: (data: FormularioRespuesta) => consumoApi.put(StepperFichasApis.upsertFormularioRespuesta(), data)
  })

  const isStepOptional = (step: number) => {
    //agregar secciones opcionales
    return step === 999;
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
    <Box sx={{ width: '100%', my: 8 }}>
      <Stepper activeStep={activeStep} sx={{ display: 'flex', flexWrap: 'wrap', rowGap: 2 }}>
        {fichaStepper.secciones.map((seccion, index) => {
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
            <Step key={seccion.seccionId} {...stepProps}>
              <StepLabel {...labelProps}>{seccion.nombre}</StepLabel>
            </Step>
          );
        })}
      </Stepper>
      {activeStep === fichaStepper.secciones.length ? (
        <React.Fragment>
          <Typography sx={{ mt: 2, mb: 1 }}>
            Ficha Finalizada
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button onClick={handleReset}>Reiniciar</Button>
          </Box>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Typography sx={{ mt: 2, mb: 1 }}>{ fichaStepper.secciones[activeStep]?.nombre }</Typography>
          <Stack
            spacing={2}
          >
            {
              fichaStepper.secciones[activeStep]?.preguntas.map((pregunta, index) => (
                <TextField 
                  key={index}
                  id={index.toString()} 
                  label={pregunta.label} 
                  variant="outlined" sx={{ mx: 2 }} 
                  onChange={(e) => {
                    const respuesta: FormularioRespuesta = {
                      respuesta: e.target.value.trim(),
                      pregunta: pregunta.preguntaId,
                      usuario: usuario,
                      comentario: "",
                      fecha: new Date(),
                      sucursal: 0
                    }

                    upsertFomularioRespuesta(respuesta)

                    console.log("Respuesta")
                    console.log(respuesta)
                    console.log("Valor")
                    console.log(e.target.value)
                    console.log("Pregunta")
                    console.log(pregunta)
                    console.log("usuario")
                    console.log(usuario)
                  }}
                />
              ))
            }
            {
              fichaStepper.secciones[activeStep]?.preguntasSelect.map((preguntaSelect, index) => (
                <FormControl fullWidth key={index}>
                  <InputLabel id={preguntaSelect.label}>{preguntaSelect.label}</InputLabel>
                  <Select
                    labelId={preguntaSelect.label}
                    id={preguntaSelect.preguntaSelectId.toString()}
                    label={preguntaSelect.label}
                  >
                    {preguntaSelect.opciones.map((opcion, index) => (
                      <MenuItem key={index} value={opcion.value}>{opcion.text}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))
            }
          </Stack>
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
              {activeStep === fichaStepper.secciones.length - 1 ? 'Finalizar' : 'Siguiente'}
            </Button>
          </Box>
        </React.Fragment>
      )}
    </Box>
  );
}