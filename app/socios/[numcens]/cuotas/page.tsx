import { Fragment } from "react";
import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";
import RegistrarPagoModalButton from "@/app/components/RegistrarPagoModalButton";
import AnularPagoManualButton from "@/app/components/AnularPagoManualButton";

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

const { data: resumenCuotas } =
  idsCuotas.length > 0
    ? await (supabase as any)
        .from("VISTA_CUOTAS_RESUMEN")
        .select("*")
        .in("IDCuotaSocio", idsCuotas)
    : { data: [] };

const resumenCuotasAny = (resumenCuotas as any[]) || [];

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

    const { data: aplicacionesRemesa } =
  idsPlazos.length > 0
    ? await (supabase as any)
        .from("REMESAS_APLICACIONES")
        .select("*")
        .in("IDPlazo", idsPlazos)
    : { data: [] };

const aplicacionesRemesaAny = (aplicacionesRemesa as any[]) || [];

const { data: gastosDevolucion } = await (supabase as any)
  .from("PAGOS_MANUALES")
  .select("*")
  .eq("NUMCENS", Number(numcens))
  .ilike("Observaciones", "%GASTOS DEVOLUCION%")
  .order("FechaPago", { ascending: true });

const gastosDevolucionAny = (gastosDevolucion as any[]) || [];

  function plazosDeCuota(idCuotaSocio: number) {
    return (
      plazosAny.filter(
        (p) => Number(p.IDCuotaSocio) === Number(idCuotaSocio)
      ) || []
    );
  }

  const totalImporte =
  resumenCuotasAny.reduce(
    (acc, cuota) => acc + Number(cuota.ImporteCuota || 0),
    0
  ) || 0;

const totalPagado =
  resumenCuotasAny.reduce(
    (acc, cuota) => acc + Number(cuota.TotalPagado || 0),
    0
  ) || 0;

const totalPendiente =
  resumenCuotasAny.reduce(
    (acc, cuota) => acc + Number(cuota.Pendiente || 0),
    0
  ) || 0;

    function formatearFecha(fecha: string | null) {
      if (!fecha) return "-";
    
      const [year, month, day] = fecha.split("-");
      return `${day}-${month}-${year}`;
    }
    
    function movimientosDePlazo(idPlazo: number) {
      const movimientos: any[] = [];
    
      aplicacionesRemesaAny
        .filter((r) => Number(r.IDPlazo) === Number(idPlazo))
        .forEach((r) => {
          movimientos.push({
            fecha: r.FechaAplicacion,
            texto: `Remesa ${r.IDRemesa}`,
            importe: Number(r.ImporteAplicado || 0),
            tipo: "remesa",
          });
        });
    
      pagosManualesAny
        .filter((p) => Number(p.IDPlazo) === Number(idPlazo))
        .forEach((p) => {
          movimientos.push({
            fecha: p.PAGOS_MANUALES?.FechaPago,
            texto: "Pago manual",
            importe: Number(p.ImporteAplicado || 0),
            tipo: "manual",
            idPagoManual: p.PAGOS_MANUALES?.IDPagoManual,
          });
        });
    
      return movimientos;
    }

    const movimientosHistorial = [
      ...plazosAny.flatMap((plazo) => {
    const movimientos = movimientosDePlazo(plazo.IDPlazo);

    if (plazo.Estado === "Sin cobro") {
      movimientos.push({
        fecha: plazo.FechaVencimiento || plazo.FechaPago || null,
        texto: "Sin cobro",
        importe: 0,
      });
    }

    return movimientos;
  }),

  ...gastosDevolucionAny.map((gasto) => ({
    fecha: gasto.FechaPago,
    texto: "Gastos devolución",
    importe: -Number(gasto.Importe || 0),
    tipo: "gasto-devolucion",
  })),
]
  .sort((a, b) => {
    const fechaA = a.fecha || "";
    const fechaB = b.fecha || "";
    return fechaA.localeCompare(fechaB);
  });

const plazosPendientes = plazosAny.filter(
  (plazo) =>
    Number(plazo.Pendiente || 0) > 0 &&
    plazo.Estado !== "Pagado"
);

const totalCuotasPendientes = plazosPendientes.length;

const resumenPendientes = Object.values(
  plazosPendientes.reduce((acc: any, plazo: any) => {
    const importe = Number(plazo.Pendiente || 0).toFixed(2);

    if (!acc[importe]) {
      acc[importe] = {
        importe: Number(plazo.Pendiente || 0),
        cantidad: 0,
      };
    }

    acc[importe].cantidad += 1;

    return acc;
  }, {})
) as any[];

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
  <div className="flex items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">
        Cuotas del socio
      </h1>

      <p className="mt-2 text-sm text-zinc-600">
        {socioAny?.Apellidos}, {socioAny?.Nombre} · NUMCENS {numcens}
      </p>
    </div>

    {cuotasAny.length > 0 && totalPendiente > 0 && (
  <RegistrarPagoModalButton
  idCuotaSocio={Number(cuotasAny[0].IDCuotaSocio)}
  numcens={Number(numcens)}
  pendienteMaximo={totalPendiente}
/>
)}
  </div>
</div>
          </section>

          <section className="mb-8 border border-zinc-200 bg-white">
          <div className="grid grid-cols-2 lg:grid-cols-5">
          <Resumen
  label="Ejercicio"
  value={cuotasAny[0]?.Ejercicio || "-"}
/>
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
          <div className="mb-8 grid gap-4 lg:grid-cols-2">
          <section className="border border-zinc-200 bg-white">
  <div className="bg-zinc-100 px-4 py-3">
    <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
      Pagos realizados
    </h2>
    <p className="text-xs text-zinc-500">
      Remesas, pagos manuales e intentos sin cobro
    </p>
  </div>

  <div className="p-4">
    {movimientosHistorial.length === 0 ? (
      <p className="text-sm text-zinc-500">
        Todavía no hay movimientos registrados.
      </p>
    ) : (
      <div className="space-y-2">
        {movimientosHistorial.map((mov, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between border-b border-zinc-100 pb-2 text-sm"
          >
            <span>
              {formatearFecha(mov.fecha)} · {mov.texto}
            </span>

            <div className="flex items-center">
  <span
    className={
      mov.texto === "Sin cobro"
  ? "font-medium text-orange-700"
  : mov.tipo === "gasto-devolucion"
  ? "font-medium text-red-700"
  : "font-medium text-green-700"
    }
  >
    {mov.texto === "Sin cobro"
  ? "Sin cobro"
  : `${Number(mov.importe || 0).toFixed(2)} €`}
  </span>

  {mov.tipo === "manual" && mov.idPagoManual && (
    <AnularPagoManualButton
      idPagoManual={Number(mov.idPagoManual)}
    />
  )}
</div>
          </div>
        ))}
      </div>
    )}
  </div>
</section>

<section className="border border-zinc-200 bg-white">
  <div className="bg-zinc-100 px-4 py-3">
    <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
      Cuotas pendientes recalculadas
    </h2>
    <p className="text-xs text-zinc-500">
      Resumen actual según pagos realizados y cuotas pendientes
    </p>
  </div>

  <div className="p-4">
    {totalCuotasPendientes === 0 ? (
      <p className="text-sm font-medium text-green-700">
        No quedan cuotas pendientes.
      </p>
    ) : (
      <div className="space-y-2 text-sm">
        {resumenPendientes.map((grupo) => (
          <p key={grupo.importe}>
            {grupo.cantidad} cuota
            {grupo.cantidad === 1 ? "" : "s"} pendiente
            {grupo.cantidad === 1 ? "" : "s"} de{" "}
            <span className="font-medium">
              {Number(grupo.importe || 0).toFixed(2)} €
            </span>
          </p>
        ))}
      </div>
    )}
  </div>
</section>
</div>

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
  const color =
    estado === "Pagada" || estado === "Pagado"
      ? "bg-green-500"
      : estado === "Parcial" || estado === "En remesa"
      ? "bg-yellow-500"
      : estado === "Devuelto"
      ? "bg-red-500"
      : "bg-zinc-300";

  return (
    <div
      className="flex items-center justify-center"
      title={estado || "Sin estado"}
    >
      <span className={`h-5 w-5 rounded-full ${color}`} />
    </div>
  );
}