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
        const cuota = cuotasAny.find(
          (c) => Number(c.IDCuotaSocio) === Number(idCuotaSocio)
        );
      
        return cuota
      ? `${cuota.Apellidos}, ${cuota.Nombre}`
      : "-";
  }

  const familiaAny = familia as any;
  const pagosAny = (pagos as any[]) || [];

  function formatearFecha(fecha: string | null) {
    if (!fecha) return "-";
  
    const [year, month, day] = fecha.split("-");
    return `${day}-${month}-${year}`;
  }
  
  function movimientosDePlazo(idPlazo: number) {
    const movimientos: any[] = [];
  
    pagosAny
      .filter((p) => Number(p.IDPlazo) === Number(idPlazo))
      .forEach((p) => {
        movimientos.push({
          fecha: p.PAGOS_MANUALES?.FechaPago,
          texto: "Pago manual familiar",
          importe: Number(p.ImporteAplicado || 0),
        });
      });
  
    return movimientos;
  }
  
  const movimientosFamilia = plazosAny
    .flatMap((plazo) => {
      const movimientos = movimientosDePlazo(plazo.IDPlazo);
  
      if (plazo.Estado === "Sin cobro") {
        movimientos.push({
          fecha: plazo.FechaVencimiento || plazo.FechaPago || null,
          texto: `${socioDeCuota(plazo.IDCuotaSocio)} · Sin cobro`,
          importe: 0,
        });
      }
  
      return movimientos.map((mov) => ({
        ...mov,
        socio: socioDeCuota(plazo.IDCuotaSocio),
      }));
    })
    .sort((a, b) => {
      const fechaA = a.fecha || "";
      const fechaB = b.fecha || "";
      return fechaA.localeCompare(fechaB);
    });
  
  const pendientesPorSocio = cuotasAny
    .map((cuota) => {
      const plazosCuota = plazosAny.filter(
        (p) => Number(p.IDCuotaSocio) === Number(cuota.IDCuotaSocio)
      );
  
      const pendientes = plazosCuota.filter(
        (p) =>
          Number(p.Pendiente || 0) > 0 &&
          p.Estado !== "Pagado"
      );
  
      const grupos = Object.values(
        pendientes.reduce((acc: any, plazo: any) => {
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
  
      return {
        socio: `${cuota.Apellidos}, ${cuota.Nombre}`,
        grupos,
        totalPendiente: pendientes.reduce(
          (acc, p) => acc + Number(p.Pendiente || 0),
          0
        ),
      };
    })
    .filter((item) => item.totalPendiente > 0);

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
                {familiaAny?.Nombre_Familia || "Familia"} · {miembrosAny.length || 0} miembros
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

          <div className="mb-8 grid gap-4 lg:grid-cols-2">
  <section className="border border-zinc-200 bg-white">
    <div className="bg-zinc-100 px-4 py-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
        Pagos realizados
      </h2>
      <p className="text-xs text-zinc-500">
        Pagos manuales familiares e intentos sin cobro
      </p>
    </div>

    <div className="p-4">
      {movimientosFamilia.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Todavía no hay movimientos registrados.
        </p>
      ) : (
        <div className="space-y-2">
          {movimientosFamilia.map((mov, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between border-b border-zinc-100 pb-2 text-sm"
            >
              <span>
                {formatearFecha(mov.fecha)} · {mov.socio} · {mov.texto}
              </span>

              <span
                className={
                  mov.texto.includes("Sin cobro")
                    ? "font-medium text-orange-700"
                    : "font-medium text-green-700"
                }
              >
                {mov.texto.includes("Sin cobro")
                  ? "Sin cobro"
                  : `${Number(mov.importe || 0).toFixed(2)} €`}
              </span>
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
        Resumen pendiente por miembro de la familia
      </p>
    </div>

    <div className="p-4">
      {pendientesPorSocio.length === 0 ? (
        <p className="text-sm font-medium text-green-700">
          No quedan cuotas pendientes.
        </p>
      ) : (
        <div className="space-y-4 text-sm">
          {pendientesPorSocio.map((item) => (
            <div
              key={item.socio}
              className="border-b border-zinc-100 pb-3 last:border-b-0"
            >
              <p className="mb-1 font-medium text-zinc-900">
                {item.socio}
              </p>

              {item.grupos.map((grupo: any) => (
                <p key={grupo.importe} className="text-zinc-700">
                  {grupo.cantidad} cuota
                  {grupo.cantidad === 1 ? "" : "s"} pendiente
                  {grupo.cantidad === 1 ? "" : "s"} de{" "}
                  <span className="font-medium">
                    {Number(grupo.importe || 0).toFixed(2)} €
                  </span>
                </p>
              ))}
            </div>
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