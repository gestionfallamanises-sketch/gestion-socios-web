"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function ExcelSociosLoteriaPage() {
  useEffect(() => {
    exportarExcel();
  }, []);

  async function exportarExcel() {
    const { data: gruposData, error } = await (supabase as any)
      .from("SOCIOS_LOTERIA")
      .select("*");

    if (error) {
      alert(error.message);
      return;
    }

    const responsables = (gruposData || [])
      .filter((g: any) => !g.EsExterno && g.NUMCENS_Responsable)
      .map((g: any) => Number(g.NUMCENS_Responsable));

    const { data: sociosData } = await (supabase as any)
      .from("SOCIOS")
      .select("NUMCENS, Nombre, Apellidos")
      .in("NUMCENS", responsables);

    const filas = (gruposData || [])
      .map((grupo: any) => {
        const responsable = (sociosData || []).find(
          (socio: any) =>
            Number(socio.NUMCENS) === Number(grupo.NUMCENS_Responsable)
        );

        const responsableNombre = grupo.EsExterno
          ? `EXT - ${grupo.NombreExterno || "Externo"}`
          : responsable
          ? `${responsable.NUMCENS} - ${responsable.Apellidos}, ${responsable.Nombre}`
          : grupo.NUMCENS_Responsable;

        const responsableOrden = grupo.EsExterno
          ? grupo.NombreExterno || ""
          : responsable
          ? `${responsable.Apellidos || ""} ${responsable.Nombre || ""}`
          : "";

        return {
          Responsable: responsableNombre,
          Miembros: Number(grupo.NumeroMiembros || 0),
          Falla: Number(grupo.PapeletasFalla || 0),
          Virgen: Number(grupo.PapeletasVirgen || 0),
          Navidad: Number(grupo.PapeletasNavidad || 0),
          Niño: Number(grupo.PapeletasNino || 0),
          _orden: responsableOrden,
        };
      })
      .sort((a: any, b: any) =>
        normalizarTexto(a._orden || "").localeCompare(
          normalizarTexto(b._orden || "")
        )
      )
      .map(({ _orden, ...fila }: any) => fila);

    const totalFalla = filas.reduce((sum, f) => sum + Number(f.Falla || 0), 0);
    const totalVirgen = filas.reduce((sum, f) => sum + Number(f.Virgen || 0), 0);
    const totalNavidad = filas.reduce((sum, f) => sum + Number(f.Navidad || 0), 0);
    const totalNino = filas.reduce((sum, f) => sum + Number(f.Niño || 0), 0);

    filas.push({
      Responsable: "TOTAL",
      Miembros: "",
      Falla: totalFalla,
      Virgen: totalVirgen,
      Navidad: totalNavidad,
      Niño: totalNino,
    });

    const worksheet = XLSX.utils.json_to_sheet(filas);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Socios lotería");
    XLSX.writeFile(workbook, "socios-loteria.xlsx");

    window.history.back();
  }

  return <main className="p-8 text-sm">Generando Excel...</main>;
}