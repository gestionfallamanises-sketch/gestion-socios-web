"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function formatearFecha(fecha: string) {
  const d = new Date(fecha);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

function calcularEmitidas(sorteo: any, tipo: "Falla" | "Virgen") {
  const decimos = Number(sorteo[`Decimos${tipo}`] || 0);
  const precioDecimo = Number(sorteo[`PrecioDecimo${tipo}`] || 0);
  const importeJugado = Number(sorteo[`ImportePapeleta${tipo}`] || 1);

  return Math.floor((decimos * precioDecimo) / importeJugado);
}

export default function ImprimirSorteosPage() {
  const [sorteos, setSorteos] = useState<any[]>([]);

  useEffect(() => {
    cargarSorteos();
  }, []);

  async function cargarSorteos() {
    const { data, error } = await (supabase as any)
      .from("LOTERIA_SORTEOS")
      .select("*")
      .order("FechaSorteo", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setSorteos(data || []);
  }

  return (
    <main className="bg-white p-6 text-sm text-zinc-900">
      <div className="mb-4 flex justify-between no-print">
        <button onClick={() => window.history.back()} className="text-red-900">
          ← Volver
        </button>

        <button
          onClick={() => window.print()}
          className="bg-red-900 px-4 py-2 text-white"
        >
          Imprimir
        </button>
      </div>

      <h1 className="mb-4 text-2xl font-bold text-center">
  Sorteos
</h1>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-zinc-100">
            <th className="border px-2 py-2">Fecha</th>
            <th className="border px-2 py-2">Nº Falla</th>
            <th className="border px-2 py-2">Precio déc.</th>
            <th className="border px-2 py-2">Pap. emitidas</th>
            <th className="border px-2 py-2">Pap. socios</th>
            <th className="border px-2 py-2">Restantes</th>
            <th className="border px-2 py-2">Nº Virgen</th>
            <th className="border px-2 py-2">Precio déc.</th>
            <th className="border px-2 py-2">Pap. emitidas</th>
            <th className="border px-2 py-2">Pap. socios</th>
            <th className="border px-2 py-2">Restantes</th>
          </tr>
        </thead>

        <tbody>
          {sorteos.map((sorteo) => {
            const emitidasFalla = calcularEmitidas(sorteo, "Falla");
            const emitidasVirgen = calcularEmitidas(sorteo, "Virgen");

            const sociosFalla = Number(sorteo.PapeletasTotalesFalla || 0);
            const sociosVirgen = Number(sorteo.PapeletasTotalesVirgen || 0);

            return (
              <tr key={sorteo.ID}>
                <td className="border px-2 py-2">
                  {formatearFecha(sorteo.FechaSorteo)}
                </td>
                <td className="border px-2 py-2">{sorteo.NumeroFalla}</td>
                <td className="border px-2 py-2 text-right">
                  {Number(sorteo.PrecioDecimoFalla || 0).toFixed(2)} €
                </td>
                <td className="border px-2 py-2 text-right">
                  {emitidasFalla}
                </td>
                <td className="border px-2 py-2 text-right">{sociosFalla}</td>
                <td className="border px-2 py-2 text-right">
                  {emitidasFalla - sociosFalla}
                </td>

                <td className="border px-2 py-2">{sorteo.NumeroVirgen}</td>
                <td className="border px-2 py-2 text-right">
                  {Number(sorteo.PrecioDecimoVirgen || 0).toFixed(2)} €
                </td>
                <td className="border px-2 py-2 text-right">
                  {emitidasVirgen}
                </td>
                <td className="border px-2 py-2 text-right">{sociosVirgen}</td>
                <td className="border px-2 py-2 text-right">
                  {emitidasVirgen - sociosVirgen}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <style jsx global>{`
  @media print {
    .no-print {
      display: none !important;
    }

    @page {
      size: landscape;
      margin: 1cm;
    }
  }
`}</style>
    </main>

    
  );
}