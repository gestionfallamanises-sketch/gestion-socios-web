"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function AddMemberForm({
  idFamilia,
}: {
  idFamilia: number;
}) {
  const [socios, setSocios] = useState<any[]>([]);
  const [seleccion, setSeleccion] = useState("");
  const [loading, setLoading] = useState(false);

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

    if (!familia?.Titular_NUMCENS) {
      await supabase
        .from("FAMILIAS")
        .update({
          Titular_NUMCENS: socioElegido.NUMCENS,
        })
        .eq("ID_Familia", idFamilia);
    }
    await supabase.rpc("generar_actualizar_cuotas_completo", {
      p_ejercicio: 2027,
    });
    
    setLoading(false);
    setSeleccion("");
    window.location.reload();
  }

  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-2">
      <div className="relative w-72">
  <input
    value={seleccion}
    onChange={(e) => setSeleccion(e.target.value)}
    placeholder="Buscar socio..."
    className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
  />

  {seleccion && (
    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto border border-zinc-200 bg-white shadow-lg">
      {socios
        .filter((socio) => {
          const texto = normalizar(
            `${socio.NUMCENS} ${socio.Apellidos} ${socio.Nombre}`
          );

          return texto.includes(
            normalizar(seleccion)
          );
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
            {socio.NUMCENS} · {socio.Apellidos},{" "}
            {socio.Nombre}
          </button>
        ))}
    </div>
  )}
</div>

        <button
          type="button"
          onClick={agregarMiembro}
          disabled={loading}
          className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50"
        >
          {loading ? "Añadiendo..." : "Añadir miembro"}
        </button>
      </div>

      <p className="mt-2 text-xs text-zinc-500">
        Solo aparecen socios que todavía no están asignados a ninguna familia.
      </p>
      </div>
  );
}