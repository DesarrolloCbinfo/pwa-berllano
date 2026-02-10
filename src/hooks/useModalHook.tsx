import React, { useState } from "react";

function useModalHook() {
  const [modalActualizar, setModalActualizar] = useState(false);
  const [modalInsertar, setModalInsertar] = useState(false);
  const cerrarModalActualizar = () => {
    setModalActualizar(false);
  };

  const mostrarModalInsertar = () => {
    setModalInsertar(true);
  };

  const cerrarModalInsertar = () => {
    setModalInsertar(false);
  };

  ////AREAS
  const [modalActualizarArea, setModalActualizarArea] = useState(false);
  const [modalInsertarArea, setModalInsertarArea] = useState(false);
  const cerrarModalActualizarArea = () => {
    setModalActualizarArea(false);
  };

  const mostrarModalInsertarArea = () => {
    setModalInsertarArea(true);
  };

  const cerrarModalInsertarArea = () => {
    setModalInsertarArea(false);
  };

  ////DEPTOS
  const [modalActualizarDepto, setModalActualizarDepto] = useState(false);
  const [modalInsertarDepto, setModalInsertarDepto] = useState(false);
  const cerrarModalActualizarDepto = () => {
    setModalActualizarDepto(false);
  };

  const mostrarModalInsertarDepto = () => {
    setModalInsertarDepto(true);
  };

  const cerrarModalInsertarDepto = () => {
    setModalInsertarDepto(false);
  };

  ////DEPTOS
  const [modalActualizarClase, setModalActualizarClase] = useState(false);
  const [modalInsertarClase, setModalInsertarClase] = useState(false);
  const cerrarModalActualizarClase = () => {
    setModalActualizarClase(false);
  };

  const mostrarModalInsertarClase = () => {
    setModalInsertarClase(true);
  };

  const cerrarModalInsertarClase = () => {
    setModalInsertarClase(false);
  };

  return {
    modalActualizar,
    modalInsertar,
    setModalActualizar,
    setModalInsertar,
    cerrarModalActualizar,
    mostrarModalInsertar,
    cerrarModalInsertar,
    //AREAS
    modalActualizarArea,
    modalInsertarArea,
    setModalActualizarArea,
    setModalInsertarArea,
    cerrarModalActualizarArea,
    mostrarModalInsertarArea,
    cerrarModalInsertarArea,
    //DEPTOS
    modalActualizarDepto,
    modalInsertarDepto,
    setModalActualizarDepto,
    setModalInsertarDepto,
    cerrarModalActualizarDepto,
    mostrarModalInsertarDepto,
    cerrarModalInsertarDepto,
    // CLASE
    modalActualizarClase,
    modalInsertarClase,
    setModalActualizarClase,
    setModalInsertarClase,
    cerrarModalActualizarClase,
    mostrarModalInsertarClase,
    cerrarModalInsertarClase,
  };
}

export default useModalHook;
