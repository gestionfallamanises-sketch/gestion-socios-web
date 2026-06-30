"use client";

import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GrupoLoteriaModal from "@/app/components/GrupoLoteriaModal";

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
const [ordenResponsable, setOrdenResponsable] = useState<"asc" | "desc">("asc");
const [grupoEditando, setGrupoEditando] = useState<any | null>(null);
const [numcensYaUsados, setNumcensYaUsados] = useState<number[]>([]);
const [mostrarModalExterno, setMostrarModalExterno] = useState(false);
const [nombreExterno, setNombreExterno] = useState("");
const [telefonoExterno, setTelefonoExterno] = useState("");
const [externoFalla, setExternoFalla] = useState(0);
const [externoVirgen, setExternoVirgen] = useState(0);
const [externoNavidad, setExternoNavidad] = useState(0);
const [externoNino, setExternoNino] = useState(0);

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
  
  function normalizarTexto(texto: string) {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
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

        const yaUsadoEnOtroGrupo =
  numcensYaUsados.includes(Number(socio.NUMCENS));

if (yaUsadoEnOtroGrupo && !grupoEditando) return false;
  
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

  async function guardarExterno() {
    if (!nombreExterno.trim()) {
      alert("Escribe el nombre del responsable externo.");
      return;
    }
  
    const { error } = await (supabase as any)
      .from("SOCIOS_LOTERIA")
      .insert({
        EsExterno: true,
        NombreExterno: nombreExterno.trim(),
        TelefonoExterno: telefonoExterno.trim() || null,
        Ejercicio: 2027,
        PapeletasFalla: externoFalla,
PapeletasVirgen: externoVirgen,
PapeletasNavidad: externoNavidad,
PapeletasNino: externoNino,
        Observaciones: "Responsable externo",
      });
  
    if (error) {
      alert("Error creando externo: " + error.message);
      return;
    }
  
    setNombreExterno("");
    setTelefonoExterno("");
    setMostrarModalExterno(false);
    setExternoFalla(0);
setExternoVirgen(0);
setExternoNavidad(0);
setExternoNino(0);
  
await cargarGruposLoteria();
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
  .filter(
    (grupo: any) =>
      grupo.NUMCENS_Responsable !== null &&
      grupo.NUMCENS_Responsable !== undefined
  )
  .map((grupo: any) => Number(grupo.NUMCENS_Responsable));

let sociosResponsables: any[] = [];

if (numcensResponsables.length > 0) {
  const { data, error: errorSocios } = await (supabase as any)
    .from("SOCIOS")
    .select("NUMCENS, Nombre, Apellidos")
    .in("NUMCENS", numcensResponsables);

  if (errorSocios) {
    alert(errorSocios.message);
    return;
  }

  sociosResponsables = data || [];
}
  
    const gruposConNombre = (grupos || []).map((grupo: any) => {
      const responsable = (sociosResponsables || []).find(
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
        ResponsableOrden: responsable
          ? `${responsable.Apellidos || ""} ${responsable.Nombre || ""}`
          : "",
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

  const totalResponsables = gruposLoteria.length;

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

  const gruposLoteriaOrdenados = [...gruposLoteria].sort((a, b) => {
    const nombreA = (a.ResponsableOrden || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  
    const nombreB = (b.ResponsableOrden || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  
    return ordenResponsable === "asc"
      ? nombreA.localeCompare(nombreB)
      : nombreB.localeCompare(nombreA);
  });

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

    <div className="flex gap-2">
    <button
  onClick={() => router.push("/loterias/socios-loteria/imprimir")}
  title="Imprimir"
  className="rounded bg-zinc-100 px-2 py-1 text-sm hover:bg-zinc-200"
>
  🖨️
</button>

<button
  onClick={() => router.push("/loterias/socios-loteria/excel")}
  title="Exportar Excel"
  className="rounded bg-zinc-100 px-2 py-1 text-sm hover:bg-zinc-200"
>
  📗
</button>

  <button
    onClick={() => setMostrarModalExterno(true)}
    className="bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
  >
    + Externo
  </button>

  <button
    onClick={() => setMostrarModal(true)}
    className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
  >
    + Nuevo grupo
  </button>
</div>
  </div>
</section>

          <section className="border border-zinc-200 bg-white">

          <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
  <h2 className="text-sm font-semibold uppercase text-zinc-700">
    Grupos lotería
  </h2>

  <div className="flex flex-wrap justify-end gap-2 text-xs">
  <span className="text-zinc-600">Responsables</span>
<span className="bg-white px-2 py-1 font-semibold">
  {totalResponsables}
</span>
    
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
                  <th className="px-4 py-3 text-left">
  <button
    type="button"
    onClick={() =>
      setOrdenResponsable(ordenResponsable === "asc" ? "desc" : "asc")
    }
    className="flex items-center gap-1 text-xs font-semibold uppercase text-zinc-600"
  >
    Responsable
    <span>{ordenResponsable === "asc" ? "↑" : "↓"}</span>
  </button>
</th>
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
    gruposLoteriaOrdenados.map((grupo) => (
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

{mostrarModalExterno && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="w-full max-w-md border border-zinc-200 bg-white shadow-xl">

      <div className="border-b border-zinc-200 px-6 py-4">
        <h2 className="text-lg font-semibold">
          Nuevo responsable externo
        </h2>
      </div>

      <div className="space-y-4 p-6">

        <div>
          <label className="mb-1 block text-sm font-medium">
            Nombre
          </label>

          <input
            value={nombreExterno}
            onChange={(e) => setNombreExterno(e.target.value)}
            className="w-full border border-zinc-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Teléfono
          </label>

          <input
            value={telefonoExterno}
            onChange={(e) => setTelefonoExterno(e.target.value)}
            className="w-full border border-zinc-300 px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
  <div>
    <label className="mb-1 block text-sm font-medium">Falla</label>
    <input type="number" value={externoFalla} onChange={(e) => setExternoFalla(Number(e.target.value))} className="w-full border border-zinc-300 px-3 py-2" />
  </div>

  <div>
    <label className="mb-1 block text-sm font-medium">Virgen</label>
    <input type="number" value={externoVirgen} onChange={(e) => setExternoVirgen(Number(e.target.value))} className="w-full border border-zinc-300 px-3 py-2" />
  </div>

  <div>
    <label className="mb-1 block text-sm font-medium">Navidad</label>
    <input type="number" value={externoNavidad} onChange={(e) => setExternoNavidad(Number(e.target.value))} className="w-full border border-zinc-300 px-3 py-2" />
  </div>

  <div>
    <label className="mb-1 block text-sm font-medium">Niño</label>
    <input type="number" value={externoNino} onChange={(e) => setExternoNino(Number(e.target.value))} className="w-full border border-zinc-300 px-3 py-2" />
  </div>
</div>

      </div>

      <div className="flex justify-end gap-2 border-t border-zinc-200 px-6 py-4">

        <button
          onClick={() => setMostrarModalExterno(false)}
          className="border border-zinc-300 px-4 py-2"
        >
          Cancelar
        </button>

        <button
          onClick={guardarExterno}
          className="bg-red-900 px-4 py-2 text-white"
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