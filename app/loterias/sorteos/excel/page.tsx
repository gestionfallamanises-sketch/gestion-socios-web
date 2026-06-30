"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

function calcularEmitidas(sorteo: any, tipo: "Falla" | "Virgen") {
  const decimos = Number(sorteo[`Decimos${tipo}`] || 0);
  const precioDecimo = Number(sorteo[`PrecioDecimo${tipo}`] || 0);
  const importeJugado = Number(sorteo[`ImportePapeleta${tipo}`] || 1);

  return Math.floor((decimos * precioDecimo) / importeJugado);
}

export default function ExcelSorteosPage() {
  useEffect(() => {
    exportarExcel();
  }, []);

  async function exportarExcel() {
    const { data, error } = await (supabase as any)
      .from("LOTERIA_SORTEOS")
      .select("*")
      .order("FechaSorteo", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    const filas = (data || []).map((sorteo: any) => {
      const emitidasFalla = calcularEmitidas(sorteo, "Falla");
      const emitidasVirgen = calcularEmitidas(sorteo, "Virgen");

      const sociosFalla = Number(sorteo.PapeletasTotalesFalla || 0);
      const sociosVirgen = Number(sorteo.PapeletasTotalesVirgen || 0);

      return {
        "Fecha sorteo": sorteo.FechaSorteo,
        "Número Falla": sorteo.NumeroFalla,
        "Precio décimo Falla": Number(sorteo.PrecioDecimoFalla || 0),
        "Papeletas emitidas Falla": emitidasFalla,
        "Papeletas socios Falla": sociosFalla,
        "Restantes Falla": emitidasFalla - sociosFalla,

        "Número Virgen": sorteo.NumeroVirgen,
        "Precio décimo Virgen": Number(sorteo.PrecioDecimoVirgen || 0),
        "Papeletas emitidas Virgen": emitidasVirgen,
        "Papeletas socios Virgen": sociosVirgen,
        "Restantes Virgen": emitidasVirgen - sociosVirgen,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(filas);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Sorteos");

    XLSX.writeFile(workbook, "sorteos.xlsx");

    window.history.back();
  }

  return (
    <main className="p-8 text-sm">
      Generando Excel de sorteos...
    </main>
  );
}