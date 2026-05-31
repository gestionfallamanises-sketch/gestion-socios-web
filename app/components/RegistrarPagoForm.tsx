"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  idCuotaSocio: number;
  numcens: number;
};

export default function RegistrarPagoForm({
  idCuotaSocio,
  numcens,
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
  
    const { data, error } = await (supabase as any).rpc(
      "registrar_pago_manual_cuota",
      {
        p_id_cuota_socio: idCuotaSocio,
        p_importe: Number(importe),
        p_observaciones: observaciones || null,
      }
    );
  
    setLoading(false);
  
    if (error) {
      alert(error.message);
      return;
    }
  
    alert("Pago registrado correctamente. ID: " + data);
    window.location.reload();
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div>
        <label className="mb-1 block text-sm font-medium">
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

      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium">
          Observaciones
        </label>

        <input
          type="text"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
        />
      </div>

      <div className="md:col-span-3">
        <button
          onClick={registrarPago}
          disabled={loading || !importe}
          className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50"
        >
          {loading
            ? "Registrando..."
            : "Registrar pago"}
        </button>
      </div>
    </div>
  );
}