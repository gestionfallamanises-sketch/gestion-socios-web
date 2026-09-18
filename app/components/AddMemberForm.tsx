"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { normalizarTexto } from "@/lib/texto";

function normalizar(texto: string) {
  return normalizarTexto(texto);
}

export default function AddMemberForm({
  idFamilia,
}: {
  idFamilia: number;
}) {
  const [socios, setSocios] = useState<any[]>([]);
  const [seleccion, setSeleccion] = useState("");
  const [loading, setLoading] = useState(false);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    async function cargarSocios() {
      const { data } = await supabase
        .from("SOCIOS")
        .select("*")
        .is("ID_Familia", null)
        .order("Apellidos", { ascending: true });

      setSocios(data || []);
    }

    cargarSocios();
  }, []);

  async function agregarMiembro() {
    const numcensSeleccionado = seleccion.split(" - ")[0];

    const busquedaNormalizada = normalizar(seleccion);

const socioElegido = socios.find((socio) => {
  const textoSocio = normalizar(
    `${socio.NUMCENS} ${socio.Apellidos} ${socio.Nombre}`
  );

  return (
    String(socio.NUMCENS) === String(numcensSeleccionado) ||
    textoSocio.includes(busquedaNormalizada)
  );
});

    if (!socioElegido) {
      alert("Selecciona un socio válido");
      return;
    }

    setLoading(true);

    const { error } = await (supabase as any)
  .from("SOCIOS")
  .update({
    ID_Familia: idFamilia,
  })
  .eq("NUMCENS", socioElegido.NUMCENS);

    if (error) {
      setLoading(false);
      alert(error.message);
      return;
    }

    const { data: familia } = await supabase
      .from("FAMILIAS")
      .select("Titular_NUMCENS")
      .eq("ID_Familia", idFamilia)
      .single();

      if (!(familia as any)?.Titular_NUMCENS) {
      await (supabase as any)
  .from("FAMILIAS")
  .update({
          Titular_NUMCENS: socioElegido.NUMCENS,
        })
        .eq("ID_Familia", idFamilia);
    }
    const { data: ejercicioData, error: errorEjercicio } = await supabase
  .from("EJERCICIOS")
  .select("Ejercicio")
  .eq("Activo", true)
  .maybeSingle();

if (errorEjercicio) {
  alert(errorEjercicio.message);
  return;
}

const ejercicioActivo = Number(ejercicioData?.Ejercicio || 0);

if (!ejercicioActivo) {
  alert("No se ha encontrado un ejercicio activo.");
  return;
}

const { error: errorCuotas } = await supabase.rpc(
  "generar_actualizar_cuotas_completo",
  {
    p_ejercicio: ejercicioActivo,
  }
);

if (errorCuotas) {
  alert(errorCuotas.message);
  return;
}
    
    setLoading(false);
    setSeleccion("");
    window.location.reload();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
      >
        + Añadir miembro
      </button>
  
      {abierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-zinc-200 bg-white shadow-xl">
  
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">
                  Añadir miembro
                </h2>
  
                <p className="mt-1 text-xs text-zinc-500">
                  Selecciona un socio que todavía no pertenezca a ninguna familia.
                </p>
              </div>
  
              <button
                type="button"
                onClick={() => {
                  setAbierto(false);
                  setSeleccion("");
                }}
                className="text-xl text-zinc-400 hover:text-zinc-700"
              >
                ×
              </button>
            </div>
  
            <div className="p-5">
              <div className="relative">
                <input
                  autoFocus
                  value={seleccion}
                  onChange={(e) => setSeleccion(e.target.value)}
                  placeholder="Buscar por nombre, apellidos o NUMCENS..."
                  className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
                />
  
                {seleccion && (
                  <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto border border-zinc-200 bg-white shadow-lg">
                    {socios
                      .filter((socio) => {
                        const texto = normalizar(
                          `${socio.NUMCENS} ${socio.Apellidos} ${socio.Nombre}`
                        );
  
                        return texto.includes(normalizar(seleccion));
                      })
                      .slice(0, 20)
                      .map((socio) => (
                        <button
                          key={socio.NUMCENS}
                          type="button"
                          onClick={() =>
                            setSeleccion(
                              `${socio.NUMCENS} - ${socio.Apellidos}, ${socio.Nombre}`
                            )
                          }
                          className="block w-full border-b border-zinc-100 px-3 py-2 text-left text-sm hover:bg-red-50"
                        >
                          <span className="font-medium">
                            {socio.Apellidos}, {socio.Nombre}
                          </span>
  
                          <span className="ml-2 text-xs text-zinc-400">
                            Nº {socio.NUMCENS}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
  
            <div className="flex justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-5 py-3">
              <button
                type="button"
                onClick={() => {
                  setAbierto(false);
                  setSeleccion("");
                }}
                disabled={loading}
                className="border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Cancelar
              </button>
  
              <button
                type="button"
                onClick={agregarMiembro}
                disabled={loading || !seleccion}
                className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50"
              >
                {loading ? "Añadiendo..." : "Añadir miembro"}
              </button>
            </div>
  
          </div>
        </div>
      )}
    </>
  );
}