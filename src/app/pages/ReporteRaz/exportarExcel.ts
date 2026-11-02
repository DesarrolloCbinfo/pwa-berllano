import * as XLSX from 'xlsx';
import { filasExcelRaz } from './reporte';
import type { FilaRaz, PeriodoRaz } from './reporte';

export function exportarExcelRaz(filas: FilaRaz[], periodo: PeriodoRaz) {
  const libro = XLSX.utils.book_new();
  const registros = filasExcelRaz(filas);
  const hoja = XLSX.utils.aoa_to_sheet(registros);
  hoja['!cols'] = registros[0].map(() => ({ wch: 13.5 }));
  hoja['!rows'] = registros.map(() => ({ hpt: 15 }));
  for (let renglon = 1; renglon < registros.length; renglon += 1) {
    const celdaFecha = hoja[XLSX.utils.encode_cell({ r: renglon, c: 1 })];
    if (celdaFecha) celdaFecha.z = 'd-mmm-yy';
  }
  XLSX.utils.book_append_sheet(libro, hoja, 'c_sp_reporteRazUnion');
  XLSX.writeFile(libro, `Reporte_Raz_${periodo.anio}_${String(periodo.mes).padStart(2, '0')}.xls`, { bookType: 'biff8' });
}
