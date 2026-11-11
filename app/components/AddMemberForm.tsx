"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { normalizarTexto } from "@/lib/texto";

type Socio = {
  NUMCENS: number;
  Nombre: string | null;
  Apellidos: string | null;
  Estado?: string | null;
};
type Tarifa = {
  IDCuota: string;
  Descripcion: string | null;
  Importe: number;
};

const normalizar = (texto: string) => normalizarTexto(texto || "");

export default function AddMemberForm({ idFamilia }: { idFamilia: number }) {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [pagadores, setPagadores] = useState<Socio[]>([]);
  const [tiposCuota, setTiposCuota] = useState<Tarifa[]>([]);
  const [ejercicio, setEjercicio] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [numcensElegido, setNumcensElegido] = useState<number | null>(null);
  const [busquedaPagador, setBusquedaPagador] = useState("");
  const [numcensPagador, setNumcensPagador] = useState<number | null>(null);
  const [idCuota, setIdCuota] = useState("");
  const [metodo, setMetodo] = useState<"Banco" | "Efectivo">("Efectivo");
  const [plazos, setPlazos] = useState(1);
  const [abierto, setAbierto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(false);

  useEffect(() => {
    async function cargar() {
      setCargandoDatos(true);
      try {
        const { data: ejercicioData, error: eEjercicio } = await (supabase as any)
          .from("EJERCICIOS")
          .select("Ejercicio")
          .eq("Activo", true)
          .maybeSingle();
        if (eEjercicio) throw eEjercicio;
        const activo = Number(ejercicioData?.Ejercicio || 0);
        if (!activo) throw new Error("No existe un ejercicio activo.");
        setEjercicio(activo);

        const [resSinFamilia, resPagadores, resTarifas] = await Promise.all([
          (supabase as any).from("SOCIOS")
            .select("NUMCENS, Nombre, Apellidos, Estado")
            .is("ID_Familia", null)
            .order("Apellidos", { ascending: true })
            .range(0, 9999),
          (supabase as any).from("SOCIOS")
            .select("NUMCENS, Nombre, Apellidos, Estado")
            .order("Apellidos", { ascending: true })
            .range(0, 9999),
          (supabase as any).from("TIPOS_CUOTA")
            .select("IDCuota, Descripcion, Importe")
            .eq("Ejercicio", activo)
            .order("Descripcion", { ascending: true }),
        ]);
        if (resSinFamilia.error) throw resSinFamilia.error;
        if (resPagadores.error) throw resPagadores.error;
        if (resTarifas.error) throw resTarifas.error;
        setSocios((resSinFamilia.data || []) as Socio[]);
        setPagadores((resPagadores.data || []) as Socio[]);
        const tarifas = (resTarifas.data || []).map((t: any) => ({
          IDCuota: String(t.IDCuota),
          Descripcion: t.Descripcion ?? null,
          Importe: Number(t.Importe ?? 0),
        }));
        setTiposCuota(tarifas);
      } catch (err: any) {
        alert("Error cargando datos: " + (err?.message || String(err)));
      } finally {
        setCargandoDatos(false);
      }
    }
    cargar();
  }, []);

  const socioElegido = socios.find((s) => Number(s.NUMCENS) === numcensElegido);
  const pagadorElegido = pagadores.find((s) => Number(s.NUMCENS) === numcensPagador);
  const tarifaElegida = tiposCuota.find((t) => t.IDCuota === idCuota);
  const sociosFiltrados = useMemo(() => busqueda.trim()
    ? socios.filter((s) => normalizar(`${s.NUMCENS} ${s.Apellidos || ""} ${s.Nombre || ""}`)
      .includes(normalizar(busqueda.trim()))).slice(0, 15)
    : [], [socios, busqueda]);
  const pagadoresFiltrados = useMemo(() => busquedaPagador.trim()
    ? pagadores.filter((s) => normalizar(`${s.NUMCENS} ${s.Apellidos || ""} ${s.Nombre || ""}`)
      .includes(normalizar(busquedaPagador.trim()))).slice(0, 15)
    : [], [pagadores, busquedaPagador]);

  function seleccionarSocio(s: Socio) {
    setNumcensElegido(Number(s.NUMCENS));
    setBusqueda("");
    setNumcensPagador(Number(s.NUMCENS));
    setBusquedaPagador("");
  }

  function reiniciar() {
    setAbierto(false);
    setBusqueda("");
    setNumcensElegido(null);
    setBusquedaPagador("");
    setNumcensPagador(null);
    setIdCuota("");
    setMetodo("Efectivo");
    setPlazos(1);
  }

  async function agregarMiembro() {
    if (!socioElegido || !ejercicio || !tarifaElegida || !numcensPagador || loading) return;
    const numcens = Number(socioElegido.NUMCENS);
    const numeroPlazos = metodo === "Banco" ? plazos : 1;

    if (!window.confirm(
      `¿Añadir a ${socioElegido.Nombre} ${socioElegido.Apellidos} y asignar la tarifa ` +
      `${tarifaElegida.Descripcion || tarifaElegida.IDCuota} (${tarifaElegida.Importe.toFixed(2)} €)?`
    )) return;

    setLoading(true);
    let miembroAsignado = false;
    try {
      // Comprobar antes de escribir: solo incorporamos socios sin familia.
      const { data: socioActual, error: errorSocio } = await (supabase as any)
        .from("SOCIOS").select("ID_Familia").eq("NUMCENS", numcens).single();
      if (errorSocio) throw errorSocio;
      if (socioActual?.ID_Familia != null && Number(socioActual.ID_Familia) !== idFamilia) {
        throw new Error("Este socio ya pertenece a otra familia.");
      }

      if (metodo === "Banco") {
        const { data: bancos, error: errorBanco } = await (supabase as any)
          .from("DATOS_BANCARIOS").select("IBAN, Activo")
          .eq("NUMCENS", numcensPagador);
        if (errorBanco) throw errorBanco;
        if (!(bancos || []).some((b: any) => b.Activo !== false && String(b.IBAN || "").trim())) {
          throw new Error("El pagador no tiene un IBAN activo registrado.");
        }
      }

      // No sobrescribir cuotas ni formas de pago ya existentes.
      const [{ data: cuotas, error: errorCuota }, { data: formas, error: errorForma }] = await Promise.all([
        (supabase as any).from("CUOTAS_SOCIOS").select("IDCuotaSocio")
          .eq("NUMCENS", numcens).eq("Ejercicio", ejercicio).limit(1),
        (supabase as any).from("FORMAS_PAGO_SOCIOS").select("NUMCENS")
          .eq("NUMCENS", numcens).eq("Activo", true).limit(1),
      ]);
      if (errorCuota) throw errorCuota;
      if (errorForma) throw errorForma;
      if ((cuotas || []).length || (formas || []).length) {
        throw new Error("Este socio ya tiene cuota o forma de pago activa. No se modificarán automáticamente; revísalo desde su ficha.");
      }

      if (socioActual?.ID_Familia == null) {
        const { error } = await (supabase as any).from("SOCIOS")
          .update({ ID_Familia: idFamilia })
          .eq("NUMCENS", numcens).is("ID_Familia", null);
        if (error) throw error;
        miembroAsignado = true;
      }

      // Crear los dos registros que necesita el botón Editar de la familia.
      const { error: errorNuevaForma } = await (supabase as any)
        .from("FORMAS_PAGO_SOCIOS")
        .insert({
          NUMCENS: numcens,
          Metodo: metodo,
          NumeroPlazos: numeroPlazos,
          Fraccionado: numeroPlazos > 1,
          NUMCENS_Pagador: numcensPagador,
          Activo: true,
        });
      if (errorNuevaForma) throw errorNuevaForma;

      const { error: errorNuevaCuota } = await (supabase as any)
        .from("CUOTAS_SOCIOS")
        .insert({
          NUMCENS: numcens,
          Ejercicio: ejercicio,
          ID_Familia: idFamilia,
          IDCuota: tarifaElegida.IDCuota,
          Importe: tarifaElegida.Importe,
          EstadoPago: "Pendiente",
          NUMCENS_Pagador: numcensPagador,
        });
      if (errorNuevaCuota) throw errorNuevaCuota;

      const { data: familia, error: errorFamilia } = await (supabase as any)
        .from("FAMILIAS")
        .select("Titular_NUMCENS")
        .eq("ID_Familia", idFamilia)
        .single();
      if (errorFamilia) throw errorFamilia;
      if (!familia?.Titular_NUMCENS) {
        const { error } = await (supabase as any)
          .from("FAMILIAS")
          .update({ Titular_NUMCENS: numcens })
          .eq("ID_Familia", idFamilia);
        if (error) throw error;
      }

      // Reutilizar la generación de plazos que ya existe en la aplicación.
      const { error: errorGenerar } = await (supabase as any).rpc(
        "generar_actualizar_cuotas_completo", { p_ejercicio: ejercicio }
      );
      if (errorGenerar) throw errorGenerar;

      // Confirmar que se han creado plazos cuando la cuota no es cero.
      const { data: cuotaCreada, error: errorVerificar } = await (supabase as any)
        .from("CUOTAS_SOCIOS")
        .select("IDCuotaSocio")
        .eq("NUMCENS", numcens)
        .eq("Ejercicio", ejercicio)
        .maybeSingle();
      if (errorVerificar) throw errorVerificar;
      if (!cuotaCreada) throw new Error("No se ha encontrado la cuota después del alta.");

      alert("Socio añadido con tarifa y forma de pago configuradas.");
      reiniciar();
      window.location.reload();
    } catch (err: any) {
      alert(
        "No se ha completado la configuración: " + (err?.message || String(err)) +
        (miembroAsignado
          ? "\n\nEl socio puede haber quedado vinculado a la familia. Revisa su ficha antes de repetir el alta."
          : "")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}
        className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950">
        + Añadir miembro
      </button>
      {abierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Añadir miembro</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Asigna la tarifa y la forma de pago del ejercicio {ejercicio || "activo"}.
                </p>
              </div>
              <button type="button" onClick={reiniciar} disabled={loading}
                className="text-xl text-zinc-400 hover:text-zinc-700">×</button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="relative">
                <label className="mb-1 block text-xs font-semibold text-zinc-600">Socio sin familia</label>
                {socioElegido ? (
                  <div className="flex items-center justify-between border border-zinc-300 px-3 py-2 text-sm">
                    <span>{socioElegido.NUMCENS} · {socioElegido.Nombre} {socioElegido.Apellidos}</span>
                    <button type="button" onClick={() => { setNumcensElegido(null); setBusqueda(""); }}
                      className="text-red-900 hover:underline">Cambiar</button>
                  </div>
                ) : (
                  <>
                    <input autoFocus value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar por número, nombre o apellidos..."
                      className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900" />
                    {busqueda.trim() && (
                      <div className="absolute z-40 mt-1 max-h-52 w-full overflow-y-auto border border-zinc-300 bg-white shadow-lg">
                        {sociosFiltrados.length ? sociosFiltrados.map((s) => (
                          <button key={s.NUMCENS} type="button" onClick={() => seleccionarSocio(s)}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-red-50">
                            {s.NUMCENS} · {s.Apellidos}, {s.Nombre}
                          </button>
                        )) : <p className="px-3 py-2 text-sm text-zinc-500">Sin resultados</p>}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-600">Tipo de cuota</label>
                <select value={idCuota} onChange={(e) => setIdCuota(e.target.value)}
                  className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm">
                  <option value="">Seleccionar tarifa...</option>
                  {tiposCuota.map((t) => (
                    <option key={t.IDCuota} value={t.IDCuota}>
                      {t.Descripcion || t.IDCuota} · {t.Importe.toFixed(2)} €
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-600">Forma de pago</label>
                  <select value={metodo} onChange={(e) => { setMetodo(e.target.value as "Banco" | "Efectivo"); if (e.target.value === "Efectivo") setPlazos(1); }}
                    className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm">
                    <option value="Efectivo">Efectivo</option>
                    <option value="Banco">Banco</option>
                  </select>
                </div>
                {metodo === "Banco" && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-600">Nº de plazos</label>
                    <select value={plazos} onChange={(e) => setPlazos(Number(e.target.value))}
                      className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="relative">
                <label className="mb-1 block text-xs font-semibold text-zinc-600">Pagador (cualquier socio, incluso de baja)</label>
                {pagadorElegido ? (
                  <div className="flex items-center justify-between gap-2 border border-zinc-300 px-3 py-2 text-sm">
                    <span>{pagadorElegido.NUMCENS} · {pagadorElegido.Nombre} {pagadorElegido.Apellidos}</span>
                    <button type="button" onClick={() => { setNumcensPagador(null); setBusquedaPagador(""); }}
                      className="text-red-900 hover:underline">Cambiar</button>
                  </div>
                ) : (
                  <>
                    <input value={busquedaPagador} onChange={(e) => setBusquedaPagador(e.target.value)}
                      placeholder="Buscar pagador por número o nombre..."
                      className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900" />
                    {busquedaPagador.trim() && (
                      <div className="absolute z-40 mt-1 max-h-52 w-full overflow-y-auto border border-zinc-300 bg-white shadow-lg">
                        {pagadoresFiltrados.length ? pagadoresFiltrados.map((p) => (
                          <button key={p.NUMCENS} type="button" onClick={() => { setNumcensPagador(Number(p.NUMCENS)); setBusquedaPagador(""); }}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-red-50">
                            {p.NUMCENS} · {p.Apellidos}, {p.Nombre}{String(p.Estado || "").toLowerCase() === "baja" ? " (Baja)" : ""}
                          </button>
                        )) : <p className="px-3 py-2 text-sm text-zinc-500">Sin resultados</p>}
                      </div>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs text-zinc-500">Este formulario configura socios que todavía no tienen cuota ni forma de pago activa. No sobrescribe cuotas ni pagos existentes.</p>
              {cargandoDatos && <p className="text-xs text-zinc-500">Cargando tarifas y socios...</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-5 py-3">
              <button type="button" onClick={reiniciar} disabled={loading}
                className="border border-zinc-300 bg-white px-4 py-2 text-sm">Cancelar</button>
              <button type="button" onClick={agregarMiembro}
                disabled={loading || cargandoDatos || !socioElegido || !tarifaElegida || !numcensPagador || !ejercicio}
                className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-40">
                {loading ? "Añadiendo..." : "Añadir miembro"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
