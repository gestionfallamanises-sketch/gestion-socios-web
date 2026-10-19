"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { normalizarTexto } from "@/lib/texto";

function normalizar(texto: string) {
  return normalizarTexto(texto);
}

export default function SorteoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");

  const [sorteo, setSorteo] = useState<any>(null);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);

  const [mostrarModalParticipante, setMostrarModalParticipante] = useState(false);
const [busquedaParticipante, setBusquedaParticipante] = useState("");
const [sociosParticipante, setSociosParticipante] = useState<any[]>([]);
const [participanteSeleccionado, setParticipanteSeleccionado] = useState<any>(null);
const [nuevasPapeletasFalla, setNuevasPapeletasFalla] = useState(0);
const [nuevasPapeletasVirgen, setNuevasPapeletasVirgen] = useState(0);

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

const numcensResponsables = (gruposData || [])
.filter(
  (g: any) =>
    g.NUMCENS_Responsable !== null &&
    g.NUMCENS_Responsable !== undefined &&
    g.NUMCENS_Responsable !== "null"
)
.map((g: any) => Number(g.NUMCENS_Responsable));

let sociosData: any[] = [];

if (numcensResponsables.length > 0) {
const { data, error: errorSocios } = await (supabase as any)
  .from("SOCIOS")
  .select("NUMCENS, Apellidos, Nombre")
  .in("NUMCENS", numcensResponsables);

if (errorSocios) {
  alert("Error cargando responsables: " + errorSocios.message);
  return;
}

sociosData = data || [];
}
  
const gruposConNombre = (movimientosData || []).map((movimiento: any) => {
  const grupo =
    (gruposData || []).find(
      (g: any) =>
        Number(g.ID) === Number(movimiento.IDGrupoLoteria)
    ) || {};

  const socio = sociosData?.find(
    (s: any) =>
      Number(s.NUMCENS) ===
      Number(
        movimiento.NUMCENS_Responsable ??
          grupo.NUMCENS_Responsable
      )
  );
      
      return {
        ...grupo,
      
        NombreCompleto:
  movimiento?.NombreParticipante ||
  (grupo.EsExterno
    ? grupo.NombreExterno || "Externo"
    : socio
    ? `${socio.Apellidos}, ${socio.Nombre}`
    : ""),

    ResponsableExtra: movimiento.EsExterno
    ? "EXT"
    : movimiento.NUMCENS_Responsable
    ? String(movimiento.NUMCENS_Responsable)
    : "",
  
  ResponsableOrden:
    movimiento.NombreParticipante ||
    (socio
      ? `${socio.Apellidos || ""} ${socio.Nombre || ""}`
      : ""),
      
  PapeletasFalla: Number(movimiento.PapeletasFalla || 0),

    ImporteFalla: Number(movimiento?.ImporteFalla || 0),

    PapeletasVirgen: Number(movimiento.PapeletasVirgen || 0),
          
        ImporteVirgen: Number(movimiento?.ImporteVirgen || 0),
          
          ImportePagado: movimiento?.ImportePagado ?? 0,

          PapeletasPremioFalla:
  Number(sorteoData.PremioFallaPorPapeleta || 0) > 0
    ? Number(movimiento?.PapeletasPremioFalla || 0)
    : 0,

    PapeletasPremioVirgen:
  Number(sorteoData.PremioVirgenPorPapeleta || 0) > 0
    ? Number(movimiento?.PapeletasPremioVirgen || 0)
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
          IDLinea: movimiento.ID,
          IDGrupoLoteria: movimiento.IDGrupoLoteria ?? null,
      };
    });
  
    setGrupos(
      gruposConNombre.sort((a: any, b: any) =>
        normalizarTexto(a.ResponsableOrden || "").localeCompare(
          normalizarTexto(b.ResponsableOrden || "")
        )
      )
    );
  }

  async function abrirModalParticipante() {
    const { data, error } = await (supabase as any)
      .from("SOCIOS")
      .select("NUMCENS, Apellidos, Nombre")
      .order("Apellidos", { ascending: true });
  
    if (error) {
      alert("Error cargando socios: " + error.message);
      return;
    }
  
    setSociosParticipante(data || []);
    setBusquedaParticipante("");
    setParticipanteSeleccionado(null);
    setNuevasPapeletasFalla(0);
    setNuevasPapeletasVirgen(0);
    setMostrarModalParticipante(true);
  }
  async function guardarNuevoParticipante() {
    if (!participanteSeleccionado || !sorteo) return;
  
    const yaExiste = grupos.some(
      (grupo: any) =>
        Number(grupo.NUMCENS_Responsable) ===
        Number(participanteSeleccionado.NUMCENS)
    );
  
    if (yaExiste) {
      alert("Este socio ya participa en este sorteo.");
      return;
    }
  
    const precioFalla =
      Number(sorteo.ImportePapeletaFalla || 0) +
      Number(sorteo.BeneficioFalla || 0);
  
    const precioVirgen =
      Number(sorteo.ImportePapeletaVirgen || 0) +
      Number(sorteo.BeneficioVirgen || 0);
  
    const papeletasVirgen =
      sorteo.TipoSorteo === "ESPECIAL"
        ? 0
        : nuevasPapeletasVirgen;
  
        const { data: detalleSocio } = await (supabase as any)
  .from("SOCIOS_LOTERIA_DETALLE")
  .select("IDSocioLoteria")
  .eq(
    "NUMCENS",
    Number(participanteSeleccionado.NUMCENS)
  )
  .limit(1)
  .maybeSingle();

const idGrupoLoteria = detalleSocio?.IDSocioLoteria
  ? Number(detalleSocio.IDSocioLoteria)
  : null;

    const { error } = await (supabase as any)
      .from("LOTERIA_SORTEOS_GRUPOS")
      .insert({
        IDSorteo: Number(params.id),
        IDGrupoLoteria: idGrupoLoteria,
  
        NUMCENS_Responsable: participanteSeleccionado.NUMCENS,
  
        NombreParticipante:
          `${participanteSeleccionado.Apellidos}, ${participanteSeleccionado.Nombre}`,
  
        EsExterno: false,
  
        PapeletasFalla: nuevasPapeletasFalla,
        PapeletasVirgen: papeletasVirgen,
  
        ImporteFalla: Number(
          (nuevasPapeletasFalla * precioFalla).toFixed(2)
        ),
  
        ImporteVirgen: Number(
          (papeletasVirgen * precioVirgen).toFixed(2)
        ),
  
        ImportePagado: 0,
        PagadoConfirmado: false,
  
        PapeletasPremioFalla: nuevasPapeletasFalla,
        PapeletasPremioVirgen: papeletasVirgen,
  
        ImportePremio:
          nuevasPapeletasFalla *
            Number(sorteo.PremioFallaPorPapeleta || 0) +
          papeletasVirgen *
            Number(sorteo.PremioVirgenPorPapeleta || 0),
  
        PremioEntregado: false,
      });
  
    if (error) {
      alert("Error añadiendo participante: " + error.message);
      return;
    }
  
    setMostrarModalParticipante(false);
    await cargarDatos();
  }

  async function eliminarParticipanteSorteo(grupo: any) {
    const confirmar = confirm(
      `¿Quitar a ${grupo.NombreCompleto || "este participante"} de este sorteo?`
    );
  
    if (!confirmar) return;
  
    const { error } = await (supabase as any)
      .from("LOTERIA_SORTEOS_GRUPOS")
      .delete()
      .eq("ID", Number(grupo.IDLinea));
  
    if (error) {
      alert("Error eliminando participante: " + error.message);
      return;
    }
  
    const nuevos = grupos.filter(
      (g: any) => Number(g.IDLinea) !== Number(grupo.IDLinea)
    );
  
    setGrupos(nuevos);
    await actualizarTotalesSorteoPadre(nuevos);
  }

  function actualizarGrupo(idGrupo: number, campo: string, valor: any) {
    if (
      campo === "PapeletasFalla" ||
      campo === "PapeletasVirgen" ||
      campo === "PapeletasPremioFalla" ||
      campo === "PapeletasPremioVirgen"
    ) {
      valor = Math.max(0, Number(valor || 0));
    }
    setGrupos((prev) => {
      const nuevos = prev.map((grupo) => {
        const idActual = Number(grupo.IDLinea);
  
        if (idActual !== Number(idGrupo)) return grupo;
  
        const actualizado = {
          ...grupo,
          [campo]: valor,
        };
  
        const totalAPagar =
  Number(actualizado.ImporteFalla || 0) +
  Number(actualizado.ImporteVirgen || 0);

if (campo === "ImportePagado") {
  actualizado.ImportePagado = Math.min(
    totalAPagar,
    Math.max(0, Number(valor || 0))
  );

  actualizado.PagadoConfirmado =
    totalAPagar > 0 &&
    actualizado.ImportePagado >= totalAPagar;
}

if (campo === "PagadoConfirmado") {
  actualizado.ImportePagado = valor ? totalAPagar : 0;
}

        const precioVentaFalla =
          Number(sorteo?.ImportePapeletaFalla || 0) +
          Number(sorteo?.BeneficioFalla || 0);
  
        const precioVentaVirgen =
          Number(sorteo?.ImportePapeletaVirgen || 0) +
          Number(sorteo?.BeneficioVirgen || 0);
  
        if (campo === "PapeletasFalla") {
          actualizado.ImporteFalla =
            Number(valor || 0) * precioVentaFalla;
        }
  
        if (campo === "PapeletasVirgen") {
          actualizado.ImporteVirgen =
            Number(valor || 0) * precioVentaVirgen;
        }
  
        if (
          campo === "PapeletasPremioFalla" ||
          campo === "PapeletasPremioVirgen" ||
          campo === "PapeletasFalla" ||
          campo === "PapeletasVirgen"
        ) {
          actualizado.ImportePremio =
            Number(actualizado.PapeletasPremioFalla || 0) *
              Number(sorteo?.PremioFallaPorPapeleta || 0) +
            Number(actualizado.PapeletasPremioVirgen || 0) *
              Number(sorteo?.PremioVirgenPorPapeleta || 0);
        }
  
        guardarGrupo(actualizado, false);
  
        return actualizado;
      });
  
      actualizarTotalesSorteoPadre(nuevos);

      return nuevos;
    });
  }
  
  function calcularPendiente(grupo: any) {
    const totalPapeletas =
      Number(grupo.ImporteFalla || 0) +
      Number(grupo.ImporteVirgen || 0);
  
    const importePagado = grupo.PagadoConfirmado
      ? totalPapeletas
      : Math.max(0, Number(grupo.ImportePagado || 0));
  
    const pendienteCobro = Math.max(
      0,
      totalPapeletas - importePagado
    );
  
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
        ImporteFalla: Number(
          (
            Number(grupo.PapeletasFalla || 0) *
            (
              Number(sorteo?.ImportePapeletaFalla || 0) +
              Number(sorteo?.BeneficioFalla || 0)
            )
          ).toFixed(2)
        ),
      
        PapeletasVirgen: grupo.PapeletasVirgen,
        ImporteVirgen: Number(
          (
            Number(grupo.PapeletasVirgen || 0) *
            (
              Number(sorteo?.ImportePapeletaVirgen || 0) +
              Number(sorteo?.BeneficioVirgen || 0)
            )
          ).toFixed(2)
        ),
      
        ImportePagado: grupo.ImportePagado,
        PapeletasPremioFalla: grupo.PapeletasPremioFalla,
        PapeletasPremioVirgen: grupo.PapeletasPremioVirgen,
        ImportePremio: grupo.ImportePremio,
        PremioEntregado: grupo.PremioEntregado,
        PagadoConfirmado: grupo.PagadoConfirmado,
      })
      .eq("ID", Number(grupo.IDLinea));
  
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
  
  const totalPagado = grupos.reduce((sum, g) => {
    const totalAPagar =
      Number(g.ImporteFalla || 0) +
      Number(g.ImporteVirgen || 0);
  
    const pagadoReal = g.PagadoConfirmado
      ? totalAPagar
      : Math.min(
          totalAPagar,
          Math.max(0, Number(g.ImportePagado || 0))
        );
  
    return sum + pagadoReal;
  }, 0);
  
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

  const sociosParticipanteFiltrados = sociosParticipante.filter((socio) => {
    const texto = `${socio.NUMCENS} ${socio.Apellidos || ""} ${socio.Nombre || ""}`;
  
    return normalizarTexto(texto).includes(
      normalizarTexto(busquedaParticipante)
    );
  });

  const hayPremios = grupos.some(
    (g) => Number(g.ImportePremio || 0) > 0
  );

  async function actualizarTotalesSorteoPadre(gruposActualizados: any[]) {
    const totalFalla = gruposActualizados.reduce(
      (sum, g) => sum + Number(g.PapeletasFalla || 0),
      0
    );
  
    const totalVirgen = gruposActualizados.reduce(
      (sum, g) => sum + Number(g.PapeletasVirgen || 0),
      0
    );
  
    await (supabase as any)
      .from("LOTERIA_SORTEOS")
      .update({
        PapeletasTotalesFalla: totalFalla,
        PapeletasTotalesVirgen: totalVirgen,
      })
      .eq("ID", Number(params.id));
  }

  async function marcarTodosPagados(valor: boolean) {
    const nuevos = grupos.map((g) => {
      const totalAPagar =
        Number(g.ImporteFalla || 0) +
        Number(g.ImporteVirgen || 0);
  
      return {
        ...g,
        PagadoConfirmado: valor,
        ImportePagado: valor ? totalAPagar : 0,
      };
    });
  
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

  function formatearFecha(fecha: string | null) {
    if (!fecha) return "—";
  
    const [year, month, day] = fecha.split("-");
    return `${day}/${month}/${year}`;
  }

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mx-auto max-w-7xl">
       
        <div className="no-print mb-4 flex items-center justify-between">
  <button
    onClick={() => router.push("/loterias/sorteos")}
    className="text-sm font-medium text-red-900 hover:underline"
  >
    ← Volver a sorteos
  </button>

  <button
    onClick={() => window.print()}
    className="rounded bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
  >
    🖨️ Imprimir
  </button>
</div>

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
    {formatearFecha(sorteo.FechaSorteo)}
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

    {sorteo?.TipoSorteo !== "ESPECIAL" && (
  <>
    <span>Pap_V</span>
    <span className="bg-white px-2 py-1 font-semibold">{totalPapVirgen}</span>

    <span>Imp_V</span>
    <span className="bg-white px-2 py-1 font-semibold">
      {totalImpVirgen.toFixed(2)} €
    </span>
  </>
)}

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

<div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
  <input
    type="text"
    value={busqueda}
    onChange={(e) => setBusqueda(e.target.value)}
    placeholder="Buscar socio..."
    className="w-72 border border-zinc-300 px-3 py-2 text-sm"
  />

  <button
    type="button"
    onClick={abrirModalParticipante}
    className="rounded bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
  >
    + Añadir participante
  </button>
</div>

            <table className="min-w-full divide-y divide-zinc-200">

              <thead className="bg-zinc-50">
                <tr>
                <th className="w-96 px-4 py-2 text-left text-xs font-semibold uppercase">
  Responsable
</th>

<th className="w-12 px-1 py-2 text-center text-xs font-semibold uppercase">
  Pap_F
</th>

{sorteo?.TipoSorteo !== "ESPECIAL" && (
  <>
    <th className="w-12 px-1 py-2 text-center text-xs font-semibold uppercase">
      Pap_V
    </th>
  </>
)}

<th className="w-44 px-2 py-2 text-center text-xs font-semibold uppercase">
  Total
  <input
    title="Marcar todos como pagados"
    type="checkbox"
    className="no-print ml-2"
    onChange={(e) => marcarTodosPagados(e.target.checked)}
  />
</th>

<th className="px-2 py-2 text-center text-xs font-semibold uppercase">
  Premio_F
</th>

{sorteo?.TipoSorteo !== "ESPECIAL" && (
  <th className="px-2 py-2 text-center text-xs font-semibold uppercase">
    Premio_V
  </th>
)}

<th className="w-36 px-2 py-2 text-center text-xs font-semibold uppercase">
  Premio
  <input
    type="checkbox"
    disabled={!hayPremios}
    title="Marcar todos los premios como entregados"
    className="no-print ml-2"
    onChange={(e) => marcarTodosPremios(e.target.checked)}
  />
</th>
<th className="px-2 py-2 text-right text-xs font-semibold uppercase">Saldo</th>
<th className="no-print px-2 py-2 text-center text-xs font-semibold uppercase">
  Acciones
</th>
                </tr>
                
              </thead>

              <tbody className="divide-y divide-zinc-200 bg-white">
  {gruposFiltrados.map((grupo, index) => {
    const pendiente = calcularPendiente(grupo);

    return (
      <tr key={grupo.IDLinea}>
       <td
  className={`w-[220px] max-w-[220px] px-4 py-2 text-sm ${
    grupo.IDGrupoLoteria
      ? "cursor-pointer text-red-900 hover:underline"
      : "text-zinc-700"
  }`}
  onClick={() => {
    if (grupo.IDGrupoLoteria) {
      router.push(
        `/loterias/socios-loteria/${grupo.IDGrupoLoteria}`
      );
    }
  }}
>
          {grupo.NombreCompleto}
          {grupo.ResponsableExtra && (
            <span className="ml-2 text-xs text-zinc-400">
              {grupo.ResponsableExtra}
            </span>
          )}
        </td>

        <td className="w-12 px-1 py-2 text-center text-sm">
          <input
            type="number"
            value={grupo.PapeletasFalla || 0}
            onChange={(e) =>
              actualizarGrupo(
                Number(grupo.IDLinea),
                "PapeletasFalla",
                Number(e.target.value)
              )
            }
            className="w-12 bg-transparent text-right text-sm focus:outline-none"
          />
        </td>


        {sorteo?.TipoSorteo !== "ESPECIAL" && (
          <>
            <td className="w-12 px-1 py-2 text-center text-sm">
              <input
                type="number"
                value={grupo.PapeletasVirgen || 0}
                onChange={(e) =>
                  actualizarGrupo(
                    Number(grupo.IDLinea),
                    "PapeletasVirgen",
                    Number(e.target.value)
                  )
                }
                className="w-12 bg-transparent text-right text-sm focus:outline-none"
              />
            </td>

          </>
        )}

<td className="w-44 px-2 py-2 text-right text-sm whitespace-nowrap">
  <div className="flex items-center justify-end gap-2 whitespace-nowrap">
    <span>
      {(
        Number(grupo.ImporteFalla || 0) +
        Number(grupo.ImporteVirgen || 0)
      ).toFixed(2)} €
    </span>

    <input
      type="number"
      min="0"
      step="0.01"
      value={Number(grupo.ImportePagado || 0)}
      onChange={(e) =>
        actualizarGrupo(
          Number(grupo.IDLinea),
          "ImportePagado",
          Number(e.target.value)
        )
      }
      title="Importe pagado"
      className="no-print w-16 border border-zinc-300 px-1 py-0.5 text-right text-xs"
    />

<span className="no-print text-xs text-zinc-500">€</span>

    <label
  title="Pagado completo"
  className="no-print flex cursor-pointer items-center"
>
      <input
        type="checkbox"
        checked={grupo.PagadoConfirmado || false}
        onChange={(e) =>
          actualizarGrupo(
            Number(grupo.IDLinea),
            "PagadoConfirmado",
            e.target.checked
          )
        }
      />
    </label>
  </div>
</td>

<td className="w-20 px-2 py-2 text-center text-sm whitespace-nowrap">
  {(
    Number(grupo.PapeletasPremioFalla || 0) *
    Number(sorteo?.PremioFallaPorPapeleta || 0)
  ).toFixed(2)} €
</td>

        {sorteo?.TipoSorteo !== "ESPECIAL" && (
          <td className="w-20 px-2 py-2 text-center text-sm whitespace-nowrap">
          {(
            Number(grupo.PapeletasPremioVirgen || 0) *
            Number(sorteo?.PremioVirgenPorPapeleta || 0)
          ).toFixed(2)} €
        </td>
        )}

<td className="w-36 px-2 py-2 text-right text-sm whitespace-nowrap">
<div className="flex items-center justify-center gap-1 whitespace-nowrap">
            <input
              type="text"
              value={Number(grupo.ImportePremio || 0).toFixed(2)}
              onChange={(e) =>
                actualizarGrupo(
                  Number(grupo.IDLinea),
                  "ImportePremio",
                  Number(e.target.value)
                )
              }
              className="w-16 bg-transparent text-center text-sm focus:outline-none"
            />
            <span className="text-xs text-zinc-500">€</span>

            <label
              title="Entregado"
              className={`no-print flex items-center gap-1 text-xs ${
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
                  actualizarGrupo(
                    Number(grupo.IDLinea),
                    "PremioEntregado",
                    e.target.checked
                  )
                }
              />
            </label>
          </div>
        </td>

        <td
          className={`px-2 py-2 text-right text-sm font-semibold whitespace-nowrap 
            ${
            pendiente < 0
              ? "text-red-700"
              : pendiente > 0
              ? "text-green-700"
              : "text-zinc-700"
          }`}
        >
          {pendiente.toFixed(2)} €
        </td>
        <td className="no-print px-2 py-2 text-center">
  <button
    type="button"
    onClick={() => eliminarParticipanteSorteo(grupo)}
    title="Quitar de este sorteo"
    className="rounded bg-zinc-100 px-2 py-1 hover:bg-red-50"
  >
    🗑️
  </button>
</td>
      </tr>
    );
  })}
</tbody>

            </table>

          </section>

        </div>
        </main>

{mostrarModalParticipante && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="w-full max-w-lg border border-zinc-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
        <h2 className="text-lg font-semibold">
          Añadir participante
          <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
  Este participante se añadirá únicamente a este sorteo.
  Si quieres que participe también en futuros sorteos, añádelo desde
  <strong> Socios lotería</strong>.
</div>
        </h2>

        <button
          type="button"
          onClick={() => setMostrarModalParticipante(false)}
          className="text-xl text-zinc-500 hover:text-zinc-800"
        >
          ×
        </button>
      </div>

      <div className="space-y-4 p-6">
      <input
  type="text"
  autoFocus
  value={busquedaParticipante}
  onChange={(e) => setBusquedaParticipante(e.target.value)}
  placeholder="Buscar por nº, apellidos o nombre..."
  className="w-full border border-zinc-300 px-3 py-2 text-sm"
/>

        <div className="max-h-64 overflow-y-auto border border-zinc-200">
          {sociosParticipanteFiltrados.map((socio) => (
            <button
              key={socio.NUMCENS}
              type="button"
              onClick={() => setParticipanteSeleccionado(socio)}
              className={`block w-full border-b border-zinc-100 px-3 py-2 text-left text-sm hover:bg-zinc-50 ${
                Number(participanteSeleccionado?.NUMCENS) ===
                Number(socio.NUMCENS)
                  ? "bg-zinc-100 font-semibold"
                  : ""
              }`}
            >
              {socio.NUMCENS} - {socio.Apellidos}, {socio.Nombre}
            </button>
          ))}
        </div>

        {participanteSeleccionado && (
          <div className="space-y-3 border-t border-zinc-200 pt-4">
            <div className="font-medium">
              {participanteSeleccionado.Apellidos},{" "}
              {participanteSeleccionado.Nombre}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Papeletas Falla
                </label>
                <input
                  type="number"
                  min="0"
                  value={nuevasPapeletasFalla}
                  onChange={(e) =>
                    setNuevasPapeletasFalla(Number(e.target.value))
                  }
                  className="w-full border border-zinc-300 px-3 py-2"
                />
              </div>

              {sorteo?.TipoSorteo !== "ESPECIAL" && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Papeletas Virgen
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={nuevasPapeletasVirgen}
                    onChange={(e) =>
                      setNuevasPapeletasVirgen(Number(e.target.value))
                    }
                    className="w-full border border-zinc-300 px-3 py-2"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4">
          <button
            type="button"
            onClick={() => setMostrarModalParticipante(false)}
            className="border border-zinc-300 px-4 py-2 text-sm"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={guardarNuevoParticipante}
            disabled={!participanteSeleccionado}
            className="bg-red-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  </div>
)}

</div>
);
}