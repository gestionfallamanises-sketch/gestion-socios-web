"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabase";

export default function InformesLoteriaPage() {
  const router = useRouter();

  const [sorteos, setSorteos] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function exportarExcel() {
    alert("Pendiente de implementar");
  }

  async function cargarDatos() {
    const { data: sorteosData, error: errorSorteos } = await (supabase as any)
      .from("LOTERIA_SORTEOS")
      .select("*")
      .order("FechaSorteo", { ascending: false })
      .limit(8);

      let sorteosMostrar = [...(sorteosData || [])];

      while (sorteosMostrar.length < 8) {
        sorteosMostrar.push({
          ID: `vacio-${sorteosMostrar.length}`,
          FechaSorteo: "",
        });
      }
      
      setSorteos(sorteosMostrar);

    const { data: gruposData, error: errorGrupos } = await (supabase as any)
      .from("SOCIOS_LOTERIA")
      .select("*")
      .eq("Activo", true)
      .order("NUMCENS_Responsable");

    if (errorGrupos) {
      alert("Error cargando grupos: " + errorGrupos.message);
      return;
    }

    if (!gruposData || gruposData.length === 0) {
      setGrupos([]);
      return;
    }

    const numcensResponsables = gruposData.map(
      (g: any) => g.NUMCENS_Responsable
    );

    const { data: sociosData } = await (supabase as any)
      .from("SOCIOS")
      .select("NUMCENS, Apellidos, Nombre")
      .in("NUMCENS", numcensResponsables);

    const gruposConNombre = gruposData.map((grupo: any) => {
      const socio = sociosData?.find(
        (s: any) => Number(s.NUMCENS) === Number(grupo.NUMCENS_Responsable)
      );

      return {
        ...grupo,
        NombreCompleto: socio
          ? `${grupo.NUMCENS_Responsable} - ${socio.Apellidos}, ${socio.Nombre}`
          : String(grupo.NUMCENS_Responsable),
      };
    });

    setGrupos(gruposConNombre);
  }

  function formatearFecha(fecha: string) {
    const d = new Date(fecha);
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
  
    return `${dia}/${mes}`;
  }

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mx-auto max-w-7xl">

          <div className="mb-4">
            <button
              onClick={() => router.push("/loterias")}
              className="text-sm font-medium text-red-900 hover:underline"
            >
              ← Volver a loterías
            </button>
          </div>

          <section className="mb-6 border border-zinc-200 bg-white p-6 print:hidden">
            <div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold text-zinc-900">
      Informes de lotería
    </h1>

    <p className="mt-2 text-sm text-zinc-600">
      Hoja semanal imprimible de responsables y sorteos.
    </p>
  </div>

  <div className="flex gap-2">
    <button
      onClick={() => window.print()}
      className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
    >
      Imprimir
    </button>

    <button
      onClick={exportarExcel}
      className="bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
    >
      Excel
    </button>
  </div>
</div>
          </section>

          <section className="border border-zinc-300 bg-white p-4">
            <h2 className="mb-4 text-center text-lg font-bold uppercase">
              Hoja semanal de lotería
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
              <thead>
  <tr>
    <th className="border border-zinc-400 px-2 py-1"></th>
    <th className="border border-zinc-400 px-2 py-1"></th>
    <th className="border border-zinc-400 px-2 py-1 text-left">
      Premio F
    </th>

    {sorteos.map((sorteo) => (
      <th key={sorteo.ID} className="border border-zinc-400 px-2 py-1">
      </th>
    ))}
  </tr>

  <tr>
    <th className="border border-zinc-400 px-2 py-1"></th>
    <th className="border border-zinc-400 px-2 py-1"></th>
    <th className="border border-zinc-400 px-2 py-1 text-left">
      Premio V
    </th>

    {sorteos.map((sorteo) => (
      <th key={sorteo.ID} className="border border-zinc-400 px-2 py-1">
      </th>
    ))}
  </tr>

  <tr>
    <th className="w-2 border border-zinc-400 px-0 py-2 text-center">
      Falla
    </th>

    <th className="w-2 border border-zinc-400 px-0 py-2 text-center">
      Virgen
    </th>

    <th className="w-44 border border-zinc-400 px-2 py-2 text-left">
      Representante
    </th>

    {sorteos.map((sorteo) => (
  <th
    key={sorteo.ID}
    className="w-10 border border-zinc-400 px-1 py-1 text-center"
  >
    {sorteo.FechaSorteo
      ? formatearFecha(sorteo.FechaSorteo)
      : ""}
  </th>
))}
  </tr>
</thead>

<tbody>
  {grupos.map((grupo) => (
    <tr key={grupo.ID}>
      <td className="border border-zinc-400 px-2 py-1 text-center font-medium">
        {grupo.PapeletasFalla}
      </td>

      <td className="border border-zinc-400 px-2 py-1 text-center font-medium">
        {grupo.PapeletasVirgen}
      </td>

      <td className="border border-zinc-400 px-2 py-1 text-sm font-medium">
  {grupo.NombreCompleto}
</td>

      {sorteos.map((sorteo) => (
        <td
          key={sorteo.ID}
          className="border border-zinc-400 px-1 py-2 text-sm font-medium"
        >
        </td>
      ))}
    </tr>
  ))}
</tbody>
              </table>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}