import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";
import PrintButton from "@/app/components/PrintButton";
import ExportarExcelFamiliaButton from "@/app/components/ExportarExcelFamiliaButton";

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

  // Forma de pago vigente: para Efectivo no se usa el importe de
  // CUOTAS_PLAZOS como saldo, sino el resumen contable real.
  const { data: formasPago } = numsFamilia.length > 0
    ? await supabase
        .from("FORMAS_PAGO_SOCIOS")
        .select("NUMCENS, Metodo")
        .in("NUMCENS", numsFamilia)
        .eq("Activo", true)
    : { data: [] };

  const metodosPorSocio = new Map<number, string>(
    ((formasPago as any[]) || []).map((f) => [
      Number(f.NUMCENS),
      String(f.Metodo || "").trim().toLowerCase(),
    ])
  );

  const { data: ejercicioActivo } = await supabase
    .from("EJERCICIOS")
    .select("Ejercicio")
    .eq("Activo", true)
    .maybeSingle();
  const ejercicioVigente = Number((ejercicioActivo as any)?.Ejercicio || 2027);

  const { data: cuotas } =
    numsFamilia.length > 0
      ? await supabase
      .from("VISTA_CUOTAS_RESUMEN")
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

      const { data: aplicacionesRemesa } =
  idsPlazos.length > 0
    ? await (supabase as any)
        .from("REMESAS_APLICACIONES")
        .select("*")
        .in("IDPlazo", idsPlazos)
    : { data: [] };


  // Consultar TODAS las líneas de remesa de los plazos de la familia.
  // Algunas devoluciones agrupadas se reflejan en CUOTAS_PLAZOS
  // aunque no figure Devuelto=true en cada línea de REMESAS_DETALLE.
  const { data: detallesRemesa, error: errorDetalles } =
    idsPlazos.length > 0
      ? await (supabase as any)
          .from("REMESAS_DETALLE")
          .select("IDDetalleRemesa, IDPlazo, IDRemesa, Importe, Estado, Devuelto, IBAN, TitularCuenta")
          .in("IDPlazo", idsPlazos)
      : { data: [], error: null };

  if (errorDetalles) {
    console.error("Error consultando el historial de remesas:", errorDetalles.message);
  }

  const detallesRemesaAny = (detallesRemesa as any[]) || [];
  const idsRemesasHistorial = [...new Set(
    detallesRemesaAny
      .map((r) => Number(r.IDRemesa))
      .filter((n) => Number.isSafeInteger(n) && n > 0)
  )];

  const { data: remesasHistorial } = idsRemesasHistorial.length > 0
    ? await (supabase as any)
        .from("REMESAS")
        .select("IDRemesa, FechaVencimiento, FechaRemesa")
        .in("IDRemesa", idsRemesasHistorial)
    : { data: [] };

  const remesasHistorialAny = (remesasHistorial as any[]) || [];

  function lineaDevuelta(detalle: any, plazo: any): boolean {
    const devueltaEnDetalle = detalle.Devuelto === true ||
      String(detalle.Estado || "").trim().toLowerCase() === "devuelto";
    if (devueltaEnDetalle) return true;

    // Cuando el plazo figura devuelto, se muestra su línea aunque
    // el detalle del recibo agrupado no esté marcado individualmente.
    if (String(plazo?.Estado || "").trim().toLowerCase() === "devuelto") {
      return true;
    }

    // La devolución del recibo agrupado afecta a las líneas del MISMO
    // recibo (remesa + IBAN + titular). No afecta a otras cuentas.
    return detallesRemesaAny.some((otra) =>
      Number(otra.IDRemesa) === Number(detalle.IDRemesa) &&
      String(otra.IBAN || "") === String(detalle.IBAN || "") &&
      String(otra.TitularCuenta || "") === String(detalle.TitularCuenta || "") &&
      (otra.Devuelto === true ||
       String(otra.Estado || "").trim().toLowerCase() === "devuelto")
    );
  }

      const idsCuotasFamilia = cuotasAny.map((c) => c.IDCuotaSocio);

const { data: resumenCuotasFamilia } =
  idsCuotasFamilia.length > 0
    ? await (supabase as any)
        .from("VISTA_CUOTAS_RESUMEN")
        .select("*")
        .in("IDCuotaSocio", idsCuotasFamilia)
    : { data: [] };

const resumenCuotasFamiliaAny = (resumenCuotasFamilia as any[]) || [];

const totalCuotas =
  resumenCuotasFamiliaAny.reduce(
    (t, c) => t + Number(c.ImporteCuota || 0),
    0
  ) || 0;

const totalPagado =
  resumenCuotasFamiliaAny.reduce(
    (t, c) => t + Number(c.TotalPagado || 0),
    0
  ) || 0;

const totalPendiente =
  resumenCuotasFamiliaAny.reduce(
    (t, c) => t + Number(c.Pendiente || 0),
    0
  ) || 0;

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
const aplicacionesRemesaAny = (aplicacionesRemesa as any[]) || [];

  function formatearFecha(fecha: string | null) {
    if (!fecha) return "-";
  
    const [year, month, day] = fecha.split("-");
    return `${day}-${month}-${year}`;
  }
  
  const plazosFamiliaAnyPorId = new Map<number, any>(
    plazosAny.map((p) => [Number(p.IDPlazo), p])
  );

  function movimientosDePlazo(idPlazo: number) {
    const movimientos: any[] = [];
  
    aplicacionesRemesaAny
      .filter((r) => Number(r.IDPlazo) === Number(idPlazo))
      // REMESAS_APLICACIONES conserva aplicaciones históricas incluso
      // cuando el recibo fue posteriormente devuelto. En ese caso,
      // no se trata de un cobro vigente y no debe aparecer en verde.
      .filter((r) => {
        const detallesDelRecibo = detallesRemesaAny.filter(
          (rd) =>
            Number(rd.IDPlazo) === Number(idPlazo) &&
            Number(rd.IDRemesa) === Number(r.IDRemesa)
        );
        const plazo = plazosFamiliaAnyPorId.get(Number(idPlazo));
        return !detallesDelRecibo.some((rd) => lineaDevuelta(rd, plazo));
      })
      .forEach((r) => {
        movimientos.push({
          fecha: remesasHistorialAny.find((remesa) => Number(remesa.IDRemesa) === Number(r.IDRemesa))?.FechaVencimiento || r.FechaAplicacion,
          texto: `Remesa ${r.IDRemesa}`,
          importe: Number(r.ImporteAplicado || 0),
          tipo: "remesa",
        });
      });
  
    pagosAny
      .filter((p) => Number(p.IDPlazo) === Number(idPlazo))
      .forEach((p) => {
        movimientos.push({
          fecha: p.PAGOS_MANUALES?.FechaPago,
          texto: "Efectivo",
          importe: Number(p.ImporteAplicado || 0),
          tipo: "manual",
        });
      });
  
    // Una línea histórica por socio/plazo y remesa; importe individual.
    const plazoActual = plazosFamiliaAnyPorId.get(Number(idPlazo));
    const vistos = new Set<string>();
    detallesRemesaAny
      .filter((rd) => Number(rd.IDPlazo) === Number(idPlazo))
      .filter((rd) => lineaDevuelta(rd, plazoActual))
      .forEach((rd) => {
        const clave = `${rd.IDRemesa}-${rd.IDPlazo}`;
        if (vistos.has(clave)) return;
        vistos.add(clave);

        const remesa = remesasHistorialAny.find(
          (r) => Number(r.IDRemesa) === Number(rd.IDRemesa)
        );
        movimientos.push({
          fecha: remesa?.FechaVencimiento || remesa?.FechaRemesa || null,
          texto: `Remesa ${rd.IDRemesa} · Devuelto`,
          importe: Number(rd.Importe || 0),
          tipo: "devuelto",
        });
      });

    // Si el plazo está devuelto pero no hay detalle de remesa
    // accesible, mostrar el estado sin inventar un importe histórico.
    if (
      String(plazoActual?.Estado || "").trim().toLowerCase() === "devuelto" &&
      !movimientos.some((m) => m.tipo === "devuelto")
    ) {
      movimientos.push({
        fecha: plazoActual?.FechaVencimiento || plazoActual?.FechaPago || null,
        texto: "Plazo devuelto (sin detalle de remesa accesible)",
        importe: null,
        tipo: "devuelto",
      });
    }

    return movimientos;
  }
  
  // Agrupar los movimientos por cuota y socio, sin mezclar ejercicios.
  const movimientosFamilia = plazosAny
    .flatMap((plazo) => {
      const movimientos = movimientosDePlazo(plazo.IDPlazo);
      if (plazo.Estado === "Sin cobro") {
        movimientos.push({
          fecha: plazo.FechaVencimiento || plazo.FechaPago || null,
          texto: "Sin cobro",
          importe: 0,
          tipo: "sin-cobro",
        });
      }
      return movimientos.map((mov) => ({
        ...mov,
        idCuotaSocio: Number(plazo.IDCuotaSocio),
      }));
    })
    .sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")));

  const bloquesSocios = cuotasAny.map((cuota) => {
    const idCuotaSocio = Number(cuota.IDCuotaSocio);
    const resumen = resumenCuotasFamiliaAny.find(
      (r) => Number(r.IDCuotaSocio) === idCuotaSocio
    ) || cuota;
    const pendienteReal = Number(resumen.Pendiente || 0);
    const importeCuota = Number(resumen.ImporteCuota || 0);
    const pagadoReal = Number(resumen.TotalPagado || 0);
    const esEfectivo = Number(cuota.Ejercicio) === ejercicioVigente &&
      metodosPorSocio.get(Number(cuota.NUMCENS)) === "efectivo";
    const movimientos = movimientosFamilia.filter(
      (mov) => mov.idCuotaSocio === idCuotaSocio
    );
    const plazosCuota = plazosAny.filter(
      (p) => Number(p.IDCuotaSocio) === idCuotaSocio
    );
    const pendientes = plazosCuota.filter(
      (p) => Number(p.Pendiente || 0) > 0 && p.Estado !== "Pagado"
    );
    const grupos = Object.values(
      pendientes.reduce((acc: Record<string, { importe: number; cantidad: number }>, plazo: any) => {
        const importe = Number(plazo.Pendiente || 0);
        const clave = importe.toFixed(2);
        if (!acc[clave]) acc[clave] = { importe, cantidad: 0 };
        acc[clave].cantidad += 1;
        return acc;
      }, {})
    );
    return {
      idCuotaSocio,
      numcens: Number(cuota.NUMCENS),
      nombre: `${cuota.Apellidos || ""}, ${cuota.Nombre || ""}`,
      ejercicio: cuota.Ejercicio,
      importeCuota,
      pagadoReal,
      pendienteReal,
      esEfectivo,
      movimientos,
      grupos,
    };
  });

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
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          Cuotas y pagos familiares
        </h1>

        <p className="mt-2 text-sm text-zinc-600">
          {familiaAny?.Nombre_Familia || "Familia"} · {miembrosAny.length || 0} miembros
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <ExportarExcelFamiliaButton
          nombreFamilia={String(familiaAny?.Nombre_Familia || `Familia_${id}`)}
          bloques={bloquesSocios.map((bloque) => ({
            numcens: bloque.numcens,
            nombre: bloque.nombre,
            ejercicio: String(bloque.ejercicio),
            metodo: Number(bloque.ejercicio) === ejercicioVigente
              ? (bloque.esEfectivo ? "Efectivo" : "Banco")
              : "",
            cuota: bloque.importeCuota,
            pagado: bloque.pagadoReal,
            pendiente: bloque.pendienteReal,
            movimientos: bloque.movimientos.map((mov) => ({
              fecha: mov.fecha || "",
              tipo: mov.tipo === "manual" ? "Efectivo" : mov.tipo === "sin-cobro" ? "Intento" : "Remesa",
              referencia: mov.tipo === "manual" ? "Entrega a cuenta" : String(mov.texto || ""),
              importe: mov.importe == null ? null : Number(mov.importe),
              estado: mov.tipo === "devuelto" ? "Devuelto" : mov.tipo === "sin-cobro" ? "Sin cobro" : "Cobrado",
            })),
          }))}
        />
        <PrintButton />
      </div>
    </div>
  </div>
</section>

          <section className="mb-8 border border-zinc-200 bg-white">
            <div className="grid grid-cols-1 text-sm md:grid-cols-3">
              <Bloque label="Total cuotas" value={`${totalCuotas.toFixed(2)} €`} />
              <Bloque label="Total pagado" value={`${totalPagado.toFixed(2)} €`} />
              <Bloque label="Total pendiente" value={`${totalPendiente.toFixed(2)} €`} />
            </div>
          </section>

          <div className="space-y-3 pb-8">
            {bloquesSocios.map((bloque) => (
              <section key={bloque.idCuotaSocio} className="border border-zinc-200 bg-white">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-zinc-200 bg-zinc-100 px-3 py-2 text-xs">
                  <Link href={`/socios/${bloque.numcens}/cuotas`} className="font-bold text-red-900 hover:underline">
                    {bloque.nombre} · Nº {bloque.numcens}
                  </Link>
                  <span className="text-zinc-600">Ej. <strong>{bloque.ejercicio}</strong></span>
                  <span className="text-zinc-700">Cuota: <strong>{bloque.importeCuota.toFixed(2)} €</strong></span>
                  <span className="text-green-700">Pagado: <strong>{bloque.pagadoReal.toFixed(2)} €</strong></span>
                  <span className="text-red-700">Pendiente: <strong>{bloque.pendienteReal.toFixed(2)} €</strong></span>
                  {Number(bloque.ejercicio) === ejercicioVigente && (
                    <span className="text-zinc-500">{bloque.esEfectivo ? "Efectivo" : "Banco"}</span>
                  )}
                </div>

                <div className="grid lg:grid-cols-5">
                  <div className="min-w-0 lg:col-span-3 lg:border-r lg:border-zinc-200">
                    <div className="border-b border-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700">
                      Pagos y devoluciones
                    </div>
                    {bloque.movimientos.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-zinc-500">Sin movimientos registrados.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[460px] border-collapse text-xs">
                          <thead className="bg-zinc-50 text-left text-zinc-600">
                            <tr>
                              <th className="whitespace-nowrap px-2 py-1.5">Fecha</th>
                              <th className="px-2 py-1.5">Tipo</th>
                              <th className="px-2 py-1.5">Referencia</th>
                              <th className="whitespace-nowrap px-2 py-1.5 text-right">Importe</th>
                              <th className="px-2 py-1.5 text-center">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bloque.movimientos.map((mov, i) => {
                              const devuelto = mov.tipo === "devuelto";
                              const sinCobro = mov.tipo === "sin-cobro";
                              const tipo = devuelto || mov.tipo === "remesa" ? "Remesa" : mov.tipo === "manual" ? "Efectivo" : "Intento";
                              const referencia = mov.tipo === "manual" ? "Entrega a cuenta" : mov.texto;
                              const estado = devuelto ? "Devuelto" : sinCobro ? "Sin cobro" : "Cobrado";
                              const color = devuelto ? "text-red-700" : sinCobro ? "text-amber-700" : "text-green-700";
                              return (
                                <tr key={`${bloque.idCuotaSocio}-${i}`} className="border-t border-zinc-100 hover:bg-zinc-50">
                                  <td className="whitespace-nowrap px-2 py-1.5 text-zinc-700">{formatearFecha(mov.fecha)}</td>
                                  <td className="whitespace-nowrap px-2 py-1.5">{tipo}</td>
                                  <td className="px-2 py-1.5 text-zinc-700">{referencia}</td>
                                  <td className={`whitespace-nowrap px-2 py-1.5 text-right font-medium ${color}`}>
                                    {mov.importe == null ? "—" : `${Number(mov.importe).toFixed(2)} €`}
                                  </td>
                                  <td className={`whitespace-nowrap px-2 py-1.5 text-center font-medium ${color}`}>{estado}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 lg:col-span-2">
                    <div className="border-b border-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700">
                      Cuotas pendientes
                    </div>
                    <div className="space-y-1 px-3 py-2 text-xs">
                      {bloque.pendienteReal <= 0 ? (
                        <p className="font-medium text-green-700">Cuota completamente pagada.</p>
                      ) : (
                        <>
                          <p className="font-semibold text-red-700">
                            Pendiente real: {bloque.pendienteReal.toFixed(2)} €
                          </p>
                          {!bloque.esEfectivo && bloque.grupos.length > 0 && (
                            <>
                              {bloque.grupos.map((grupo) => (
                                <p key={grupo.importe} className="text-zinc-700">
                                  {grupo.cantidad} plazo{grupo.cantidad === 1 ? "" : "s"} de {grupo.importe.toFixed(2)} €
                                </p>
                              ))}
                              <p className="pt-1 text-[11px] text-zinc-500">
                                Desglose interno de plazos; el saldo válido es el pendiente real.
                              </p>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            ))}
            {bloquesSocios.length === 0 && (
              <p className="border border-zinc-200 bg-white p-4 text-sm text-zinc-500">No hay cuotas registradas.</p>
            )}
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