"use client";

import { useEffect, useRef, useState } from "react";
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
  const [posicion, setPosicion] = useState<{ x: number; y: number } | null>(null);
  const ventanaRef = useRef<HTMLDivElement>(null);
  const arrastreRef = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    if (!open) {
      setPosicion(null);
      return;
    }
    function mover(e: MouseEvent) {
      if (!arrastreRef.current || !ventanaRef.current) return;
      const { dx, dy } = arrastreRef.current;
      const ancho = ventanaRef.current.offsetWidth;
      const alto = ventanaRef.current.offsetHeight;
      setPosicion({
        x: Math.max(0, Math.min(Math.max(0, window.innerWidth - ancho), e.clientX - dx)),
        y: Math.max(0, Math.min(Math.max(0, window.innerHeight - alto), e.clientY - dy)),
      });
    }
    function soltar() { arrastreRef.current = null; }
    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", soltar);
    return () => {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseup", soltar);
    };
  }, [open]);

  if (!open) return null;

  function comenzarArrastre(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0 || !ventanaRef.current) return;
    const rect = ventanaRef.current.getBoundingClientRect();
    arrastreRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    setPosicion({ x: rect.left, y: rect.top });
    e.preventDefault();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div
        ref={ventanaRef}
        className={`w-full max-w-xl border border-zinc-200 bg-white shadow-xl ${posicion ? "fixed" : "relative"}`}
        style={posicion ? { left: posicion.x, top: posicion.y, margin: 0 } : undefined}
      >
        <div
          className="cursor-move select-none border-l-4 border-red-900 px-4 py-3"
          onMouseDown={comenzarArrastre}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-red-900">Registrar pago</h2>
              <p className="mt-1 text-xs text-zinc-600">
                Introduce la fecha y el importe del pago manual.
              </p>
            </div>
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onCancel}
              aria-label="Cerrar ventana"
              className="text-xl font-bold text-zinc-400 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
        <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-3">
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
