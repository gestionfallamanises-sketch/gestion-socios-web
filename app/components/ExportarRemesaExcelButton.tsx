"use client";

import * as XLSX from "xlsx";

type Props = {
  filas: any[];
  idRemesa: number | string;
  ejercicio?: number | string;
  fechaVencimiento?: string | null;
};

export default function ExportarRemesaExcelButton({
  filas,
  idRemesa,
  ejercicio,
  fechaVencimiento,
}: Props) {
  function formatearFecha(fecha: string | null | undefined) {
    if (!fecha) return "";

    const soloFecha = String(fecha).split("T")[0];
    const partes = soloFecha.split("-");

    if (partes.length !== 3) return fecha;

    const [year, month, day] = partes;

    return `${day}-${month}-${year}`;
  }

  function exportarExcel() {
    const esBanco = filas?.[0]?.NombreDeudor !== undefined;

    const datos = esBanco
      ? filas.map((fila) => ({
          "NOMBRE DEUDOR": fila.NombreDeudor || "",
          "REFERENCIA MANDATO": fila.ReferenciaMandato || "",
          "CUENTA CARGO": fila.IBAN || "",
          "CONCEPTO": Array.isArray(fila.Concepto)
            ? `${fila.Concepto.join("-")}/${ejercicio || ""}/${
                fila.Lineas?.[0]?.NumeroPlazo || ""
              }`
            : fila.Concepto || "",
          "FECHA FIRMA MANDATO": formatearFecha(fila.FechaMandato),
          "REFERENCIA ADEUDO": fila.ReferenciaAdeudo || "",
          "FECHA VENCIMIENTO": formatearFecha(fechaVencimiento),
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
            "SOCIO CUOTA": `${fila.NUMCENS || ""} · ${
              fila.socioCuotaNombre || ""
            }`,
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

    // Ajustar automáticamente el ancho de las columnas
    if (datos.length > 0) {
      const columnas = Object.keys(datos[0]);

      hoja["!cols"] = columnas.map((columna) => {
        const anchoMaximo = Math.max(
          columna.length,
          ...datos.map((fila: any) =>
            String(fila[columna] ?? "").length
          )
        );

        return {
          wch: Math.min(anchoMaximo + 3, 45),
        };
      });
    }

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