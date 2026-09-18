"use client";

import * as XLSX from "xlsx";

export default function ExcelSocioButton({
  socio,
  cuota,
  formaPago,
  pagador,
  iban,
  familia,
}: {
  socio: any;
  cuota: any;
  formaPago: any;
  pagador: string;
  iban: string;
  familia: any[];
}) {
  function exportarExcel() {
    const datosSocio = [
      ["FICHA DEL SOCIO", ""],
      ["", ""],

      ["DATOS PERSONALES", ""],
      ["NUMCENS", socio.NUMCENS],
      ["Apellidos", socio.Apellidos || ""],
      ["Nombre", socio.Nombre || ""],
      ["Fecha nacimiento", socio["FECHA de NACIMIENTO"] || ""],
      ["Teléfono 1", socio["Teléfono 1"] || ""],
      ["Teléfono 2", socio["Teléfono 2"] || ""],
      ["NIF", socio.NIF || ""],
      ["Dirección", socio.Dirección || ""],
      ["Código postal", socio["Código Postal"] || ""],
      ["Ciudad", socio.Ciudad || ""],
      ["Estado", socio.Estado || ""],
      ["Antigüedad", socio.Antiguedad_Calculada || ""],

      ["", ""],
      ["CONFIGURACIÓN", ""],
      ["Comisión", socio.Comision || ""],
      ["Sexo", socio.SEXE || ""],
      ["Banda", socio.EsBanda ? "Sí" : "No"],
      ["Cargo", socio.CARREG || ""],
      ["Lotería", socio.ConLoteria ? "Sí" : "No"],

      ["", ""],
      ["CUOTA Y PAGO", ""],
      ["Ejercicio", cuota?.Ejercicio || ""],
      ["Tipo cuota", cuota?.Descripcion || cuota?.TipoCuota || cuota?.IDCuota || ""],
      ["Importe", Number(cuota?.Importe || 0)],
      ["Forma de pago", formaPago?.Metodo || ""],
      ["Nº plazos", formaPago?.NumeroPlazos || ""],
      ["Pagador", pagador || ""],
      ["IBAN", iban || ""],
      ["Pagado", Number(cuota?.TotalPagado || 0)],
      ["Pendiente", Number(cuota?.Pendiente || 0)],
    ];

    const hojaSocio = XLSX.utils.aoa_to_sheet(datosSocio);
    

    hojaSocio["!cols"] = [
      { wch: 22 },
      { wch: 45 },
    ];

    const libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      libro,
      hojaSocio,
      "Ficha socio"
    );

    if (familia.length > 0) {
      const datosFamilia = familia.map((m) => ({
        NUMCENS: m.NUMCENS,
        Apellidos: m.Apellidos || "",
        Nombre: m.Nombre || "",
        Comisión: m.Comision || "",
        Lotería: m.ConLoteria ? "Sí" : "No",
        Estado: m.Estado || "",
      }));

      const hojaFamilia =
        XLSX.utils.json_to_sheet(datosFamilia);

      hojaFamilia["!cols"] = [
        { wch: 10 },
        { wch: 28 },
        { wch: 22 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
      ];

      XLSX.utils.book_append_sheet(
        libro,
        hojaFamilia,
        "Familia"
      );
    }

    const nombreArchivo =
      `Socio_${socio.NUMCENS}_${socio.Apellidos || ""}_${socio.Nombre || ""}`
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, "_");

    XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);
  }

  return (
    <button
      type="button"
      onClick={exportarExcel}
      className="border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
    >
      Excel
    </button>
  );
}