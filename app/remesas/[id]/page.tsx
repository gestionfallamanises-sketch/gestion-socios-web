import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";
import ExportarRemesaExcelButton from "@/app/components/ExportarRemesaExcelButton";
import PrintButton from "@/app/components/PrintButton";
import EditarImporteRemesaInput from "@/app/components/EditarImporteRemesaInput";
import QuitarLineaRemesaButton from "@/app/components/QuitarLineaRemesaButton";
import EditarFechaVencimientoInput from "@/app/components/EditarFechaVencimientoInput";
import MarcarReciboAgrupadoDevueltoButton from "@/app/components/MarcarReciboAgrupadoDevueltoButton";
import AnularReciboAgrupadoDevueltoButton from "@/app/components/AnularReciboAgrupadoDevueltoButton";
import AgregarLineasRemesaButton from "@/app/components/AgregarLineasRemesaButton";

export default async function RemesaDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ buscar?: string }>;
}) {
  const { id } = await params;
  
  const { buscar = "" } = await searchParams;
  const textoBusqueda = buscar.trim().toLowerCase();

  const { data: remesa } = await (supabase as any)
    .from("REMESAS")
    .select("*")
    .eq("IDRemesa", Number(id))
    .single();

  const remesaAny = remesa as any;

  const { data: lineas } = await (supabase as any)
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

  const lineasAny = (lineas as any[]) || [];

  const lineasParaBanco = lineasAny.filter(
    (linea) =>
      String(linea.Estado || "").trim().toLowerCase() !== "cobrado"
  );

  const total =
  lineasAny
    .filter(
      (l) =>
        String(l.Estado || "").trim().toLowerCase() !== "cobrado"
    )
    .reduce((acc, l) => acc + Number(l.Importe || 0), 0) || 0;

    const numsSocios = lineasAny.map((l) => l.NUMCENS);
    const numsPagadores = lineasAny
      .map((l) => l.NUMCENS_Pagador)
      .filter(Boolean);

  const { data: sociosRemesa } =
    numsSocios.length > 0
      ? await (supabase as any)
          .from("SOCIOS")
          .select("NUMCENS, Nombre, Apellidos, FechaPrimerAlta")
          .in("NUMCENS", numsSocios)
      : { data: [] };

      const sociosRemesaAny = (sociosRemesa as any[]) || [];

lineasAny.sort((a, b) => {
  const socioA = sociosRemesaAny.find(
    (s) => Number(s.NUMCENS) === Number(a.NUMCENS)
  );

  const socioB = sociosRemesaAny.find(
    (s) => Number(s.NUMCENS) === Number(b.NUMCENS)
  );

  const textoA = `${socioA?.Apellidos || ""} ${socioA?.Nombre || ""}`;
  const textoB = `${socioB?.Apellidos || ""} ${socioB?.Nombre || ""}`;

  return textoA.localeCompare(textoB, "es");
});

const lineasFiltradas = textoBusqueda
  ? lineasAny.filter((linea) => {
      const socio = sociosRemesaAny.find(
        (s) => Number(s.NUMCENS) === Number(linea.NUMCENS)
      );

      const texto = [
        linea.NUMCENS,
        linea.NUMCENS_Pagador,
        socio?.Nombre,
        socio?.Apellidos,
        linea.IBAN,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return texto.includes(textoBusqueda);
    })
  : lineasAny;

const { data: sociosPagadores } =
  numsPagadores.length > 0
    ? await (supabase as any)
        .from("SOCIOS")
        .select("NUMCENS, Nombre, Apellidos")
        .in("NUMCENS", numsPagadores)
    : { data: [] };

const sociosPagadoresAny = (sociosPagadores as any[]) || [];

const remesaAgrupada = Object.values(
  lineasAny.reduce((acc: any, linea: any) => {
      const clave = `${linea.NUMCENS_Pagador}-${linea.IBAN}`;

      if (!acc[clave]) {
        acc[clave] = {
          NUMCENS_Pagador: linea.NUMCENS_Pagador,
          EstadoAgrupado: linea.Estado,
          NombreDeudor:
  linea.TitularCuenta ||
  (() => {
    const pagador = sociosPagadoresAny.find(
      (s) => Number(s.NUMCENS) === Number(linea.NUMCENS_Pagador)
    );

    return pagador
      ? `${pagador.Apellidos || ""}, ${pagador.Nombre || ""}`
      : linea.NUMCENS_Pagador || "";
  })(),
          IBAN: linea.IBAN,
          Importe: 0,
          Concepto: [],
          ReferenciaMandato: `${linea.NUMCENS_Pagador || linea.NUMCENS || "?"}-${
            linea.CUOTAS_SOCIOS?.Ejercicio || remesaAny?.Ejercicio || "?"
          }-${linea.CUOTAS_PLAZOS?.NumeroPlazo || "?"}`,
          FechaMandato:
            sociosRemesaAny.find(
              (s) => Number(s.NUMCENS) === Number(linea.NUMCENS)
            )?.FechaPrimerAlta || "-",

            IDPlazo: linea.IDPlazo,

          ReferenciaAdeudo: `R${linea.IDRemesa}-P${linea.IDPlazo}`,
          FechaVencimiento:
            linea.CUOTAS_PLAZOS?.FechaVencimiento || "-",
        };
      }

      acc[clave].Importe += Number(linea.Importe || 0);
      acc[clave].Concepto.push(
        `${linea.NUMCENS}-${
          linea.CUOTAS_SOCIOS?.Ejercicio || remesaAny?.Ejercicio
        }-${linea.CUOTAS_PLAZOS?.NumeroPlazo || ""}`
      );

      if (
        String(linea.Estado || "").trim().toLowerCase() === "devuelto"
      ) {
        acc[clave].EstadoAgrupado = "Devuelto";
      }

      return acc;
    }, {})
  );

  (remesaAgrupada as any[]).sort((a: any, b: any) =>
    (a.NombreDeudor || "").localeCompare(
      b.NombreDeudor || "",
      "es"
    )
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
                Ejercicio {remesaAny?.Ejercicio} · Estado {remesaAny?.Estado} · Total{" "}
                {total.toFixed(2)} €
              </p>
            </div>
          </section>

          <section className="border border-zinc-200 bg-white">
            <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
            <div className="w-full">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  Líneas de remesa
                </h2>

                <p className="text-xs text-zinc-500">
  Detalle interno para comprobar cuotas, pagadores e importes
</p>

<div className="mt-3 flex items-center justify-between">
  <form
    className="flex items-center gap-2"
    method="get"
  >
    <input
      type="text"
      name="buscar"
      defaultValue={buscar}
      placeholder="Buscar socio, apellido, NUMCENS, pagador..."
      className="h-9 w-80 border border-zinc-300 px-3 text-sm outline-none focus:border-red-900"
    />

    <button
      type="submit"
      className="h-9 bg-red-900 px-4 text-sm font-medium text-white hover:bg-red-950"
    >
      Buscar
    </button>

    <AgregarLineasRemesaButton
      idRemesa={Number(id)}
    />

    {buscar && (
      <a
        href={`/remesas/${id}`}
        className="flex h-9 items-center bg-zinc-200 px-4 text-sm font-medium hover:bg-zinc-300"
      >
        Limpiar
      </a>
    )}
  </form>

  <div className="flex items-center gap-2">
    <PrintButton />

    <ExportarRemesaExcelButton
      filas={lineasAny}
      idRemesa={remesaAny?.IDRemesa}
    />
  </div>
</div>
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
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Importe</th>
                    <th className="px-4 py-3 text-center">Quitar</th>
                  </tr>
                </thead>

                <tbody>
                  {lineasAny.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                        Esta remesa no tiene líneas.
                      </td>
                    </tr>
                  ) : (
                    lineasFiltradas.map((linea) => {
                      const socioCuota = sociosRemesaAny.find(
                        (s) => Number(s.NUMCENS) === Number(linea.NUMCENS)
                      );

                      linea.socioCuotaNombre =
                        `${socioCuota?.Apellidos || ""}, ${
                          socioCuota?.Nombre || ""
                        }`;

                      const ejercicio =
                        linea.CUOTAS_SOCIOS?.Ejercicio || remesaAny?.Ejercicio;
                      const plazo = linea.CUOTAS_PLAZOS?.NumeroPlazo;

                      return (
                        <tr
  key={linea.IDDetalleRemesa}
  className={
    linea.Estado === "Añadida"
      ? "border-t border-zinc-200 bg-blue-50 hover:bg-blue-100"
      : "border-t border-zinc-200 hover:bg-red-50"
  }
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
                            {linea.CUOTAS_SOCIOS?.Ejercicio || remesaAny?.Ejercicio || "?"}-
                            {linea.CUOTAS_PLAZOS?.NumeroPlazo || "?"}
                          </td>

                          <td className="px-4 py-3">
                            Cuota {ejercicio} · Plazo {plazo}
                          </td>

                          <td className="px-4 py-3">
  <span
    className={
      linea.Estado === "Cobrado"
        ? "bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
        : linea.Estado === "Parcial"
        ? "bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700"
        : linea.Estado === "Añadida"
        ? "bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700"
        : linea.Estado === "Devuelto"
        ? "bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700"
        : "bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
    }
  >
    {linea.Estado || "-"}
  </span>
</td>

<td className="px-4 py-3 text-right">
  {linea.Estado === "Cobrado" ? (
    <span className="text-sm font-medium text-green-700">
      {Number(linea.Importe || 0).toFixed(2)} €
    </span>
  ) : (
    <EditarImporteRemesaInput
      idDetalleRemesa={linea.IDDetalleRemesa}
      idRemesa={Number(id)}
      importeInicial={Number(linea.Importe || 0)}
    />
  )}
</td>

<td className="px-4 py-3 text-center">
  {String(linea.Estado || "")
    .trim()
    .toLowerCase()
    .startsWith("cobrad") ? (
    <span className="text-xs text-zinc-400">
      No editable
    </span>
  ) : (
    <QuitarLineaRemesaButton
      idDetalleRemesa={linea.IDDetalleRemesa}
    />
  )}
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
                idRemesa={remesaAny?.IDRemesa}
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
                    <th className="px-4 py-3 text-center">Acción</th>
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
                      <td className="px-4 py-3">
  <EditarFechaVencimientoInput
    idPlazo={fila.IDPlazo}
    fechaInicial={fila.FechaVencimiento || ""}
  />
</td>
<td className="px-4 py-3 text-right">
  {fila.Importe.toFixed(2)} €
</td>

<td className="px-4 py-3">RCUR</td>

<td className="px-4 py-3 text-center">
  {fila.EstadoAgrupado === "Devuelto" ? (
    <AnularReciboAgrupadoDevueltoButton
      idRemesa={Number(id)}
      numcensPagador={Number(fila.NUMCENS_Pagador)}
      iban={fila.IBAN}
    />
  ) : (
    <MarcarReciboAgrupadoDevueltoButton
      idRemesa={Number(id)}
      numcensPagador={Number(fila.NUMCENS_Pagador)}
      iban={fila.IBAN}
    />
  )}
</td>
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