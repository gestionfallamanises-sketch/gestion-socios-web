"use client";

import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SociosLoteriaPage() {
    const router = useRouter();

    const [mostrarModal, setMostrarModal] = useState(false);
    const [socios, setSocios] = useState<any[]>([]);
const [busquedaResponsable, setBusquedaResponsable] = useState("");
const [responsableSeleccionado, setResponsableSeleccionado] = useState<any | null>(null);
const [busquedaSocio, setBusquedaSocio] = useState("");
const [sociosIncluidos, setSociosIncluidos] = useState<any[]>([]);
const [reglasPapeletas, setReglasPapeletas] = useState<any[]>([]);
const [papeletasFalla, setPapeletasFalla] = useState(0);
const [papeletasVirgen, setPapeletasVirgen] = useState(0);
const [papeletasNavidad, setPapeletasNavidad] = useState(0);
const [papeletasNino, setPapeletasNino] = useState(0);
const [ejercicioActivo, setEjercicioActivo] = useState<number | null>(null);
const [observaciones, setObservaciones] = useState("");
const [gruposLoteria, setGruposLoteria] = useState<any[]>([]);
const [grupoSeleccionado, setGrupoSeleccionado] = useState<any | null>(null);
const [mostrarDetalle, setMostrarDetalle] = useState(false);
const [sociosDetalle, setSociosDetalle] = useState<any[]>([]);
const [grupoEditando, setGrupoEditando] = useState<any | null>(null);
const [numcensYaUsados, setNumcensYaUsados] = useState<number[]>([]);

useEffect(() => {
    cargarSocios();
  }, []);

  useEffect(() => {
    cargarNumcensYaUsados();
  }, []);

  useEffect(() => {
    cargarGruposLoteria();
  }, []);

  useEffect(() => {
    cargarEjercicioActivo();
  }, []);
  
  useEffect(() => {
    if (ejercicioActivo) {
      cargarReglasPapeletas();
    }
  }, [ejercicioActivo]);

  async function cargarEjercicioActivo() {
    const { data, error } = await (supabase as any)
      .from("EJERCICIOS")
      .select("Ejercicio")
      .eq("Activo", true)
      .single();
  
    if (error) {
      alert(error.message);
      return;
    }
  
    setEjercicioActivo(data?.Ejercicio || null);
  }
  
  async function cargarReglasPapeletas() {
    const { data, error } = await (supabase as any)
      .from("LOTERIA_PAPELETAS")
      .select("*")
      .order("NumMiembrosLoteriaMin", { ascending: true });
  
  
    if (error) {
      alert(error.message);
      return;
    }
  
    setReglasPapeletas(data || []);
  }
  
  async function cargarSocios() {
    const { data, error } = await (supabase as any)
      .from("SOCIOS")
      .select("NUMCENS, Nombre, Apellidos, Estado, ConLoteria")
      .order("Apellidos", { ascending: true });
  
    if (error) {
      alert(error.message);
      return;
    }
  
    setSocios(data || []);
  }

  async function cargarNumcensYaUsados() {
    const { data, error } = await (supabase as any)
      .from("SOCIOS_LOTERIA_DETALLE")
      .select("NUMCENS");
  
    if (error) {
      alert(error.message);
      return;
    }
  
    setNumcensYaUsados(
      (data || []).map((x: any) => Number(x.NUMCENS))
    );
  }
  
  function textoSocio(socio: any) {
    return `${socio.Apellidos || ""}, ${socio.Nombre || ""} · NUMCENS ${socio.NUMCENS}`;
  }
  
  function sociosFiltrados(texto: string) {
    if (!texto.trim()) return [];
  
    const busqueda = texto.toLowerCase().trim();
  
    return socios
      .filter((socio) => {
        const yaIncluido = sociosIncluidos.some(
          (s) => Number(s.NUMCENS) === Number(socio.NUMCENS)
        );
  
        if (yaIncluido) return false;

        const yaUsadoEnOtroGrupo =
  numcensYaUsados.includes(Number(socio.NUMCENS));

if (yaUsadoEnOtroGrupo && !grupoEditando) return false;
  
        const nombreCompleto = `${socio.Apellidos || ""} ${socio.Nombre || ""}`.toLowerCase();
        const nombreInvertido = `${socio.Nombre || ""} ${socio.Apellidos || ""}`.toLowerCase();
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
      sociosIncluidos.filter((socio) => Number(socio.NUMCENS) !== Number(numcens))
    );
  }

  useEffect(() => {
    if (grupoEditando) return;
  
    const miembros = sociosIncluidos.filter(
        (socio) => socio.ConLoteria === true
      ).length;
  
    if (miembros === 0) {
      setPapeletasFalla(0);
      setPapeletasVirgen(0);
      setPapeletasNavidad(0);
      setPapeletasNino(0);
      return;
    }
  
    const regla = reglasPapeletas.find(
      (r) =>
        miembros >= Number(r.NumMiembrosLoteriaMin) &&
        miembros <= Number(r.NumMiembrosLoteriaMax)
    );
  
    if (!regla) return;
  
    const semanal = Number(regla.PapeletasSemanal || 0);
  
    setPapeletasFalla(Math.ceil(semanal / 2));
    setPapeletasVirgen(Math.floor(semanal / 2));
    setPapeletasNavidad(Number(regla.PapeletasNavidad || 0));
    setPapeletasNino(Number(regla.PapeletasNino || 0));
  }, [sociosIncluidos, reglasPapeletas, grupoEditando]);

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

  async function guardarGrupoLoteria() {
    if (!ejercicioActivo) {
      alert("No hay ejercicio activo.");
      return;
    }
  
    if (!responsableSeleccionado) {
      alert("Selecciona un responsable.");
      return;
    }
  
    if (sociosIncluidos.length === 0) {
      alert("Añade al menos un socio.");
      return;
    }
  
    if (grupoEditando) {
        const { error: errorUpdate } = await (supabase as any)
          .from("SOCIOS_LOTERIA")
          .update({
            NUMCENS_Responsable: responsableSeleccionado.NUMCENS,
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
      
        alert("Grupo actualizado correctamente");
      
        limpiarFormulario();
        setGrupoEditando(null);
        setMostrarModal(false);
        cargarGruposLoteria();
        cargarNumcensYaUsados();
      
        return;
      }
      
    const { data: grupo, error: errorGrupo } = await (supabase as any)
      .from("SOCIOS_LOTERIA")
      .insert({
        Ejercicio: ejercicioActivo,
        NUMCENS_Responsable: responsableSeleccionado.NUMCENS,
        NumeroMiembros: sociosIncluidos.length,
        PapeletasFalla: papeletasFalla,
        PapeletasVirgen: papeletasVirgen,
        PapeletasNavidad: papeletasNavidad,
        PapeletasNino: papeletasNino,
        Observaciones: observaciones || null,
        Activo: true,
      })
      .select()
      .single();
  
    if (errorGrupo) {
      alert(errorGrupo.message);
      return;
    }
  
    const detalles = sociosIncluidos.map((socio) => ({
      IDSocioLoteria: grupo.ID,
      NUMCENS: socio.NUMCENS,
    }));
  
    const { error: errorDetalle } = await (supabase as any)
      .from("SOCIOS_LOTERIA_DETALLE")
      .insert(detalles);
  
    if (errorDetalle) {
      alert(errorDetalle.message);
      return;
    }
  
    alert("Grupo de lotería guardado correctamente");
  
    limpiarFormulario();
    setMostrarModal(false);
    cargarGruposLoteria();
    cargarNumcensYaUsados();
  }

  async function cargarGruposLoteria() {
    const { data: grupos, error } = await (supabase as any)
      .from("SOCIOS_LOTERIA")
      .select("*")
      .eq("Activo", true)
      .order("ID", { ascending: false });
  
    if (error) {
      alert(error.message);
      return;
    }
  
    const numcensResponsables = (grupos || [])
      .map((grupo: any) => grupo.NUMCENS_Responsable)
      .filter(Boolean);
  
    const { data: sociosResponsables, error: errorSocios } = await (supabase as any)
      .from("SOCIOS")
      .select("NUMCENS, Nombre, Apellidos")
      .in("NUMCENS", numcensResponsables);
  
    if (errorSocios) {
      alert(errorSocios.message);
      return;
    }
  
    const gruposConNombre = (grupos || []).map((grupo: any) => {
      const responsable = (sociosResponsables || []).find(
        (socio: any) =>
          Number(socio.NUMCENS) === Number(grupo.NUMCENS_Responsable)
      );
  
      return {
        ...grupo,
        ResponsableNombre: responsable
  ? `${responsable.NUMCENS} - ${responsable.Apellidos}, ${responsable.Nombre}`
  : grupo.NUMCENS_Responsable,
      };
    });
  
    setGruposLoteria(gruposConNombre);
  }

  async function verGrupo(grupo: any) {
    setGrupoSeleccionado(grupo);
  
    const { data, error } = await (supabase as any)
      .from("SOCIOS_LOTERIA_DETALLE")
      .select("NUMCENS")
      .eq("IDSocioLoteria", grupo.ID);
  
    if (error) {
      alert(error.message);
      return;
    }
  
    const numeros = (data || []).map((x: any) => x.NUMCENS);
  
    if (numeros.length === 0) {
      setSociosDetalle([]);
      setMostrarDetalle(true);
      return;
    }
  
    const { data: socios, error: errorSocios } = await (supabase as any)
      .from("SOCIOS")
      .select("NUMCENS, Nombre, Apellidos")
      .in("NUMCENS", numeros);
  
    if (errorSocios) {
      alert(errorSocios.message);
      return;
    }
  
    setSociosDetalle(socios || []);
    setMostrarDetalle(true);
  }

  async function eliminarGrupo(idGrupo: number) {
    const confirmar = confirm(
      "¿Eliminar este grupo de lotería? También se eliminarán los socios incluidos."
    );
  
    if (!confirmar) return;
  
    const { error } = await (supabase as any)
      .from("SOCIOS_LOTERIA")
      .delete()
      .eq("ID", idGrupo);
  
    if (error) {
      alert(error.message);
      return;
    }
  
    cargarGruposLoteria();
    cargarNumcensYaUsados();
  }

  async function editarGrupo(grupo: any) {
    setGrupoEditando(grupo);
  
    setResponsableSeleccionado({
      NUMCENS: grupo.NUMCENS_Responsable,
      Nombre: "",
      Apellidos: grupo.ResponsableNombre || "",
    });
  
    setBusquedaResponsable(grupo.ResponsableNombre || String(grupo.NUMCENS_Responsable));
    setPapeletasFalla(Number(grupo.PapeletasFalla || 0));
    setPapeletasVirgen(Number(grupo.PapeletasVirgen || 0));
    setPapeletasNavidad(Number(grupo.PapeletasNavidad || 0));
    setPapeletasNino(Number(grupo.PapeletasNino || 0));
    setObservaciones(grupo.Observaciones || "");
  
    const { data, error } = await (supabase as any)
      .from("SOCIOS_LOTERIA_DETALLE")
      .select("NUMCENS")
      .eq("IDSocioLoteria", grupo.ID);
  
    if (error) {
      alert(error.message);
      return;
    }
  
    const numeros = (data || []).map((x: any) => x.NUMCENS);
  
    if (numeros.length > 0) {
      const { data: socios, error: errorSocios } = await (supabase as any)
        .from("SOCIOS")
        .select("NUMCENS, Nombre, Apellidos, Estado, ConLoteria")
        .in("NUMCENS", numeros);
  
      if (errorSocios) {
        alert(errorSocios.message);
        return;
      }
  
      setSociosIncluidos(socios || []);
    } else {
      setSociosIncluidos([]);
    }
  
    setMostrarModal(true);
  }

  const totalMiembros = gruposLoteria.reduce(
    (sum, g) => sum + Number(g.NumeroMiembros || 0),
    0
  );
  
  const totalFalla = gruposLoteria.reduce(
    (sum, g) => sum + Number(g.PapeletasFalla || 0),
    0
  );
  
  const totalVirgen = gruposLoteria.reduce(
    (sum, g) => sum + Number(g.PapeletasVirgen || 0),
    0
  );
  
  const totalNavidad = gruposLoteria.reduce(
    (sum, g) => sum + Number(g.PapeletasNavidad || 0),
    0
  );
  
  const totalNino = gruposLoteria.reduce(
    (sum, g) => sum + Number(g.PapeletasNino || 0),
    0
  );

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
        Socios lotería
      </h1>

      <p className="mt-2 text-sm text-zinc-600">
        Responsables y asignaciones de papeletas.
      </p>
    </div>

    <button
      onClick={() => setMostrarModal(true)}
      className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
    >
      + Nuevo grupo
    </button>
  </div>
</section>

          <section className="border border-zinc-200 bg-white">

          <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
  <h2 className="text-sm font-semibold uppercase text-zinc-700">
    Grupos lotería
  </h2>

  <div className="flex flex-wrap justify-end gap-2 text-xs">
    <span className="text-zinc-600">Miembros</span>
    <span className="bg-white px-2 py-1 font-semibold">{totalMiembros}</span>

    <span className="text-zinc-600">Falla</span>
    <span className="bg-white px-2 py-1 font-semibold">{totalFalla}</span>

    <span className="text-zinc-600">Virgen</span>
    <span className="bg-white px-2 py-1 font-semibold">{totalVirgen}</span>

    <span className="text-zinc-600">Navidad</span>
    <span className="bg-white px-2 py-1 font-semibold">{totalNavidad}</span>

    <span className="text-zinc-600">Niño</span>
    <span className="bg-white px-2 py-1 font-semibold">{totalNino}</span>
  </div>
</div>

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
                  <tr>
                    <th className="px-4 py-3">Responsable</th>
                    <th className="px-4 py-3 text-center">Miembros</th>
                    <th className="px-4 py-3 text-center">Falla</th>
                    <th className="px-4 py-3 text-center">Virgen</th>
                    <th className="px-4 py-3 text-center">Navidad</th>
                    <th className="px-4 py-3 text-center">Niño</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>

                <tbody>
  {gruposLoteria.length === 0 ? (
    <tr>
      <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
        No hay grupos de lotería creados.
      </td>
    </tr>
  ) : (
    gruposLoteria.map((grupo) => (
      <tr key={grupo.ID} className="border-t border-zinc-200 hover:bg-red-50">
        <td
  className="cursor-pointer px-4 py-3 font-medium text-red-900 hover:underline"
  onClick={() =>
    router.push(`/loterias/socios-loteria/${grupo.ID}`)
  }
>
  {grupo.ResponsableNombre}
</td>
        <td className="px-4 py-3 text-center">{grupo.NumeroMiembros}</td>
        <td className="px-4 py-3 text-center">{grupo.PapeletasFalla}</td>
        <td className="px-4 py-3 text-center">{grupo.PapeletasVirgen}</td>
        <td className="px-4 py-3 text-center">{grupo.PapeletasNavidad}</td>
        <td className="px-4 py-3 text-center">{grupo.PapeletasNino}</td>
        <td className="px-4 py-3 text-center">
  <div className="flex justify-center gap-3">

    <button
  onClick={() => editarGrupo(grupo)}
  className="text-sm font-medium text-zinc-700 hover:underline"
>
  Editar
</button>

    <button
      onClick={() => eliminarGrupo(grupo.ID)}
      className="text-sm font-medium text-red-700 hover:underline"
    >
      Eliminar
    </button>
  </div>
</td>
      </tr>
    ))
  )}
</tbody>

              </table>

            </div>

          </section>

        </div>

        {mostrarModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="w-full max-w-2xl border border-zinc-200 bg-white shadow-xl">

      <div className="border-b border-zinc-200 px-6 py-4">
        <h2 className="text-lg font-semibold">
        {grupoEditando ? "Editar grupo de lotería" : "Nuevo grupo de lotería"}
        </h2>
      </div>

      <div className="space-y-5 p-6">

      <div>
  <label className="mb-1 block text-sm font-medium text-zinc-700">
    Responsable
  </label>

  <input
    type="text"
    value={busquedaResponsable}
    onChange={(e) => {
      setBusquedaResponsable(e.target.value);
      setResponsableSeleccionado(null);
    }}
    placeholder="Buscar socio responsable..."
    className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
  />

  {busquedaResponsable && !responsableSeleccionado && (
    <div className="mt-1 max-h-40 overflow-y-auto border border-zinc-200 bg-white">
      {sociosFiltrados(busquedaResponsable).map((socio) => (
        <button
          key={socio.NUMCENS}
          type="button"
          onClick={() => {
            setResponsableSeleccionado(socio);
            setBusquedaResponsable(textoSocio(socio));
          
            const yaIncluido = sociosIncluidos.some(
              (s) => Number(s.NUMCENS) === Number(socio.NUMCENS)
            );
          
            if (!yaIncluido) {
              setSociosIncluidos([...sociosIncluidos, socio]);
            }
          }}
          className="block w-full px-3 py-2 text-left text-sm hover:bg-red-50"
        >
          {textoSocio(socio)}
          {socio.ConLoteria ? (
            <span className="ml-2 text-xs text-green-700">Con lotería</span>
          ) : (
            <span className="ml-2 text-xs text-zinc-400">Sin lotería</span>
          )}
        </button>
      ))}
    </div>
  )}
</div>

<div>
  <label className="mb-1 block text-sm font-medium text-zinc-700">
    Socios incluidos
  </label>

  <input
    type="text"
    value={busquedaSocio}
    onChange={(e) => setBusquedaSocio(e.target.value)}
    placeholder="Buscar socio para añadir..."
    className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
  />

  {busquedaSocio && (
    <div className="mt-1 max-h-40 overflow-y-auto border border-zinc-200 bg-white">
      {sociosFiltrados(busquedaSocio).map((socio) => (
        <button
          key={socio.NUMCENS}
          type="button"
          onClick={() => agregarSocioIncluido(socio)}
          className="block w-full px-3 py-2 text-left text-sm hover:bg-red-50"
        >
          {textoSocio(socio)}
          {socio.ConLoteria ? (
            <span className="ml-2 text-xs text-green-700">Con lotería</span>
          ) : (
            <span className="ml-2 text-xs text-zinc-400">Sin lotería</span>
          )}
        </button>
      ))}
    </div>
  )}

  {sociosIncluidos.length === 0 ? (
    <div className="mt-3 border border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
      Todavía no hay socios añadidos.
    </div>
  ) : (
    <div className="mt-3 divide-y divide-zinc-200 border border-zinc-200">
      {sociosIncluidos.map((socio) => (
        <div
          key={socio.NUMCENS}
          className="flex items-center justify-between px-3 py-2 text-sm"
        >
          <span>
            {textoSocio(socio)}
            {socio.ConLoteria ? (
              <span className="ml-2 text-xs text-green-700">Con lotería</span>
            ) : (
              <span className="ml-2 text-xs text-zinc-400">Sin lotería</span>
            )}
          </span>

          {Number(socio.NUMCENS) !== Number(responsableSeleccionado?.NUMCENS) ? (
  <button
    type="button"
    onClick={() => quitarSocioIncluido(socio.NUMCENS)}
    className="text-xs font-medium text-red-900 hover:underline"
  >
    Quitar
  </button>
) : (
  <span className="text-xs text-zinc-400">
    Responsable
  </span>
)}
        </div>
      ))}
    </div>
  )}
</div>

<div className="grid grid-cols-2 gap-2 md:grid-cols-7">
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
        Miembros
      </label>
      <input
  type="number"
  value={sociosIncluidos?.length ?? 0}
  readOnly
  className="w-full border border-zinc-300 bg-zinc-100 px-2 py-1 text-sm text-zinc-600"
/>
    </div>

    <div>
  <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
    Con lotería
  </label>

  <input
    type="number"
    value={
      sociosIncluidos.filter(
        (socio) => socio.ConLoteria === true
      ).length
    }
    readOnly
    className="w-full border border-zinc-300 bg-zinc-100 px-2 py-1 text-sm text-zinc-600"
  />
</div>

    <div>
  <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
    Sin lotería
  </label>

  <input
    type="number"
    value={
      sociosIncluidos.filter(
        (socio) => socio.ConLoteria === false
      ).length
    }
    readOnly
    className="w-full border border-zinc-300 bg-zinc-100 px-2 py-1 text-sm text-zinc-600"
  />
</div>

    <div>
      <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
        Falla
      </label>
      <input
  type="number"
  value={papeletasFalla}
  onChange={(e) => setPapeletasFalla(Number(e.target.value))}
  className="w-full border border-zinc-300 px-2 py-1 text-sm"
/>
    </div>

    <div>
      <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
        Virgen
      </label>
      <input
  type="number"
  value={papeletasVirgen}
  onChange={(e) => setPapeletasVirgen(Number(e.target.value))}
  className="w-full border border-zinc-300 px-2 py-1 text-sm"
/>
    </div>

    <div>
      <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
        Navidad
      </label>
      <input
  type="number"
  value={papeletasNavidad}
  onChange={(e) => setPapeletasNavidad(Number(e.target.value))}
  className="w-full border border-zinc-300 px-2 py-1 text-sm"
/>
    </div>

    <div>
      <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
        Niño
      </label>
      <input
  type="number"
  value={papeletasNino}
  onChange={(e) => setPapeletasNino(Number(e.target.value))}
  className="w-full border border-zinc-300 px-2 py-1 text-sm"
/>
    </div>
  </div>

  <div>
    <label className="mb-1 block text-sm font-medium text-zinc-700">
      Observaciones
    </label>

    <textarea
  rows={3}
  value={observaciones}
  onChange={(e) => setObservaciones(e.target.value)}
  className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
/>
  </div>

</div>

      <div className="flex justify-end gap-2 border-t border-zinc-200 px-6 py-4">

        <button
          onClick={() => {
            limpiarFormulario();
            setGrupoEditando(null);
            setMostrarModal(false);
          }}
          className="bg-zinc-300 px-4 py-2 text-sm"
        >
          Cancelar
        </button>

        <button
  onClick={guardarGrupoLoteria}
  className="bg-red-900 px-4 py-2 text-sm text-white hover:bg-red-950"
>
  Guardar
</button>

      </div>

    </div>
  </div>
)}

{mostrarDetalle && grupoSeleccionado && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="w-full max-w-3xl border border-zinc-200 bg-white shadow-xl">

      <div className="border-b border-zinc-200 px-6 py-4">
        <h2 className="text-lg font-semibold">
          Grupo de lotería
        </h2>
      </div>

      <div className="space-y-4 p-6">

        <div>
          <strong>Responsable:</strong>{" "}
          {grupoSeleccionado.ResponsableNombre}
        </div>

        <div>
          <strong>Miembros:</strong>{" "}
          {grupoSeleccionado.NumeroMiembros}
        </div>

        <div className="grid grid-cols-4 gap-4">

          <div>
            <strong>Falla</strong>
            <div>{grupoSeleccionado.PapeletasFalla}</div>
          </div>

          <div>
            <strong>Virgen</strong>
            <div>{grupoSeleccionado.PapeletasVirgen}</div>
          </div>

          <div>
            <strong>Navidad</strong>
            <div>{grupoSeleccionado.PapeletasNavidad}</div>
          </div>

          <div>
            <strong>Niño</strong>
            <div>{grupoSeleccionado.PapeletasNino}</div>
          </div>

        </div>

        <div>
          <h3 className="mb-2 font-semibold">
            Socios incluidos
          </h3>

          <div className="border border-zinc-200">
            {sociosDetalle.map((socio) => (
              <div
                key={socio.NUMCENS}
                className="border-b border-zinc-200 px-4 py-2 last:border-b-0"
              >
                {socio.NUMCENS} - {socio.Apellidos}, {socio.Nombre}
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="flex justify-end border-t border-zinc-200 px-6 py-4">
        <button
          onClick={() => setMostrarDetalle(false)}
          className="bg-zinc-300 px-4 py-2 text-sm"
        >
          Cerrar
        </button>
      </div>

    </div>
  </div>
)}
      </main>
    </div>
  );
}