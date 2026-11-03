"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  idCuotaSocio: number;
  numcens: number;
  pendienteMaximo?: number;
};

const clienteAutenticado = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function fechaLocal() {
  const fecha = new Date();
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

export default function RegistrarPagoForm({
  idCuotaSocio,
  numcens,
  pendienteMaximo,
}: Props) {
  const [fechaPago, setFechaPago] = useState(fechaLocal);
  const [importe, setImporte] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);

  async function registrarPago() {
    if (loading) return;
    if (!fechaPago) {
      alert("Selecciona una fecha de pago.");
      return;
    }
    if (
      !importe ||
      !Number.isFinite(Number(importe)) ||
      Number(importe) <= 0 ||
      !/^\d+(\.\d{1,2})?$/.test(importe)
    ) {
      alert("Introduce un importe válido");
      return;
    }

    if (
      pendienteMaximo !== undefined &&
      Number(importe) > Number(pendienteMaximo)
    ) {
      alert(`El importe máximo pendiente es ${Number(pendienteMaximo).toFixed(2)} €.`);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc(
        "registrar_pago_manual_cuota",
        {
          p_id_cuota_socio: idCuotaSocio,
          p_importe: Number(importe),
          p_observaciones: observaciones || null,
        }
      );

      if (error) {
        alert(error.message);
        return;
      }

      // El registro actual crea el pago con fecha de hoy. La función de edición
      // existente permite guardar la fecha elegida sin alterar su importe.
      const idPago = Number(data);
      const { error: errorFecha } = await (clienteAutenticado as any).rpc(
        "editar_pago_manual_seguro",
        {
          p_id_pago_manual: idPago,
          p_fecha_pago: fechaPago,
          p_importe: Number(importe),
          p_observaciones: observaciones.trim() || null,
        }
      );

      if (errorFecha) {
        alert(
          `El pago ${idPago} SE HA REGISTRADO, pero no se pudo guardar la fecha elegida: ${errorFecha.message}. No vuelvas a registrarlo; corrige la fecha con el lápiz desde la ficha del socio.`
        );
        window.location.reload();
        return;
      }

      alert("Pago registrado correctamente. ID: " + idPago);
      window.location.reload();
    } catch (error: any) {
      alert(`No se pudo completar la operación: ${error?.message || "Error desconocido"}. Comprueba el historial antes de volver a registrar el pago.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <label htmlFor="fecha-pago-manual" className="mb-1 block text-xs font-medium text-zinc-700">
            Fecha del pago
          </label>
          <input
            id="fecha-pago-manual"
            type="date"
            value={fechaPago}
            onChange={(e) => setFechaPago(e.target.value)}
            className="block w-full min-w-0 border border-zinc-300 bg-white px-2 py-2 text-sm outline-none focus:border-red-900"
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="importe-pago-manual" className="mb-1 block text-xs font-medium text-zinc-700">
            Importe (€)
          </label>
          <input
            id="importe-pago-manual"
            type="number"
            min="0"
            step="0.01"
            value={importe}
            onChange={(e) => setImporte(e.target.value)}
            className="block w-full min-w-0 border border-zinc-300 bg-white px-2 py-2 text-sm outline-none focus:border-red-900"
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="observaciones-pago-manual" className="mb-1 block text-xs font-medium text-zinc-700">
            Observaciones
          </label>
          <input
            id="observaciones-pago-manual"
            type="text"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="block w-full min-w-0 border border-zinc-300 bg-white px-2 py-2 text-sm outline-none focus:border-red-900"
          />
        </div>
        <button
          type="button"
          onClick={registrarPago}
          disabled={loading || !importe || !fechaPago}
          className="shrink-0 bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Registrando..." : "Registrar pago"}
        </button>
      </div>
    </div>
  );
}
