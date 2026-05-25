"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  idDetalleRemesa: number;
  idRemesa: number;
  importeInicial: number;
};

export default function EditarImporteRemesaInput({
  idDetalleRemesa,
  idRemesa,
  importeInicial,
}: Props) {
  const [importe, setImporte] = useState(
    Number(importeInicial || 0).toFixed(2)
  );
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);

    const { error } = await (supabase as any)
      .from("REMESAS_DETALLE")
      .update({
        Importe: Number(importe),
      })
      .eq("IDDetalleRemesa", idDetalleRemesa);

    if (error) {
      alert(error.message);
      setGuardando(false);
      return;
    }

    await supabase.rpc("recalcular_total_remesa", {
      p_id_remesa: idRemesa,
    });

    setGuardando(false);
  }

  return (
    <input
      type="number"
      step="0.01"
      value={importe}
      onChange={(e) => setImporte(e.target.value)}
      onBlur={guardar}
      disabled={guardando}
      className="w-24 border border-zinc-300 bg-white px-2 py-1 text-right text-sm outline-none focus:border-red-900"
    />
  );
}