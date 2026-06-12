"use client";

import { supabase } from "@/lib/supabaseClient";

export default function AnularPagoManualButton({
  idPagoManual,
}: {
  idPagoManual: number;
}) {
  async function anularPago() {
    const confirmar = confirm(
      "¿Seguro que quieres anular este pago manual?"
    );

    if (!confirmar) return;

    const { error } = await (supabase as any).rpc(
      "anular_pago_manual_y_recalcular",
      {
        p_id_pago_manual: idPagoManual,
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
      type="button"
      onClick={anularPago}
      className="ml-3 text-xs font-medium text-red-700 hover:text-red-900"
    >
      Anular
    </button>
  );
}