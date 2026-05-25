"use client";

import * as XLSX from "xlsx";

type Props = {
  filas: any[];
};

export default function ExportarFamiliasMiembrosExcelButton({ filas }: Props) {
  function exportarExcel() {
    const datos = filas.map((fila) => ({
      Familia: fila.Familia,
      NUMCENS: fila.NUMCENS,
      Miembro: fila.Miembro,
      Comisión: fila.Comision,
      Lotería: fila.Loteria,
      Pagador: fila.Pagador,
    }));

    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(libro, hoja, "Familias miembros");
    XLSX.writeFile(libro, "familias_miembros.xlsx");
  }

  return (
    <button
      type="button"
      onClick={exportarExcel}
      className="rounded-lg bg-red-900 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
    >
      Exportar Excel
    </button>
  );
}