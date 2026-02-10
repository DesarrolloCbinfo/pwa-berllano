//Formatear la fecha para los formularios de los CRUDS
export function inputSetDateValue(date: string) {
  if (date === null || date === undefined) {
    return ""
  }

  return date.split('T')[0] ?? date 
}

//Formatear la fecha a dd/mm/yyyy para las tablas de los CRUDS
export function formatoFechaTabla(date: string | null | undefined) {
  if (date === null || date === undefined) {
    return ""
  }

  const newDate = date.split('T')[0].split('-')

  return `${newDate[2]}/${newDate[1]}/${newDate[0]}`
}