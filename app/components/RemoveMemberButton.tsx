"use client";

import React from "react";
import { supabase } from "../../lib/supabase";

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

const { error: errorCuotas } = await (supabase as any).rpc(
  "generar_actualizar_cuotas_completo",
  {
    p_ejercicio: ejercicioActivo,
  }
);

if (errorCuotas) {
  alert(errorCuotas.message);
  return;
}

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