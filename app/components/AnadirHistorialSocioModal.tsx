"use client";

import { useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AnadirHistorialSocioModal({
  numcens,
  onGuardado,
}: {
  numcens: number;
  onGuardado: (nuevoMovimiento: any) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [ejercicio, setEjercicio] = useState("");
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState("Alta");
  const [cargo, setCargo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [posicion, setPosicion] = useState({ x: 0, y: 0 });
const arrastrando = useRef(false);
const inicioArrastre = useRef({ x: 0, y: 0 });

  async function guardar() {
    setError("");

    const ejercicioNumero = Number(ejercicio);

    if (!ejercicio || !Number.isInteger(ejercicioNumero)) {
      setError("Introduce un ejercicio válido.");
      return;
    }

    setGuardando(true);

    // Comprobar que ese ejercicio no exista ya para el socio
    const { data: existente, error: errorComprobacion } = await supabase
      .from("HISTORIAL_SOCIOS")
      .select("ID")
      .eq("NUMCENS", numcens)
      .eq("Ejercicio", ejercicioNumero)
      .maybeSingle();

    if (errorComprobacion) {
      setError(errorComprobacion.message);
      setGuardando(false);
      return;
    }

    if (existente) {
      setError("Este socio ya tiene historial para ese ejercicio.");
      setGuardando(false);
      return;
    }

    const { data: nuevoId, error: errorInsert } = await supabase.rpc(
        "anadir_historial_anterior",
        {
          p_numcens: numcens,
          p_ejercicio: ejercicioNumero,
          p_fecha: fecha || null,
          p_estado: estado,
          p_cargo: cargo.trim() || null,
          p_categoria: categoria || null,
        }
      );

    if (errorInsert) {
      setError(errorInsert.message);
      setGuardando(false);
      return;
    }

    setGuardando(false);

setEjercicio("");
setFecha("");
setEstado("Alta");
setCargo("");
setCategoria("");
setError("");

onGuardado({
    ID: nuevoId,
    NUMCENS: numcens,
    Ejercicio: ejercicioNumero,
    Fecha_Alta_Baja: fecha || null,
    Estado: estado,
    Cargo: cargo.trim() || null,
    CategoriaCargo: categoria || null,
  });
  }

  function iniciarArrastre(e: React.MouseEvent) {
    arrastrando.current = true;
  
    inicioArrastre.current = {
      x: e.clientX - posicion.x,
      y: e.clientY - posicion.y,
    };
  
    function mover(e: MouseEvent) {
      if (!arrastrando.current) return;
  
      setPosicion({
        x: e.clientX - inicioArrastre.current.x,
        y: e.clientY - inicioArrastre.current.y,
      });
    }
  
    function terminar() {
      arrastrando.current = false;
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseup", terminar);
    }
  
    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", terminar);
  }

  return (
    <>
      <button
  type="button"
  onClick={() => setAbierto(true)}
  className="h-[38px] whitespace-nowrap bg-zinc-600 px-3 text-sm font-medium text-white hover:bg-zinc-700"
>
  + Añadir historial
</button>

      {abierto && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-6"
          onClick={() => setAbierto(false)}
        >
          <div
  className="w-full max-w-md border border-zinc-200 bg-white shadow-2xl"
  style={{
    transform: `translate(${posicion.x}px, ${posicion.y}px)`,
  }}
  onClick={(e) => e.stopPropagation()}
>
<div
  onMouseDown={iniciarArrastre}
  className="flex cursor-move select-none items-center justify-between border-b border-zinc-200 px-5 py-4"
>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">
                  Añadir historial anterior
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  NUMCENS {numcens}
                </p>
              </div>

              <button
  type="button"
  onMouseDown={(e) => e.stopPropagation()}
  onClick={() => window.location.reload()}
  className="flex h-8 w-8 items-center justify-center text-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
>
  ×
</button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-zinc-600">
                  Ejercicio *
                </label>

                <input
                  type="number"
                  value={ejercicio}
                  onChange={(e) => setEjercicio(e.target.value)}
                  placeholder="Ej. 2020"
                  className="w-full border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-zinc-600">
                  Fecha
                </label>

                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-zinc-600">
                  Estado *
                </label>

                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full border border-zinc-300 px-3 py-2 text-sm"
                >
                  <option value="Alta">Alta</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-zinc-600">
                  Cargo
                </label>

                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Opcional"
                  className="w-full border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-zinc-600">
                  Categoría del cargo
                </label>

                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full border border-zinc-300 px-3 py-2 text-sm"
                >
                  <option value="">Sin categoría</option>
                  <option value="REPRESENTATIVO">Representativo</option>
                  <option value="DIRECTIVO">Directivo</option>
                  <option value="VOCAL">Vocal</option>
                </select>
              </div>

              {error && (
                <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                disabled={guardando}
                className="border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}