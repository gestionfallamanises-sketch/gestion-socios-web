"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function EditarCargoHistorial({
    id,
    numcens,
    ejercicio,
    ejercicioActivo,
    cargoInicial,
    categoriaInicial,
    onGuardado,
    soloBoton = false,
  }: {
    id: number;
    numcens: number;
    ejercicio: number;
    ejercicioActivo: number | null;
    cargoInicial: string | null;
    categoriaInicial: string | null;
    onGuardado?: () => void;
    soloBoton?: boolean;
  }) {

  const [editando, setEditando] = useState(false);
  const [cargo, setCargo] = useState(cargoInicial || "");
  const [categoria, setCategoria] = useState(categoriaInicial || "");
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);

    // 1. Guardamos siempre el cargo en el historial
    const { error } = await supabase
      .from("HISTORIAL_SOCIOS")
      .update({
        Cargo: cargo.trim() || null,
        CategoriaCargo: categoria,
      })
      .eq("ID", id);

    if (error) {
      setGuardando(false);
      alert("No se ha podido guardar el cargo.");
      return;
    }

    // 2. Si estamos editando el ejercicio activo,
    // actualizamos también el cargo actual de la ficha del socio
    if (
      ejercicioActivo &&
      Number(ejercicio) === Number(ejercicioActivo)
    ) {
      const { error: errorSocio } = await supabase
        .from("SOCIOS")
        .update({
          CARREG: cargo.trim() || null,
        })
        .eq("NUMCENS", numcens);

      if (errorSocio) {
        setGuardando(false);
        alert(
          "El historial se ha guardado, pero no se ha podido actualizar la ficha del socio."
        );
        return;
      }
    }

    setGuardando(false);
    onGuardado?.();
    setEditando(false);
  }

  if (editando) {
    return (
      <div className="relative">
        <div className="fixed inset-0 z-40" onClick={() => setEditando(false)} />
  
        <div
          className="absolute right-0 top-8 z-50 w-52 border border-zinc-200 bg-white p-3 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2">
            <label className="mb-1 block text-[10px] font-medium uppercase text-zinc-500">
              Cargo
            </label>
  
            <input
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Cargo"
              autoFocus
              className="w-full border border-zinc-300 px-2 py-1.5 text-xs outline-none focus:border-red-900"
            />
          </div>
  
          <div className="mb-3">
            <label className="mb-1 block text-[10px] font-medium uppercase text-zinc-500">
              Categoría
            </label>
  
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full border border-zinc-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-red-900"
            >
              <option value="REPRESENTATIVO">Representativo</option>
              <option value="DIRECTIVO">Directivo</option>
              <option value="VOCAL">Vocal</option>
            </select>
          </div>
  
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setCargo(cargoInicial || "");
                setCategoria(categoriaInicial || "");
                setEditando(false);
              }}
              className="border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </button>
  
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="bg-red-900 px-3 py-1.5 text-xs text-white hover:bg-red-950 disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-7 pr-8">
      {!soloBoton && (
  <>
    {cargo ? (
      <span
        className={
          categoria === "REPRESENTATIVO"
            ? "bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800"
            : categoria === "DIRECTIVO"
            ? "bg-red-100 px-2 py-1 text-xs font-semibold text-red-800"
            : categoria === "VOCAL"
            ? "bg-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-700"
            : "text-xs text-zinc-600"
        }
      >
        {cargo}
      </span>
    ) : (
      <span className="text-xs text-zinc-400">—</span>
    )}
  </>
)}
  
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="no-print absolute right-0 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-red-900"
        title="Editar cargo"
        aria-label="Editar cargo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.862 4.487 18.55 2.8a1.875 1.875 0 1 1 2.652 2.652L10.582 16.073a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.862 4.487Zm0 0L19.5 7.125M18 14.25v4.125A1.875 1.875 0 0 1 16.125 20.25H5.625A1.875 1.875 0 0 1 3.75 18.375V7.875A1.875 1.875 0 0 1 5.625 6H9.75"
          />
        </svg>
      </button>
    </div>
  );
}