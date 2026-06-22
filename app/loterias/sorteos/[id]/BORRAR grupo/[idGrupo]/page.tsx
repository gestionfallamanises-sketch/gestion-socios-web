"use client";

import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function GrupoLoteriaPage() {
  const params = useParams();
  const router = useRouter();
  const [grupo, setGrupo] = useState<any>(null);
  const [sorteos, setSorteos] = useState<any[]>([]);
  const [filas, setFilas] = useState<any[]>([]);

  useEffect(() => {
    cargarGrupo();
  }, []);
  
  async function cargarGrupo() {
    const { data, error } = await (supabase as any)
      .from("SOCIOS_LOTERIA")
      .select("*")
      .eq("ID", Number(params.idGrupo))
      .single();
  
    if (error) {
      alert("Error cargando grupo: " + error.message);
      return;
    }
  
    const { data: socioData } = await (supabase as any)
      .from("SOCIOS")
      .select("NUMCENS, Apellidos, Nombre")
      .eq("NUMCENS", Number(data.NUMCENS_Responsable))
      .maybeSingle();
  
    setGrupo({
      ...data,
      ResponsableNombre: socioData
        ? `${data.NUMCENS_Responsable} - ${socioData.Apellidos}, ${socioData.Nombre}`
        : String(data.NUMCENS_Responsable),
    });
    cargarSorteos(data);
  }

  async function cargarSorteos(grupoActual: any) {
    const { data: sorteosData, error: errorSorteos } = await (supabase as any)
      .from("LOTERIA_SORTEOS")
      .select("*")
      .order("FechaSorteo", { ascending: true });
  
    if (errorSorteos) {
      alert("Error cargando sorteos: " + errorSorteos.message);
      return;
    }
  
    const sorteosLista = sorteosData || [];
    setSorteos(sorteosLista);
  
    const registrosIniciales = sorteosLista.map((sorteo: any) => ({
      IDSorteo: sorteo.ID,
      IDGrupoLoteria: Number(params.idGrupo),
    }));
  
    const { error: errorUpsert } = await (supabase as any)
      .from("LOTERIA_SORTEOS_GRUPOS")
      .upsert(registrosIniciales, {
        onConflict: "IDSorteo,IDGrupoLoteria",
      });
  
    if (errorUpsert) {
      alert("Error creando filas del responsable: " + errorUpsert.message);
      return;
    }
  
    const { data: filasData, error: errorFilas } = await (supabase as any)
      .from("LOTERIA_SORTEOS_GRUPOS")
      .select("*")
      .eq("IDGrupoLoteria", Number(params.idGrupo));
  
    if (errorFilas) {
      alert("Error cargando filas: " + errorFilas.message);
      return;
    }
  
    const filasCompletas = sorteosLista.map((sorteo: any) => {
      const fila = filasData?.find(
        (f: any) => Number(f.IDSorteo) === Number(sorteo.ID)
      );
  
      return {
        ...fila,
      
        IDSorteo: sorteo.ID,
        FechaSorteo: sorteo.FechaSorteo,
      
        PapeletasFalla:
          fila?.PapeletasFalla ?? Number(grupoActual.PapeletasFalla || 0),
      
        PapeletasVirgen:
          fila?.PapeletasVirgen ?? Number(grupoActual.PapeletasVirgen || 0),
      
        ImporteFalla:
          fila?.ImporteFalla ??
          Number(grupoActual.PapeletasFalla || 0) *
            Number(sorteo.ImportePapeletaFalla || 0),
      
        ImporteVirgen:
          fila?.ImporteVirgen ??
          Number(grupoActual.PapeletasVirgen || 0) *
            Number(sorteo.ImportePapeletaVirgen || 0),
      
        ImportePagado: fila?.ImportePagado ?? 0,
      
        ImportePremio:
          fila?.ImportePremio ??
          Number(grupoActual.PapeletasFalla || 0) *
            Number(sorteo.PremioFallaPorPapeleta || 0) +
            Number(grupoActual.PapeletasVirgen || 0) *
            Number(sorteo.PremioVirgenPorPapeleta || 0),
      };
    });
  
    setFilas(filasCompletas);
  }

  function calcularSaldoFila(fila: any) {
    const base =
      Number(fila.ImporteFalla || 0) +
      Number(fila.ImporteVirgen || 0) -
      Number(fila.ImportePagado || 0);
  
    if (!fila.PremioEntregado) {
      return base - Number(fila.ImportePremio || 0);
    }
  
    return base;
  }
  
  function calcularTotalHasta(index: number) {
    return filas
      .slice(0, index + 1)
      .reduce((total, fila) => total + calcularSaldoFila(fila), 0);
  }

  return (
    
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mx-auto max-w-7xl">

        <div className="mb-4 flex gap-6 text-sm">
  <button
    onClick={() => router.push("/loterias/socios-loteria")}
    className="font-medium text-red-900 hover:underline"
  >
    ← Volver a socios
  </button>

  <button
    onClick={() => router.push("/loterias/sorteos")}
    className="font-medium text-red-900 hover:underline"
  >
    ← Volver a sorteos
  </button>
</div>

          <section className="mb-6 border border-zinc-200 bg-white p-6">
          <div className="flex items-start justify-between">
  <div>
    <h1 className="text-2xl font-bold">
      Historial sorteos
    </h1>

    <p className="mt-2 text-sm text-zinc-600">
      Resumen histórico de sorteos y movimientos.
    </p>
  </div>

  <div className="text-right text-sm">
    <div><strong>Socio:</strong> {grupo?.ResponsableNombre}</div>
<div><strong>Miembros:</strong> {grupo?.NumeroMiembros}</div>
<div>
  <strong>Falla:</strong> {grupo?.PapeletasFalla}{" "}
  <strong>Virgen:</strong> {grupo?.PapeletasVirgen}
</div>
  </div>
</div>
          </section>

          <section className="bg-white px-2">
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-zinc-100">
                  <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase">
  Sorteo
</th>

<th className="px-4 py-2 text-center text-xs font-semibold uppercase">
  Papeletas<br />Falla
</th>

<th className="px-4 py-2 text-center text-xs font-semibold uppercase">
Importe<br />Falla
</th>

<th className="px-4 py-2 text-center text-xs font-semibold uppercase">
  Papeletas<br />Virgen
</th>

<th className="px-4 py-2 text-center text-xs font-semibold uppercase">
Importe<br />Virgen
</th>

<th className="px-4 py-2 text-center text-xs font-semibold uppercase">
  Pagado
</th>

<th className="px-4 py-2 text-center text-xs font-semibold uppercase">
  Premio
</th>

<th className="px-4 py-2 text-center text-xs font-semibold uppercase">
  Entregado
</th>

<th className="px-4 py-2 text-center text-xs font-semibold uppercase">
  Pendiente
</th>

<th className="px-4 py-2 text-center text-xs font-semibold uppercase">
  Total
</th>
                  </tr>
                </thead>

                <tbody>
  {filas.map((fila, index) => (
    <tr key={fila.IDSorteo} className="border-b border-zinc-200">
      <td className="px-4 py-2 text-sm">
        {fila.FechaSorteo}
      </td>

      <td className="px-4 py-2 text-right text-sm">
        {fila.PapeletasFalla || 0}
      </td>

      <td className="px-4 py-2 text-right text-sm">
        {Number(fila.ImporteFalla || 0).toFixed(2)} €
      </td>

      <td className="px-4 py-2 text-right text-sm">
        {fila.PapeletasVirgen || 0}
      </td>

      <td className="px-4 py-2 text-right text-sm">
        {Number(fila.ImporteVirgen || 0).toFixed(2)} €
      </td>

      <td className="px-4 py-2 text-right text-sm">
        {Number(fila.ImportePagado || 0).toFixed(2)} €
      </td>

      <td className="px-4 py-2 text-right text-sm">
        {Number(fila.ImportePremio || 0).toFixed(2)} €
      </td>

      <td className="px-4 py-2 text-center text-sm">
        {fila.PremioEntregado ? "Sí" : "No"}
      </td>

      <td className="px-4 py-2 text-right text-sm font-semibold">
        {calcularSaldoFila(fila).toFixed(2)} €
      </td>

      <td className="px-4 py-2 text-right text-sm font-bold text-red-900">
        {calcularTotalHasta(index).toFixed(2)} €
      </td>
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