import { SweetAlertOptions } from "sweetalert2"

interface ISwalMessagesPermissions {
  delete: SweetAlertOptions
  add: SweetAlertOptions
  update: SweetAlertOptions
}

interface ISwalMessagesApis {
  add: SweetAlertOptions
  update: SweetAlertOptions
  delete: SweetAlertOptions
}

export const SwalMessagesPermissions: ISwalMessagesPermissions = {
  delete: {
    icon: "error",
    title: "Permisos no validos",
    text: "No cuentas con los permisos necesarios para eliminar"
  },
  add: {
    icon: "error",
    title: "Permisos no validos",
    text: "No cuentas con los permisos necesarios para agregar"
  },
  update: {
    icon: "error",
    title: "Permisos no validos",
    text: "No cuentas con los permisos necesarios para editar"
  }
}

/*
export const SwalMessages: ISwalMessagesApis = {
  add: {
    title: "Exitoso",
    text: `${response.data.mensaje1}`,
    icon: "success",
  },
  update: {
    title: "Exitoso",
    text: `${response.data.mensaje1}`,
    icon: "success",
  },
  delete: {
    title: "Exitoso",
    text: `${response.data.mensaje1}`,
    icon: "success",
  }
}*/