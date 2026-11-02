import * as XLSX from 'xlsx';
import { filasExcelRaz, seccionesRaz } from './reporte';
import type { FilaRaz, PeriodoRaz } from './reporte';

export function exportarExcelRaz(filas: FilaRaz[], periodo: PeriodoRaz) {
  const libro = XLSX.utils.book_new();
  seccionesRaz.forEach((seccion) => {
    const hoja = XLSX.utils.aoa_to_sheet(filasExcelRaz(filas, seccion, periodo));
    const columnas = seccion.grupos.flatMap((grupo) => grupo.columnas);
    hoja['!cols'] = [{ wch: 14 }, ...columnas.map(() => ({ wch: 16 }))];
    hoja['!merges'] = [{ s: { r: 3, c: 0 }, e: { r: 4, c: 0 } }];
    let columnaInicio = 1;
    seccion.grupos.forEach((grupo) => {
      hoja['!merges']!.push({ s: { r: 3, c: columnaInicio }, e: { r: 3, c: columnaInicio + grupo.columnas.length - 1 } });
      columnaInicio += grupo.columnas.length;
    });
    for (let renglon = 5; renglon <= filas.length + 5; renglon += 1) {
      for (let columna = 1; columna <= columnas.length; columna += 1) {
        const celda = hoja[XLSX.utils.encode_cell({ r: renglon, c: columna })];
        if (celda?.t === 'n') celda.z = '#,##0.00';
      }
    }
    XLSX.utils.book_append_sheet(libro, hoja, seccion.titulo);
  });
  XLSX.writeFile(libro, `Reporte_Raz_${periodo.anio}_${String(periodo.mes).padStart(2, '0')}.xlsx`);
}
