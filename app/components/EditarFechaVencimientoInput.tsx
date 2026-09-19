"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  idPlazo?: number;
  idRemesa?: number;
  fechaInicial: string | null;
};

export default function EditarFechaVencimientoInput({
  idPlazo,
  idRemesa,
  fechaInicial,
}: Props) {
  const [fecha, setFecha] = useState(fechaInicial || "");
  const [guardando, setGuardando] = useState(false);

  async function guardar(nuevaFecha: string) {
    if (nuevaFecha === (fechaInicial || "")) {
      return;
    }
  
    setGuardando(true);
  
    const { error } = idRemesa
      ? await (supabase as any).rpc(
          "actualizar_fecha_vencimiento_remesa",
          {
            p_id_remesa: idRemesa,
            p_fecha: nuevaFecha || null,
          }
        )
      : await (supabase as any).rpc(
          "actualizar_fecha_vencimiento_plazo",
          {
            p_id_plazo: idPlazo,
            p_fecha: nuevaFecha || null,
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
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={fecha}
        onChange={(e) => {
          const nuevaFecha = e.target.value;
          setFecha(nuevaFecha);
          guardar(nuevaFecha);
        }}
        disabled={guardando}
        className={`h-10 border border-zinc-300 bg-white px-3 text-lg font-medium outline-none focus:border-red-900 ${
          guardando ? "cursor-wait opacity-60" : ""
        }`}
      />
  
      {guardando && (
        <span className="text-sm font-medium text-zinc-500">
          Guardando...
        </span>
      )}
    </div>
  );
}