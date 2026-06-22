"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabase";

export default function SorteoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");

  const [sorteo, setSorteo] = useState<any>(null);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const { data: sorteoData, error: errorSorteo } = await (supabase as any)
      .from("LOTERIA_SORTEOS")
      .select("*")
      .eq("ID", params.id)
      .single();
  
    if (errorSorteo) {
      alert("Error cargando sorteo: " + errorSorteo.message);
      return;
    }
  
    setSorteo(sorteoData);
  
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
  
    const registros = gruposData.map((grupo: any) => ({
      IDSorteo: Number(params.id),
      IDGrupoLoteria: grupo.ID,
    }));
  
    const { error: errorUpsert } = await (supabase as any)
      .from("LOTERIA_SORTEOS_GRUPOS")
      .upsert(registros, {
        onConflict: "IDSorteo,IDGrupoLoteria",
        ignoreDuplicates: true,
      });
  
    if (errorUpsert) {
      alert("Error generando grupos del sorteo: " + errorUpsert.message);
      return;
    }
  
    const { data: movimientosData, error: errorMovimientos } =
  await (supabase as any)
    .from("LOTERIA_SORTEOS_GRUPOS")
    .select("*")
    .eq("IDSorteo", Number(params.id));

if (errorMovimientos) {
  alert(errorMovimientos.message);
  return;
}

setMovimientos(movimientosData || []);

    const numcensResponsables = gruposData.map(
      (g: any) => g.NUMCENS_Responsable
    );
  
    const { data: sociosData, error: errorSocios } = await (supabase as any)
      .from("SOCIOS")
      .select("NUMCENS, Apellidos, Nombre")
      .in("NUMCENS", numcensResponsables);
  
    if (errorSocios) {
      alert("Error cargando responsables: " + errorSocios.message);
      return;
    }
  
    const gruposConNombre = gruposData.map((grupo: any) => {
      const socio = sociosData?.find(
        (s: any) => Number(s.NUMCENS) === Number(grupo.NUMCENS_Responsable)
      );
  
      const movimiento = movimientosData?.find(
        (m: any) => m.IDGrupoLoteria === grupo.ID
      );
      
      return {
        ...grupo,
      
        NombreCompleto: socio
          ? `${grupo.NUMCENS_Responsable} - ${socio.Apellidos}, ${socio.Nombre}`
          : String(grupo.NUMCENS_Responsable),
      
          PapeletasFalla:
  Number(movimiento?.PapeletasFalla || 0) > 0
    ? Number(movimiento.PapeletasFalla)
    : Number(grupo.PapeletasFalla || 0),

    ImporteFalla:
    Number(movimiento?.ImporteFalla || 0) > 0
      ? Number(movimiento.ImporteFalla)
      : Number(
          (Number(movimiento?.PapeletasFalla || grupo.PapeletasFalla || 0) *
            Number(sorteoData.ImportePapeletaFalla || 0)).toFixed(2)
        ),
              PapeletasVirgen:
              Number(movimiento?.PapeletasVirgen || 0) > 0
                ? Number(movimiento.PapeletasVirgen)
                : Number(grupo.PapeletasVirgen || 0),
          
                ImporteVirgen:
                Number(movimiento?.ImporteVirgen || 0) > 0
                  ? Number(movimiento.ImporteVirgen)
                  : Number(
                      (Number(movimiento?.PapeletasVirgen || grupo.PapeletasVirgen || 0) *
                        Number(sorteoData.ImportePapeletaVirgen || 0)).toFixed(2)
                    ),
          
          ImportePagado: movimiento?.ImportePagado ?? 0,

          PapeletasPremioFalla:
  Number(sorteoData.PremioFallaPorPapeleta || 0) > 0
    ? Number(movimiento?.PapeletasPremioFalla || grupo.PapeletasFalla || 0)
    : 0,

PapeletasPremioVirgen:
  Number(sorteoData.PremioVirgenPorPapeleta || 0) > 0
    ? Number(movimiento?.PapeletasPremioVirgen || grupo.PapeletasVirgen || 0)
    : 0,
          
          ImportePremio:
  movimiento?.ImportePremio && Number(movimiento.ImportePremio) > 0
    ? Number(movimiento.ImportePremio)
    : (
        (Number(movimiento?.PapeletasFalla || grupo.PapeletasFalla || 0) *
          Number(sorteoData.PremioFallaPorPapeleta || 0)) +
        (Number(movimiento?.PapeletasVirgen || grupo.PapeletasVirgen || 0) *
          Number(sorteoData.PremioVirgenPorPapeleta || 0))
      ),
          
          PremioEntregado: movimiento?.PremioEntregado ?? false,
          PagadoConfirmado: movimiento?.PagadoConfirmado ?? false,
IDGrupoLoteria: movimiento?.IDGrupoLoteria ?? grupo.ID,
      };
    });
  
    setGrupos(gruposConNombre);
  }

  function actualizarGrupo(index: number, campo: string, valor: any) {
    setGrupos((prev) => {
      const nuevos = prev.map((grupo, i) => {
        if (i !== index) return grupo;
  
        const actualizado = {
          ...grupo,
          [campo]: valor,
        };
  
        if (campo === "PapeletasFalla") {
          actualizado.ImporteFalla =
            Number(valor || 0) * Number(sorteo?.ImportePapeletaFalla || 0);
  
          actualizado.ImportePremio =
            Number(valor || 0) * Number(sorteo?.PremioFallaPorPapeleta || 0) +
            Number(actualizado.PapeletasVirgen || 0) *
              Number(sorteo?.PremioVirgenPorPapeleta || 0);
        }
  
        if (campo === "PapeletasVirgen") {
          actualizado.ImporteVirgen =
            Number(valor || 0) * Number(sorteo?.ImportePapeletaVirgen || 0);
  
            actualizado.ImportePremio =
  Number(actualizado.PapeletasPremioFalla || 0) *
    Number(sorteo?.PremioFallaPorPapeleta || 0) +
  Number(actualizado.PapeletasPremioVirgen || 0) *
    Number(sorteo?.PremioVirgenPorPapeleta || 0);
        }
  
        if (
          campo === "PapeletasPremioFalla" ||
          campo === "PapeletasPremioVirgen"
        ) {
          actualizado.ImportePremio =
            Number(
              campo === "PapeletasPremioFalla"
                ? valor
                : actualizado.PapeletasPremioFalla || 0
            ) *
              Number(sorteo?.PremioFallaPorPapeleta || 0) +
            Number(
              campo === "PapeletasPremioVirgen"
                ? valor
                : actualizado.PapeletasPremioVirgen || 0
            ) *
              Number(sorteo?.PremioVirgenPorPapeleta || 0);
        }

        guardarGrupo(actualizado, false);
  
        return actualizado;
      });
  
      return nuevos;
    });
  }
  
  function calcularPendiente(grupo: any) {
    const totalPapeletas =
      Number(grupo.ImporteFalla || 0) +
      Number(grupo.ImporteVirgen || 0);
  
    const pendienteCobro = grupo.PagadoConfirmado
      ? 0
      : totalPapeletas;
  
    const pendientePremio = grupo.PremioEntregado
      ? 0
      : Number(grupo.ImportePremio || 0);
  
    return pendienteCobro - pendientePremio;
  }
  
  async function guardarGrupo(grupo: any, mostrarAviso = true) {
    const { error } = await (supabase as any)
      .from("LOTERIA_SORTEOS_GRUPOS")
      .update({
        PapeletasFalla: grupo.PapeletasFalla,
        ImporteFalla: grupo.ImporteFalla,
        PapeletasVirgen: grupo.PapeletasVirgen,
        ImporteVirgen: grupo.ImporteVirgen,
        ImportePagado: grupo.ImportePagado,
        PapeletasPremioFalla: grupo.PapeletasPremioFalla,
PapeletasPremioVirgen: grupo.PapeletasPremioVirgen,
        ImportePremio: grupo.ImportePremio,
        PremioEntregado: grupo.PremioEntregado,
        PagadoConfirmado: grupo.PagadoConfirmado,
      })
      .eq("IDSorteo", Number(params.id))
      .eq("IDGrupoLoteria", Number(grupo.IDGrupoLoteria || grupo.ID));
  
    if (error) {
      alert("Error guardando grupo: " + error.message);
      return;
    }
  
    if (mostrarAviso) {
      alert("Fila guardada");
    }
  }

  const totalPapFalla = grupos.reduce(
    (sum, g) => sum + Number(g.PapeletasFalla || 0),
    0
  );
  
  const totalImpFalla = grupos.reduce(
    (sum, g) => sum + Number(g.ImporteFalla || 0),
    0
  );
  
  const totalPapVirgen = grupos.reduce(
    (sum, g) => sum + Number(g.PapeletasVirgen || 0),
    0
  );
  
  const totalImpVirgen = grupos.reduce(
    (sum, g) => sum + Number(g.ImporteVirgen || 0),
    0
  );
  
  const totalPagado = grupos.reduce(
    (sum, g) => sum + Number(g.ImportePagado || 0),
    0
  );
  
  const totalPremio = grupos.reduce(
    (sum, g) => sum + Number(g.ImportePremio || 0),
    0
  );
  
  const totalPendiente = grupos.reduce(
    (sum, g) => sum + calcularPendiente(g),
    0
  );

  const gruposFiltrados = grupos.filter((grupo) =>
    String(grupo.NombreCompleto || "")
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const hayPremios = grupos.some(
    (g) => Number(g.ImportePremio || 0) > 0
  );

  async function marcarTodosPagados(valor: boolean) {
    const nuevos = grupos.map((g) => ({
      ...g,
      PagadoConfirmado: valor,
    }));
  
    setGrupos(nuevos);
  
    await Promise.all(nuevos.map((g) => guardarGrupo(g, false)));
    alert("Cambios guardados");
  }
  
  async function marcarTodosPremios(valor: boolean) {
    const nuevos = grupos.map((g) => ({
      ...g,
      PremioEntregado: valor,
    }));
  
    setGrupos(nuevos);
  
    await Promise.all(nuevos.map((g) => guardarGrupo(g, false)));
alert("Cambios guardados");
  }

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mx-auto max-w-7xl">
       
        <button
  onClick={() => router.push("/loterias/sorteos")}
  className="mb-4 text-sm font-medium text-red-900 hover:underline"
>
  ← Volver a sorteos
</button>

          <section className="mb-6 border border-zinc-200 bg-white p-6">

            <h1 className="text-2xl font-bold">
              Detalle del sorteo
            </h1>

            {sorteo && (
              <div className="mt-4 flex flex-wrap items-center gap-8">

<div>
  <span className="text-xs uppercase text-zinc-500">
    Fecha
  </span>
  <span className="ml-2 font-semibold">
    {sorteo.FechaSorteo}
  </span>
</div>

<div>
  <span className="text-xs uppercase text-zinc-500">
    Falla
  </span>

  <span className="ml-2 text-xl font-bold text-red-900">
    {sorteo.NumeroFalla}
  </span>

  <span className="ml-3 text-sm text-red-900">
    Precio: {Number(sorteo.ImportePapeletaFalla || 0).toFixed(2)} €
    {" · "}
    Premio: {Number(sorteo.PremioFallaPorPapeleta || 0).toFixed(2)} €
  </span>
</div>

<div>
  <span className="text-xs uppercase text-zinc-500">
    Virgen
  </span>

  <span className="ml-2 text-xl font-bold text-blue-900">
    {sorteo.NumeroVirgen}
  </span>

  <span className="ml-3 text-sm text-blue-900">
    Precio: {Number(sorteo.ImportePapeletaVirgen || 0).toFixed(2)} €
    {" · "}
    Premio: {Number(sorteo.PremioVirgenPorPapeleta || 0).toFixed(2)} €
  </span>
</div>

              </div>
            )}
          </section>

          <section className="border border-zinc-200 bg-white">

          <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
  <h2 className="text-sm font-semibold uppercase text-zinc-700">
    Grupos de lotería
  </h2>

  <div className="flex flex-wrap justify-end gap-2 text-xs">
    <span className="text-zinc-600">Pap_F</span>
    <span className="bg-white px-2 py-1 font-semibold">{totalPapFalla}</span>

    <span className="text-zinc-600">Imp_F</span>
    <span className="bg-white px-2 py-1 font-semibold">{totalImpFalla.toFixed(2)} €</span>

    <span className="text-zinc-600">Pap_V</span>
    <span className="bg-white px-2 py-1 font-semibold">{totalPapVirgen}</span>

    <span className="text-zinc-600">Imp_V</span>
    <span className="bg-white px-2 py-1 font-semibold">{totalImpVirgen.toFixed(2)} €</span>

    <span className="text-zinc-600">Total</span>
<span className="bg-white px-2 py-1 font-semibold">
  {(totalImpFalla + totalImpVirgen).toFixed(2)} €
</span>

    <span className="text-zinc-600">Premio</span>
    <span className="bg-white px-2 py-1 font-semibold">{totalPremio.toFixed(2)} €</span>

    <span className="text-zinc-600">Pend.</span>
    <span className="bg-white px-2 py-1 font-semibold">{totalPendiente.toFixed(2)} €</span>
  </div>
</div>

<div className="border-b border-zinc-200 bg-white px-4 py-3">
  <input
    type="text"
    value={busqueda}
    onChange={(e) => setBusqueda(e.target.value)}
    placeholder="Buscar socio..."
    className="w-72 border border-zinc-300 px-3 py-2 text-sm"
  />
</div>

            <table className="min-w-full divide-y divide-zinc-200">

              <thead className="bg-zinc-50">
                <tr>
                <th className="w-96 px-4 py-2 text-left text-xs font-semibold uppercase">Responsable</th>
<th className="px-2 py-2 text-center text-xs font-semibold uppercase">Pap_F</th>
<th className="px-2 py-2 text-right text-xs font-semibold uppercase">Imp_F</th>
<th className="px-2 py-2 text-center text-xs font-semibold uppercase">Pap_V</th>
<th className="px-2 py-2 text-right text-xs font-semibold uppercase">Imp_V</th>
<th className="px-2 py-2 text-right text-xs font-semibold uppercase">
  Total
  <input
    title="Marcar todos como pagados"
    type="checkbox"
    className="ml-2"
    onChange={(e) => marcarTodosPagados(e.target.checked)}
  />
</th>
<th className="px-2 py-2 text-center text-xs font-semibold uppercase">Prem_F</th>
<th className="px-2 py-2 text-center text-xs font-semibold uppercase">Prem_V</th>
<th className="px-2 py-2 text-right text-xs font-semibold uppercase">
  Premio
  <input
  type="checkbox"
  disabled={!hayPremios}
  title="Marcar todos los premios como entregados"
  className="ml-2"
  onChange={(e) => marcarTodosPremios(e.target.checked)}
/>
</th>
<th className="px-2 py-2 text-right text-xs font-semibold uppercase">Saldo</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-200 bg-white">
  {gruposFiltrados.map((grupo, index) => {
    const pendiente = calcularPendiente(grupo);

    return (
      <tr key={grupo.ID}>
        <td
  className="w-[220px] max-w-[220px] cursor-pointer px-4 py-2 text-sm text-red-900 hover:underline"
  onClick={() =>
    router.push(`/loterias/socios-loteria/${grupo.ID}`)
  }
>
  {grupo.NombreCompleto}
</td>

        <td className="px-4 py-2 text-right text-sm">
          <input
            type="number"
            value={grupo.PapeletasFalla || 0}
            onChange={(e) =>
              actualizarGrupo(index, "PapeletasFalla", Number(e.target.value))
            }
            className="w-12 bg-transparent text-right text-sm focus:outline-none"
          />
        </td>

        <td className="px-2 py-2 text-right text-sm whitespace-nowrap">
          <input
            type="text"
            value={Number(grupo.ImporteFalla || 0).toFixed(2)}
            onChange={(e) =>
              actualizarGrupo(index, "ImporteFalla", Number(e.target.value))
            }
            className="w-10 bg-transparent text-right text-sm focus:outline-none"
          />
          <span className="ml-1 text-xs text-zinc-500">€</span>
        </td>

        <td className="px-4 py-2 text-right text-sm">
          <input
            type="number"
            value={grupo.PapeletasVirgen || 0}
            onChange={(e) =>
              actualizarGrupo(index, "PapeletasVirgen", Number(e.target.value))
            }
            className="w-12 bg-transparent text-right text-sm focus:outline-none"
          />
        </td>

        <td className="px-2 py-2 text-right text-sm whitespace-nowrap">
          <input
            type="text"
            value={Number(grupo.ImporteVirgen || 0).toFixed(2)}
            onChange={(e) =>
              actualizarGrupo(index, "ImporteVirgen", Number(e.target.value))
            }
            className="w-10 bg-transparent text-right text-sm focus:outline-none"
          />
          <span className="ml-1 text-xs text-zinc-500">€</span>
        </td>

        <td className="w-26 px-2 py-2 text-right text-sm whitespace-nowrap">
  <div className="flex items-center justify-end gap-1 whitespace-nowrap">
    <span>
      {(Number(grupo.ImporteFalla || 0) + Number(grupo.ImporteVirgen || 0)).toFixed(2)} €
    </span>

    <label title="Pagado" className="flex cursor-pointer items-center gap-1 text-xs text-zinc-500">
      
      <input
        type="checkbox"
        checked={grupo.PagadoConfirmado || false}
        onChange={(e) =>
          actualizarGrupo(index, "PagadoConfirmado", e.target.checked)
        }
      />
    </label>
  </div>
</td>

<td className="w-9 px-2 py-2 text-right text-sm">
  <input
    type="number"
    disabled={Number(sorteo?.PremioFallaPorPapeleta || 0) <= 0}
    value={grupo.PapeletasPremioFalla || 0}
    onChange={(e) =>
      actualizarGrupo(
        index,
        "PapeletasPremioFalla",
        Number(e.target.value)
      )
    }
    className="w-9 bg-transparent text-right text-sm focus:outline-none"
  />
</td>

<td className="w-9 px-2 py-2 text-right text-sm">
  <input
    type="number"
    disabled={Number(sorteo?.PremioVirgenPorPapeleta || 0) <= 0}
    value={grupo.PapeletasPremioVirgen || 0}
    onChange={(e) =>
      actualizarGrupo(
        index,
        "PapeletasPremioVirgen",
        Number(e.target.value)
      )
    }
    className="w-7 bg-transparent text-right text-sm focus:outline-none"
  />
</td>

<td className="w-16 px-2 py-2 text-right text-sm whitespace-nowrap">
  <div className="flex items-center justify-end gap-1 whitespace-nowrap">
    <input
      type="text"
      value={Number(grupo.ImportePremio || 0).toFixed(2)}
      onChange={(e) =>
        actualizarGrupo(index, "ImportePremio", Number(e.target.value))
      }
      className="w- bg-transparent text-right text-sm focus:outline-none"
    />
    <span className="text-xs text-zinc-500">€</span>

    <label
  title="Entregado"
  className={`flex items-center gap-1 text-xs ${
    Number(grupo.ImportePremio || 0) <= 0
      ? "cursor-not-allowed text-zinc-300"
      : "cursor-pointer text-zinc-500"
  }`}
>
  
    <input
  type="checkbox"
  disabled={Number(grupo.ImportePremio || 0) <= 0}
  checked={grupo.PremioEntregado || false}
  onChange={(e) =>
    actualizarGrupo(index, "PremioEntregado", e.target.checked)
  }
/>
    </label>
  </div>
</td>

<td
  className={`px-2 py-2 text-right text-sm font-semibold whitespace-nowrap ${
            pendiente > 0
              ? "text-red-700"
              : pendiente < 0
              ? "text-green-700"
              : "text-zinc-700"
          }`}
        >
          {pendiente.toFixed(2)} €
        </td>

      </tr>
    );
  })}
</tbody>

            </table>

          </section>

        </div>
      </main>
    </div>
  );
}