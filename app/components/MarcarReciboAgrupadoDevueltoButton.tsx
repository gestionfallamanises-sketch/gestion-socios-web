"use client";

import { supabase } from "@/lib/supabaseClient";

type Props = {
  idRemesa: number;
  numcensPagador: number;
  iban: string | null;
};

export default function MarcarReciboAgrupadoDevueltoButton({
  idRemesa,
  numcensPagador,
  iban,
}: Props) {
  async function marcarDevuelto() {
    const gastosTexto = prompt("Gastos de devolución (€):", "6");

    if (gastosTexto === null) return;

    const gastos = Number(gastosTexto);

    if (Number.isNaN(gastos) || gastos < 0) {
      alert("Introduce un importe válido");
      return;
    }

    const observaciones = prompt(
      "Observaciones / motivo devolución:",
      "Recibo agrupado devuelto"
    );

    const confirmar = confirm(
      `¿Marcar este recibo agrupado como devuelto y sumar ${gastos.toFixed(
        2
      )} € al siguiente plazo pendiente del pagador?`
    );

    if (!confirmar) return;

    const { error } = await (supabase as any).rpc(
      "marcar_recibo_agrupado_devuelto",
      {
        p_id_remesa: idRemesa,
        p_numcens_pagador: numcensPagador,
        p_iban: iban || "",
        p_gastos: gastos,
        p_observaciones: observaciones || null,
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
      onClick={marcarDevuelto}
      className="bg-red-900 px-3 py-1 text-xs font-medium text-white hover:bg-red-950"
    >
      Marcar devuelto
    </button>
  );
}