import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";
import RegistrarPagoFamiliaForm from "@/app/components/RegistrarPagoFamiliaForm";

export default async function CuotasFamiliaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: familia } = await supabase
    .from("FAMILIAS")
    .select("*")
    .eq("ID_Familia", Number(id))
    .single();

  const { data: miembros } = await supabase
    .from("SOCIOS")
    .select("*")
    .eq("ID_Familia", Number(id))
    .order("Apellidos", { ascending: true });

    const miembrosAny = (miembros as any[]) || [];
    const numsFamilia = miembrosAny.map((s) => s.NUMCENS);

  const { data: cuotas } =
    numsFamilia.length > 0
      ? await supabase
          .from("vista_cuotas_socios")
          .select("*")
          .in("NUMCENS", numsFamilia)
          .order("Ejercicio", { ascending: false })
      : { data: [] };

      const cuotasAny = (cuotas as any[]) || [];
      const idsCuotas = cuotasAny.map((c) => c.IDCuotaSocio);

  const { data: plazos } =
    idsCuotas.length > 0
      ? await supabase
          .from("CUOTAS_PLAZOS")
          .select("*")
          .in("IDCuotaSocio", idsCuotas)
          .order("NumeroPlazo", { ascending: true })
      : { data: [] };

      const plazosAny = (plazos as any[]) || [];
      const idsPlazos = plazosAny.map((p) => p.IDPlazo);

  const { data: pagos } =
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

      const totalCuotas =
      cuotasAny.reduce((t, c) => t + Number(c.Importe || 0), 0) || 0;
    
    const totalPagado =
      plazosAny.reduce((t, p) => t + Number(p.ImportePagado || 0), 0) || 0;
    
    const totalPendiente =
      plazosAny.reduce((t, p) => t + Number(p.Pendiente || 0), 0) || 0;

  function socioDeCuota(idCuotaSocio: number) {
    const cuota = cuotas?.find(
      (c) => Number(c.IDCuotaSocio) === Number(idCuotaSocio)
    );

    return cuota
      ? `${cuota.Apellidos}, ${cuota.Nombre}`
      : "-";
  }

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href={`/familias/${id}`}
            className="mb-6 inline-block text-sm font-medium text-red-900 hover:text-red-950"
          >
            ← Volver a familia
          </Link>

          <section className="mb-8 border border-zinc-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-900 px-6 py-5">
              <h1 className="text-2xl font-bold text-zinc-900">
                Cuotas y pagos familiares
              </h1>

              <p className="mt-2 text-sm text-zinc-600">
                {familia?.Nombre_Familia || "Familia"} · {miembros?.length || 0} miembros
              </p>
            </div>
          </section>

          <section className="mb-8 border border-zinc-200 bg-white">
            <div className="grid grid-cols-1 text-sm md:grid-cols-3">
              <Bloque label="Total cuotas" value={`${totalCuotas.toFixed(2)} €`} />
              <Bloque label="Total pagado" value={`${totalPagado.toFixed(2)} €`} />
              <Bloque label="Total pendiente" value={`${totalPendiente.toFixed(2)} €`} />
            </div>
          </section>

          <section className="mb-8 border border-zinc-200 bg-white">
            <div className="bg-zinc-100 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                Registrar pago familiar
              </h2>
            </div>

            <div className="p-4">
              <RegistrarPagoFamiliaForm idFamilia={Number(id)} />
            </div>
          </section>

          <section className="mb-8 border border-zinc-200 bg-white">
            <div className="bg-zinc-100 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                Plazos familiares
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
                  <tr>
                    <th className="px-4 py-3">Socio</th>
                    <th className="px-4 py-3">Plazo</th>
                    <th className="px-4 py-3 text-right">Importe</th>
                    <th className="px-4 py-3 text-right">Pagado</th>
                    <th className="px-4 py-3 text-right">Pendiente</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Método</th>
                  </tr>
                </thead>

                <tbody>
                  {!plazos || plazos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-zinc-500">
                        No hay plazos generados.
                      </td>
                    </tr>
                  ) : (
                    plazosAny.map((plazo) => (
                      <tr key={plazo.IDPlazo} className="border-t border-zinc-200 hover:bg-red-50">
                        <td className="px-4 py-3 font-medium">
                          {socioDeCuota(plazo.IDCuotaSocio)}
                        </td>

                        <td className="px-4 py-3">
                          Plazo {plazo.NumeroPlazo}
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
                          {plazo.Metodo || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="border border-zinc-200 bg-white">
            <div className="bg-zinc-100 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                Historial de pagos familiares
              </h2>
            </div>

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
                  {!pagos || pagos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                        No hay pagos registrados.
                      </td>
                    </tr>
                  ) : (
                    pagos.map((pago) => {
                      const plazo = plazos?.find(
                        (p) => Number(p.IDPlazo) === Number(pago.IDPlazo)
                      );

                      return (
                        <tr key={pago.ID} className="border-t border-zinc-200 hover:bg-red-50">
                          <td className="px-4 py-3">
                            {pago.PAGOS_MANUALES?.FechaPago || "-"}
                          </td>

                          <td className="px-4 py-3">
                            {plazo ? `${socioDeCuota(plazo.IDCuotaSocio)} · Plazo ${plazo.NumeroPlazo}` : "-"}
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
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Bloque({ label, value }: { label: string; value: any }) {
  return (
    <div className="border-r border-b border-zinc-200">
      <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
        {label}
      </div>

      <div className="bg-white px-4 py-3 text-sm">{value || "-"}</div>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={
        estado === "Pagado" || estado === "Pagada"
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