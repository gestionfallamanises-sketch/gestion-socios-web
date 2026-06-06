import { Fragment } from "react";
import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";

export default async function CuotasSocioPage({
  params,
}: {
  params: Promise<{ numcens: string }>;
}) {
  const { numcens } = await params;

  const { data: socio } = await (supabase as any)

    .from("SOCIOS")
    .select("*")
    .eq("NUMCENS", Number(numcens))
    .single();

    const socioAny = socio as any;

  const { data: cuotas } = await (supabase as any)
    .from("vista_cuotas_socios")
    .select("*")
    .eq("NUMCENS", Number(numcens))
    .order("Ejercicio", { ascending: false });

    const { data: formaPago } = await (supabase as any)
  .from("FORMAS_PAGO_SOCIOS")
  .select("*")
  .eq("NUMCENS", Number(numcens))
  .eq("Activo", true)
  .maybeSingle();

  const formaPagoAny = formaPago as any;

  const cuotasAny = (cuotas as any[]) || [];
  
const idsCuotas = cuotasAny.map((c) => c.IDCuotaSocio);

  const { data: plazos } =
    idsCuotas.length > 0
    ? await (supabase as any)
          .from("CUOTAS_PLAZOS")
          .select("*")
          .in("IDCuotaSocio", idsCuotas)
          .order("NumeroPlazo", { ascending: true })
      : { data: [] };

      const plazosAny = (plazos as any[]) || [];

      const idsPlazos = plazosAny.map((p) => p.IDPlazo);

const { data: pagosManuales } =
  idsPlazos.length > 0
  ? await (supabase as any)
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

    const pagosManualesAny = (pagosManuales as any[]) || [];

  function plazosDeCuota(idCuotaSocio: number) {
    return (
      plazosAny.filter(
        (p) => Number(p.IDCuotaSocio) === Number(idCuotaSocio)
      ) || []
    );
  }

  const totalImporte =
    cuotasAny.reduce((acc, cuota) => acc + Number(cuota.Importe || 0), 0) || 0;

  const totalPagado =
    plazosAny.reduce((acc, plazo) => acc + Number(plazo.ImportePagado || 0), 0) ||
    0;

  const totalPendiente =
    plazosAny.reduce((acc, plazo) => acc + Number(plazo.Pendiente || 0), 0) || 0;

    function formatearFecha(fecha: string | null) {
      if (!fecha) return "-";
    
      const [year, month, day] = fecha.split("-");
      return `${day}-${month}-${year}`;
    }
    
  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href={"/socios/" + numcens}
            className="mb-6 inline-block text-sm font-medium text-red-900 hover:text-red-950"
          >
            ← Volver a ficha socio
          </Link>

          <section className="mb-8 border border-zinc-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-900 px-6 py-5">
              <h1 className="text-2xl font-bold text-zinc-900">
                Cuotas del socio
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                {socioAny?.Apellidos}, {socioAny?.Nombre} · NUMCENS {numcens}
              </p>
            </div>
          </section>

          <section className="mb-8 border border-zinc-200 bg-white">
          <div className="grid grid-cols-2 lg:grid-cols-5">
              <Resumen label="Cuotas" value={cuotas?.length || 0} />
              <Resumen
                label="Total cuotas"
                value={`${totalImporte.toFixed(2)} €`}
              />
              <Resumen
                label="Total pagado"
                value={`${totalPagado.toFixed(2)} €`}
                color="green"
              />
              <Resumen
                label="Total pendiente"
                value={`${totalPendiente.toFixed(2)} €`}
                color="red"
              />
              <Resumen
  label="Método/plazos"
  value={`${formaPagoAny?.Metodo || "-"} · ${
    formaPagoAny?.NumeroPlazos || "-"
  } plazo${Number(formaPagoAny?.NumeroPlazos || 0) === 1 ? "" : "s"}`}
/>
            </div>
          </section>

          <section className="border border-zinc-200 bg-white">
            <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  Historial de cuotas y plazos
                </h2>

                <p className="text-xs text-zinc-500">
                  Cuotas generadas, recibos, remesas y pagos asociados
                </p>
              </div>
            </div>

            {!cuotas || cuotas.length === 0 ? (
              <div className="p-6 text-sm text-zinc-500">
                Este socio no tiene cuotas registradas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
                    <tr>
                      <th className="px-4 py-3">Ejercicio / plazo</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Importe</th>
                      <th className="px-4 py-3 text-right">Pagado</th>
                      <th className="px-4 py-3 text-right">Pendiente</th>
                      <th className="px-4 py-3">Método</th>
                      <th className="px-4 py-3">Remesa</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>

                  <tbody>
                    {cuotasAny.map((cuota) => {
                      const plazosCuota = plazosDeCuota(cuota.IDCuotaSocio);
                      const pagadoCuota = plazosCuota.reduce(
                        (acc, p) => acc + Number(p.ImportePagado || 0),
                        0
                      );
                      const pendienteCuota = plazosCuota.reduce(
                        (acc, p) => acc + Number(p.Pendiente || 0),
                        0
                      );

                      return (
                        <Fragment key={`grupo-cuota-${cuota.IDCuotaSocio}`}>
                          <tr
                            key={`cuota-${cuota.IDCuotaSocio}`}
                            className="border-t border-zinc-300 bg-zinc-50"
                          >
                            <td className="px-4 py-3 font-semibold">
                              Ejercicio {cuota.Ejercicio}
                            </td>

                            <td className="px-4 py-3">
                              <EstadoBadge estado={cuota.EstadoPago} />
                            </td>

                            <td className="px-4 py-3 text-right font-medium">
                              {Number(cuota.Importe || 0).toFixed(2)} €
                            </td>

                            <td className="px-4 py-3 text-right text-green-700">
                              {pagadoCuota.toFixed(2)} €
                            </td>

                            <td className="px-4 py-3 text-right text-red-700">
                              {pendienteCuota.toFixed(2)} €
                            </td>

                            <td className="px-4 py-3">{cuota.Metodo || "-"}</td>

                            <td className="px-4 py-3">-</td>

                            <td className="px-4 py-3 text-right">
                              <Link
                                href={
                                  "/cuotas/" + cuota.IDCuotaSocio + "/pago"
                                }
                                className="bg-red-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-950"
                              >
                                Registrar pago
                              </Link>
                            </td>
                          </tr>

                          {plazosCuota.length === 0 ? (
                            <tr
                              key={`sin-plazos-${cuota.IDCuotaSocio}`}
                              className="border-t border-zinc-200"
                            >
                              <td
                                colSpan={8}
                                className="px-4 py-3 text-sm text-zinc-500"
                              >
                                Esta cuota todavía no tiene plazos generados.
                              </td>
                            </tr>
                          ) : (
                            plazosCuota.map((plazo) => (
                              <tr
                                key={`plazo-${plazo.IDPlazo}`}
                                className="border-t border-zinc-200 hover:bg-red-50"
                              >
                                <td className="px-4 py-3 pl-8">
  Plazo {plazo.NumeroPlazo}

  {plazo.FechaPago &&
    ["Pagado", "Parcial"].includes(plazo.Estado) && (
      <span className="ml-2 text-xs text-zinc-500">
        {formatearFecha(plazo.FechaPago)}
      </span>
    )}
</td>

                                <td className="px-4 py-3">
                                  <EstadoBadge estado={plazo.Estado} />
                                </td>

                                <td className="px-4 py-3 text-right">
  <div className="flex items-center justify-end gap-1">
  {plazo.TieneGastosDevolucion && (
  <details className="relative inline-block">
    <summary className="list-none cursor-pointer text-amber-600">
      ⚠️
    </summary>

    <div className="absolute right-0 z-50 mt-2 w-56 border border-zinc-200 bg-white p-3 text-left text-xs text-zinc-700 shadow-lg">
      <p>
        Cuota:{" "}
        {(
          Number(plazo.ImportePlazo || 0) -
          Number(plazo.GastosDevolucion || 0)
        ).toFixed(2)} €
      </p>

      <p>
        Gastos devolución:{" "}
        {Number(plazo.GastosDevolucion || 0).toFixed(2)} €
      </p>

      <p className="mt-2 font-semibold">
        Total: {Number(plazo.ImportePlazo || 0).toFixed(2)} €
      </p>
    </div>
  </details>
)}

    <span>
      {Number(plazo.ImportePlazo || 0).toFixed(2)} €
    </span>
  </div>
</td>

                                <td className="px-4 py-3 text-right text-green-700">
                                  {Number(plazo.ImportePagado || 0).toFixed(2)} €
                                </td>

                                <td className="px-4 py-3 text-right text-red-700">
                                  {Number(plazo.Pendiente || 0).toFixed(2)} €
                                </td>

                                <td className="px-4 py-3">
                                  {plazo.Metodo || "-"}
                                </td>

                                <td className="px-4 py-3">
                                  {plazo.IDRemesa
                                    ? `Remesa ${plazo.IDRemesa}`
                                    : "-"}
                                </td>

                                <td className="px-4 py-3 text-right">
                                  {plazo.Estado === "Pagado" ? (
                                    <span className="text-xs text-zinc-400">
                                      Pagado
                                    </span>
                                  ) : (
                                    <Link
                                      href={
                                        "/cuotas/" +
                                        cuota.IDCuotaSocio +
                                        "/pago"
                                      }
                                      className="bg-red-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-950"
                                    >
                                      Pagar
                                    </Link>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="mt-8 border border-zinc-200 bg-white">
  <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
        Historial de pagos manuales
      </h2>

      <p className="text-xs text-zinc-500">
        Pagos aplicados a los plazos de este socio
      </p>
    </div>
  </div>

  {!pagosManuales || pagosManuales.length === 0 ? (
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
            <th className="px-4 py-3 text-right">Importe</th>
            <th className="px-4 py-3">Método</th>
            <th className="px-4 py-3">Observaciones</th>
          </tr>
        </thead>

        <tbody>
          {pagosManualesAny.map((pago) => {
            const plazo = plazosAny.find(
              (p) => Number(p.IDPlazo) === Number(pago.IDPlazo)
            );

            return (
              <tr
                key={pago.ID}
                className="border-t border-zinc-200 hover:bg-red-50"
              >
                <td className="px-4 py-3">
                  {pago.PAGOS_MANUALES?.FechaPago || "-"}
                </td>

                <td className="px-4 py-3">
                  {plazo ? `Plazo ${plazo.NumeroPlazo}` : "-"}
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
            );
          })}
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
        estado === "Pagada" || estado === "Pagado"
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