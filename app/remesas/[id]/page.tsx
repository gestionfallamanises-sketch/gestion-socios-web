import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";
import ExportarRemesaExcelButton from "@/app/components/ExportarRemesaExcelButton";
import PrintButton from "@/app/components/PrintButton";
import EditarImporteRemesaInput from "@/app/components/EditarImporteRemesaInput";
import EditarImporteReciboRemesaInput from "@/app/components/EditarImporteReciboRemesaInput";
import QuitarLineaRemesaButton from "@/app/components/QuitarLineaRemesaButton";
import EditarFechaVencimientoInput from "@/app/components/EditarFechaVencimientoInput";
import MarcarReciboAgrupadoDevueltoButton from "@/app/components/MarcarReciboAgrupadoDevueltoButton";
import AnularReciboAgrupadoDevueltoButton from "@/app/components/AnularReciboAgrupadoDevueltoButton";
import AgregarLineasRemesaButton from "@/app/components/AgregarLineasRemesaButton";
import { normalizarTexto } from "@/lib/texto";

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
  lineasAny.forEach((linea) => {
    linea.Concepto = `${linea.NUMCENS || "?"}-${
      linea.CUOTAS_SOCIOS?.Ejercicio || remesaAny?.Ejercicio || "?"
    }-${linea.CUOTAS_PLAZOS?.NumeroPlazo || "?"}`;
  });

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

function normalizar(texto: string) {
  return normalizarTexto(texto);
}

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

        return normalizarTexto(texto).includes(
          normalizarTexto(textoBusqueda)
        );
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

const remesaAgrupada: any[] = Object.values(
  lineasAny.reduce((acc: any, linea: any) => {
    const clave = `${linea.IBAN}-${linea.TitularCuenta || ""}`;

      if (!acc[clave]) {
        acc[clave] = {
          NUMCENS_Pagador: linea.NUMCENS_Pagador,
          EstadoAgrupado: linea.Estado,
          TitularCuenta: linea.TitularCuenta || null,
          Lineas: [],
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
      acc[clave].Concepto.push(linea.NUMCENS);

      acc[clave].Lineas.push({
        IDDetalleRemesa: linea.IDDetalleRemesa,
        NUMCENS: linea.NUMCENS,
        NumeroPlazo: linea.CUOTAS_PLAZOS?.NumeroPlazo,
        Nombre:
          sociosRemesaAny.find(
            (s) => Number(s.NUMCENS) === Number(linea.NUMCENS)
          )?.Nombre || "",
        Apellidos:
          sociosRemesaAny.find(
            (s) => Number(s.NUMCENS) === Number(linea.NUMCENS)
          )?.Apellidos || "",
        Importe: Number(linea.Importe || 0),
        Estado: linea.Estado,
      });

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

  const remesaAgrupadaFiltrada = textoBusqueda
  ? remesaAgrupada.filter((fila: any) => {
      const texto = [
        fila.NombreDeudor,
        fila.NUMCENS_Pagador,
        fila.IBAN,
        fila.ReferenciaMandato,
        fila.ReferenciaAdeudo,
        ...(fila.Lineas || []).flatMap((linea: any) => [
          linea.NUMCENS,
          linea.Nombre,
          linea.Apellidos,
        ]),
      ]
        .filter(Boolean)
        .join(" ");

      return normalizarTexto(texto).includes(
        normalizarTexto(textoBusqueda)
      );
    })
  : remesaAgrupada;

 
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
        <div className="mb-6 flex items-center justify-between">
  <Link
    href="/remesas"
    className="text-sm font-medium text-red-900 hover:text-red-950"
  >
    ← Volver a remesas
  </Link>

  <div className="flex items-center gap-2">
    <PrintButton />

    <ExportarRemesaExcelButton
  filas={remesaAgrupada}
  idRemesa={remesaAny?.IDRemesa}
  ejercicio={remesaAny?.Ejercicio}
  fechaVencimiento={remesaAny?.FechaVencimiento}
/>
  </div>
</div>

          <section className="mb-8 border border-zinc-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-900 px-6 py-5">
              <h1 className="text-2xl font-bold text-zinc-900">
                Remesa {id}
              </h1>

              <div className="mt-2 flex items-center justify-between gap-6">
              <p className="text-base text-zinc-600">
    Ejercicio {remesaAny?.Ejercicio} · Estado {remesaAny?.Estado} · Total{" "}
    <span className="font-semibold text-zinc-900">
      {total.toFixed(2)} €
    </span>
  </p>

  <div className="flex items-center gap-2">
  <span className="text-base font-semibold text-zinc-700">
  Vencimiento
</span>

<EditarFechaVencimientoInput
  idRemesa={Number(id)}
  fechaInicial={remesaAny?.FechaVencimiento || ""}
/>
  </div>
</div>
            </div>
          </section>

          <section className="mt-8 border border-zinc-200 bg-white">
          <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
  <div>
    <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
      Vista agrupada para banco
    </h2>

    <p className="text-xs text-zinc-500">
      Recibos agrupados por pagador
    </p>
  </div>

  <div className="flex items-center gap-2">
  <form method="get" className="flex items-center gap-2">
    <input
      type="text"
      name="buscar"
      defaultValue={buscar}
      placeholder="Buscar socio, pagador, NUMCENS, IBAN..."
      className="h-9 w-72 border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-red-900"
    />

    <button
      type="submit"
      className="h-9 bg-red-900 px-4 text-sm font-medium text-white hover:bg-red-950"
    >
      Buscar
    </button>

    {buscar && (
      <a
        href={`/remesas/${id}`}
        className="flex h-9 items-center bg-zinc-200 px-3 text-sm font-medium hover:bg-zinc-300"
      >
        Limpiar
      </a>
    )}
  </form>

  {remesaAny?.Estado !== "Cobrada" && (
    <>
      <AgregarLineasRemesaButton idRemesa={Number(id)} />

      <AgregarLineasRemesaButton
        idRemesa={Number(id)}
        modo="especial"
      />
    </>
  )}
</div>
</div>

            <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-sm uppercase text-zinc-600">
                  <tr>
                  <th className="px-2 py-2">Nombre deudor</th>
<th className="px-2 py-2">Referencia mandato</th>
<th className="px-2 py-2">Cuenta cargo</th>
<th className="px-2 py-2">Concepto</th>
<th className="px-2 py-2 text-right">Importe</th>
<th className="px-2 py-2 text-center">Acción</th>
                  </tr>
                </thead>

                <tbody>
                {remesaAgrupadaFiltrada.map((fila) => (
  <tr
    key={`${fila.IBAN}-${fila.NombreDeudor}`}
    className="border-t"
  >
    <td className="px-2 py-2">
    <details className="relative">
        <summary className="cursor-pointer font-medium">
          {fila.NombreDeudor}
        </summary>

        <div className="absolute left-0 top-full z-20 mt-1 w-[360px] rounded-md border border-zinc-200 bg-white p-3 shadow-lg">
  {fila.Lineas?.map((linea: any) => (
    <div
      key={linea.IDDetalleRemesa}
      className="flex items-center justify-between gap-4 border-b border-zinc-100 py-2 last:border-b-0"
    >
      <span className="text-xs text-zinc-700">
        {linea.NUMCENS} ·{" "}
        {[linea.Apellidos, linea.Nombre]
          .filter(Boolean)
          .join(", ")}
      </span>

      <div className="flex items-center gap-2">
  {remesaAny?.Estado === "Cobrada" ? (
    <span className="whitespace-nowrap text-xs font-semibold">
      {Number(linea.Importe || 0).toFixed(2)} €
    </span>
  ) : (
    <EditarImporteRemesaInput
      idDetalleRemesa={linea.IDDetalleRemesa}
      importeInicial={Number(linea.Importe || 0)}
    />
  )}

  {remesaAny?.Estado !== "Cobrada" && (
    <QuitarLineaRemesaButton
      idDetalleRemesa={linea.IDDetalleRemesa}
    />
  )}
</div>
    </div>
  ))}
</div>
      </details>
    </td>

    <td className="px-2 py-2">{fila.ReferenciaMandato}</td>

    <td className="px-2 py-2">{fila.IBAN}</td>

    <td className="px-2 py-2">
  {fila.Concepto.join("-")}/
  {remesaAny?.Ejercicio}/
  {fila.Lineas?.[0]?.NumeroPlazo || fila.NumeroPlazo || ""}
</td>

    <td className="px-4 py-3 text-right">
      {remesaAny?.Estado === "Cobrada" ? (
        <span className="font-medium">
          {Number(fila.Importe || 0).toFixed(2)} €
        </span>
      ) : (
        <EditarImporteReciboRemesaInput
          idRemesa={Number(id)}
          iban={fila.IBAN || null}
          titularCuenta={fila.TitularCuenta || null}
          importeInicial={Number(fila.Importe || 0)}
        />
      )}
    </td>

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