"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AnularPagoManualButton({ idPagoManual }: { idPagoManual: number }) {
  const [anulando, setAnulando] = useState(false);

  async function anularPago() {
    if (anulando) return;
    if (!window.confirm("¿Seguro que quieres anular este pago manual?")) return;

    setAnulando(true);
    try {
      const { error } = await supabase.rpc("anular_pago_manual_y_recalcular", {
        p_id_pago_manual: idPagoManual,
      });
      if (error) {
        alert(error.message);
        return;
      }
      window.location.reload();
    } finally {
      setAnulando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={anularPago}
      disabled={anulando}
      title="Anular pago"
      aria-label={`Anular pago ${idPagoManual}`}
      className="rounded p-1 text-red-700 hover:bg-red-50 hover:text-red-900 disabled:opacity-50"
    >
      🗑️
    </button>
  );
}
