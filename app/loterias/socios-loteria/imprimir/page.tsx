"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function ImprimirSociosLoteriaPage() {
  const [grupos, setGrupos] = useState<any[]>([]);

  useEffect(() => {
    cargarGrupos();
  }, []);

  async function cargarGrupos() {
    const { data: gruposData, error: errorGrupos } = await (supabase as any)
      .from("SOCIOS_LOTERIA")
      .select("*");

    if (errorGrupos) {
      alert(errorGrupos.message);
      return;
    }

    const responsables = (gruposData || [])
      .filter((g: any) => !g.EsExterno && g.NUMCENS_Responsable)
      .map((g: any) => Number(g.NUMCENS_Responsable));

    const { data: sociosData } = await (supabase as any)
      .from("SOCIOS")
      .select("NUMCENS, Nombre, Apellidos")
      .in("NUMCENS", responsables);

    const gruposConNombre = (gruposData || []).map((grupo: any) => {
      const responsable = (sociosData || []).find(
        (socio: any) =>
          Number(socio.NUMCENS) === Number(grupo.NUMCENS_Responsable)
      );

      return {
        ...grupo,
        ResponsableNombre: grupo.EsExterno
          ? `EXT - ${grupo.NombreExterno || "Externo"}`
          : responsable
          ? `${responsable.NUMCENS} - ${responsable.Apellidos}, ${responsable.Nombre}`
          : grupo.NUMCENS_Responsable,
        ResponsableOrden: grupo.EsExterno
          ? grupo.NombreExterno || ""
          : responsable
          ? `${responsable.Apellidos || ""} ${responsable.Nombre || ""}`
          : "",
      };
    });

    const ordenados = gruposConNombre.sort((a: any, b: any) =>
      normalizarTexto(a.ResponsableOrden || "").localeCompare(
        normalizarTexto(b.ResponsableOrden || "")
      )
    );

    setGrupos(ordenados);
  }

  const totalFalla = grupos.reduce(
    (sum, g) => sum + Number(g.PapeletasFalla || 0),
    0
  );

  const totalVirgen = grupos.reduce(
    (sum, g) => sum + Number(g.PapeletasVirgen || 0),
    0
  );

  const totalNavidad = grupos.reduce(
    (sum, g) => sum + Number(g.PapeletasNavidad || 0),
    0
  );

  const totalNino = grupos.reduce(
    (sum, g) => sum + Number(g.PapeletasNino || 0),
    0
  );

  return (
    <main className="bg-white p-6 text-sm text-zinc-900">
      <div className="no-print mb-4 flex justify-between">
        <button onClick={() => window.history.back()} className="text-red-900">
          ← Volver
        </button>

        <button
          onClick={() => window.print()}
          className="bg-red-900 px-4 py-2 text-white"
        >
          Imprimir
        </button>
      </div>

      <h1 className="mb-4 text-center text-2xl font-bold">
        Socios lotería
      </h1>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-zinc-100">
            <th className="border px-2 py-2 text-left">Responsable</th>
            <th className="border px-2 py-2 text-center">Miembros</th>
            <th className="border px-2 py-2 text-center">Falla</th>
            <th className="border px-2 py-2 text-center">Virgen</th>
            <th className="border px-2 py-2 text-center">Navidad</th>
            <th className="border px-2 py-2 text-center">Niño</th>
          </tr>
        </thead>

        <tbody>
          {grupos.map((grupo) => (
            <tr key={grupo.ID}>
              <td className="border px-2 py-2">{grupo.ResponsableNombre}</td>
              <td className="border px-2 py-2 text-center">
                {grupo.NumeroMiembros || 0}
              </td>
              <td className="border px-2 py-2 text-center">
                {grupo.PapeletasFalla || 0}
              </td>
              <td className="border px-2 py-2 text-center">
                {grupo.PapeletasVirgen || 0}
              </td>
              <td className="border px-2 py-2 text-center">
                {grupo.PapeletasNavidad || 0}
              </td>
              <td className="border px-2 py-2 text-center">
                {grupo.PapeletasNino || 0}
              </td>
            </tr>
          ))}

          <tr className="bg-zinc-100 font-bold">
            <td className="border px-2 py-2">TOTAL</td>
            <td className="border px-2 py-2 text-center"></td>
            <td className="border px-2 py-2 text-center">{totalFalla}</td>
            <td className="border px-2 py-2 text-center">{totalVirgen}</td>
            <td className="border px-2 py-2 text-center">{totalNavidad}</td>
            <td className="border px-2 py-2 text-center">{totalNino}</td>
          </tr>
        </tbody>
      </table>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }

          @page {
            size: landscape;
            margin: 1cm;
          }
        }
      `}</style>
    </main>
  );
}