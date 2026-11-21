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
  const [pagoGuardando, setPagoGuardando] = useState<number | null>(null);
  const [premioGuardando, setPremioGuardando] = useState<number | null>(null);
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
  
    const { data: filasData, error: errorFilas } = await (supabase as any)
      .from("LOTERIA_SORTEOS_GRUPOS")
      .select("*")
      .eq("IDGrupoLoteria", Number(params.idGrupo));
  
    if (errorFilas) {
      alert("Error cargando filas: " + errorFilas.message);
      return;
    }
  
    const filasCompletas = (filasData || [])
  .map((fila: any) => {
    const sorteo = sorteosLista.find(
      (s: any) => Number(s.ID) === Number(fila.IDSorteo)
    );

    if (!sorteo) return null;

    return {
      ...fila,
      IDSorteo: sorteo.ID,
      FechaSorteo: sorteo.FechaSorteo,
    };
  })
  .filter(Boolean);
  
    // Los sorteos más recientes se muestran primero.
    // El acumulado se calcula después en orden cronológico, sin invertir su significado.
    setFilas(filasCompletas.sort((a: any, b: any) =>
      String(b.FechaSorteo).localeCompare(String(a.FechaSorteo)) ||
      Number(b.IDSorteo) - Number(a.IDSorteo)
    ));
  }

  async function cambiarPagoSorteo(fila: any, marcar: boolean) {
    if (pagoGuardando !== null) return;

    const idLinea = Number(fila.ID);
    const importeTotal = Number(
      (Number(fila.ImporteFalla || 0) + Number(fila.ImporteVirgen || 0)).toFixed(2)
    );
    const importeAnterior = Number(fila.ImportePagado || 0);
    const yaPagado = Boolean(fila.PagadoConfirmado) ||
      (importeTotal > 0 && importeAnterior >= importeTotal - 0.005);

    if (!Number.isFinite(idLinea) || idLinea <= 0) {
      alert("No se puede identificar la línea del sorteo.");
      return;
    }
    if (marcar && importeTotal <= 0) {
      alert("Este sorteo no tiene importe que cobrar.");
      return;
    }
    // No transformar cobros parciales existentes por accidente.
    if (importeAnterior > 0.005 && importeAnterior < importeTotal - 0.005) {
      alert("Este sorteo tiene un importe parcialmente pagado. Revísalo desde el detalle del sorteo antes de cambiar su estado.");
      return;
    }
    if (marcar === yaPagado) return;

    const fecha = String(fila.FechaSorteo || "").slice(0, 10).split("-").reverse().join("/");
    const mensaje = marcar
      ? `¿Confirmar el cobro COMPLETO de ${importeTotal.toFixed(2)} € del sorteo ${fecha}?`
      : `¿Desmarcar el cobro del sorteo ${fecha}? Su importe pagado pasará a 0,00 €.`;
    if (!window.confirm(mensaje)) return;

    setPagoGuardando(idLinea);
    try {
      // Comprobar que otro usuario no haya modificado el movimiento.
      const { data: actual, error: errorLectura } = await (supabase as any)
        .from("LOTERIA_SORTEOS_GRUPOS")
        .select("ID, IDGrupoLoteria, IDSorteo, ImporteFalla, ImporteVirgen, ImportePagado, PagadoConfirmado")
        .eq("ID", idLinea)
        .single();
      if (errorLectura) throw errorLectura;

      const totalActual = Number(
        (Number(actual.ImporteFalla || 0) + Number(actual.ImporteVirgen || 0)).toFixed(2)
      );
      const coincide =
        Number(actual.IDGrupoLoteria) === Number(params.idGrupo) &&
        Number(actual.IDSorteo) === Number(fila.IDSorteo) &&
        Math.abs(totalActual - importeTotal) < 0.005 &&
        Math.abs(Number(actual.ImportePagado || 0) - importeAnterior) < 0.005 &&
        Boolean(actual.PagadoConfirmado) === Boolean(fila.PagadoConfirmado);
      if (!coincide) {
        alert("El sorteo ha cambiado desde que abriste la ficha. Se actualizará la información antes de volver a intentar el cobro.");
        await cargarSorteos(grupo);
        return;
      }

      const { data: guardado, error: errorGuardado } = await (supabase as any)
        .from("LOTERIA_SORTEOS_GRUPOS")
        .update({
          ImportePagado: marcar ? importeTotal : 0,
          PagadoConfirmado: marcar,
        })
        .eq("ID", idLinea)
        .eq("IDGrupoLoteria", Number(params.idGrupo))
        .eq("IDSorteo", Number(fila.IDSorteo))
        .eq("PagadoConfirmado", Boolean(fila.PagadoConfirmado))
        .eq("ImportePagado", importeAnterior)
        .select("ID")
        .maybeSingle();
      if (errorGuardado) throw errorGuardado;
      if (!guardado) {
        alert("El registro cambió antes de guardarlo. Se recargarán los datos.");
      }
      await cargarSorteos(grupo);
    } catch (error: any) {
      alert("No se pudo actualizar el cobro: " + (error?.message || String(error)));
      await cargarSorteos(grupo);
    } finally {
      setPagoGuardando(null);
    }
  }

  async function cambiarEntregaPremio(fila: any, entregar: boolean) {
    if (premioGuardando !== null || pagoGuardando !== null) return;

    const idLinea = Number(fila.ID);
    const premio = Number(fila.ImportePremio || 0);
    if (!Number.isFinite(idLinea) || idLinea <= 0 || premio <= 0) return;
    if (entregar === Boolean(fila.PremioEntregado)) return;

    const fechaSorteo = String(fila.FechaSorteo || "").slice(0, 10)
      .split("-").reverse().join("/");
    const mensaje = entregar
      ? `¿Confirmar la ENTREGA del premio de ${premio.toFixed(2)} € del sorteo ${fechaSorteo}?`
      : `¿Anular la confirmación de entrega del premio de ${premio.toFixed(2)} € del sorteo ${fechaSorteo}?`;
    if (!window.confirm(mensaje)) return;

    setPremioGuardando(idLinea);
    try {
      const { data: actual, error: errorLectura } = await (supabase as any)
        .from("LOTERIA_SORTEOS_GRUPOS")
        .select("ID, IDGrupoLoteria, IDSorteo, ImportePremio, PremioEntregado")
        .eq("ID", idLinea)
        .single();
      if (errorLectura) throw errorLectura;
      const coincide =
        Number(actual.IDGrupoLoteria) === Number(params.idGrupo) &&
        Number(actual.IDSorteo) === Number(fila.IDSorteo) &&
        Math.abs(Number(actual.ImportePremio || 0) - premio) < 0.005 &&
        Boolean(actual.PremioEntregado) === Boolean(fila.PremioEntregado);
      if (!coincide) {
        alert("Los datos del premio han cambiado. Se actualizará la ficha antes de continuar.");
        await cargarSorteos(grupo);
        return;
      }

      const { data: guardado, error: errorGuardado } = await (supabase as any)
        .from("LOTERIA_SORTEOS_GRUPOS")
        .update({ PremioEntregado: entregar })
        .eq("ID", idLinea)
        .eq("IDGrupoLoteria", Number(params.idGrupo))
        .eq("IDSorteo", Number(fila.IDSorteo))
        .eq("PremioEntregado", Boolean(fila.PremioEntregado))
        .eq("ImportePremio", premio)
        .select("ID")
        .maybeSingle();
      if (errorGuardado) throw errorGuardado;
      if (!guardado) alert("La línea cambió antes de guardar. Se recargarán los datos.");
      await cargarSorteos(grupo);
    } catch (error: any) {
      alert("No se pudo actualizar la entrega del premio: " + (error?.message || String(error)));
      await cargarSorteos(grupo);
    } finally {
      setPremioGuardando(null);
    }
  }

  function calcularSaldoFila(fila: any) {
    const totalPapeletas =
      Number(fila.ImporteFalla || 0) + Number(fila.ImporteVirgen || 0);
    // Mismo criterio que el detalle del sorteo: un pago parcial también cuenta.
    const pagado = fila.PagadoConfirmado
      ? totalPapeletas
      : Math.min(totalPapeletas, Math.max(0, Number(fila.ImportePagado || 0)));
    const pendienteCobro = Math.max(0, totalPapeletas - pagado);
    const pendientePremio = fila.PremioEntregado
      ? 0
      : Number(fila.ImportePremio || 0);
    // Positivo: deuda del socio. Negativo: premio a favor del socio.
    return pendienteCobro - pendientePremio;
  }
  
  function calcularTotalHasta(index: number) {
    return filas
      .slice(index)
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
        {(() => {
          const importeTotal = Number(fila.ImporteFalla || 0) + Number(fila.ImporteVirgen || 0);
          const importePagado = Number(fila.ImportePagado || 0);
          const completo = Boolean(fila.PagadoConfirmado) ||
            (importeTotal > 0 && importePagado >= importeTotal - 0.005);
          const parcial = importePagado > 0.005 && importePagado < importeTotal - 0.005;
          return (
            <label className="inline-flex items-center justify-center gap-2">
              <input
                type="checkbox"
                checked={completo}
                disabled={pagoGuardando !== null || premioGuardando !== null || importeTotal <= 0 || parcial}
                onChange={(e) => cambiarPagoSorteo(fila, e.target.checked)}
                aria-label={`Pagado sorteo ${String(fila.FechaSorteo || "").slice(0,10)}`}
                title={parcial ? "Cobro parcial existente: revisar en detalle del sorteo" : "Marcar o desmarcar pago completo"}
                className="h-4 w-4 accent-red-900 disabled:cursor-not-allowed disabled:opacity-40"
              />
              <span className={completo ? "text-green-700" : parcial ? "text-amber-700" : "text-zinc-500"}>
                {pagoGuardando === Number(fila.ID) ? "Guardando..." : completo ? "Sí" : parcial ? "Parcial" : "No"}
              </span>
            </label>
          );
        })()}
      </td>

      <td className="px-4 py-2 text-right text-sm">
        {Number(fila.ImportePremio || 0).toFixed(2)} €
      </td>

      <td className="px-4 py-2 text-center text-sm">
        {Number(fila.ImportePremio || 0) > 0 ? (
          <label className="inline-flex items-center justify-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(fila.PremioEntregado)}
              disabled={premioGuardando !== null || pagoGuardando !== null}
              onChange={(e) => cambiarEntregaPremio(fila, e.target.checked)}
              aria-label={`Premio entregado sorteo ${String(fila.FechaSorteo || "").slice(0,10)}`}
              title="Confirmar o anular la entrega completa del premio"
              className="h-4 w-4 accent-green-700 disabled:cursor-not-allowed disabled:opacity-40"
            />
            <span className={fila.PremioEntregado ? "text-green-700" : "text-zinc-500"}>
              {premioGuardando === Number(fila.ID) ? "Guardando..." : fila.PremioEntregado ? "Sí" : "No"}
            </span>
          </label>
        ) : (
          <span className="text-zinc-400">—</span>
        )}
      </td>

      <td className={`px-4 py-2 text-right text-sm font-semibold ${calcularSaldoFila(fila) > 0.005 ? "text-red-700" : calcularSaldoFila(fila) < -0.005 ? "text-green-700" : "text-zinc-600"}`}>
        {Math.abs(calcularSaldoFila(fila)).toFixed(2)} €
      </td>

      <td className={`px-4 py-2 text-right text-sm font-bold ${calcularTotalHasta(index) > 0.005 ? "text-red-700" : calcularTotalHasta(index) < -0.005 ? "text-green-700" : "text-zinc-600"}`}>
        {Math.abs(calcularTotalHasta(index)).toFixed(2)} €
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