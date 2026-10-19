"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function euros(valor: number) {
  return `${Number(valor || 0).toFixed(2)} €`;
}

export default function ImprimirSorteoPage() {
  const params = useParams();
  const [sorteo, setSorteo] = useState<any>(null);
  const [lineas, setLineas] = useState<any[]>([]);

  useEffect(() => {
    cargarSorteo();
  }, []);

  async function cargarSorteo() {
    const { data, error } = await (supabase as any)
      .from("LOTERIA_SORTEOS")
      .select("*")
      .eq("ID", Number(params.id))
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setSorteo(data);
    const { data: lineasData, error: errorLineas } = await (supabase as any)
  .from("LOTERIA_SORTEOS_GRUPOS")
  .select(`
    NombreParticipante,
    NUMCENS_Responsable,
    PapeletasFalla,
    PapeletasVirgen,
    ImporteFalla,
    ImporteVirgen,
    ImportePagado,
    ImportePremio,
    PremioEntregado,
    PagadoConfirmado
  `)
  .eq("IDSorteo", Number(params.id))
  .order("NombreParticipante", { ascending: true });

if (errorLineas) {
  alert(errorLineas.message);
  return;
}

setLineas(lineasData || []);
  }

  if (!sorteo) return null;

  const filasSocios = lineas.map((linea: any) => {
    const total =
      Number(linea.ImporteFalla || 0) +
      Number(linea.ImporteVirgen || 0);
  
    const cobrado = linea.PagadoConfirmado
      ? total
      : Math.min(
          total,
          Math.max(0, Number(linea.ImportePagado || 0))
        );
  
    const pendiente = Math.max(0, total - cobrado);
  
    const premioTotal = Number(linea.ImportePremio || 0);
  
    const sinEntregar = linea.PremioEntregado
      ? 0
      : premioTotal;
  
    const entregado = linea.PremioEntregado
      ? premioTotal
      : 0;
  
    const saldo = pendiente - sinEntregar;
  
    return {
      ...linea,
      total,
      cobrado,
      pendiente,
      premioTotal,
      sinEntregar,
      entregado,
      saldo,
    };
  });

  return (
    <main className="bg-white p-8 text-sm text-zinc-900">
      <div className="no-print mb-4 flex justify-between">
        <button onClick={() => history.back()} className="text-red-900">
          ← Volver
        </button>

        <button
          onClick={() => window.print()}
          className="bg-red-900 px-4 py-2 text-white"
        >
          Imprimir
        </button>
      </div>

      <h1 className="mb-6 text-center text-2xl font-bold">
        Sorteo {sorteo.FechaSorteo}
      </h1>

      <div className="grid grid-cols-2 gap-6">
        <Bloque titulo="Falla" sorteo={sorteo} tipo="Falla" />
        {sorteo?.TipoSorteo !== "ESPECIAL" && (
  <Bloque titulo="Virgen" sorteo={sorteo} tipo="Virgen" />
)}
      </div>

      <section className="mt-8">
  <h2 className="mb-3 text-lg font-bold">
    Detalle de socios
  </h2>

  <table className="w-full border-collapse text-[10px]">
    <thead>
      <tr className="bg-zinc-100">
        <th className="border border-zinc-300 px-2 py-1 text-left">
          Socio
        </th>

        <th className="border border-zinc-300 px-2 py-1 text-center">
          NUMCENS
        </th>

        <th className="border border-zinc-300 px-2 py-1 text-right">
          Pap. F
        </th>

        <th className="border border-zinc-300 px-2 py-1 text-right">
          Pap. V
        </th>

        <th className="border border-zinc-300 px-2 py-1 text-right">
          Total
        </th>

        <th className="border border-zinc-300 px-2 py-1 text-right">
          Cobrado
        </th>

        <th className="border border-zinc-300 px-2 py-1 text-right">
          Pendiente
        </th>

        <th className="border border-zinc-300 px-2 py-1 text-right">
          Premio
        </th>

        <th className="border border-zinc-300 px-2 py-1 text-right">
          Sin entregar
        </th>

        <th className="border border-zinc-300 px-2 py-1 text-right">
          Entregado
        </th>

        <th className="border border-zinc-300 px-2 py-1 text-right">
          Saldo
        </th>
      </tr>
    </thead>

    <tbody>
      {filasSocios.map((fila: any, index: number) => (
        <tr key={index}>
          <td className="border border-zinc-300 px-2 py-1">
            {fila.NombreParticipante || ""}
          </td>

          <td className="border border-zinc-300 px-2 py-1 text-center">
            {fila.NUMCENS_Responsable || ""}
          </td>

          <td className="border border-zinc-300 px-2 py-1 text-right">
            {Number(fila.PapeletasFalla || 0)}
          </td>

          <td className="border border-zinc-300 px-2 py-1 text-right">
            {Number(fila.PapeletasVirgen || 0)}
          </td>

          <td className="border border-zinc-300 px-2 py-1 text-right">
            {euros(fila.total)}
          </td>

          <td className="border border-zinc-300 px-2 py-1 text-right">
            {euros(fila.cobrado)}
          </td>

          <td className="border border-zinc-300 px-2 py-1 text-right">
            {euros(fila.pendiente)}
          </td>

          <td className="border border-zinc-300 px-2 py-1 text-right">
            {euros(fila.premioTotal)}
          </td>

          <td className="border border-zinc-300 px-2 py-1 text-right">
            {euros(fila.sinEntregar)}
          </td>

          <td className="border border-zinc-300 px-2 py-1 text-right">
            {euros(fila.entregado)}
          </td>

          <td className="border border-zinc-300 px-2 py-1 text-right font-semibold">
            {euros(fila.saldo)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</section>

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

function Bloque({
  titulo,
  sorteo,
  tipo,
}: {
  titulo: string;
  sorteo: any;
  tipo: "Falla" | "Virgen";
}) {
  const decimos = Number(sorteo[`Decimos${tipo}`] || 0);
  const precioDecimo = Number(sorteo[`PrecioDecimo${tipo}`] || 0);
  const importeJugado = Number(sorteo[`ImportePapeleta${tipo}`] || 0);
  const beneficioPapeleta = Number(sorteo[`Beneficio${tipo}`] || 0);
  const premioPapeleta = Number(sorteo[`Premio${tipo}PorPapeleta`] || 0);
  const papeletasSocios = Number(sorteo[`PapeletasTotales${tipo}`] || 0);

  const precioVenta = importeJugado + beneficioPapeleta;
  const pagoAdministracion = decimos * precioDecimo;
  const papeletasEmitidas =
    importeJugado > 0
      ? Math.floor(pagoAdministracion / importeJugado)
      : 0;
  const sobrantes = Math.max(0, papeletasEmitidas - papeletasSocios);

  const restoSuelto =
    pagoAdministracion - papeletasEmitidas * importeJugado;

  const jugadoFalla =
    sobrantes * importeJugado + restoSuelto;

  const recaudacionSocios = papeletasSocios * precioVenta;
  const importeJugadoSocios = papeletasSocios * importeJugado;
  const beneficioSocios = papeletasSocios * beneficioPapeleta;
  const beneficioPremio = sobrantes * premioPapeleta;

  return (
    <section className="border border-zinc-300">
      <h2 className="bg-zinc-100 px-4 py-2 text-lg font-bold">{titulo}</h2>

      <div className="grid grid-cols-2 text-sm">
        <Fila label="Número" value={sorteo[`Numero${tipo}`] || "-"} />
        <Fila label="Décimos" value={decimos} />
        <Fila label="Precio décimo" value={euros(precioDecimo)} />
        <Fila label="Papeletas emitidas" value={papeletasEmitidas} />
        <Fila label="Precio papeleta venta" value={euros(precioVenta)} />
        <Fila label="Papeletas socios" value={papeletasSocios} />
        <Fila label="Importe jugado" value={euros(importeJugado)} />
        <Fila label="Papeletas sobrantes" value={sobrantes} />
        <Fila label="Beneficio papeleta" value={euros(beneficioPapeleta)} />
        <Fila label="Premio papeletas" value={euros(premioPapeleta)} />
      </div>

      <div className="border-t border-zinc-300 bg-zinc-50 px-4 py-2 font-semibold">
        Cálculos
      </div>

      <div className="grid grid-cols-2 text-sm">
        <Fila label="Pago administración" value={euros(pagoAdministracion)} />
        <Fila label="Recaudación socios" value={euros(recaudacionSocios)} />
        <Fila label="Importe jugado socios" value={euros(importeJugadoSocios)} />
        <Fila label="Jugado falla" value={euros(jugadoFalla)} />
        <Fila label="Beneficio socios" value={euros(beneficioSocios)} />
        <Fila label="Beneficio premio" value={euros(beneficioPremio)} />
      </div>
    </section>
  );
}

function Fila({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between border-b border-r border-zinc-200 px-3 py-2">
      <span className="text-zinc-600">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}