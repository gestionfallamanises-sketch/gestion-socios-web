"use client";

import * as XLSX from "xlsx";

type Props = {
  filas: any[];
  idRemesa: number | string;
};

export default function ExportarRemesaExcelButton({ filas, idRemesa }: Props) {
  function exportarExcel() {
    
    const esBanco = filas?.[0]?.NombreDeudor !== undefined;

const datos = esBanco
  ? filas.map((fila) => ({
      "NOMBRE DEUDOR": fila.NombreDeudor || "",
      "REFERENCIA MANDATO": fila.ReferenciaMandato || "",
      "CUENTA CARGO": fila.IBAN || "",
      "CONCEPTO": Array.isArray(fila.Concepto)
        ? fila.Concepto.join(", ")
        : fila.Concepto || "",
      "FECHA FIRMA MANDATO": fila.FechaMandato || "",
      "REFERENCIA ADEUDO": fila.ReferenciaAdeudo || "",
      "FECHA VENCIMIENTO": fila.FechaVencimiento || "",
      "IMPORTE": Number(fila.Importe || 0).toFixed(2),
      "TIPO DE ADEUDO": "RCUR",
    }))
  : filas.map((fila) => ({
      "SOCIO CUOTA": `${fila.NUMCENS || ""} · ${fila.socioCuotaNombre || ""}`,
      "PAGADOR": fila.NUMCENS_Pagador || "",
      "REFERENCIA MANDATO": `${fila.NUMCENS || "?"}-${
        fila.CUOTAS_SOCIOS?.Ejercicio || "?"
      }-${fila.CUOTAS_PLAZOS?.NumeroPlazo || "?"}`,
      "CUOTA / PLAZO": `Cuota ${
        fila.CUOTAS_SOCIOS?.Ejercicio || ""
      } · Plazo ${fila.CUOTAS_PLAZOS?.NumeroPlazo || ""}`,
      "IMPORTE": Number(fila.Importe || 0).toFixed(2),
    }));

    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(libro, hoja, "Remesa");

    XLSX.writeFile(libro, `remesa_${idRemesa}.xlsx`);
  }

  return (
    <button
      type="button"
      onClick={exportarExcel}
      className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
    >
      Exportar Excel
    </button>
  );
}