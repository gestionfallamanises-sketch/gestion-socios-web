"use client";

import { supabase } from "@/lib/supabaseClient";

export default function RemoveMemberButton({
  numcens,
}: {
  numcens: string;
}) {
  async function quitarMiembro() {
    const confirmar = confirm(
      "¿Quitar socio de la familia?"
    );

    if (!confirmar) return;

    const { error } = await (supabase as any)
      .from("SOCIOS")
      .update({
        ID_Familia: null,
      })
      .eq("NUMCENS", Number(numcens));

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
      onClick={quitarMiembro}
      className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
    >
      Quitar
    </button>
  );
}