"use client";

import * as XLSX from "xlsx";

type Props = {
  filas: any[];
  idRemesa: number | string;
  ejercicio?: number | string;
};

export default function ExportarRemesaExcelButton({
  filas,
  idRemesa,
  ejercicio,
}: Props) {
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
    : filas.map((fila) => {
      const ejercicioFinal =
        fila.CUOTAS_SOCIOS?.Ejercicio ||
        fila.Ejercicio ||
        fila.EjercicioRemesa ||
        "";
  
      const numeroPlazo =
        fila.CUOTAS_PLAZOS?.NumeroPlazo ||
        fila.NumeroPlazo ||
        "";
  
      const referencia =
        fila.Concepto ||
        `${fila.NUMCENS || "?"}-${ejercicioFinal || "?"}-${numeroPlazo || "?"}`;
  
      return {
        "SOCIO CUOTA": `${fila.NUMCENS || ""} · ${fila.socioCuotaNombre || ""}`,
        "PAGADOR": fila.NUMCENS_Pagador || "",
        "REFERENCIA MANDATO": referencia,
        "CUOTA / PLAZO": `Cuota ${ejercicioFinal} - Plazo ${numeroPlazo}`,
        "IMPORTE": `${Number(fila.Importe || 0).toLocaleString("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})} €`,
      };
    });

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