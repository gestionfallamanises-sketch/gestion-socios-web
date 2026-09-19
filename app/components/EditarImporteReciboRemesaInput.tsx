"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  idRemesa: number;
  iban: string | null;
  titularCuenta: string | null;
  importeInicial: number;
};

export default function EditarImporteReciboRemesaInput({
  idRemesa,
  iban,
  titularCuenta,
  importeInicial,
}: Props) {
  const [importe, setImporte] = useState(
    Number(importeInicial || 0).toFixed(2)
  );
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    const nuevoImporte = Number(importe);

    if (
      !Number.isFinite(nuevoImporte) ||
      nuevoImporte < 0 ||
      nuevoImporte === Number(importeInicial)
    ) {
      return;
    }

    setGuardando(true);

    const { error } = await (supabase as any).rpc(
      "actualizar_importe_recibo_remesa",
      {
        p_id_remesa: idRemesa,
        p_iban: iban,
        p_titular_cuenta: titularCuenta,
        p_importe_total: nuevoImporte,
      }
    );

    if (error) {
      alert(error.message);
      setImporte(Number(importeInicial || 0).toFixed(2));
      setGuardando(false);
      return;
    }

    window.location.reload();
  }

  return (
    <input
      type="number"
      min="0"
      step="0.01"
      value={importe}
      onChange={(e) => setImporte(e.target.value)}
      onBlur={guardar}
      disabled={guardando}
      className="w-24 border border-zinc-300 bg-white px-2 py-1 text-right text-sm font-medium outline-none focus:border-red-900"
    />
  );
}