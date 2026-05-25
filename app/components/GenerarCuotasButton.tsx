"use client";

import { supabase } from "@/lib/supabaseClient";

type Props = {
  ejercicio: number;
};

export default function GenerarCuotasButton({
  ejercicio,
}: Props) {
  async function generarCuotas() {
    const confirmar = confirm(
      `¿Quieres generar/recalcular las cuotas del ejercicio ${ejercicio}?`
    );

    if (!confirmar) return;

    const { error } = await (supabase as any).rpc(
      "generar_actualizar_cuotas_completo",
      {
        p_ejercicio: ejercicio,
      }
    );

    if (error) {
      alert(
        "Error al generar cuotas: " + error.message
      );
      return;
    }

    alert("Cuotas generadas correctamente");

    window.location.reload();
  }

  return (
    <button
    onClick={generarCuotas}
    title="Recalcular cuotas"
    className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
  >
    ↻
  </button>
  );
}