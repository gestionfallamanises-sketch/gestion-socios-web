import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";
import ExportarRemesaExcelButton from "@/app/components/ExportarRemesaExcelButton";
import PrintButton from "@/app/components/PrintButton";
import EditarImporteRemesaInput from "@/app/components/EditarImporteRemesaInput";

export default async function RemesaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: remesa } = await supabase
    .from("REMESAS")
    .select("*")
    .eq("IDRemesa", Number(id))
    .single();

  const { data: lineas } = await supabase
    .from("REMESAS_DETALLE")
    .select(`
      *,
      CUOTAS_PLAZOS (
        NumeroPlazo,
        FechaVencimiento
      ),
      CUOTAS_SOCIOS (
        Ejercicio,
        NUMCENS,
        SOCIOS:NUMCENS (
          Nombre,
          Apellidos,
          FechaPrimerAlta
        )
      )
    `)
    .eq("IDRemesa", Number(id))
    .order("NUMCENS_Pagador", { ascending: true })
.order("NUMCENS", { ascending: true });

  const total =
    lineas?.reduce((acc, l) => acc + Number(l.Importe || 0), 0) || 0;
    
    const numsSocios = lineas?.map((l) => l.NUMCENS) || [];

const { data: sociosRemesa } =
  numsSocios.length > 0
    ? await supabase
        .from("SOCIOS")
        .select("NUMCENS, Nombre, Apellidos, FechaPrimerAlta")
        .in("NUMCENS", numsSocios)
    : { data: [] };

    const remesaAgrupada = Object.values(
        (lineas || []).reduce((acc: any, linea: any) => {
          const clave = `${linea.NUMCENS_Pagador}-${linea.IBAN}`;
      
          if (!acc[clave]) {
            acc[clave] = {
                NUMCENS_Pagador: linea.NUMCENS_Pagador,
                NombreDeudor:
  linea.TitularCuenta ||
  linea.NUMCENS_Pagador ||
  "",
    
                IBAN: linea.IBAN,
                Importe: 0,
                Concepto: [],
                ReferenciaMandato: `${linea.NUMCENS || "?"}-${linea.CUOTAS_SOCIOS?.Ejercicio || remesa?.Ejercicio || "?"}-${linea.CUOTAS_PLAZOS?.NumeroPlazo || "?"}`,
                FechaMandato:
  sociosRemesa?.find(
    (s) => Number(s.NUMCENS) === Number(linea.NUMCENS)
  )?.FechaPrimerAlta || "-",
                ReferenciaAdeudo: `R${linea.IDRemesa}-P${linea.IDPlazo}`,
                FechaVencimiento:
                  linea.CUOTAS_PLAZOS?.FechaVencimiento || "-",
              };
          }
      
          acc[clave].Importe += Number(linea.Importe || 0);
          acc[clave].Concepto.push(
            `${linea.NUMCENS}-${linea.CUOTAS_SOCIOS?.Ejercicio || remesa?.Ejercicio}-${linea.CUOTAS_PLAZOS?.NumeroPlazo || ""}`
          );
      
          return acc;
        }, {})
      );

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/remesas"
            className="mb-6 inline-block text-sm font-medium text-red-900 hover:text-red-950"
          >
            ← Volver a remesas
          </Link>

          <section className="mb-8 border border-zinc-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-900 px-6 py-5">
              <h1 className="text-2xl font-bold text-zinc-900">
                Remesa {id}
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                Ejercicio {remesa?.Ejercicio} · Estado {remesa?.Estado} · Total{" "}
                {total.toFixed(2)} €
              </p>
            </div>
          </section>

          <section className="border border-zinc-200 bg-white">
          <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
  <div>
    <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
      Líneas de remesa
    </h2>

    <p className="text-xs text-zinc-500">
      Detalle interno para comprobar cuotas, pagadores e importes
    </p>
  </div>

  <div className="flex items-center gap-3">
    <PrintButton />

    <ExportarRemesaExcelButton
  filas={lineas}
  idRemesa={remesa.IDRemesa}
/>
  </div>
</div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
  <tr>
    <th className="px-4 py-3">Socio cuota</th>
    <th className="px-4 py-3">Pagador</th>
    <th className="px-4 py-3">Referencia mandato</th>
    <th className="px-4 py-3">Cuota / plazo</th>
    <th className="px-4 py-3 text-right">Importe</th>
  </tr>
</thead>

<tbody>
  {!lineas || lineas.length === 0 ? (
    <tr>
      <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
        Esta remesa no tiene líneas.
      </td>
    </tr>
  ) : (
    lineas.map((linea) => {
        const socioCuota = sociosRemesa?.find(
            (s) => Number(s.NUMCENS) === Number(linea.NUMCENS)
          );
          
          linea.socioCuotaNombre =
            `${socioCuota?.Apellidos || ""}, ${
              socioCuota?.Nombre || ""
            }`;

      const ejercicio = linea.CUOTAS_SOCIOS?.Ejercicio;
      const plazo = linea.CUOTAS_PLAZOS?.NumeroPlazo;

      return (
        <tr
          key={linea.IDDetalleRemesa}
          className="border-t border-zinc-200 hover:bg-red-50"
        >
          <td className="px-4 py-3 font-medium">
            {linea.NUMCENS} · {socioCuota?.Apellidos || ""},{" "}
            {socioCuota?.Nombre || ""}
          </td>

          <td className="px-4 py-3">
            {linea.NUMCENS_Pagador || "-"}
          </td>

          <td className="px-4 py-3">
          {linea.NUMCENS || "?"}-
{linea.CUOTAS_SOCIOS?.Ejercicio || remesa?.Ejercicio || "?"}-
{linea.CUOTAS_PLAZOS?.NumeroPlazo || "?"}
          </td>

          <td className="px-4 py-3">
            Cuota {ejercicio} · Plazo {plazo}
          </td>

          <td className="px-4 py-3 text-right">
  <EditarImporteRemesaInput
    idDetalleRemesa={linea.IDDetalleRemesa}
    idRemesa={Number(id)}
    importeInicial={Number(linea.Importe || 0)}
  />
</td>
        </tr>
      );
    })
  )}
</tbody>
</table>
</div>
</section>

<section className="mt-8 border border-zinc-200 bg-white">
<div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
  <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
    Vista agrupada para banco
  </h2>

  <ExportarRemesaExcelButton
  filas={remesaAgrupada}
  idRemesa={remesa.IDRemesa}
/>
</div>

  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
        <tr>
          <th className="px-4 py-3">Nombre deudor</th>
          <th className="px-4 py-3">Referencia mandato</th>
          <th className="px-4 py-3">Cuenta cargo</th>
          <th className="px-4 py-3">Concepto</th>
          <th className="px-4 py-3">Fecha firma mandato</th>
          <th className="px-4 py-3">Referencia adeudo</th>
          <th className="px-4 py-3">Fecha vencimiento</th>
          <th className="px-4 py-3 text-right">Importe</th>
          <th className="px-4 py-3">Tipo adeudo</th>
        </tr>
      </thead>

      <tbody>
        {remesaAgrupada.map((fila: any) => (
          <tr key={`${fila.NUMCENS_Pagador}-${fila.IBAN}`} className="border-t">
            <td className="px-4 py-3">{fila.NombreDeudor}</td>
            <td className="px-4 py-3">{fila.ReferenciaMandato}</td>
            <td className="px-4 py-3">{fila.IBAN}</td>
            <td className="px-4 py-3">{fila.Concepto.join(", ")}</td>
            <td className="px-4 py-3">{fila.FechaMandato || "-"}</td>
            <td className="px-4 py-3">{fila.ReferenciaAdeudo}</td>
            <td className="px-4 py-3">{fila.FechaVencimiento || "-"}</td>
            <td className="px-4 py-3 text-right">
              {fila.Importe.toFixed(2)} €
            </td>
            <td className="px-4 py-3">RCUR</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>
        </div>
      </main>
    </div>
  );
}