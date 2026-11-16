"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";

function fechaEspanola(iso: string | null | undefined): string {
  if (!iso) return "";
  const fecha = iso.slice(0, 10);
  const partes = fecha.split("-");
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : "";
}

function fechaISO(texto: string): string | null | undefined {
  const valor = texto.trim();
  if (!valor) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  if (!match) return undefined;
  const [, dd, mm, aaaa] = match;
  const dia = Number(dd);
  const mes = Number(mm);
  const anno = Number(aaaa);
  const prueba = new Date(Date.UTC(anno, mes - 1, dia));
  if (
    anno < 1000 ||
    prueba.getUTCFullYear() !== anno ||
    prueba.getUTCMonth() !== mes - 1 ||
    prueba.getUTCDate() !== dia
  ) return undefined;
  return `${aaaa}-${mm}-${dd}`;
}

export default function EditarCargoHistorial({
  id,
  numcens,
  ejercicio,
  ejercicioActivo,
  fechaInicial,
  cargoInicial,
  categoriaInicial,
  onGuardado,
  soloBoton = false,
}: {
  id: number;
  numcens: number;
  ejercicio: number;
  ejercicioActivo: number | null;
  fechaInicial: string | null;
  cargoInicial: string | null;
  categoriaInicial: string | null;
  onGuardado?: () => void | Promise<void>;
  soloBoton?: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [fecha, setFecha] = useState(fechaEspanola(fechaInicial));
  const [cargo, setCargo] = useState(cargoInicial || "");
  const [categoria, setCategoria] = useState(categoriaInicial || "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  function cancelar() {
    setFecha(fechaEspanola(fechaInicial));
    setCargo(cargoInicial || "");
    setCategoria(categoriaInicial || "");
    setError("");
    setEditando(false);
  }

  async function guardar() {
    const fechaConvertida = fechaISO(fecha);
    if (fechaConvertida === undefined) {
      setError("Introduce una fecha válida (dd/mm/aaaa).");
      return;
    }
    setError("");
    setGuardando(true);
    try {
      const { data, error: errorHistorial } = await supabase
        .from("HISTORIAL_SOCIOS")
        .update({
          Fecha_Alta_Baja: fechaConvertida,
          Cargo: cargo.trim() || null,
          CategoriaCargo: categoria || null,
        })
        .eq("ID", id)
        .eq("NUMCENS", numcens)
        .select("ID");

      if (errorHistorial) throw errorHistorial;
      if (!data || data.length !== 1) {
        throw new Error("No se pudo confirmar la actualización del historial. Comprueba los permisos.");
      }

      // Conservar el comportamiento previo para el cargo del ejercicio activo.
      if (
        ejercicioActivo !== null &&
        Number(ejercicio) === Number(ejercicioActivo)
      ) {
        const { error: errorSocio } = await supabase
          .from("SOCIOS")
          .update({ CARREG: cargo.trim() || null })
          .eq("NUMCENS", numcens);
        if (errorSocio) {
          setError("Historial guardado, pero no se pudo actualizar el cargo actual del socio.");
          await onGuardado?.();
          return;
        }
      }

      await onGuardado?.();
      setEditando(false);
    } catch (e: any) {
      setError(e?.message || "No se ha podido guardar el historial.");
    } finally {
      setGuardando(false);
    }
  }

  function formatearFechaInput(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 8);
  
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 4) {
      return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
    }
  
    return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
  }

  return (
    <div className="relative min-h-7 pr-8">
      {editando && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 no-print" onMouseDown={(e) => { if (e.target === e.currentTarget) cancelar(); }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Editar historial"
            className="w-full max-w-[340px] max-h-[calc(100dvh-32px)] overflow-y-auto border border-zinc-200 bg-white p-3 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
          <div className="mb-2 text-sm font-bold text-zinc-800">Editar historial</div>
          <div className="space-y-2">
            <div className="grid grid-cols-[78px_minmax(0,1fr)] items-center gap-2">
              <label htmlFor={`fecha-hist-${id}`} className="text-xs text-zinc-600">Fecha</label>
              <input
                id={`fecha-hist-${id}`}
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                maxLength={10}
                value={fecha}
                onChange={(e) => setFecha(formatearFechaInput(e.target.value))}
                className="min-w-0 w-full border border-zinc-300 px-2 py-1.5 text-xs outline-none focus:border-red-900"
              />
            </div>
            <div className="grid grid-cols-[78px_minmax(0,1fr)] items-center gap-2">
              <label htmlFor={`cargo-hist-${id}`} className="text-xs text-zinc-600">Cargo</label>
              <input
                id={`cargo-hist-${id}`}
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Cargo"
                className="min-w-0 w-full border border-zinc-300 px-2 py-1.5 text-xs outline-none focus:border-red-900"
              />
            </div>
            <div className="grid grid-cols-[78px_minmax(0,1fr)] items-center gap-2">
              <label htmlFor={`categoria-hist-${id}`} className="text-xs text-zinc-600">Categoría</label>
              <select
                id={`categoria-hist-${id}`}
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="min-w-0 w-full border border-zinc-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-red-900"
              >
                <option value="">Sin categoría</option>
                <option value="REPRESENTATIVO">Representativo</option>
                <option value="DIRECTIVO">Directivo</option>
                <option value="VOCAL">Vocal</option>
              </select>
            </div>
          </div>
          {error && <p className="mt-2 text-xs text-red-700" role="alert">{error}</p>}
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={cancelar} disabled={guardando} className="border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50">Cancelar</button>
            <button type="button" onClick={guardar} disabled={guardando} className="bg-red-900 px-3 py-1.5 text-xs text-white hover:bg-red-950 disabled:opacity-50">{guardando ? "Guardando..." : "Guardar"}</button>
          </div>
          </div>
        </div>,
        document.body
      )}
      {!soloBoton && (
        cargo ? (
          <span className={
            categoria === "REPRESENTATIVO" ? "bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800" :
            categoria === "DIRECTIVO" ? "bg-red-100 px-2 py-1 text-xs font-semibold text-red-800" :
            categoria === "VOCAL" ? "bg-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-700" : "text-xs text-zinc-600"
          }>{cargo}</span>
        ) : <span className="text-xs text-zinc-400">—</span>
      )}
      <button
        type="button"
        onClick={() => {
          setFecha(fechaEspanola(fechaInicial));
          setCargo(cargoInicial || "");
          setCategoria(categoriaInicial || "");
          setError("");
          setEditando(true);
        }}
        className="no-print absolute right-0 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-red-900"
        title="Editar fecha y cargo"
        aria-label="Editar fecha y cargo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487 18.55 2.8a1.875 1.875 0 1 1 2.652 2.652L10.582 16.073a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.862 4.487Zm0 0L19.5 7.125M18 14.25v4.125A1.875 1.875 0 0 1 16.125 20.25H5.625A1.875 1.875 0 0 1 3.75 18.375V7.875A1.875 1.875 0 0 1 6 5.625H9.75" />
        </svg>
      </button>
    </div>
  );
}
