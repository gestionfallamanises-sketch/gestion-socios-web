
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import EditarImporteRemesaInput from "@/app/components/EditarImporteRemesaInput";
import QuitarLineaRemesaButton from "@/app/components/QuitarLineaRemesaButton";

type Props = {
    nombre: string;
    lineas: any[];
    remesaCobrada: boolean;
    idRemesa: number;
  };

  export default function DesgloseReciboFlotante({
    nombre,
    lineas,
    remesaCobrada,
    idRemesa,
  }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState({ top: 0, left: 0 });
  const botonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    function actualizarPosicion() {
      const rect = botonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const ancho = Math.min(380, window.innerWidth - 24);

      setPosicion({
        top: rect.bottom + 6,
        left: Math.max(
          12,
          Math.min(rect.left, window.innerWidth - ancho - 12)
        ),
      });
    }

    function cerrarFuera(e: MouseEvent) {
      const target = e.target as Node;

      if (
        !botonRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setAbierto(false);
      }
    }

    function cerrarEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }

    actualizarPosicion();

    window.addEventListener("resize", actualizarPosicion);
    window.addEventListener("scroll", actualizarPosicion, true);
    document.addEventListener("mousedown", cerrarFuera);
    document.addEventListener("keydown", cerrarEscape);

    return () => {
      window.removeEventListener("resize", actualizarPosicion);
      window.removeEventListener("scroll", actualizarPosicion, true);
      document.removeEventListener("mousedown", cerrarFuera);
      document.removeEventListener("keydown", cerrarEscape);
    };
  }, [abierto]);

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        className="cursor-pointer text-left font-medium"
      >
        <span className="mr-1">{abierto ? "▼" : "▶"}</span>
        {nombre}
      </button>

      {abierto &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top: posicion.top,
              left: posicion.left,
              width: "min(380px, calc(100vw - 24px))",
              zIndex: 9999,
            }}
            className="max-h-[60vh] overflow-y-auto rounded-md border border-zinc-200 bg-white p-3 shadow-xl"
          >
            <div className="mb-2 text-xs font-semibold text-zinc-500">
              Desglose del recibo
            </div>

            {lineas.map((linea: any) => (
              <div
                key={linea.IDDetalleRemesa}
                className="flex items-center justify-between gap-3 border-b border-zinc-100 py-2 last:border-b-0"
              >
                <span className="text-xs text-zinc-700">
                  {linea.NUMCENS} ·{" "}
                  {[linea.Apellidos, linea.Nombre]
                    .filter(Boolean)
                    .join(", ")}
                </span>

                <div className="flex items-center gap-2">
                {remesaCobrada ? (
  <span className="whitespace-nowrap text-xs font-semibold">
    {Number(linea.Importe || 0).toFixed(2)} €
  </span>
) : (
  <>
    <EditarImporteRemesaInput
  idRemesa={idRemesa}
  idDetalleRemesa={linea.IDDetalleRemesa}
  importeInicial={Number(linea.Importe || 0)}
/>

    <QuitarLineaRemesaButton
      idDetalleRemesa={linea.IDDetalleRemesa}
    />
  </>
)}
                </div>
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
