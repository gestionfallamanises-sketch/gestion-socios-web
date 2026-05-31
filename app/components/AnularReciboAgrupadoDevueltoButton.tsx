"use client";

import { supabase } from "@/lib/supabaseClient";

type Props = {
  idRemesa: number;
  numcensPagador: number;
  iban: string | null;
};

export default function AnularReciboAgrupadoDevueltoButton({
  idRemesa,
  numcensPagador,
  iban,
}: Props) {
  async function anular() {
    const confirmar = confirm(
      "¿Anular la devolución de este recibo agrupado?"
    );

    if (!confirmar) return;

    const { error } = await (supabase as any).rpc(
      "anular_recibo_agrupado_devuelto",
      {
        p_id_remesa: idRemesa,
        p_numcens_pagador: numcensPagador,
        p_iban: iban || "",
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
      onClick={anular}
      className="bg-zinc-700 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-800"
    >
      Anular devolución
    </button>
  );
}