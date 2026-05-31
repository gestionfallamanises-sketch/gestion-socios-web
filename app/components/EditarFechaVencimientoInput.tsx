"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  idPlazo: number;
  fechaInicial: string | null;
};

export default function EditarFechaVencimientoInput({
  idPlazo,
  fechaInicial,
}: Props) {
  const [fecha, setFecha] = useState(fechaInicial || "");
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);

    const { error } = await (supabase as any).rpc(
      "actualizar_fecha_vencimiento_plazo",
      {
        p_id_plazo: idPlazo,
        p_fecha: fecha || null,
      }
    );

    if (error) {
      alert(error.message);
      setGuardando(false);
      return;
    }

    setGuardando(false);
    window.location.reload();
  }

  return (
    <input
      type="date"
      value={fecha}
      onChange={(e) => setFecha(e.target.value)}
      onBlur={guardar}
      disabled={guardando}
      className="border border-zinc-300 bg-white px-2 py-1 text-sm outline-none focus:border-red-900"
    />
  );
}