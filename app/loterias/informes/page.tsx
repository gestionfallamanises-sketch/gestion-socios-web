"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabase";

export default function InformesLoteriaPage() {
  const router = useRouter();

  const [sorteos, setSorteos] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [fechaDesde, setFechaDesde] = useState("");
const [fechaHasta, setFechaHasta] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function exportarExcel() {
    alert("Pendiente de implementar");
  }

  async function cargarDatos() {
    let consultaSorteos = (supabase as any)
      .from("LOTERIA_SORTEOS")
      .select("*")
      .order("FechaSorteo", { ascending: true });
  
    if (fechaDesde) {
      consultaSorteos = consultaSorteos.gte(
        "FechaSorteo",
        fechaDesde
      );
    }
  
    if (fechaHasta) {
      consultaSorteos = consultaSorteos.lte(
        "FechaSorteo",
        fechaHasta
      );
    }
  
    if (!fechaDesde && !fechaHasta) {
      consultaSorteos = consultaSorteos.limit(8);
    }
  
    const {
      data: sorteosData,
      error: errorSorteos,
    } = await consultaSorteos;
  
    if (errorSorteos) {
      alert("Error cargando sorteos: " + errorSorteos.message);
      return;
    }

    let sorteosMostrar = [...(sorteosData || [])];

    if (!fechaDesde && !fechaHasta) {
      while (sorteosMostrar.length < 8) {
        sorteosMostrar.push({
          ID: `vacio-${sorteosMostrar.length}`,
          FechaSorteo: "",
        });
      }
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

    const { data: sociosData, error: errorSocios } =
  await (supabase as any)
    .from("SOCIOS")
    .select("NUMCENS, Apellidos, Nombre");

if (errorSocios) {
  alert("Error cargando socios: " + errorSocios.message);
  return;
}

const gruposConNombre = gruposData.map((grupo: any) => {
  const socio = sociosData?.find(
    (s: any) =>
      String(s.NUMCENS).trim() ===
      String(grupo.NUMCENS_Responsable).trim()
  );

  const nombre = socio
    ? `${socio.Apellidos}, ${socio.Nombre}`
    : grupo.NombreExterno || "";

  return {
    ...grupo,
    NombreRepresentante: nombre,
    NumeroSocio: socio ? grupo.NUMCENS_Responsable : null,
  };
});

gruposConNombre.sort((a: any, b: any) =>
  String(a.NombreRepresentante || "").localeCompare(
    String(b.NombreRepresentante || ""),
    "es",
    { sensitivity: "base" }
  )
);

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

    <div className="mt-4 flex items-end gap-3">

  <div>
    <label className="mb-1 block text-xs font-medium text-zinc-600">
      Desde
    </label>

    <input
      type="date"
      value={fechaDesde}
      onChange={(e) => setFechaDesde(e.target.value)}
      className="border border-zinc-300 px-3 py-2 text-sm"
    />
  </div>

  <div>
    <label className="mb-1 block text-xs font-medium text-zinc-600">
      Hasta
    </label>

    <input
      type="date"
      value={fechaHasta}
      onChange={(e) => setFechaHasta(e.target.value)}
      className="border border-zinc-300 px-3 py-2 text-sm"
    />
  </div>

  <button
    type="button"
    onClick={cargarDatos}
    className="bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
  >
    Aplicar periodo
  </button>

</div>
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
  {grupo.NombreRepresentante}

  {grupo.NumeroSocio && (
    <span className="ml-2 text-[10px] font-normal text-zinc-400">
      {grupo.NumeroSocio}
    </span>
  )}
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