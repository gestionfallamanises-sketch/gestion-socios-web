"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ConfirmModal from "@/app/components/ConfirmModal";

export default function AgregarLineasRemesaButton({
  idRemesa,
  modo = "normal",
}: {
  idRemesa: number;
  modo?: "normal" | "especial";
}) {
  const router = useRouter();

  const [lineas, setLineas] = useState<any[]>([]);
  const [seleccionadas, setSeleccionadas] = useState<number[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [modalConfirmar, setModalConfirmar] = useState(false);

  async function buscarLineas() {
    setCargando(true);
    setSeleccionadas([]);

    const { data, error } = await (supabase as any).rpc(
      modo === "especial"
        ? "buscar_lineas_especiales_remesa"
        : "buscar_lineas_faltantes_remesa",
      {
        p_id_remesa: idRemesa,
      }
    );

    if (error) {
      alert(error.message);
      setCargando(false);
      return;
    }

    setLineas(data || []);
    setCargando(false);
  }

  function toggleLinea(idPlazo: number) {
    setSeleccionadas((actual) =>
      actual.includes(idPlazo)
        ? actual.filter((id) => id !== idPlazo)
        : [...actual, idPlazo]
    );
  }

  function seleccionarTodas() {
    setSeleccionadas(lineas.map((linea) => Number(linea.IDPlazo)));
  }

  function limpiarSeleccion() {
    setSeleccionadas([]);
  }

  async function agregarSeleccionadas() {
    if (seleccionadas.length === 0) {
      alert("Selecciona al menos una línea.");
      return;
    }
  
    setModalConfirmar(true);
  }
  
  async function confirmarAgregarSeleccionadas() {
    setModalConfirmar(false);
  
    const idsSeleccionadas = [...seleccionadas];
  
    if (idsSeleccionadas.length === 0) {
      alert("Selecciona al menos una línea.");
      return;
    }
  
    setGuardando(true);
  
    const { data, error } = await (supabase as any).rpc(
      "agregar_lineas_seleccionadas_remesa",
      {
        p_id_remesa: idRemesa,
        p_idplazos: idsSeleccionadas,
      }
    );
  
    if (error) {
      alert(error.message);
      setGuardando(false);
      return;
    }
  
    if (!data || Number(data) === 0) {
      alert(
        "No se ha añadido ninguna línea. Puede que ya estuvieran añadidas o que hayan cambiado los estados."
      );
      setGuardando(false);
      return;
    }
  
    alert(`Se han añadido ${data} línea(s) a la remesa.`);
  
    setGuardando(false);
    setLineas([]);
    setSeleccionadas([]);
  
    router.refresh();
  }
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={buscarLineas}
        className="h-9 bg-red-900 px-4 text-sm font-medium text-white hover:bg-red-950"
      >
        {cargando
  ? "Buscando..."
  : modo === "especial"
  ? "Plazos especiales"
  : "10 plazos"}
      </button>

      {lineas.length > 0 && (
        <div className="absolute right-0 z-50 mt-2 w-[720px] border border-zinc-200 bg-white shadow-lg">
          <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-zinc-700">
                Líneas encontradas: {lineas.length}
              </p>

              <p className="text-xs text-zinc-500">
                Seleccionadas: {seleccionadas.length}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setLineas([]);
                setSeleccionadas([]);
              }}
              className="text-xs font-medium text-zinc-500 hover:text-red-900"
            >
              Cerrar
            </button>
          </div>

          <div className="flex items-center gap-2 border-t border-zinc-200 px-4 py-3">
            <button
              type="button"
              onClick={seleccionarTodas}
              className="bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
            >
              Seleccionar todas
            </button>

            <button
              type="button"
              onClick={limpiarSeleccion}
              className="bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
            >
              Limpiar selección
            </button>

            <button
              type="button"
              onClick={agregarSeleccionadas}
              disabled={guardando || seleccionadas.length === 0}
              className={
                guardando || seleccionadas.length === 0
                  ? "ml-auto bg-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-500"
                  : "ml-auto bg-red-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-950"
              }
            >
              {guardando ? "Añadiendo..." : "Añadir seleccionadas"}
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {lineas.map((linea) => {
              const idPlazo = Number(linea.IDPlazo);
              const seleccionada = seleccionadas.includes(idPlazo);

              return (
                <label
                key={`${linea.IDPlazo}-${linea.IBAN}`}
                  className={
                    seleccionada
                      ? "flex cursor-pointer items-center gap-3 border-t border-zinc-200 bg-red-50 px-4 py-2 text-sm"
                      : "flex cursor-pointer items-center gap-3 border-t border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50"
                  }
                >
                  <input
                    type="checkbox"
                    checked={seleccionada}
                    onChange={() => toggleLinea(idPlazo)}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900">
                    {linea.NUMCENS} · {linea.Socio}
{modo === "especial"
  ? ` · ${linea.NumeroPlazos || "-"} plazos`
  : ` · Plazo ${linea.NumeroPlazo}`}
                    </p>

                    <p className="text-xs text-zinc-500">
                      Pagador: {linea.NUMCENS_Pagador || "-"} · IBAN:{" "}
                      {linea.IBAN || "-"}
                    </p>
                  </div>

                  <span className="font-medium">
                    {Number(linea.Importe || 0).toFixed(2)} €
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

<ConfirmModal
  open={modalConfirmar}
  title="ATENCIÓN"
  message={`Se van a añadir ${seleccionadas.length} línea(s) a la remesa. Revise que son correctas antes de continuar.`}
  confirmText="Sí, añadir"
  cancelText="Cancelar"
  onCancel={() => setModalConfirmar(false)}
  onConfirm={confirmarAgregarSeleccionadas}
/>
    </div>
  );
}