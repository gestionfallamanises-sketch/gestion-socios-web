import Link from "next/link";
import { supabase } from "../../../../lib/supabase";
import PrintButton from "../../../components/PrintButton";

export default async function HistorialSocioPage({
  params,
}: {
  params: Promise<{ numcens: string }>;
}) {
  const { numcens } = await params;

  const { data: socio } = await supabase
  .from("SOCIOS_ANTIGUEDAD_CALCULADA")
    .select("*")
    .eq("NUMCENS", Number(numcens))
    .single();

  const { data: historial } = await supabase
    .from("HISTORIAL_SOCIOS")
    .select("ID, NUMCENS, Ejercicio, Fecha_Alta_Baja, Estado")
    .eq("NUMCENS", Number(numcens))
    .order("Ejercicio", { ascending: true });

  if (!socio) {
    return <div className="p-10">Socio no encontrado</div>;
  }

  const mitad = Math.ceil((historial?.length || 0) / 2);
  const izquierda = historial?.slice(0, mitad) || [];
  const derecha = historial?.slice(mitad) || [];

  return (
    <div className="min-h-screen bg-zinc-50 p-10">
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }

          @page {
            margin: 1.2cm;
          }
        }
      `}</style>

      <main className="mx-auto max-w-6xl">
        <div className="no-print mb-6 flex gap-4">
          <Link
            href={`/socios/${socio.NUMCENS}`}
            className="border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            ← Volver a la ficha
          </Link>

          <PrintButton />
        </div>

        <section className="mb-8 border border-zinc-200 bg-white shadow-sm">
          <div className="border-l-4 border-red-900 px-6 py-5">
            <h1 className="text-2xl font-bold text-zinc-900">
              Historial del socio
            </h1>

            <p className="mt-2 text-sm text-zinc-600">
              <span className="font-semibold uppercase">
                {socio.Apellidos}, {socio.Nombre}
              </span>{" "}
              · NUMCENS {socio.NUMCENS} · Antigüedad:{" "}
              {socio.Antiguedad_Calculada || "-"}
            </p>
          </div>
        </section>

        {!historial || historial.length === 0 ? (
          <section className="border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
            Este socio todavía no tiene historial registrado.
          </section>
        ) : (
          <section className="border border-zinc-200 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <HistorialTabla movimientos={izquierda} />

              <div className="border-l border-zinc-200">
                <HistorialTabla movimientos={derecha} />
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function HistorialTabla({ movimientos }: { movimientos: any[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-600">
        <tr>
          <th className="px-4 py-3">Ejercicio</th>
          <th className="px-4 py-3">Fecha</th>
          <th className="px-4 py-3">Estado</th>
        </tr>
      </thead>

      <tbody>
        {movimientos.map((movimiento) => (
          <tr key={movimiento.ID} className="border-t border-zinc-200">
            <td className="px-4 py-3">{movimiento.Ejercicio || "-"}</td>

            <td className="px-4 py-3">
              {movimiento.Fecha_Alta_Baja || "-"}
            </td>

            <td className="px-4 py-3">
              <span
                className={
                  movimiento.Estado === "Alta"
                    ? "bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                    : "bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                }
              >
                {movimiento.Estado || "-"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}