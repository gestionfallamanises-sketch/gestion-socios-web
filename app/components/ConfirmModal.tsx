"use client";

export default function ConfirmModal({
  open,
  title = "ATENCIÓN",
  message,
  confirmText = "Continuar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md border border-zinc-200 bg-white shadow-xl">
        <div className="border-l-4 border-red-900 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>

            <div>
              <h2 className="text-lg font-bold text-red-900">{title}</h2>

              <p className="mt-2 text-sm leading-6 text-zinc-700">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}