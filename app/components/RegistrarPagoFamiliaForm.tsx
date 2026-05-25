"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  idFamilia: number;
};

export default function RegistrarPagoFamiliaForm({
  idFamilia,
}: Props) {
  const [importe, setImporte] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);

  async function registrarPago() {
    if (!importe || Number(importe) <= 0) {
      alert("Introduce un importe válido");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.rpc(
      "registrar_pago_manual_familia",
      {
        p_id_familia: idFamilia,
        p_importe: Number(importe),
        p_observaciones: observaciones || null,
      }
    );

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Pago familiar registrado · ID " + data);

    window.location.reload();
  }

  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex flex-1 gap-3">
        <div className="w-36">
          <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
            Importe
          </label>
  
          <input
            type="number"
            step="0.01"
            value={importe}
            onChange={(e) => setImporte(e.target.value)}
            className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
          />
        </div>
  
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
            Observaciones
          </label>
  
          <input
            type="text"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
          />
        </div>
      </div>
  
      <button
        onClick={registrarPago}
        disabled={loading || !importe}
        className="h-[38px] bg-red-900 px-4 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50"
      >
        {loading ? "Registrando..." : "Registrar pago"}
      </button>
    </div>
  );
}