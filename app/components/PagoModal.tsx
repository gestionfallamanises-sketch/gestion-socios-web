"use client";

type Props = {
  abierto: boolean;
  titulo: string;
  pago: any;
  setPago: (pago: any) => void;
  onClose: () => void;
  onGuardar: () => void;
};

export default function PagoModal({
  abierto,
  titulo,
  pago,
  setPago,
  onClose,
  onGuardar,
}: Props) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md border border-zinc-200 bg-white shadow-2xl">

        <div className="border-b border-zinc-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">
            {titulo}
          </h2>
        </div>

        <div className="space-y-5 p-6">

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Fecha
            </label>

            <input
              type="date"
              value={pago.FechaPago ?? ""}
              onChange={(e) =>
                setPago({
                  ...pago,
                  FechaPago: e.target.value,
                })
              }
              className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Importe
            </label>

            <input
              type="number"
              min={0}
              step="0.01"
              value={pago.Importe ?? 0}
              onChange={(e) =>
                setPago({
                  ...pago,
                  Importe: Number(e.target.value),
                })
              }
              className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Observaciones
            </label>

            <textarea
              rows={3}
              value={pago.Observaciones ?? ""}
              onChange={(e) =>
                setPago({
                  ...pago,
                  Observaciones: e.target.value,
                })
              }
              className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
            />
          </div>

        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-200 px-6 py-4">

          <button
            type="button"
            onClick={onClose}
            className="rounded bg-zinc-300 px-4 py-2 text-sm hover:bg-zinc-400"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onGuardar}
            className="rounded bg-red-900 px-4 py-2 text-sm text-white hover:bg-red-950"
          >
            Guardar
          </button>

        </div>

      </div>
    </div>
  );
}