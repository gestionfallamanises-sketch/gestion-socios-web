import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";
import RegistrarPagoForm from "@/app/components/RegistrarPagoForm";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PagoPage({ params }: Props) {
  const { id } = await params;

  const { data: cuota, error } = await (supabase as any)
    .from("vista_cuotas_socios")
    .select("*")
    .eq("IDCuotaSocio", id)
    .single();

    const { data: plazos } = await supabase
    .from("CUOTAS_PLAZOS")
    .select("*")
    .eq("IDCuotaSocio", Number(id))
    .order("NumeroPlazo", { ascending: true });

    const idsPlazos = (plazos as any[])?.map((p) => p.IDPlazo) || [];

const { data: pagosAplicados } =
  idsPlazos.length > 0
    ? await supabase
        .from("PAGOS_MANUALES_PLAZOS")
        .select(`
          ID,
          IDPlazo,
          ImporteAplicado,
          PAGOS_MANUALES (
            IDPagoManual,
            FechaPago,
            Metodo,
            Observaciones
          )
        `)
        .in("IDPlazo", idsPlazos)
        .order("ID", { ascending: false })
    : { data: [] };

  if (error || !cuota) {
    return (
      <div className="flex min-h-screen bg-zinc-100">
        <Sidebar />

        <main className="min-w-0 flex-1 p-8">
          <div className="mx-auto max-w-5xl border border-zinc-200 bg-white p-8">
            <p>Error cargando cuota</p>
          </div>
        </main>
      </div>
    );
  }

  const plazosAny = (plazos as any[]) || [];

  const totalPagadoPlazos =
    plazosAny.reduce((acc, plazo) => acc + Number(plazo.ImportePagado || 0), 0)

  const totalPendientePlazos =
    plazosAny.reduce((acc, plazo) => acc + Number(plazo.Pendiente || 0), 0) || 0;
    
    const cuotaAny = cuota as any;

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href={`/socios/${cuotaAny.NUMCENS}/cuotas`}
            className="mb-6 inline-block text-sm font-medium text-red-900 hover:text-red-950"
          >
            ← Volver a cuotas del socio
          </Link>

          <section className="mb-8 border border-zinc-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-900 px-6 py-5">
              <h1 className="text-2xl font-bold text-zinc-900">
                Registrar pago
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
              {cuotaAny.Apellidos}, {cuotaAny.Nombre} · NUMCENS {cuotaAny.NUMCENS} ·
              Ejercicio {cuotaAny.Ejercicio}
              </p>
            </div>
          </section>

          <section className="mb-8 border border-zinc-200 bg-white">
            <div className="grid grid-cols-2 lg:grid-cols-4">
              <Resumen
                label="Importe cuota"
                value={`${Number(cuotaAny.Importe || 0).toFixed(2)} €`}
              />

              <Resumen
                label="Pagado"
                value={`${totalPagadoPlazos.toFixed(2)} €`}
                color="green"
              />

              <Resumen
                label="Pendiente"
                value={`${totalPendientePlazos.toFixed(2)} €`}
                color="red"
              />

              <Resumen label="Método" value={cuotaAny.Metodo || "-"} />
            </div>
          </section>

          <section className="mb-8 border border-zinc-200 bg-white">
            <div className="bg-zinc-100 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                Nuevo pago manual
              </h2>
            </div>

            <div className="p-4">
              <RegistrarPagoForm
                idCuotaSocio={Number(cuotaAny.IDCuotaSocio)}
                numcens={Number(cuotaAny.NUMCENS)}
              />
            </div>
          </section>

          <section className="mb-8 border border-zinc-200 bg-white">
            <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  Plazos de la cuota
                </h2>

                <p className="text-xs text-zinc-500">
                  Recibos generados para esta cuota
                </p>
              </div>
            </div>

            {!plazos || plazos.length === 0 ? (
              <div className="p-6 text-sm text-zinc-500">
                Esta cuota todavía no tiene plazos generados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
                    <tr>
                      <th className="px-4 py-3">Plazo</th>
                      <th className="px-4 py-3">Vencimiento</th>
                      <th className="px-4 py-3 text-right">Importe</th>
                      <th className="px-4 py-3 text-right">Pagado</th>
                      <th className="px-4 py-3 text-right">Pendiente</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Remesa</th>
                    </tr>
                  </thead>

                  <tbody>
                  {plazosAny.map((plazo) => (
  <tr
    key={plazo.IDPlazo}
                        className="border-t border-zinc-200 hover:bg-red-50"
                      >
                        <td className="px-4 py-3 font-medium">
                          Plazo {plazo.NumeroPlazo}
                        </td>

                        <td className="px-4 py-3">
                          {plazo.FechaVencimiento || "-"}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {Number(plazo.ImportePlazo || 0).toFixed(2)} €
                        </td>

                        <td className="px-4 py-3 text-right text-green-700">
                          {Number(plazo.ImportePagado || 0).toFixed(2)} €
                        </td>

                        <td className="px-4 py-3 text-right text-red-700">
                          {Number(plazo.Pendiente || 0).toFixed(2)} €
                        </td>

                        <td className="px-4 py-3">
                          <EstadoBadge estado={plazo.Estado} />
                        </td>

                        <td className="px-4 py-3">
                          {plazo.IDRemesa ? `Remesa ${plazo.IDRemesa}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="border border-zinc-200 bg-white">
            <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  Historial de pagos manuales
                </h2>

                <p className="text-xs text-zinc-500">
                  Pagos aplicados a los plazos de esta cuota
                </p>
              </div>
            </div>

            {!pagosAplicados || pagosAplicados.length === 0 ? (
              <div className="p-6 text-sm text-zinc-500">
                Todavía no hay pagos manuales registrados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Plazo</th>
                      <th className="px-4 py-3 text-right">Aplicado</th>
                      <th className="px-4 py-3">Método</th>
                      <th className="px-4 py-3">Observaciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pagosAplicados.map((pago) => (
                      <tr
                        key={pago.ID}
                        className="border-t border-zinc-200 hover:bg-red-50"
                      >
                        <td className="px-4 py-3">
                          {pago.PAGOS_MANUALES?.FechaPago || "-"}
                        </td>

                        <td className="px-4 py-3">
                        {(() => {
  const plazo = plazos?.find(
    (p) => Number(p.IDPlazo) === Number(pago.IDPlazo)
  );

  return plazo ? `Plazo ${plazo.NumeroPlazo}` : "-";
})()}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {Number(pago.ImporteAplicado || 0).toFixed(2)} €
                        </td>

                        <td className="px-4 py-3">
                          {pago.PAGOS_MANUALES?.Metodo || "-"}
                        </td>

                        <td className="px-4 py-3">
                          {pago.PAGOS_MANUALES?.Observaciones || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function Resumen({
  label,
  value,
  color,
}: {
  label: string;
  value: any;
  color?: "green" | "red";
}) {
  return (
    <div className="border-r border-b border-zinc-200">
      <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
        {label}
      </div>

      <div
        className={
          "bg-white px-4 py-3 text-sm font-medium " +
          (color === "green"
            ? "text-green-700"
            : color === "red"
            ? "text-red-700"
            : "text-zinc-900")
        }
      >
        {value}
      </div>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={
        estado === "Pagado"
          ? "bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
          : estado === "Parcial" || estado === "En remesa"
          ? "bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700"
          : "bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
      }
    >
      {estado || "-"}
    </span>
  );
}