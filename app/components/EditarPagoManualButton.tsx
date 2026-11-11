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

type PagoOriginal = {
  Importe: number;
  FechaPago: string;
  Observaciones: string | null;
  Metodo: string | null;
};

export default function EditarPagoManualButton({
  idPagoManual,
  fechaPago,
  observaciones,
  importe,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [fecha, setFecha] = useState(fechaPago);
  const [notas, setNotas] = useState(observaciones ?? "");
  const [nuevoImporte, setNuevoImporte] = useState(importe.toFixed(2));
  const [importeOriginal, setImporteOriginal] = useState<number | null>(null);
  const [importeBloqueado, setImporteBloqueado] = useState(false);

  async function abrir() {
    if (cargando || guardando) return;
    setCargando(true);
    try {
      // Importante: el importe que llega como prop puede ser SOLO la parte
      // aplicada a este socio. Para editar, necesitamos el pago completo.
      const { data: pago, error: errorPago } = await supabase
        .from("PAGOS_MANUALES")
        .select('Importe, FechaPago, Observaciones, Metodo')
        .eq("IDPagoManual", idPagoManual)
        .single();

      if (errorPago || !pago) {
        throw new Error(errorPago?.message || "No se ha encontrado el pago original.");
      }

      const { count, error: errorAplicaciones } = await supabase
        .from("PAGOS_MANUALES_PLAZOS")
        .select("ID", { count: "exact", head: true })
        .eq("IDPagoManual", idPagoManual);

      if (errorAplicaciones || count === null) {
        throw new Error(errorAplicaciones?.message || "No se han podido comprobar las aplicaciones del pago.");
      }

      const original = pago as PagoOriginal;
      const total = Number(original.Importe);
      if (!Number.isFinite(total) || total <= 0) {
        throw new Error("El importe del pago original no es válido.");
      }

      // Los pagos familiares, y cualquier pago repartido entre varios plazos,
      // conservan el importe original: solo se editan fecha y observaciones.
      const esFamiliar = String(original.Metodo || "").trim().toUpperCase() === "PAGADOR";
      setImporteBloqueado(esFamiliar || count > 1);
      setImporteOriginal(total);
      setNuevoImporte(total.toFixed(2));
      setFecha(original.FechaPago || fechaPago);
      setNotas(original.Observaciones ?? "");
      setAbierto(true);
    } catch (error: any) {
      alert("No se pudo abrir la edición del pago: " + (error?.message || "Error desconocido"));
    } finally {
      setCargando(false);
    }
  }

  async function guardar() {
    if (guardando || importeOriginal === null) return;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(fecha))) {
      alert("Introduce una fecha válida.");
      return;
    }

    const valor = importeBloqueado ? importeOriginal : Number(nuevoImporte);
    if (
      !importeBloqueado &&
      (!/^\d+(?:\.\d{1,2})?$/.test(nuevoImporte) ||
        !Number.isFinite(valor) || valor <= 0)
    ) {
      alert("Introduce un importe válido, mayor que cero y con dos decimales como máximo.");
      return;
    }

    setGuardando(true);
    try {
      const { error } = await (supabase as any).rpc("editar_pago_manual_seguro", {
        p_id_pago_manual: idPagoManual,
        p_fecha_pago: fecha,
        // En pagos familiares siempre enviamos el importe TOTAL original.
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
        disabled={cargando || guardando}
        className="rounded p-1 text-zinc-600 hover:bg-zinc-100 hover:text-red-900 disabled:opacity-50"
        title="Editar pago manual"
        aria-label={`Editar pago ${idPagoManual}`}
      >
        {cargando ? "…" : "✏️"}
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Editar pago manual"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 text-left shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-red-900">Editar pago en efectivo</h2>
                <p className="mt-1 text-xs text-zinc-500">Pago n.º {idPagoManual}</p>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                disabled={guardando}
                className="text-xl text-zinc-500"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <label htmlFor={`fecha-pago-${idPagoManual}`} className="mb-1 block text-sm font-medium text-zinc-700">
              Fecha del pago
            </label>
            <input
              id={`fecha-pago-${idPagoManual}`}
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="mb-4 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            />

            <label htmlFor={`importe-pago-${idPagoManual}`} className="mb-1 block text-sm font-medium text-zinc-700">
              {importeBloqueado ? "Importe total del pago (€)" : "Importe del pago (€)"}
            </label>
            <input
              id={`importe-pago-${idPagoManual}`}
              type="number"
              min="0.01"
              step="0.01"
              value={nuevoImporte}
              onChange={(e) => setNuevoImporte(e.target.value)}
              disabled={importeBloqueado}
              className="mb-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-100 disabled:text-zinc-500"
            />
            <p className="mb-4 text-xs text-zinc-500">
              {importeBloqueado
                ? "Pago familiar o aplicado a varios plazos: puedes modificar la fecha y las observaciones, pero no el importe ni su reparto."
                : "Solo pagos manuales. Los recibos de remesa no se pueden modificar."}
            </p>

            <label htmlFor={`notas-pago-${idPagoManual}`} className="mb-1 block text-sm font-medium text-zinc-700">
              Observaciones
            </label>
            <textarea
              id={`notas-pago-${idPagoManual}`}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={guardando}
                onClick={() => setAbierto(false)}
                className="rounded border border-zinc-300 px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardando || !fecha}
                onClick={guardar}
                className="rounded bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
