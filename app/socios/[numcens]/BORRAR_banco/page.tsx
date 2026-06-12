import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";
import RegistrarPagoModalButton from "@/app/components/RegistrarPagoModalButton";

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

  const { data: cuotas } = await supabase
    .from("vista_cuotas_socios")
    .select("*")
    .eq("NUMCENS", Number(numcens))
    .order("Ejercicio", { ascending: false });

    const cuotasAny = (cuotas as any[]) || [];
    const socioAny = socio as any;

    const totalImporte =
      cuotasAny.reduce((acc, cuota) => acc + Number(cuota.Importe || 0), 0) || 0;
    
    const totalPagado =
      cuotasAny.reduce((acc, cuota) => acc + Number(cuota.TotalPagado || 0), 0) || 0;

  const totalPendiente =
    cuotasAny.reduce((acc, cuota) => acc + Number(cuota.Pendiente || 0), 0) || 0;

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
            <div className="grid grid-cols-2 lg:grid-cols-4">
              <Resumen label="Cuotas" value={cuotasAny.length || 0} />
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
            </div>
          </section>

          <section className="border border-zinc-200 bg-white">
            <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  Historial de cuotas
                </h2>

                <p className="text-xs text-zinc-500">
                  Cuotas generadas y pagos asociados a este socio
                </p>
              </div>
            </div>

            {!cuotas || cuotasAny.length === 0 ? (
              <div className="p-6 text-sm text-zinc-500">
                Este socio no tiene cuotas registradas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
                    <tr>
                      <th className="px-4 py-3">Ejercicio</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Importe</th>
                      <th className="px-4 py-3 text-right">Pagado</th>
                      <th className="px-4 py-3 text-right">Pendiente</th>
                      <th className="px-4 py-3">Método</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>

                  <tbody>
                    {cuotasAny.map((cuota) => {
                      const estado = cuota.EstadoPago;

                      return (
                        <tr
                          key={cuota.IDCuotaSocio}
                          className="border-t border-zinc-200 hover:bg-red-50"
                        >
                          <td className="px-4 py-3 font-medium">
                            {cuota.Ejercicio}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={
                                estado === "Pagada"
                                  ? "bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                                  : estado === "Parcial"
                                  ? "bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700"
                                  : "bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                              }
                            >
                              {estado || "-"}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            {Number(cuota.Importe || 0).toFixed(2)} €
                          </td>

                          <td className="px-4 py-3 text-right text-green-700">
                            {Number(cuota.TotalPagado || 0).toFixed(2)} €
                          </td>

                          <td className="px-4 py-3 text-right text-red-700">
                            {Number(cuota.Pendiente || 0).toFixed(2)} €
                          </td>

                          <td className="px-4 py-3">{cuota.Metodo || "-"}</td>

                          <td className="px-4 py-3 text-right">
                          {Number(cuota.Pendiente || 0) > 0 ? (
  <RegistrarPagoModalButton
    idCuotaSocio={Number(cuota.IDCuotaSocio)}
    numcens={Number(cuota.NUMCENS)}
    pendienteMaximo={Number(cuota.Pendiente || 0)}
  />
) : (
  <span className="text-xs text-zinc-400">Pagada</span>
)}
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