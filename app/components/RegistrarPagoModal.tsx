"use client";

import RegistrarPagoForm from "@/app/components/RegistrarPagoForm";

export default function RegistrarPagoModal({
    open,
  idCuotaSocio,
  numcens,
  pendienteMaximo,
  onCancel,
}: {
  open: boolean;
  idCuotaSocio: number;
  numcens: number;
  pendienteMaximo: number;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-xl border border-zinc-200 bg-white shadow-xl">
        <div className="border-l-4 border-red-900 px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-red-900">
                Registrar pago
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-700">
                Introduce el importe del pago manual. Al guardar, se recalcularán las cuotas pendientes.
              </p>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="text-xl font-bold text-zinc-400 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>

        <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-5">
        <RegistrarPagoForm
  idCuotaSocio={idCuotaSocio}
  numcens={numcens}
  pendienteMaximo={pendienteMaximo}
/>
        </div>
      </div>
    </div>
  );
}