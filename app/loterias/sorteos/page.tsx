"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ControlSemanalPage() {
    const router = useRouter();

  const [mostrarModal, setMostrarModal] = useState(false);
  const [fechaSorteo, setFechaSorteo] = useState("");

const [numeroFalla, setNumeroFalla] = useState("");
const [decimosFalla, setDecimosFalla] = useState(0);
const [precioDecimoFalla, setPrecioDecimoFalla] = useState(0);
const [papeletasFalla, setPapeletasFalla] = useState(0);
const [sobrantesFalla, setSobrantesFalla] = useState(0);
const [importePapeletaFalla, setImportePapeletaFalla] = useState(0);
const [beneficioFalla, setBeneficioFalla] = useState(0);

const [numeroVirgen, setNumeroVirgen] = useState("");
const [decimosVirgen, setDecimosVirgen] = useState(0);
const [precioDecimoVirgen, setPrecioDecimoVirgen] = useState(0);
const [papeletasVirgen, setPapeletasVirgen] = useState(0);
const [sobrantesVirgen, setSobrantesVirgen] = useState(0);
const [importePapeletaVirgen, setImportePapeletaVirgen] = useState(0);
const [beneficioVirgen, setBeneficioVirgen] = useState(0);
const [sorteos, setSorteos] = useState<any[]>([]);
const [sorteoEditando, setSorteoEditando] = useState<any | null>(null);
const [premioFallaPorPapeleta, setPremioFallaPorPapeleta] = useState(0);
const [premioVirgenPorPapeleta, setPremioVirgenPorPapeleta] = useState(0);

function euros(valor: number) {
    return new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(valor || 0)) + " €";
  }

  const importeJugadoFalla = decimosFalla * precioDecimoFalla;
const recaudacionMaxFalla = papeletasFalla * importePapeletaFalla;
const papeletasVendidasFalla = papeletasFalla - sobrantesFalla;
const beneficioRealFalla = papeletasVendidasFalla * beneficioFalla;

const importeJugadoVirgen = decimosVirgen * precioDecimoVirgen;
const recaudacionMaxVirgen = papeletasVirgen * importePapeletaVirgen;
const papeletasVendidasVirgen = papeletasVirgen - sobrantesVirgen;
const beneficioRealVirgen = papeletasVendidasVirgen * beneficioVirgen;

useEffect(() => {
    cargarSorteos();
  }, []);

  async function guardarSorteo() {
    if (!fechaSorteo) {
      alert("Selecciona la fecha del sorteo.");
      return;
    }
  
    const datos = {
      Ejercicio: 2027,
      FechaSorteo: fechaSorteo,
  
      NumeroFalla: numeroFalla,
      DecimosFalla: decimosFalla,
      PrecioDecimoFalla: precioDecimoFalla,
      PapeletasTotalesFalla: papeletasFalla,
      SobrantesFalla: sobrantesFalla,
      ImportePapeletaFalla: importePapeletaFalla,
      BeneficioFalla: beneficioFalla,
      PremioFallaPorPapeleta: premioFallaPorPapeleta,
  
      NumeroVirgen: numeroVirgen,
      DecimosVirgen: decimosVirgen,
      PrecioDecimoVirgen: precioDecimoVirgen,
      PapeletasTotalesVirgen: papeletasVirgen,
      SobrantesVirgen: sobrantesVirgen,
      ImportePapeletaVirgen: importePapeletaVirgen,
      BeneficioVirgen: beneficioVirgen,
      PremioVirgenPorPapeleta: premioVirgenPorPapeleta,
  
      Activo: true,
    };
  
    let error;
  
    if (sorteoEditando) {
      ({ error } = await (supabase as any)
        .from("LOTERIA_SORTEOS")
        .update(datos)
        .eq("ID", sorteoEditando.ID));
    } else {
      ({ error } = await (supabase as any)
        .from("LOTERIA_SORTEOS")
        .insert(datos));
    }
  
    if (error) {
      alert(error.message);
      return;
    }
  
    alert(sorteoEditando ? "Sorteo actualizado correctamente" : "Sorteo guardado correctamente");
  
    cargarSorteos();
limpiarFormularioSorteo();
setMostrarModal(false);
  }

  async function cargarSorteos() {
    const { data, error } = await (supabase as any)
      .from("LOTERIA_SORTEOS")
      .select("*")
      .order("FechaSorteo", { ascending: false });
  
    if (error) {
      alert(error.message);
      return;
    }
  
    setSorteos(data || []);
  }

  function editarSorteo(sorteo: any) {
    setSorteoEditando(sorteo);
    setFechaSorteo(sorteo.FechaSorteo || "");
  
    setNumeroFalla(sorteo.NumeroFalla || "");
    setDecimosFalla(Number(sorteo.DecimosFalla || 0));
    setPrecioDecimoFalla(Number(sorteo.PrecioDecimoFalla || 0));
    setPapeletasFalla(Number(sorteo.PapeletasTotalesFalla || 0));
    setSobrantesFalla(Number(sorteo.SobrantesFalla || 0));
    setImportePapeletaFalla(Number(sorteo.ImportePapeletaFalla || 0));
    setBeneficioFalla(Number(sorteo.BeneficioFalla || 0));
    setPremioFallaPorPapeleta(Number(sorteo.PremioFallaPorPapeleta || 0));
  
    setNumeroVirgen(sorteo.NumeroVirgen || "");
    setDecimosVirgen(Number(sorteo.DecimosVirgen || 0));
    setPrecioDecimoVirgen(Number(sorteo.PrecioDecimoVirgen || 0));
    setPapeletasVirgen(Number(sorteo.PapeletasTotalesVirgen || 0));
    setSobrantesVirgen(Number(sorteo.SobrantesVirgen || 0));
    setImportePapeletaVirgen(Number(sorteo.ImportePapeletaVirgen || 0));
    setBeneficioVirgen(Number(sorteo.BeneficioVirgen || 0));
    setPremioVirgenPorPapeleta(Number(sorteo.PremioVirgenPorPapeleta || 0));
  
    setMostrarModal(true);
  }

  async function eliminarSorteo(id: number) {
    const confirmar = confirm(
      "¿Seguro que quieres eliminar este sorteo?"
    );
  
    if (!confirmar) return;
  
    const { error: errorGrupos } = await (supabase as any)
      .from("LOTERIA_SORTEOS_GRUPOS")
      .delete()
      .eq("IDSorteo", id);
  
    if (errorGrupos) {
      alert(errorGrupos.message);
      return;
    }
  
    const { error: errorSorteo } = await (supabase as any)
      .from("LOTERIA_SORTEOS")
      .delete()
      .eq("ID", id);
  
    if (errorSorteo) {
      alert(errorSorteo.message);
      return;
    }
  
    cargarSorteos();
  }

  function limpiarFormularioSorteo() {
    setSorteoEditando(null);
    setFechaSorteo("");
  
    setNumeroFalla("");
    setDecimosFalla(0);
    setPrecioDecimoFalla(0);
    setPapeletasFalla(0);
    setSobrantesFalla(0);
    setImportePapeletaFalla(0);
    setBeneficioFalla(0);
    setPremioFallaPorPapeleta(0);
  
    setNumeroVirgen("");
    setDecimosVirgen(0);
    setPrecioDecimoVirgen(0);
    setPapeletasVirgen(0);
    setSobrantesVirgen(0);
    setImportePapeletaVirgen(0);
    setBeneficioVirgen(0);
    setPremioVirgenPorPapeleta(0);
  }

  function formatearFecha(fecha: string) {
    const d = new Date(fecha);
  
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const anio = d.getFullYear();
  
    return `${dia}/${mes}/${anio}`;
  }

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-7xl">

        <div className="mb-4">
  <button
    onClick={() => router.push("/loterias")}
    className="text-sm font-medium text-red-900 hover:underline"
  >
    ← Volver a loterías
  </button>
</div>

        <section className="mb-6 border border-zinc-200 bg-white p-6">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">
        Sorteos
      </h1>

      <p className="mt-2 text-sm text-zinc-600">
        Gestión de sorteos y resultados.
      </p>
    </div>

    <button
      onClick={() => {
        limpiarFormularioSorteo();
        setMostrarModal(true);
      }}
      className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
    >
      + Nuevo sorteo
    </button>
  </div>
</section>

          <section className="border border-zinc-200 bg-white">
            <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  Sorteos
                </h2>

                <p className="text-xs text-zinc-500">
                  Fechas de sorteo configuradas
                </p>
              </div>
            </div>

            {sorteos.length === 0 ? (
  <div className="px-4 py-12 text-center text-sm text-zinc-500">
    Todavía no hay sorteos creados.
  </div>
) : (
  <table className="min-w-full divide-y divide-zinc-200">
    <thead className="bg-zinc-100">
      <tr>
        <th className="px-4 py-2 text-left text-xs font-semibold uppercase">
          Fecha
        </th>

        <th className="px-4 py-2 text-left text-xs font-semibold uppercase">
          Falla
        </th>

        <th className="px-4 py-2 text-right text-xs font-semibold uppercase">
  Pap. Falla
</th>

<th className="px-4 py-2 text-right text-xs font-semibold uppercase">
  Déc. Falla
</th>

<th className="px-4 py-2 text-left text-xs font-semibold uppercase">
          Virgen
        </th>

<th className="px-4 py-2 text-right text-xs font-semibold uppercase">
  Pap. Virgen
</th>

<th className="px-4 py-2 text-right text-xs font-semibold uppercase">
  Déc. Virgen
</th>

        <th className="px-4 py-2 text-center text-xs font-semibold uppercase">
  Acciones
</th>
      </tr>
    </thead>

    <tbody className="divide-y divide-zinc-200 bg-white">
      {sorteos.map((sorteo) => (
        <tr
  key={sorteo.ID}
  className="hover:bg-zinc-50"
  >
          <td
  className="cursor-pointer px-4 py-2 text-sm text-red-900 hover:underline"
  onClick={() =>
    router.push(`/loterias/sorteos/${sorteo.ID}`)
  }
>
  {formatearFecha(sorteo.FechaSorteo)}
</td>

          <td className="px-4 py-2 text-sm">
            {sorteo.NumeroFalla}
          </td>

          <td className="px-4 py-2 text-right text-sm">
  {Number(sorteo.ImportePapeletaFalla || 0).toFixed(2)} €
</td>

<td className="px-4 py-2 text-right text-sm">
  {Number(sorteo.PrecioDecimoFalla || 0).toFixed(2)} €
</td>

<td className="px-4 py-2 text-sm">
            {sorteo.NumeroVirgen}
          </td>

<td className="px-4 py-2 text-right text-sm">
  {Number(sorteo.ImportePapeletaVirgen || 0).toFixed(2)} €
</td>

<td className="px-4 py-2 text-right text-sm">
  {Number(sorteo.PrecioDecimoVirgen || 0).toFixed(2)} €
</td>


          <td className="px-4 py-2 text-center">
          <div className="flex justify-center gap-3">

  <button
    onClick={(e) => {
      e.stopPropagation();
      editarSorteo(sorteo);
    }}
    className="text-sm font-medium text-red-900 hover:underline"
  >
    Editar sorteo
  </button>

  <button
    onClick={(e) => {
      e.stopPropagation();
      eliminarSorteo(sorteo.ID);
    }}
    className="text-sm font-medium text-red-700 hover:underline"
  >
    Eliminar
  </button>
</div>
</td>
        </tr>
      ))}
    </tbody>
  </table>
)}
          </section>
        </div>

        {mostrarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-4xl border border-zinc-200 bg-white shadow-xl">
            <div className="border-b border-zinc-200 px-6 py-4">
  <h2 className="text-lg font-semibold">
    {sorteoEditando ? "Editar sorteo" : "Nuevo sorteo"}
  </h2>
</div>

              <div className="space-y-4 p-6">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">
                    Fecha del sorteo
                  </label>
                  <input
  type="date"
  value={fechaSorteo}
  onChange={(e) => setFechaSorteo(e.target.value)}
  className="w-full border border-zinc-300 px-3 py-2 text-sm"
/>
                </div>

                <div className="grid grid-cols-2 gap-6">

                <div className="border border-zinc-200 p-4">

<div className="mb-4 flex items-center justify-between">
  <h3 className="font-semibold text-red-900">
    Falla
  </h3>

  <input
  type="text"
  value={numeroFalla || ""}
  onChange={(e) => setNumeroFalla(e.target.value)}
  className="w-36 border border-zinc-300 px-2 py-1 text-center text-2xl font-bold tracking-wider"
/>
</div>

<div className="grid grid-cols-2 gap-x-8 gap-y-3">

  {/* CANTIDADES */}

  <div className="flex items-center justify-between">
    <label className="text-sm">Nº Décimos</label>
    <input
  type="number"
  value={decimosFalla || 0}
  onChange={(e) => setDecimosFalla(Number(e.target.value))}
  className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
/>
  </div>

  {/* IMPORTES */}

  <div className="flex items-center justify-between">
    <label className="text-sm">Precio décimo</label>

    <div className="flex items-center">
    <input
  type="number"
  step="0.01"
  value={precioDecimoFalla || 0}
  onChange={(e) => setPrecioDecimoFalla(Number(e.target.value))}
  className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
/>
      <span className="ml-2 text-sm">€</span>
    </div>
  </div>

  <div className="flex items-center justify-between">
    <label className="text-sm">Papeletas</label>
    <input
  type="number"
  value={papeletasFalla || 0}
  onChange={(e) => setPapeletasFalla(Number(e.target.value))}
  className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
/>
  </div>

  <div className="flex items-center justify-between">
    <label className="text-sm">Importe papeleta</label>

    <div className="flex items-center">
    <input
  type="number"
  step="0.01"
  value={importePapeletaFalla || 0}
  onChange={(e) => setImportePapeletaFalla(Number(e.target.value))}
  className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
/>
      <span className="ml-2 text-sm">€</span>
    </div>
  </div>

  <div className="flex items-center justify-between">
    <label className="text-sm">Sobrantes</label>
    <input
  type="number"
  value={sobrantesFalla || 0}
  onChange={(e) => setSobrantesFalla(Number(e.target.value))}
  className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
/>
  </div>

  <div className="flex items-center justify-between">
    <label className="text-sm">Beneficio pap.</label>

    <div className="flex items-center">
    <input
  type="number"
  step="0.01"
  value={beneficioFalla || 0}
  onChange={(e) => setBeneficioFalla(Number(e.target.value))}
  className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
/>
      <span className="ml-2 text-sm">€</span>
    </div>
  </div>

  <div className="flex items-center justify-between">
  <label className="text-sm">Premio pap.</label>

  <div className="flex items-center">
    <input
      type="number"
      step="0.01"
      value={premioFallaPorPapeleta || 0}
      onChange={(e) => setPremioFallaPorPapeleta(Number(e.target.value))}
      className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
    />
    <span className="ml-2 text-sm">€</span>
  </div>
</div>

</div>

<hr className="my-4" />

<div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">

  <div className="flex items-center justify-between">
    <span>Importe jugado</span>
    <span className="font-semibold">{euros(importeJugadoFalla)}</span>
  </div>

  <div className="flex items-center justify-between">
    <span>Recaudación máx.</span>
    <span className="font-semibold">{euros(recaudacionMaxFalla)}</span>
  </div>

  <div className="flex items-center justify-between">
    <span>Papeletas vendidas</span>
    <span className="font-semibold">{papeletasVendidasFalla}</span>
  </div>

  <div className="flex items-center justify-between">
    <span>Beneficio real</span>
    <span className="font-semibold">{euros(beneficioRealFalla)}</span>
  </div>

</div>

</div>

<div className="border border-zinc-200 p-4">

<div className="mb-4 flex items-center justify-between">
  <h3 className="font-semibold text-blue-900">
    Virgen
  </h3>

  <input
  type="text"
  value={numeroVirgen || ""}
  onChange={(e) => setNumeroVirgen(e.target.value)}
  className="w-36 border border-zinc-300 px-2 py-1 text-center text-2xl font-bold tracking-wider"
/>
</div>

<div className="grid grid-cols-2 gap-x-8 gap-y-3">

  {/* CANTIDADES */}

  <div className="flex items-center justify-between">
    <label className="text-sm">Nº Décimos</label>
    <input
  type="number"
  value={decimosVirgen || 0}
  onChange={(e) => setDecimosVirgen(Number(e.target.value))}
  className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
/>
  </div>

  {/* IMPORTES */}

  <div className="flex items-center justify-between">
    <label className="text-sm">Precio décimo</label>

    <div className="flex items-center">
    <input
  type="number"
  step="0.01"
  value={precioDecimoVirgen || 0}
  onChange={(e) => setPrecioDecimoVirgen(Number(e.target.value))}
  className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
/>
      <span className="ml-2 text-sm">€</span>
    </div>
  </div>

  <div className="flex items-center justify-between">
    <label className="text-sm">Papeletas</label>
    <input
  type="number"
  value={papeletasVirgen || 0}
  onChange={(e) => setPapeletasVirgen(Number(e.target.value))}
  className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
/>
  </div>

  <div className="flex items-center justify-between">
    <label className="text-sm">Importe papeleta</label>

    <div className="flex items-center">
    <input
  type="number"
  step="0.01"
  value={importePapeletaVirgen || 0}
  onChange={(e) => setImportePapeletaVirgen(Number(e.target.value))}
  className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
/>
      <span className="ml-2 text-sm">€</span>
    </div>
  </div>

  <div className="flex items-center justify-between">
    <label className="text-sm">Sobrantes</label>
    <input
  type="number"
  value={sobrantesVirgen || 0}
  onChange={(e) => setSobrantesVirgen(Number(e.target.value))}
  className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
/>
  </div>

  <div className="flex items-center justify-between">
    <label className="text-sm">Beneficio pap.</label>

    <div className="flex items-center">
    <input
  type="number"
  step="0.01"
  value={beneficioVirgen || 0}
  onChange={(e) => setBeneficioVirgen(Number(e.target.value))}
  className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
/>
      <span className="ml-2 text-sm">€</span>
    </div>
  </div>

  <div className="flex items-center justify-between">
  <label className="text-sm">Premio pap.</label>

  <div className="flex items-center">
    <input
      type="number"
      step="0.01"
      value={premioVirgenPorPapeleta || 0}
      onChange={(e) => setPremioVirgenPorPapeleta(Number(e.target.value))}
      className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
    />
    <span className="ml-2 text-sm">€</span>
  </div>
</div>

</div>

<hr className="my-4" />

<div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">

  <div className="flex items-center justify-between">
    <span>Importe jugado</span>
    <span className="font-semibold">
  {euros(importeJugadoVirgen)}
</span>
  </div>

  <div className="flex items-center justify-between">
    <span>Recaudación máx.</span>
    <span className="font-semibold">
  {euros(recaudacionMaxVirgen)}
</span>
  </div>

  <div className="flex items-center justify-between">
    <span>Papeletas vendidas</span>
    <span className="font-semibold">
  {papeletasVendidasVirgen}
</span>
  </div>

  <div className="flex items-center justify-between">
    <span>Beneficio real</span>
    <span className="font-semibold">
  {euros(beneficioRealVirgen)}
</span>
  </div>

</div>

</div>

</div>
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-200 px-6 py-4">
                <button
                  onClick={() => setMostrarModal(false)}
                  className="bg-zinc-300 px-4 py-2 text-sm"
                >
                  Cancelar
                </button>

                <button
  onClick={guardarSorteo}
  className="bg-red-900 px-4 py-2 text-sm text-white hover:bg-red-950"
>
  Guardar
</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}