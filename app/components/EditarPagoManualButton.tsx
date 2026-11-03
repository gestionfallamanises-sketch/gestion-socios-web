"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  idPagoManual: number;
  fechaPago: string;
  observaciones: string;
  importe: number;
};

export default function EditarPagoManualButton({
  idPagoManual,
  fechaPago,
  observaciones,
  importe,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState(fechaPago);
  const [notas, setNotas] = useState(observaciones);
  const [nuevoImporte, setNuevoImporte] = useState(importe.toFixed(2));
  const [guardando, setGuardando] = useState(false);

  function abrir() {
    setFecha(fechaPago);
    setNotas(observaciones);
    setNuevoImporte(importe.toFixed(2));
    setAbierto(true);
  }

  async function guardar() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(fecha))) {
      alert("Introduce una fecha válida.");
      return;
    }

    const valor = Number(nuevoImporte);
    if (!/^\d+(?:\.\d{1,2})?$/.test(nuevoImporte) || !Number.isFinite(valor) || valor <= 0) {
      alert("Introduce un importe válido, mayor que cero y con dos decimales como máximo.");
      return;
    }

    setGuardando(true);
    try {
      // Una única transacción SQL: pago + aplicación + cuota interna.
   
      const { error } = await (supabase as any).rpc("editar_pago_manual_seguro", {
        p_id_pago_manual: idPagoManual,
        p_fecha_pago: fecha,
        p_importe: valor,
        p_observaciones: notas.trim() || null,
      });
      if (error) throw error;
      window.location.reload();
    } catch (error: any) {
      alert("No se pudo actualizar el pago: " + (error?.message || "Error desconocido"));
      setGuardando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="rounded p-1 text-zinc-600 hover:bg-zinc-100 hover:text-red-900"
        title="Editar pago manual"
        aria-label={`Editar pago ${idPagoManual}`}
      >
        ✏️
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Editar pago manual">
          <div className="w-full max-w-md rounded-lg bg-white p-6 text-left shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-red-900">Editar pago en efectivo</h2>
                <p className="mt-1 text-xs text-zinc-500">Pago n.º {idPagoManual}</p>
              </div>
              <button type="button" onClick={() => setAbierto(false)} disabled={guardando} className="text-xl text-zinc-500" aria-label="Cerrar">×</button>
            </div>

            <label htmlFor={`fecha-pago-${idPagoManual}`} className="mb-1 block text-sm font-medium text-zinc-700">Fecha del pago</label>
            <input id={`fecha-pago-${idPagoManual}`} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="mb-4 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />

            <label htmlFor={`importe-pago-${idPagoManual}`} className="mb-1 block text-sm font-medium text-zinc-700">Importe del pago (€)</label>
            <input id={`importe-pago-${idPagoManual}`} type="number" min="0.01" step="0.01" value={nuevoImporte} onChange={(e) => setNuevoImporte(e.target.value)} className="mb-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
            <p className="mb-4 text-xs text-zinc-500">Solo pagos manuales. Los recibos de remesa no se pueden modificar. Si el pago está repartido entre varios plazos, la edición del importe se bloqueará.</p>

            <label htmlFor={`notas-pago-${idPagoManual}`} className="mb-1 block text-sm font-medium text-zinc-700">Observaciones</label>
            <textarea id={`notas-pago-${idPagoManual}`} value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} className="w-full rounded border border-zinc-300 px-3 py-2 text-sm" />

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" disabled={guardando} onClick={() => setAbierto(false)} className="rounded border border-zinc-300 px-4 py-2 text-sm">Cancelar</button>
              <button type="button" disabled={guardando || !fecha} onClick={guardar} className="rounded bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50">{guardando ? "Guardando..." : "Guardar cambios"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
