"use client";

import { supabase } from "@/lib/supabaseClient";

type Props = {
  idDetalleRemesa: number;
};

export default function QuitarLineaRemesaButton({
  idDetalleRemesa,
}: Props) {
  async function quitar() {
    const confirmar = confirm(
      "¿Quitar esta línea de la remesa?"
    );

    if (!confirmar) return;

    const { error } = await (supabase as any).rpc(
      "quitar_linea_remesa",
      {
        p_id_detalle_remesa: idDetalleRemesa,
      }
    );

    if (error) {
      alert(error.message);
      return;
    }

    window.location.reload();
  }

  return (
    <button
      onClick={quitar}
      className="bg-zinc-200 px-3 py-1 text-xs hover:bg-zinc-300"
    >
      Quitar
    </button>
  );
}