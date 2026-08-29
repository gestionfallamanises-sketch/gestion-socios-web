"use client";

import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import GrupoLoteriaModal from "@/app/components/GrupoLoteriaModal";
import { normalizarTexto } from "@/lib/texto";

export default function GrupoLoteriaPage() {
  const params = useParams();
  const router = useRouter();
  const [grupo, setGrupo] = useState<any>(null);
  const [sorteos, setSorteos] = useState<any[]>([]);
  const [filas, setFilas] = useState<any[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
const [grupoEditando, setGrupoEditando] = useState<any>(null);

const [socios, setSocios] = useState<any[]>([]);
const [busquedaResponsable, setBusquedaResponsable] = useState("");
const [responsableSeleccionado, setResponsableSeleccionado] = useState<any>(null);
const [sociosIncluidos, setSociosIncluidos] = useState<any[]>([]);
const [busquedaSocio, setBusquedaSocio] = useState("");

const [papeletasFalla, setPapeletasFalla] = useState(0);
const [papeletasVirgen, setPapeletasVirgen] = useState(0);
const [papeletasNavidad, setPapeletasNavidad] = useState(0);
const [papeletasNino, setPapeletasNino] = useState(0);
const [observaciones, setObservaciones] = useState("");

useEffect(() => {
  cargarSocios();
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
  
    let socioData: any = null;
  
    if (data.NUMCENS_Responsable) {
      const { data: socio } = await (supabase as any)
        .from("SOCIOS")
        .select("NUMCENS, Apellidos, Nombre, ConLoteria")
        .eq("NUMCENS", Number(data.NUMCENS_Responsable))
        .maybeSingle();
  
      socioData = socio;
    }
  
    const grupoConNombre = {
      ...data,
      ResponsableNombre: data.EsExterno
        ? `EXT - ${data.NombreExterno || "Externo"}`
        : socioData
        ? `${data.NUMCENS_Responsable} - ${socioData.Apellidos}, ${socioData.Nombre}`
        : String(data.NUMCENS_Responsable),
    };
  
    setGrupo(grupoConNombre);
    setGrupoEditando(grupoConNombre);
  
    await cargarSociosIncluidos(data, socioData);
    cargarSorteos(data);
  }

  async function abrirEditarGrupo() {
    await cargarGrupo();
    setMostrarModal(true);
  }

  async function cargarSocios() {
    const { data, error } = await (supabase as any)
      .from("SOCIOS")
      .select("*")
      .eq("Estado", "Activo")
      .order("Apellidos");
  
    if (error) {
      alert("Error cargando socios: " + error.message);
      return;
    }
  
    setSocios(data || []);
  }


  async function guardarGrupoLoteria() {
    if (!grupoEditando) {
      alert("No hay grupo seleccionado.");
      return;
    }
  
    if (!responsableSeleccionado && !grupoEditando.EsExterno) {
      alert("Selecciona un responsable.");
      return;
    }
  
    const numcensResponsable = grupoEditando.EsExterno
      ? null
      : responsableSeleccionado?.NUMCENS || grupoEditando.NUMCENS_Responsable;
  
    const { error: errorUpdate } = await (supabase as any)
      .from("SOCIOS_LOTERIA")
      .update({
        NUMCENS_Responsable: numcensResponsable,
        NumeroMiembros: sociosIncluidos.length,
        PapeletasFalla: papeletasFalla,
        PapeletasVirgen: papeletasVirgen,
        PapeletasNavidad: papeletasNavidad,
        PapeletasNino: papeletasNino,
        Observaciones: observaciones || null,
      })
      .eq("ID", grupoEditando.ID);
  
    if (errorUpdate) {
      alert(errorUpdate.message);
      return;
    }
  
    await (supabase as any)
      .from("SOCIOS_LOTERIA_DETALLE")
      .delete()
      .eq("IDSocioLoteria", grupoEditando.ID);
  
    if (sociosIncluidos.length > 0) {
      const detalles = sociosIncluidos.map((socio) => ({
        IDSocioLoteria: grupoEditando.ID,
        NUMCENS: socio.NUMCENS,
      }));
  
      const { error: errorDetalle } = await (supabase as any)
        .from("SOCIOS_LOTERIA_DETALLE")
        .insert(detalles);
  
      if (errorDetalle) {
        alert(errorDetalle.message);
        return;
      }
    }
  
    setMostrarModal(false);
    await cargarGrupo();
  }
  
  function textoSocio(socio: any) {
    return `${socio.Apellidos || ""}, ${socio.Nombre || ""} · NUMCENS ${socio.NUMCENS}`;
  }
  
  function normalizar(texto: string) {
    return normalizarTexto(texto);
  }
  
  function sociosFiltrados(texto: string) {
    if (!texto.trim()) return [];
  
    const busqueda = normalizarTexto(texto.trim());
  
    return socios
      .filter((socio) => {
        const yaIncluido = sociosIncluidos.some(
          (s) => Number(s.NUMCENS) === Number(socio.NUMCENS)
        );
  
        if (yaIncluido) return false;
  
        const nombreCompleto = normalizarTexto(
          `${socio.Apellidos || ""} ${socio.Nombre || ""}`
        );
  
        const nombreInvertido = normalizarTexto(
          `${socio.Nombre || ""} ${socio.Apellidos || ""}`
        );
  
        const numcens = String(socio.NUMCENS || "");
  
        return (
          nombreCompleto.includes(busqueda) ||
          nombreInvertido.includes(busqueda) ||
          numcens.includes(busqueda)
        );
      })
      .slice(0, 30);
  }
  
  function agregarSocioIncluido(socio: any) {
    const yaExiste = sociosIncluidos.some(
      (s) => Number(s.NUMCENS) === Number(socio.NUMCENS)
    );
  
    if (yaExiste) {
      setBusquedaSocio("");
      return;
    }
  
    setSociosIncluidos([...sociosIncluidos, socio]);
    setBusquedaSocio("");
  }
  
  function quitarSocioIncluido(numcens: number) {
    setSociosIncluidos(
      sociosIncluidos.filter(
        (socio) => Number(socio.NUMCENS) !== Number(numcens)
      )
    );
  }
  
  function limpiarFormulario() {
    setBusquedaResponsable("");
    setResponsableSeleccionado(null);
    setBusquedaSocio("");
    setSociosIncluidos([]);
    setPapeletasFalla(0);
    setPapeletasVirgen(0);
    setPapeletasNavidad(0);
    setPapeletasNino(0);
    setObservaciones("");
  }

  async function cargarSociosIncluidos(grupo: any, responsable: any) {
    const { data, error } = await (supabase as any)
      .from("SOCIOS_LOTERIA_DETALLE")
      .select("NUMCENS")
      .eq("IDSocioLoteria", grupo.ID);
  
    if (error) {
      alert("Error cargando socios: " + error.message);
      return;
    }
  
    const numeros = (data || []).map((x: any) => Number(x.NUMCENS));
  
    if (numeros.length === 0) {
      setSociosIncluidos([]);
    } else {
      const { data: sociosData } = await (supabase as any)
        .from("SOCIOS")
        .select("*")
        .in("NUMCENS", numeros);
  
      setSociosIncluidos(sociosData || []);
    }
  
    if (responsable) {
      setResponsableSeleccionado(responsable);
      setBusquedaResponsable(
        `${responsable.Apellidos}, ${responsable.Nombre}`
      );
    }
  
    setPapeletasFalla(Number(grupo.PapeletasFalla || 0));
    setPapeletasVirgen(Number(grupo.PapeletasVirgen || 0));
    setPapeletasNavidad(Number(grupo.PapeletasNavidad || 0));
    setPapeletasNino(Number(grupo.PapeletasNino || 0));
    setObservaciones(grupo.Observaciones || "");
  }

  async function cargarSorteos(grupoActual: any) {
    const { data: sorteosData, error: errorSorteos } = await (supabase as any)
      .from("LOTERIA_SORTEOS")
      .select("*")
      .order("FechaSorteo", { ascending: false })
  
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
      
        PapeletasFalla: Number(fila?.PapeletasFalla || 0),

        PapeletasVirgen:
        sorteo.TipoSorteo === "ESPECIAL"
          ? 0
          : Number(fila?.PapeletasVirgen || 0),
      

ImporteFalla: Number(fila?.ImporteFalla || 0),

ImporteVirgen:
        sorteo.TipoSorteo === "ESPECIAL"
          ? 0
          : Number(fila?.ImporteVirgen || 0),


ImportePagado: Number(fila?.ImportePagado || 0),

PapeletasPremioFalla: Number(fila?.PapeletasPremioFalla || 0),

PapeletasPremioVirgen:
  sorteo.TipoSorteo === "ESPECIAL"
    ? 0
    : Number(fila?.PapeletasPremioVirgen || 0),

ImportePremio: Number(fila?.ImportePremio || 0),

PremioEntregado: fila?.PremioEntregado ?? false,

PagadoConfirmado: fila?.PagadoConfirmado ?? false,
      };
    });
  
    setFilas(filasCompletas);
  }

  function calcularSaldoFila(fila: any) {
    const totalPapeletas =
      Number(fila.ImporteFalla || 0) +
      Number(fila.ImporteVirgen || 0);
  
    const pendienteCobro = fila.PagadoConfirmado ? 0 : totalPapeletas;
  
    const pendientePremio = fila.PremioEntregado
      ? 0
      : Number(fila.ImportePremio || 0);
  
    return pendienteCobro - pendientePremio;
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

  <button
  onClick={abrirEditarGrupo}
  className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
>
  Editar grupo
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
  <div>
  <strong>Socio:</strong>{" "}
  {grupo?.EsExterno
    ? `EXT - ${grupo?.NombreExterno}`
    : grupo?.ResponsableNombre}
</div>
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
  {new Date(fila.FechaSorteo).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}
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

      <td className="px-4 py-2 text-center text-sm">
  {fila.PagadoConfirmado ? "Sí" : "No"}
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

        <GrupoLoteriaModal
  mostrarModal={mostrarModal}
  grupoEditando={grupoEditando}
  busquedaResponsable={busquedaResponsable}
  setBusquedaResponsable={setBusquedaResponsable}
  responsableSeleccionado={responsableSeleccionado}
  setResponsableSeleccionado={setResponsableSeleccionado}
  sociosFiltrados={sociosFiltrados}
  textoSocio={textoSocio}
  sociosIncluidos={sociosIncluidos}
  setSociosIncluidos={setSociosIncluidos}
  busquedaSocio={busquedaSocio}
  setBusquedaSocio={setBusquedaSocio}
  agregarSocioIncluido={agregarSocioIncluido}
  quitarSocioIncluido={quitarSocioIncluido}
  papeletasFalla={papeletasFalla}
  setPapeletasFalla={setPapeletasFalla}
  papeletasVirgen={papeletasVirgen}
  setPapeletasVirgen={setPapeletasVirgen}
  papeletasNavidad={papeletasNavidad}
  setPapeletasNavidad={setPapeletasNavidad}
  papeletasNino={papeletasNino}
  setPapeletasNino={setPapeletasNino}
  observaciones={observaciones}
  setObservaciones={setObservaciones}
  limpiarFormulario={limpiarFormulario}
  setGrupoEditando={setGrupoEditando}
  setMostrarModal={setMostrarModal}
  guardarGrupoLoteria={guardarGrupoLoteria}
/>
      </main>
    </div>
  );
}