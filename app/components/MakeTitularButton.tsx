"use client";

import { supabase } from "../../lib/supabase";

export default function MakeTitularButton({
  idFamilia,
  numcens,
}: {
  idFamilia: number;
  numcens: string;
}) {
  async function cambiarTitular() {
    const { error } = await supabase
      .from("FAMILIAS")
      .update({
        Titular_NUMCENS: Number(numcens),
      })
      .eq("ID_Familia", Number(idFamilia));

    if (error) {
      alert(error.message);
      return;
    }

    await supabase.rpc("generar_actualizar_cuotas_completo", {
      p_ejercicio: 2027,
    });
    
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={cambiarTitular}
      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-200"
    >
      Cambiar
    </button>
  );
}