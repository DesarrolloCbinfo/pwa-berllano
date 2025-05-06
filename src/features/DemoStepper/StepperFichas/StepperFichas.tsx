import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { TextField, Stack } from '@mui/material';
import { FichaStepper, PreguntasStepper } from '../../../app/pages/DemoStepper/types/DemoStepperTypes';
import { FormularioRespuesta } from './types/StepperFichasTypes';
import { useMutation } from '@tanstack/react-query';
import useConsumoApi from '../../../hooks/useConsumoApi';
import { StepperFichasApis } from './apis/StepperFichasApis';
import { useState, useEffect } from 'react';

type Props = {
  fichaStepper: FichaStepper
  usuario: string
  createNewUser: () => void
  refetchFichaStepper: () => void
}

export default function StepperFichas({ fichaStepper, usuario, createNewUser, refetchFichaStepper }: Props) {
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set<number>());

  const [preguntasPendientes, setPreguntasPendientes] = useState<PreguntasStepper[]>([])

  const { consumoApi } = useConsumoApi();

  const { mutate: upsertFomularioRespuesta } = useMutation({
    mutationFn: (data: FormularioRespuesta) => consumoApi.put(StepperFichasApis.upsertFormularioRespuesta(), data),
    onSuccess: () => refetchFichaStepper()
  })

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
    createNewUser()
    refetchFichaStepper()
    setActiveStep(0)
  };

  const handleChangeRespuesta = (e: SelectChangeEvent | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, pregunta: PreguntasStepper) => {
    const respuesta: FormularioRespuesta = {
      respuesta: e.target.value.trim(),
      pregunta: pregunta?.preguntaId,
      usuario: usuario,
      sucursal: 0
    }

    upsertFomularioRespuesta(respuesta)

    if (!e.target.value.trim()) {
      setPreguntasPendientes((prevPreguntasPendientes) => [...prevPreguntasPendientes, pregunta])
      return
    }

    setPreguntasPendientes((prevPreguntasPendientes) => prevPreguntasPendientes.filter((preguntaPendiente) => preguntaPendiente.preguntaId !== pregunta.preguntaId))
  }

  return (
    <Box sx={{ width: '100%', my: 8, fontFamily: "'Courier Prime', monospace" }}>
      <Stepper activeStep={activeStep} sx={{ display: 'flex', flexWrap: 'wrap', rowGap: 2 }}>
        {fichaStepper.secciones.map((seccion, index) => {
          const stepProps: { completed?: boolean } = {};
          const labelProps: {
            optional?: React.ReactNode;
          } = {};

          if (isStepOptional(index)) {
            labelProps.optional = (
              <Typography variant="caption" sx={{ fontFamily: "'Courier Prime', monospace" }}>Opcional</Typography>
            );
          }

          if (isStepSkipped(index)) {
            stepProps.completed = false;
          }

          return (
            <Step 
              key={seccion.seccionId} 
              {...stepProps} 
              sx={{ 
                fontFamily: "'Courier Prime', monospace",
                '& .MuiStep-root': {
                  fontFamily: "'Courier Prime', monospace",
                  cursor: 'pointer'
                },
                '& .MuiStep-horizontal': {
                  fontFamily: "'Courier Prime', monospace",
                  cursor: 'pointer'
                },
                '& .MuiStepIcon-text': {
                  fontFamily: "'Courier Prime', monospace",
                  cursor: 'pointer'
                },
              }}
            >
              <StepLabel 
                {...labelProps} 
                sx={{ 
                  fontFamily: "'Courier Prime', monospace",
                  '& .MuiStepLabel-root': {
                    fontFamily: "'Courier Prime', monospace",
                    cursor: 'pointer'
                  },
                  '& .MuiStepLabel-label': {
                    fontFamily: "'Courier Prime', monospace",
                    cursor: 'pointer'
                  },
                }}
                onClick={() => {
                  if (preguntasPendientes.length > 0) return
                  setActiveStep(index)
                }}
              >
                {seccion.nombre}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
      {activeStep === fichaStepper.secciones.length ? (
        <React.Fragment>
          <Typography sx={{ mt: 2, mb: 1, fontFamily: "'Courier Prime', monospace" }}>
            Ficha Finalizada
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button onClick={handleReset} sx={{ fontFamily: "'Courier Prime', monospace" }}>Reiniciar</Button>
          </Box>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Typography sx={{ mt: 2, mb: 1, fontFamily: "'Courier Prime', monospace" }}>{ fichaStepper.secciones[activeStep]?.nombre }</Typography>
          <Stack
            spacing={2}
          >
            {
              fichaStepper.secciones[activeStep]?.preguntas?.map((pregunta) => (
                <Box key={pregunta?.preguntaId} sx={{ m: 0, p: 0, display: 'flex', flexDirection: 'row', alignItems: 'baseline' }}>
                  {
                    pregunta?.type === 'select' ? 
                    (
                      <FormControl fullWidth>
                        <InputLabel id={pregunta?.label} sx={{ ml: 2, fontFamily: "'Courier Prime', monospace" }}>{pregunta?.label}</InputLabel>
                        <Select
                          labelId={pregunta?.label}
                          id={pregunta?.preguntaId.toString()}
                          error={preguntasPendientes?.includes(pregunta)}
                          label={pregunta?.label}
                          onChange={(e: SelectChangeEvent) => handleChangeRespuesta(e, pregunta)}
                          sx={{ 
                            mx: 2,
                            flex: '1 1 auto',
                            fontFamily: "'Courier Prime', monospace",
                            '& .MuiInputLabel-root': {
                              fontFamily: "'Courier Prime', monospace"
                            },
                            '& .MuiInputBase-input': {
                              fontFamily: "'Courier Prime', monospace"
                            }
                          }}
                          defaultValue={pregunta?.respuestaPlaceholder || ''}
                        >
                          {
                            pregunta?.opcionesSelect?.map((opcion, index) => (
                              <MenuItem key={index} value={opcion.text} sx={{ fontFamily: "'Courier Prime', monospace" }}>
                                {opcion.text}
                              </MenuItem>
                            ))
                          }
                        </Select>
                      </FormControl>
                    )
                    : pregunta?.type === 'radio' ?
                    (
                      <FormControl>
                        <FormLabel id={pregunta?.preguntaId.toString()} sx={{ fontFamily: "'Courier Prime', monospace" }}>{pregunta?.label}</FormLabel>
                        <RadioGroup
                          aria-labelledby={pregunta?.label}
                          defaultValue={pregunta?.respuestaPlaceholder || ''}
                          name={pregunta?.label}
                          onChange={(e) => handleChangeRespuesta(e, pregunta)}
                        >
                          {
                            pregunta?.opciones?.map((opcion) => (
                              <FormControlLabel
                                key={opcion.opcion_id}
                                value={opcion.valor}
                                control={<Radio />}
                                label={opcion.valor} 
                                sx={{ 
                                  flex: '1 1 auto',
                                  fontFamily: "'Courier Prime', monospace",
                                  "& .MuiFormControlLabel-label": {
                                    fontFamily: "'Courier Prime', monospace"
                                  }
                                }}
                              />
                            ))
                          }
                        </RadioGroup>
                      </FormControl>
                    )
                    :
                    (
                      <TextField 
                        id={pregunta?.preguntaId.toString()}
                        label={pregunta?.label} 
                        variant="outlined" 
                        type={pregunta?.type}
                        sx={{ 
                          mx: 2, 
                          flex: '1 1 auto', 
                          fontFamily: "'Courier Prime', monospace",
                          '& .MuiInputLabel-root': {
                            fontFamily: "'Courier Prime', monospace"
                          },
                          '& .MuiInputBase-input': {
                            fontFamily: "'Courier Prime', monospace"
                          }
                        }} 
                        required={pregunta?.requerido}
                        defaultValue={pregunta?.respuestaPlaceholder || ''}
                        error={preguntasPendientes?.includes(pregunta)}
                        onChange={(e) => handleChangeRespuesta(e, pregunta)}
                      />
                    )
                  }
                  {
                    pregunta?.comentario && (
                      <TextField
                        label="Comentario"
                        variant="outlined"
                        sx={{ 
                          mx: 2, 
                          flex: '1 1 auto', 
                          fontFamily: "'Courier Prime', monospace",
                          '& .MuiInputLabel-root': {
                            fontFamily: "'Courier Prime', monospace"
                          },
                          '& .MuiInputBase-input': {
                            fontFamily: "'Courier Prime', monospace"
                          }
                        }} 
                        defaultValue={pregunta?.comentarioPlaceholder}
                        onChange={(e) => {
                          const respuesta: FormularioRespuesta = {
                            comentario: e.target.value.trim(),
                            pregunta: pregunta.preguntaId,
                            usuario: usuario,
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
          </Stack>
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1, fontFamily: "'Courier Prime', monospace" }}
            >
              Anterior
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            {isStepOptional(activeStep) && (
              <Button color="inherit" onClick={handleSkip} sx={{ mr: 1, fontFamily: "'Courier Prime', monospace" }}>
                Omitir
              </Button>
            )}
            <Button onClick={handleNext} sx={{ fontFamily: "'Courier Prime', monospace" }}>
              {activeStep === fichaStepper.secciones.length - 1 ? 'Finalizar' : 'Siguiente'}
            </Button>
          </Box>
        </React.Fragment>
      )}
    </Box>
  );
}