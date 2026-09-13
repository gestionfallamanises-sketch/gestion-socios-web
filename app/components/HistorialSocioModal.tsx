"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import EditarCargoHistorial from "./EditarCargoHistorial";

export default function HistorialSocioModal({
  numcens,
  nombre,
  apellidos,
  antiguedad,
}: {
  numcens: number;
  nombre: string;
  apellidos: string;
  antiguedad: string | null;
}) {
  const [abierto, setAbierto] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [ejercicioActivo, setEjercicioActivo] = useState<number | null>(null);
  const [cargando, setCargando] = useState(false);

  async function abrirHistorial() {
    setAbierto(true);
    setCargando(true);

    const [{ data: historialData }, { data: ejercicioData }] =
      await Promise.all([
        supabase
          .from("HISTORIAL_SOCIOS")
          .select(
            "ID, NUMCENS, Ejercicio, Fecha_Alta_Baja, Estado, Cargo, CategoriaCargo"
          )
          .eq("NUMCENS", numcens)
          .order("Ejercicio", { ascending: true }),

        supabase
          .from("EJERCICIOS")
          .select("Ejercicio")
          .eq("Activo", true)
          .maybeSingle(),
      ]);

    setHistorial(historialData || []);
    setEjercicioActivo(ejercicioData?.Ejercicio ?? null);
    setCargando(false);
  }

  const mitad = Math.ceil(historial.length / 2);
  const izquierda = historial.slice(0, mitad);
  const derecha = historial.slice(mitad);

  function imprimirHistorial() {
    window.print();
  }
  
  function exportarHistorial() {
    const filas = historial.map((movimiento) => ({
      Ejercicio: movimiento.Ejercicio || "",
      Fecha: movimiento.Fecha_Alta_Baja || "",
      Estado: movimiento.Estado || "",
      Cargo: movimiento.Cargo || "",
      Categoria:
        movimiento.CategoriaCargo === "REPRESENTATIVO"
          ? "Representativo"
          : movimiento.CategoriaCargo === "DIRECTIVO"
          ? "Directivo"
          : movimiento.CategoriaCargo === "VOCAL"
          ? "Vocal"
          : "",
    }));
  
    if (filas.length === 0) return;
  
    const cabeceras = Object.keys(filas[0]);
  
    const csv = [
      cabeceras.join(";"),
      ...filas.map((fila) =>
        cabeceras
          .map((cabecera) =>
            `"${String(
              fila[cabecera as keyof typeof fila] ?? ""
            ).replace(/"/g, '""')}"`
          )
          .join(";")
      ),
    ].join("\n");
  
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
  
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
  
    enlace.href = url;
    enlace.download = `historial_${numcens}.csv`;
    enlace.click();
  
    URL.revokeObjectURL(url);
  }

  return (
    <>
    <style>{`
  @media print {
    body * {
      visibility: hidden !important;
    }

    #historial-modal,
    #historial-modal * {
      visibility: visible !important;
    }

    #historial-modal {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      max-width: none !important;
      max-height: none !important;
      overflow: visible !important;
      border: none !important;
      box-shadow: none !important;
    }

    .no-print {
      display: none !important;
    }

    @page {
      margin: 1.2cm;
    }
  }
`}</style>

      <button
        type="button"
        onClick={abrirHistorial}
        className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
      >
        Ver historial completo
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
          onClick={() => setAbierto(false)}
        >
          <div
  id="historial-modal"
  className="max-h-[85vh] w-full max-w-4xl overflow-y-auto border border-zinc-200 bg-white shadow-2xl"
  onClick={(e) => e.stopPropagation()}
>
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-zinc-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">
                  Historial faller
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  <span className="font-semibold uppercase">
                    {apellidos}, {nombre}
                  </span>{" "}
                  · NUMCENS {numcens} · Antigüedad: {antiguedad || "-"}
                </p>
              </div>

              <div className="no-print flex items-center gap-2">
  <button
    type="button"
    onClick={exportarHistorial}
    className="border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
  >
    Exportar Excel
  </button>

  <button
    type="button"
    onClick={imprimirHistorial}
    className="bg-red-900 px-3 py-2 text-sm font-medium text-white hover:bg-red-950"
  >
    Imprimir
  </button>

  <button
    type="button"
    onClick={() => setAbierto(false)}
    className="flex h-8 w-8 items-center justify-center text-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
    aria-label="Cerrar"
  >
    ×
  </button>
</div>
            </div>

            <div className="p-5">
              {cargando ? (
                <div className="py-10 text-center text-sm text-zinc-500">
                  Cargando historial...
                </div>
              ) : historial.length === 0 ? (
                <div className="border border-zinc-200 p-6 text-sm text-zinc-500">
                  Este socio todavía no tiene historial registrado.
                </div>
              ) : (
                <div className="grid grid-cols-1 border border-zinc-200 lg:grid-cols-2">
                  <HistorialTabla
                    movimientos={izquierda}
                    ejercicioActivo={ejercicioActivo}
                  />

                  <div className="border-l border-zinc-200">
                  <HistorialTabla
  movimientos={derecha}
  ejercicioActivo={ejercicioActivo}
  ocultarCabeceraImpresion={true}
/>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function HistorialTabla({
    movimientos,
    ejercicioActivo,
    ocultarCabeceraImpresion = false,
  }: {
    movimientos: any[];
    ejercicioActivo: number | null;
    ocultarCabeceraImpresion?: boolean;
  }) {

  return (
    <table className="w-full text-sm">
        <colgroup>
  <col className="w-[25%]" />
  <col className="w-[30%]" />
  <col className="w-[20%]" />
  <col className="w-[25%]" />
</colgroup>

      <thead
  className={`bg-zinc-100 text-left text-xs uppercase text-zinc-600 ${
    ocultarCabeceraImpresion ? "print:hidden" : ""
  }`}
>
        <tr>
          <th className="px-3 py-2">Ejercicio</th>
          <th className="px-3 py-2">Fecha</th>
          <th className="px-3 py-2">Estado</th>
          <th className="px-3 py-2">Cargo</th>
        </tr>
      </thead>

      <tbody>
        {movimientos.map((movimiento) => (
          <tr key={movimiento.ID} className="border-t border-zinc-200">
            <td className="px-3 py-2">
              {movimiento.Ejercicio || "-"}
            </td>

            <td className="px-3 py-2">
              {movimiento.Fecha_Alta_Baja || "-"}
            </td>

            <td className="px-3 py-2">
              <span
                className={
                  movimiento.Estado === "Alta"
                    ? "bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
                    : "bg-red-100 px-2 py-1 text-xs font-semibold text-red-700"
                }
              >
                {movimiento.Estado || "-"}
              </span>
            </td>

            <td className="px-3 py-2">
              <EditarCargoHistorial
                id={movimiento.ID}
                numcens={Number(movimiento.NUMCENS)}
                ejercicio={Number(movimiento.Ejercicio)}
                ejercicioActivo={ejercicioActivo}
                cargoInicial={movimiento.Cargo}
                categoriaInicial={movimiento.CategoriaCargo}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}