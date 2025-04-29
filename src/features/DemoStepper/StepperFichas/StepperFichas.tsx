import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { FormControl, InputLabel, MenuItem, Select, TextField, Stack } from '@mui/material';
import { FichaStepper, PreguntasStepper } from '../../../app/pages/DemoStepper/types/DemoStepperTypes';
import { FormularioRespuesta } from './types/StepperFichasTypes';
import { useMutation } from '@tanstack/react-query';
import useConsumoApi from '../../../hooks/useConsumoApi';
import { StepperFichasApis } from './apis/StepperFichasApis';
import { useState, useEffect } from 'react';

type Props = {
  fichaStepper: FichaStepper
  usuario: number
  refetchFichaStepper: () => void
}

export default function StepperFichas({ fichaStepper, usuario, refetchFichaStepper }: Props) {
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set<number>());

  const [preguntasPendientes, setPreguntasPendientes] = useState<PreguntasStepper[]>([])

  const { consumoApi } = useConsumoApi();

  const { mutate: upsertFomularioRespuesta } = useMutation({
    mutationFn: (data: FormularioRespuesta) => consumoApi.put(StepperFichasApis.upsertFormularioRespuesta(), data)
  })

  console.log(preguntasPendientes)

  useEffect(() => {
    setPreguntasPendientes(fichaStepper.secciones[activeStep]?.preguntas.filter((pregunta) => {
      if (!pregunta.requerido) return

      if (!pregunta.respuestaPlaceholder?.trim()) {
        return pregunta
      }
    }))

  }, [setPreguntasPendientes, activeStep, fichaStepper.secciones])

  const isStepOptional = (step: number) => {
    //agregar secciones opcionales
    return step === 999;
  };

  const isStepSkipped = (step: number) => {
    return skipped.has(step);
  };

  const handleNext = () => {

    if (preguntasPendientes.length > 0) {
      return
    }

    let newSkipped = skipped;

    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
    refetchFichaStepper()
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    refetchFichaStepper()
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
              fichaStepper.secciones[activeStep]?.preguntas?.map((pregunta) => (
                <Box key={pregunta.preguntaId} sx={{ m: 0, p: 0, display: 'flex', flexDirection: 'row', alignItems: 'baseline' }}>
                  <TextField 
                    id={pregunta.preguntaId.toString()} 
                    label={pregunta.label} 
                    variant="outlined" 
                    sx={{ mx: 2, flex: '1 1 auto' }} 
                    required={pregunta?.requerido}
                    defaultValue={pregunta?.respuestaPlaceholder}
                    error={preguntasPendientes?.includes(pregunta)}
                    onChange={(e) => {
                      const respuesta: FormularioRespuesta = {
                        respuesta: e.target.value.trim(),
                        pregunta: pregunta.preguntaId,
                        usuario: usuario,
                        comentario: pregunta.comentarioPlaceholder,
                        sucursal: 0
                      }

                      upsertFomularioRespuesta(respuesta)

                      if (!e.target.value.trim()) {
                        setPreguntasPendientes((prevPreguntasPendientes) => [...prevPreguntasPendientes, pregunta])
                        return
                      }

                      setPreguntasPendientes((prevPreguntasPendientes) => prevPreguntasPendientes.filter((preguntaPendiente) => preguntaPendiente.preguntaId !== pregunta.preguntaId))
                    }}
                  />
                  {
                    pregunta.comentario && (
                      <TextField
                        label="Comentario"
                        variant="outlined"
                        sx={{ mx: 2, flex: '1 1 auto' }} 
                        defaultValue={pregunta.comentarioPlaceholder}
                        onChange={(e) => {
                          const respuesta: FormularioRespuesta = {
                            respuesta: pregunta.respuestaPlaceholder,
                            pregunta: pregunta.preguntaId,
                            usuario: usuario,
                            comentario: e.target.value.trim(),
                            sucursal: 0
                          }

                          upsertFomularioRespuesta(respuesta)
                        }}
                      />
                    )
                  }
                </Box>
              ))
            }
            {
              fichaStepper.secciones[activeStep]?.preguntasSelect.map((preguntaSelect, index) => (
                <FormControl fullWidth key={index}>
                  <InputLabel id={preguntaSelect.label}>
                    {preguntaSelect.label}
                  </InputLabel>
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