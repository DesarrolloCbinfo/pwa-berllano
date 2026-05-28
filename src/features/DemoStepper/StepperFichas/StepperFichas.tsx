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
import FormGroup from '@mui/material/FormGroup';
import Checkbox from '@mui/material/Checkbox';
import DialogTitle from '@mui/material/DialogTitle';
import { DialogActions, Dialog } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { TextField, Stack } from '@mui/material';
import {
  FichaStepper,
  PreguntasStepper,
} from '../../../app/pages/DemoStepper/types/DemoStepperTypes';
import { FormularioRespuesta } from './types/StepperFichasTypes';
import { useMutation } from '@tanstack/react-query';
import useConsumoApi from '../../../hooks/useConsumoApi';
import { StepperFichasApis } from './apis/StepperFichasApis';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

type Props = {
  fichaStepper: FichaStepper;
  usuario: string;
  cliente: string;
  createNewUser: () => void;
  refetchFichaStepper: () => void;
  modoFicha: 'nueva' | 'lectura';
};

export default function StepperFichas({
  fichaStepper,
  usuario,
  cliente,
  createNewUser,
  refetchFichaStepper,
  modoFicha,
}: Props) {
  const [activeStep, setActiveStep] = React.useState(0);
  const [indexStep, setIndexStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set<number>());
  const [openDialog, setOpenDialog] = React.useState(false);

  const [preguntasPendientes, setPreguntasPendientes] = useState<
    PreguntasStepper[]
  >([]);

  // Track the previous usuario to detect changes
  const [prevUsuario, setPrevUsuario] = useState<string>(usuario);

  const { token } = useAuth();

  const { consumoApi } = useConsumoApi();

  const { mutate: upsertFomularioRespuesta } = useMutation({
    mutationFn: (data: FormularioRespuesta) =>
      consumoApi.put(StepperFichasApis.upsertFormularioRespuesta(), data),
    onSuccess: () => {
      // Ensure data is refreshed after each form update
      refetchFichaStepper();
    },
  });

  const { mutate: postFormularioCliente } = useMutation({
    mutationFn: (data: {
      idCliente: string;
      idTrabajador: string;
      fecha: Date;
      idFicha: number;
      uuidFicha: string;
    }) => consumoApi.post(StepperFichasApis.postFormularioCliente(), data),
  });

  // Reset active step when usuario changes (new form or loading existing form)
  //CHECAR ESTA PARTE
  useEffect(() => {
    if (prevUsuario !== usuario) {
      setActiveStep(0);
      setPrevUsuario(usuario);
    }
  }, [usuario, prevUsuario]);

  // Update pending questions when active step or form data changes
  useEffect(() => {
    setPreguntasPendientes(
      fichaStepper.secciones[activeStep]?.preguntas.filter((pregunta) => {
        if (!pregunta.requerido) return;

        if (!pregunta.respuestaPlaceholder?.trim()) {
          return pregunta;
        }
      })
    );
  }, [setPreguntasPendientes, activeStep, fichaStepper.secciones]);

  const isStepOptional = (step: number) => {
    //agregar secciones opcionales
    return step === 999;
  };

  const isStepSkipped = (step: number) => {
    return skipped.has(step);
  };

  const handleNext = () => {
    if (preguntasPendientes.length > 0) {
      setOpenDialog(true);
      return;
    }

    let newSkipped = skipped;

    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    // First update the step
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);

    // Then refetch data to ensure we have the latest state
    // This ensures the next step has the most up-to-date data
    refetchFichaStepper();
  };

  const handleFinish = () => {
    if (preguntasPendientes.length > 0) {
      setOpenDialog(true);
      return;
    }

    setActiveStep(fichaStepper.secciones.length);

    const idTrabajador = token?.usuario || '';

    postFormularioCliente({
      idCliente: cliente,
      idTrabajador: idTrabajador,
      fecha: new Date(),
      idFicha: fichaStepper.fichaId,
      uuidFicha: usuario,
    });
  };

  const handleBack = () => {
    // First update the step
    setActiveStep((prevActiveStep) => prevActiveStep - 1);

    // Then refetch data to ensure we have the latest state
    // This ensures the previous step has the most up-to-date data
    refetchFichaStepper();
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
    // Reset the active step first
    setActiveStep(0);

    // Create a new user which will generate a new UUID
    createNewUser();

    // The refetch will happen automatically when usuario changes
    // due to the useEffect we added, but we'll call it explicitly
    // to ensure the data is refreshed immediately
    refetchFichaStepper();
  };

  const handleChangeRespuesta = (
    e:
      | SelectChangeEvent
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    pregunta: PreguntasStepper
  ) => {
    const value = e.target.value.trim();

    const respuesta: FormularioRespuesta = {
      respuesta: value,
      pregunta: pregunta?.preguntaId,
      usuario: usuario,
      sucursal: 0,
      tipo: 'respuesta',
    };

    // Update the form data on the server
    upsertFomularioRespuesta(respuesta);

    // Update the local pending questions state
    if (!value) {
      // If the field is now empty, add it to pending questions if not already there
      setPreguntasPendientes((prevPreguntasPendientes) => {
        if (
          !prevPreguntasPendientes.some(
            (p) => p.preguntaId === pregunta.preguntaId
          )
        ) {
          return [...prevPreguntasPendientes, pregunta];
        }
        return prevPreguntasPendientes;
      });
    } else {
      // If the field now has a value, remove it from pending questions
      setPreguntasPendientes((prevPreguntasPendientes) =>
        prevPreguntasPendientes.filter(
          (p) => p.preguntaId !== pregunta.preguntaId
        )
      );
    }
  };

  return (
    <>
      <Dialog open={openDialog} onClose={() => setOpenDialog((prev) => !prev)}>
        <DialogTitle>
          Sección {indexStep} Requerida. por favor completar las preguntas
          requeridas resaltadas en rojo
        </DialogTitle>
        <DialogActions>
          <Button
            variant='contained'
            onClick={() => setOpenDialog((prev) => !prev)}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
      <Box
        sx={{ width: '100%', my: 6, fontFamily: "'Courier Prime', monospace" }}
      >
        <Stepper
          activeStep={activeStep}
          sx={{ display: 'flex', flexWrap: 'wrap', rowGap: 2 }}
        >
          {fichaStepper.secciones.map((seccion, index) => {
            const stepProps: { completed?: boolean } = {};
            const labelProps: {
              optional?: React.ReactNode;
            } = {};

            if (isStepOptional(index)) {
              labelProps.optional = (
                <Typography
                  variant='caption'
                  sx={{ fontFamily: "'Courier Prime', monospace" }}
                >
                  Opcional
                </Typography>
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
                    cursor: 'pointer',
                  },
                  '& .MuiStep-horizontal': {
                    fontFamily: "'Courier Prime', monospace",
                    cursor: 'pointer',
                  },
                  '& .MuiStepIcon-text': {
                    fontFamily: "'Courier Prime', monospace",
                    cursor: 'pointer',
                  },
                }}
              >
                <StepLabel
                  {...labelProps}
                  sx={{
                    fontFamily: "'Courier Prime', monospace",
                    '& .MuiStepLabel-root': {
                      fontFamily: "'Courier Prime', monospace",
                      cursor: 'pointer',
                    },
                    '& .MuiStepLabel-label': {
                      fontFamily: "'Courier Prime', monospace",
                      cursor: 'pointer',
                    },
                  }}
                  onClick={() => {
                    if (preguntasPendientes?.length > 0 && index > activeStep) {
                      setOpenDialog(true);
                      setIndexStep(activeStep + 1);
                      return;
                    }

                    for (let i = 0; i < index; i++) {
                      if (
                        fichaStepper.secciones[i]?.preguntas
                          ?.filter((pregunta) => pregunta.requerido)
                          .filter(
                            (pregunta) => !pregunta.respuestaPlaceholder?.trim()
                          ).length > 0
                      ) {
                        setOpenDialog(true);
                        setIndexStep(i + 1);
                        return;
                      }
                    }

                    setActiveStep(index);
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
            <Typography
              sx={{ mt: 2, mb: 1, fontFamily: "'Courier Prime', monospace" }}
              variant='h5'
            >
              Ficha Finalizada. Resumen de Respuestas Registradas
            </Typography>
            <Stack spacing={2}>
              {fichaStepper.secciones.map((seccion) => (
                <>
                  {seccion.preguntas.map((pregunta) => (
                    <>
                      {pregunta.respuestaPlaceholder && (
                        <Typography
                          key={pregunta?.preguntaId}
                          sx={{ fontFamily: "'Courier Prime', monospace" }}
                        >
                          {seccion.nombre} - {pregunta.label}:{' '}
                          <b>{pregunta.respuestaPlaceholder}</b>
                        </Typography>
                      )}
                    </>
                  ))}
                </>
              ))}
            </Stack>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button
                onClick={handleReset}
                sx={{ fontFamily: "'Courier Prime', monospace" }}
              >
                Reiniciar
              </Button>
            </Box>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Typography
              sx={{ mt: 2, mb: 1, fontFamily: "'Courier Prime', monospace" }}
            >
              {fichaStepper.secciones[activeStep]?.nombre}
            </Typography>
            <Stack spacing={2}>
              {fichaStepper.secciones[activeStep]?.preguntas?.map(
                (pregunta) => (
                  <Box
                    key={pregunta?.preguntaId}
                    sx={{
                      m: 0,
                      p: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    {pregunta?.nombreImagen.length > 0 && (
                      <figure style={{ maxWidth: '500px' }}>
                        <img
                          src={`https://localhost:5001/api/Archivos/${pregunta.nombreImagen}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                        />
                      </figure>
                    )}
                    <Box
                      sx={{
                        m: 0,
                        p: 0,
                        display: 'flex',
                        flexDirection: 'row',
                        gap: 1,
                        flexWrap: 'wrap',
                        width: '100%',
                      }}
                    >
                      {pregunta?.type === 'select' ? (
                        <FormControl
                          sx={{
                            width: '100%',
                            '@media screen and (min-width: 1024px)': {
                              width: '50%',
                            },
                          }}
                        >
                          <InputLabel
                            id={pregunta?.label}
                            sx={{
                              ml: 2,
                              fontFamily: "'Courier Prime', monospace",
                            }}
                          >
                            {pregunta?.label}
                          </InputLabel>
                          <Select
                            labelId={pregunta?.label}
                            id={pregunta?.preguntaId.toString()}
                            error={preguntasPendientes?.includes(pregunta)}
                            label={pregunta?.label}
                            onChange={(e: SelectChangeEvent) =>
                              handleChangeRespuesta(e, pregunta)
                            }
                            sx={{
                              mx: 2,
                              flex: '1 1 auto',
                              fontFamily: "'Courier Prime', monospace",
                              '& .MuiInputLabel-root': {
                                fontFamily: "'Courier Prime', monospace",
                              },
                              '& .MuiInputBase-input': {
                                fontFamily: "'Courier Prime', monospace",
                              },
                            }}
                            defaultValue={pregunta?.respuestaPlaceholder || ''}
                            disabled={modoFicha === 'lectura'}
                          >
                            {pregunta?.opcionesSelect?.map((opcion, index) => (
                              <MenuItem
                                key={index}
                                value={opcion.text}
                                sx={{
                                  fontFamily: "'Courier Prime', monospace",
                                }}
                              >
                                {opcion.text}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : pregunta?.type === 'radio' ? (
                        <FormControl>
                          <FormLabel
                            id={pregunta?.preguntaId.toString()}
                            sx={{ fontFamily: "'Courier Prime', monospace" }}
                          >
                            {pregunta?.label}
                          </FormLabel>
                          <RadioGroup
                            aria-labelledby={pregunta?.label}
                            defaultValue={pregunta?.respuestaPlaceholder || ''}
                            name={pregunta?.label}
                            onChange={(e) => handleChangeRespuesta(e, pregunta)}
                          >
                            {pregunta?.opciones?.map((opcion) => (
                              <Box sx={{ display: 'flex' }}>
                                {opcion?.nombre_imagen.length > 0 && (
                                  <img
                                    src={`https://localhost:5001/api/Archivos/${opcion.nombre_imagen}`}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'contain',
                                      maxWidth: '400px',
                                    }}
                                  />
                                )}
                                <FormControlLabel
                                  key={opcion.opcion_id}
                                  value={opcion.valor}
                                  control={
                                    <Radio disabled={modoFicha === 'lectura'} />
                                  }
                                  label={opcion.valor}
                                  sx={{
                                    flex: '1 1 auto',
                                    fontFamily: "'Courier Prime', monospace",
                                    '& .MuiFormControlLabel-label': {
                                      fontFamily: "'Courier Prime', monospace",
                                    },
                                  }}
                                />
                              </Box>
                            ))}
                          </RadioGroup>
                        </FormControl>
                      ) : pregunta?.type === 'checkbox' ? (
                        <FormControl>
                          <FormLabel
                            id={pregunta?.preguntaId.toString()}
                            sx={{ fontFamily: "'Courier Prime', monospace" }}
                          >
                            {pregunta?.label}
                          </FormLabel>
                          <FormGroup>
                            {pregunta?.opciones?.map((opcion) => (
                              <Box sx={{ display: 'flex' }}>
                                {opcion?.nombre_imagen.length > 0 && (
                                  <img
                                    src={`https://localhost:5001/api/Archivos/${opcion.nombre_imagen}`}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'contain',
                                      maxWidth: '400px',
                                    }}
                                  />
                                )}
                                <FormControlLabel
                                  key={opcion.opcion_id}
                                  value={opcion.valor}
                                  control={
                                    <Checkbox
                                      disabled={modoFicha === 'lectura'}
                                      checked={pregunta.respuestaPlaceholder
                                        ?.split(',')
                                        .includes(opcion.valor)}
                                      onChange={(e) => {
                                        const currentValues =
                                          pregunta.respuestaPlaceholder
                                            ?.split(',')
                                            .filter(Boolean) || [];
                                        let newValues: string[];

                                        if (e.target.checked) {
                                          newValues = [
                                            ...currentValues,
                                            opcion.valor,
                                          ];
                                        } else {
                                          newValues = currentValues.filter(
                                            (value) => value !== opcion.valor
                                          );
                                        }

                                        const respuesta: FormularioRespuesta = {
                                          respuesta: newValues.join(','),
                                          pregunta: pregunta?.preguntaId,
                                          usuario: usuario,
                                          sucursal: 0,
                                          tipo: 'respuesta',
                                        };

                                        upsertFomularioRespuesta(respuesta);
                                      }}
                                    />
                                  }
                                  label={opcion.valor}
                                  sx={{
                                    flex: '1 1 auto',
                                    fontFamily: "'Courier Prime', monospace",
                                    '& .MuiFormControlLabel-label': {
                                      fontFamily: "'Courier Prime', monospace",
                                    },
                                  }}
                                />
                              </Box>
                            ))}
                          </FormGroup>
                        </FormControl>
                      ) : (
                        <TextField
                          id={pregunta?.preguntaId.toString()}
                          label={pregunta?.label}
                          variant='outlined'
                          type={pregunta?.type}
                          disabled={modoFicha === 'lectura'}
                          sx={{
                            mx: 2,
                            flex: '1 1 auto',
                            fontFamily: "'Courier Prime', monospace",
                            '& .MuiInputLabel-root': {
                              fontFamily: "'Courier Prime', monospace",
                            },
                            '& .MuiInputBase-input': {
                              fontFamily: "'Courier Prime', monospace",
                            },
                          }}
                          required={pregunta?.requerido}
                          defaultValue={pregunta?.respuestaPlaceholder || ''}
                          error={preguntasPendientes?.includes(pregunta)}
                          onChange={(e) => handleChangeRespuesta(e, pregunta)}
                        />
                      )}
                      {pregunta?.comentario && (
                        <TextField
                          label='Comentario'
                          variant='outlined'
                          sx={{
                            mx: 2,
                            flex: '1 1 auto',
                            fontFamily: "'Courier Prime', monospace",
                            '& .MuiInputLabel-root': {
                              fontFamily: "'Courier Prime', monospace",
                            },
                            '& .MuiInputBase-input': {
                              fontFamily: "'Courier Prime', monospace",
                            },
                          }}
                          defaultValue={pregunta?.comentarioPlaceholder}
                          disabled={modoFicha === 'lectura'}
                          onChange={(e) => {
                            const respuesta: FormularioRespuesta = {
                              comentario: e.target.value.trim(),
                              pregunta: pregunta.preguntaId,
                              usuario: usuario,
                              sucursal: 0,
                              tipo: 'comentario',
                            };

                            upsertFomularioRespuesta(respuesta);
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                )
              )}
            </Stack>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Button
                color='inherit'
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1, fontFamily: "'Courier Prime', monospace" }}
              >
                Anterior
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              {isStepOptional(activeStep) && (
                <Button
                  color='inherit'
                  onClick={handleSkip}
                  sx={{ mr: 1, fontFamily: "'Courier Prime', monospace" }}
                >
                  Omitir
                </Button>
              )}
              <Button
                onClick={handleFinish}
                sx={{ mr: 2, fontFamily: "'Courier Prime', monospace" }}
              >
                Finalizar
              </Button>
              <Button
                onClick={handleNext}
                sx={{ fontFamily: "'Courier Prime', monospace" }}
              >
                Siguiente
              </Button>
            </Box>
          </React.Fragment>
        )}
      </Box>
    </>
  );
}
