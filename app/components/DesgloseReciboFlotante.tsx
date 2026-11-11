"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import EditarImporteRemesaInput from "@/app/components/EditarImporteRemesaInput";
import QuitarLineaRemesaButton from "@/app/components/QuitarLineaRemesaButton";

type Linea = {
  IDDetalleRemesa: number;
  NUMCENS?: number | string;
  Apellidos?: string;
  Nombre?: string;
  Importe?: number | string | null;
};

type Props = {
  nombre: string;
  lineas: Linea[];
  remesaCobrada: boolean;
  idRemesa: number;
};

const MARGEN = 12;
const SEPARACION = 6;
const ANCHO_PANEL = 380;

export default function DesgloseReciboFlotante({
  nombre,
  lineas,
  remesaCobrada,
  idRemesa,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [montado, setMontado] = useState(false);
  const [posicion, setPosicion] = useState({ top: 0, left: 0, maxHeight: 300 });
  const botonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // El identificador del recibo agrupado permanece estable después de editar su importe.
  // Se conserva el desplegable abierto incluso si el componente hijo recarga la página.
  const idsLineas = lineas.map((linea) => linea.IDDetalleRemesa).sort((a, b) => a - b).join("-");
  const claveSesion = `desglose-remesa:${idRemesa}:${idsLineas}`;

  useEffect(() => {
    setMontado(true);
    try {
      if (window.sessionStorage.getItem(claveSesion) === "abierto") {
        setAbierto(true);
      }
    } catch {
      // La interfaz sigue funcionando aunque el navegador bloquee sessionStorage.
    }
  }, [claveSesion]);

  function cambiarAbierto(siguiente: boolean) {
    setAbierto(siguiente);
    try {
      if (siguiente) {
        window.sessionStorage.setItem(claveSesion, "abierto");
      } else {
        window.sessionStorage.removeItem(claveSesion);
      }
    } catch {
      // Sin persistencia, el panel funciona igualmente.
    }
  }

  useLayoutEffect(() => {
    if (!abierto) return;

    function actualizarPosicion() {
      const rect = botonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const ancho = Math.min(ANCHO_PANEL, window.innerWidth - MARGEN * 2);
      const altoDisponible = Math.max(120, window.innerHeight - MARGEN * 2);
      const altoDeseado = Math.min(
        panelRef.current?.scrollHeight ?? 300,
        altoDisponible,
        window.innerHeight * 0.6
      );

      const espacioAbajo = window.innerHeight - rect.bottom - MARGEN - SEPARACION;
      const espacioArriba = rect.top - MARGEN - SEPARACION;
      const abrirArriba = espacioAbajo < altoDeseado && espacioArriba > espacioAbajo;
      const espacioElegido = Math.max(0, abrirArriba ? espacioArriba : espacioAbajo);
      const maxHeight = Math.max(0, Math.min(altoDeseado, espacioElegido));
      const top = abrirArriba
        ? Math.max(MARGEN, rect.top - SEPARACION - maxHeight)
        : Math.min(window.innerHeight - MARGEN, rect.bottom + SEPARACION);
      const left = Math.max(
        MARGEN,
        Math.min(rect.left, window.innerWidth - ancho - MARGEN)
      );

      setPosicion({ top, left, maxHeight });
    }

    function cerrarEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") cambiarAbierto(false);
    }

    actualizarPosicion();
    window.addEventListener("resize", actualizarPosicion);
    window.addEventListener("scroll", actualizarPosicion, true);
    document.addEventListener("keydown", cerrarEscape);

    return () => {
      window.removeEventListener("resize", actualizarPosicion);
      window.removeEventListener("scroll", actualizarPosicion, true);
      document.removeEventListener("keydown", cerrarEscape);
    };
  }, [abierto, claveSesion, lineas.length]);

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        onClick={() => cambiarAbierto(!abierto)}
        aria-expanded={abierto}
        className="cursor-pointer text-left font-medium"
      >
        <span className="mr-1">{abierto ? "▼" : "▶"}</span>
        {nombre}
      </button>

      {montado && abierto &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top: posicion.top,
              left: posicion.left,
              width: "min(380px, calc(100vw - 24px))",
              maxHeight: posicion.maxHeight,
              zIndex: 9999,
            }}
            className="overflow-y-auto rounded-md border border-zinc-200 bg-white p-3 shadow-xl"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-zinc-500">
                Desglose del recibo
              </div>
              <button
                type="button"
                onClick={() => cambiarAbierto(false)}
                aria-label="Cerrar desglose"
                className="rounded px-2 text-base text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              >
                ×
              </button>
            </div>

            {lineas.map((linea) => (
              <div
                key={linea.IDDetalleRemesa}
                className="flex items-center justify-between gap-3 border-b border-zinc-100 py-2 last:border-b-0"
              >
                <span className="text-xs text-zinc-700">
                  {linea.NUMCENS} ·{" "}
                  {[linea.Apellidos, linea.Nombre].filter(Boolean).join(", ")}
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
