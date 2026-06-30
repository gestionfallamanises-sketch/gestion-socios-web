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

const [totalFalla, setTotalFalla] = useState(0);
const [totalVirgen, setTotalVirgen] = useState(0);

const [modalPos, setModalPos] = useState({ x: 160, y: 80 });
const [arrastrandoModal, setArrastrandoModal] = useState(false);
const [offsetModal, setOffsetModal] = useState({ x: 0, y: 0 });

function euros(valor: number) {
    return new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(valor || 0)) + " €";
  }

  const precioPapeletaVentaFalla =
  importePapeletaFalla + beneficioFalla;

const importePagoAdministracionFalla =
  decimosFalla * precioDecimoFalla;

const papeletasEmitidasFalla =
  importePapeletaFalla > 0
    ? Math.floor(importePagoAdministracionFalla / importePapeletaFalla)
    : 0;

  const restoSueltoFalla =
  importePagoAdministracionFalla -
  papeletasEmitidasFalla * importePapeletaFalla;


const papeletasSociosFalla = papeletasFalla;

const papeletasSobrantesFalla =
  Math.max(0, papeletasEmitidasFalla - papeletasSociosFalla);

  const jugadoFalla =
  papeletasSobrantesFalla * importePapeletaFalla +
  restoSueltoFalla; 

const recaudacionSociosFalla =
  papeletasSociosFalla * precioPapeletaVentaFalla;

const importeJugadoSociosFalla =
  papeletasSociosFalla * importePapeletaFalla;

const beneficioSociosFalla =
  papeletasSociosFalla * beneficioFalla;

const beneficioPremioFalla =
  papeletasSobrantesFalla * premioFallaPorPapeleta;



  const precioPapeletaVentaVirgen =
  importePapeletaVirgen + beneficioVirgen;

const importePagoAdministracionVirgen =
  decimosVirgen * precioDecimoVirgen;

const papeletasEmitidasVirgen =
  importePapeletaVirgen > 0
    ? Math.floor(importePagoAdministracionVirgen / importePapeletaVirgen)
    : 0;

  const restoSueltoVirgen =
  importePagoAdministracionVirgen -
  papeletasEmitidasVirgen * importePapeletaVirgen;


const papeletasSociosVirgen = papeletasVirgen;

const papeletasSobrantesVirgen =
  Math.max(0, papeletasEmitidasVirgen - papeletasSociosVirgen);

  const jugadoVirgen =
  papeletasSobrantesVirgen * importePapeletaVirgen +
  restoSueltoVirgen; 

const recaudacionSociosVirgen =
  papeletasSociosVirgen * precioPapeletaVentaVirgen;

const importeJugadoSociosVirgen =
  papeletasSociosVirgen * importePapeletaVirgen;

const beneficioSociosVirgen =
  papeletasSociosVirgen * beneficioVirgen;

const beneficioPremioVirgen =
  papeletasSobrantesVirgen * premioVirgenPorPapeleta;

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

  async function cargarTotalesSociosLoteria() {
    const { data, error } = await (supabase as any)
      .from("SOCIOS_LOTERIA")
      .select("PapeletasFalla, PapeletasVirgen");
  
    if (error) {
      alert(error.message);
      return;
    }
  
    const totalF = (data || []).reduce(
      (sum: number, grupo: any) => sum + Number(grupo.PapeletasFalla || 0),
      0
    );
  
    const totalV = (data || []).reduce(
      (sum: number, grupo: any) => sum + Number(grupo.PapeletasVirgen || 0),
      0
    );
  
    setTotalFalla(totalF);
    setTotalVirgen(totalV);
  
    setPapeletasFalla(totalF);
    setPapeletasVirgen(totalV);
  }

  async function cargarTotalesSorteo(idSorteo: number) {
    const { data, error } = await (supabase as any)
      .from("LOTERIA_SORTEOS_GRUPOS")
      .select("PapeletasFalla, PapeletasVirgen")
      .eq("IDSorteo", idSorteo);
  
    if (error) {
      alert(error.message);
      return;
    }
  
    const totalFalla = (data || []).reduce(
      (sum: number, fila: any) =>
        sum + Number(fila.PapeletasFalla || 0),
      0
    );
  
    const totalVirgen = (data || []).reduce(
      (sum: number, fila: any) =>
        sum + Number(fila.PapeletasVirgen || 0),
      0
    );
  
    setPapeletasFalla(totalFalla);
    setPapeletasVirgen(totalVirgen);
  }

  async function editarSorteo(sorteo: any) {
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
  
    await cargarTotalesSociosLoteria();
    
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
    setImportePapeletaFalla(1.6);
    setBeneficioFalla(0.4);
    setPremioFallaPorPapeleta(0);
  
    setNumeroVirgen("");
    setDecimosVirgen(0);
    setPrecioDecimoVirgen(0);
    setPapeletasVirgen(0);
    setSobrantesVirgen(0);
    setImportePapeletaVirgen(1.6);
    setBeneficioVirgen(0.4);
    setPremioVirgenPorPapeleta(0);
  }

  function formatearFecha(fecha: string) {
    const d = new Date(fecha);
  
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const anio = d.getFullYear();
  
    return `${dia}/${mes}/${anio}`;
  }

  function imprimirListadoSorteos() {
    router.push("/loterias/sorteos/imprimir")
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

    

    <div className="flex gap-2">
  <button
  onClick={() => router.push("/loterias/sorteos/imprimir")}
  className="bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
>
  Imprimir
</button>

<button
  onClick={() => router.push("/loterias/sorteos/excel")}
  className="bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
>
  Excel
</button>

  <button
    onClick={async () => {
      limpiarFormularioSorteo();
      await cargarTotalesSociosLoteria();
      setMostrarModal(true);
    }}
    className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
  >
    + Nuevo sorteo
  </button>
</div>
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
  Déc. F
</th>

<th className="px-4 py-2 text-left text-xs font-semibold uppercase">
  Virgen
</th>

<th className="px-4 py-2 text-right text-xs font-semibold uppercase">
  Déc. V
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
  {Number(sorteo.PrecioDecimoFalla || 0).toFixed(2)} €
</td>

<td className="px-4 py-2 text-sm">
            {sorteo.NumeroVirgen}
          </td>

          <td className="px-4 py-2 text-right text-sm">
  {Number(sorteo.PrecioDecimoVirgen || 0).toFixed(2)} €
</td>


<td className="px-4 py-2 text-center">
  <div className="flex justify-center gap-2">

    <button
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/loterias/sorteos/${sorteo.ID}`);
      }}
      title="Ver líneas de socios"
      className="rounded bg-zinc-100 px-2 py-1 text-sm hover:bg-zinc-200"
    >
      👥
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        editarSorteo(sorteo);
      }}
      title="Editar sorteo"
      className="rounded bg-zinc-100 px-2 py-1 text-sm hover:bg-zinc-200"
    >
      ✏️
    </button>

    <button
  onClick={(e) => {
    e.stopPropagation();
    router.push(`/loterias/sorteos/${sorteo.ID}/imprimir`);
  }}
  title="Imprimir ficha"
  className="rounded bg-zinc-100 px-2 py-1 text-sm hover:bg-zinc-200"
>
  🖨️
</button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        alert("Pendiente exportar Excel");
      }}
      title="Exportar Excel"
      className="rounded bg-zinc-100 px-2 py-1 text-sm hover:bg-zinc-200"
    >
      📗
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        eliminarSorteo(sorteo.ID);
      }}
      title="Eliminar"
      className="rounded bg-red-100 px-2 py-1 text-sm hover:bg-red-200"
    >
      🗑️
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
          <div
          className="fixed inset-0 z-50 bg-black/40"
          onMouseMove={(e) => {
            if (!arrastrandoModal) return;
        
            setModalPos({
              x: e.clientX - offsetModal.x,
              y: e.clientY - offsetModal.y,
            });
          }}
          onMouseUp={() => setArrastrandoModal(false)}
        >
          <div
            className="absolute w-full max-w-6xl border border-zinc-200 bg-white shadow-xl"
            style={{
              left: modalPos.x,
              top: modalPos.y,
            }}
          >
            <div
  className="cursor-move border-b border-zinc-200 px-6 py-3"
  onMouseDown={(e) => {
    setArrastrandoModal(true);
    setOffsetModal({
      x: e.clientX - modalPos.x,
      y: e.clientY - modalPos.y,
    });
  }}
>
  <div className="flex items-center justify-between gap-4">
    <h2 className="text-lg font-semibold">
      {sorteoEditando ? "Editar sorteo" : "Nuevo sorteo"}
    </h2>

    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-zinc-700">
        Fecha
      </label>

      <input
        type="date"
        value={fechaSorteo}
        onChange={(e) => setFechaSorteo(e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-40 border border-zinc-300 px-2 py-1 text-sm"
      />
    </div>
  </div>
</div>

              <div className="space-y-3 p-4">

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
  <label className="text-sm">Papeletas emitidas</label>
  <input
    type="number"
    value={papeletasEmitidasFalla}
readOnly
    className="w-24 border border-zinc-300 bg-zinc-100 px-2 py-1 text-right text-sm"
  />
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Precio papeleta venta</label>
  <div className="flex items-center">
    <input
      type="number"
      step="0.01"
      value={(importePapeletaFalla + beneficioFalla).toFixed(2)}
      readOnly
      className="w-24 border border-zinc-300 bg-zinc-100 px-2 py-1 text-right text-sm"
    />
    <span className="ml-2 text-sm">€</span>
  </div>
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Papeletas socios</label>
  <input
    type="number"
    value={papeletasFalla || 0}
    onChange={(e) => setPapeletasFalla(Number(e.target.value))}
    className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
  />
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Importe jugado</label>
  <div className="flex items-center">
  <input
  type="number"
  step="0.01"
  value={importePapeletaFalla}
  onChange={(e) => setImportePapeletaFalla(Number(e.target.value))}
  className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
/>
    <span className="ml-2 text-sm">€</span>
  </div>
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Papeletas sobrantes</label>
  <input
    type="number"
    value={papeletasSobrantesFalla}
readOnly
    onChange={(e) => setSobrantesFalla(Number(e.target.value))}
    className="w-24 border border-zinc-300 bg-zinc-100 px-2 py-1 text-right text-sm"
  />
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Beneficio papeleta</label>
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
  <label className="text-sm">Premio papeletas</label>
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
  <span>Recaudación socios</span>
  <span className="font-semibold">{euros(recaudacionSociosFalla)}</span>
</div>

<div className="flex items-center justify-between">
  <span>Pago administración</span>
  <span className="font-semibold">
    {euros(importePagoAdministracionFalla)}
  </span>
</div>

<div className="flex items-center justify-between">
  <span>Importe jugado socios</span>
  <span className="font-semibold">{euros(importeJugadoSociosFalla)}</span>
</div>

<div className="flex items-center justify-between">
  <div>
    <div>Jugado falla</div>
    <div className="text-xs text-zinc-500">
      Sobrantes + resto sobrante
    </div>
  </div>

  <span className="font-semibold">
    {euros(jugadoFalla)}
  </span>
</div>

<div className="flex items-center justify-between">
  <span>Beneficio socios</span>
  <span className="font-semibold">{euros(beneficioSociosFalla)}</span>
</div>

<div className="flex items-center justify-between">
  <span>Beneficio premio sobrantes</span>
  <span className="font-semibold">{euros(beneficioPremioFalla)}</span>
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
  <label className="text-sm">Papeletas emitidas</label>
  <input
    type="number"
    value={papeletasEmitidasVirgen}
readOnly
    className="w-24 border border-zinc-300 bg-zinc-100 px-2 py-1 text-right text-sm"
  />
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Precio papeleta venta</label>
  <div className="flex items-center">
    <input
      type="number"
      step="0.01"
      value={(importePapeletaVirgen + beneficioVirgen).toFixed(2)}
      readOnly
      className="w-24 border border-zinc-300 bg-zinc-100 px-2 py-1 text-right text-sm"
    />
    <span className="ml-2 text-sm">€</span>
  </div>
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Papeletas socios</label>
  <input
    type="number"
    value={papeletasVirgen || 0}
    onChange={(e) => setPapeletasVirgen(Number(e.target.value))}
    className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
  />
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Importe jugado</label>
  <div className="flex items-center">
  <input
  type="number"
  step="0.01"
  value={importePapeletaVirgen}
  onChange={(e) => setImportePapeletaVirgen(Number(e.target.value))}
  className="w-24 border border-zinc-300 px-2 py-1 text-right text-sm"
/>
    <span className="ml-2 text-sm">€</span>
  </div>
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Papeletas sobrantes</label>
  <input
    type="number"
    value={papeletasSobrantesVirgen}
readOnly
    onChange={(e) => setSobrantesVirgen(Number(e.target.value))}
    className="w-24 border border-zinc-300 bg-zinc-100 px-2 py-1 text-right text-sm"
  />
</div>

<div className="flex items-center justify-between">
  <label className="text-sm">Beneficio papeleta</label>
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
  <label className="text-sm">Premio papeletas</label>
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
  <span>Recaudación socios</span>
  <span className="font-semibold">{euros(recaudacionSociosVirgen)}</span>
</div>

<div className="flex items-center justify-between">
  <span>Pago administración</span>
  <span className="font-semibold">
    {euros(importePagoAdministracionVirgen)}
  </span>
</div>

<div className="flex items-center justify-between">
  <span>Importe jugado socios</span>
  <span className="font-semibold">{euros(importeJugadoSociosVirgen)}</span>
</div>

<div className="flex items-center justify-between">
  <div>
    <div>Jugado falla</div>
    <div className="text-xs text-zinc-500">
      Sobrantes + resto sobrante
    </div>
  </div>

  <span className="font-semibold">
    {euros(jugadoVirgen)}
  </span>
</div>

<div className="flex items-center justify-between">
  <span>Beneficio socios</span>
  <span className="font-semibold">{euros(beneficioSociosVirgen)}</span>
</div>

<div className="flex items-center justify-between">
  <span>Beneficio premio sobrantes</span>
  <span className="font-semibold">{euros(beneficioPremioVirgen)}</span>
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