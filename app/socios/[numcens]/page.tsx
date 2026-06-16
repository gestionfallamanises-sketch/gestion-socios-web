import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";
import { supabase } from "@/lib/supabaseClient";
import GenerarCuotasButton from "@/app/components/GenerarCuotasButton";

export default async function SocioPage({
  params,
  searchParams,
}: {
  params: Promise<{ numcens: string }>;
  searchParams: Promise<{ fromFamilia?: string }>;
}) {
  const { numcens } = await params;
  const { fromFamilia } = await searchParams;

  const { data: socio, error } = await supabase
  .from("SOCIOS_ANTIGUEDAD_CALCULADA")
    .select("*")
    .eq("NUMCENS", Number(numcens))
    .single();

  if (error || !socio) {
    return (
      <div className="flex min-h-screen bg-zinc-100">
        <Sidebar />
        <main className="flex-1 p-10">
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <Link href="/" className="mb-6 inline-block text-red-900">
              ← Volver al listado
            </Link>
            <h1 className="text-2xl font-bold">Socio no encontrado</h1>
          </div>
        </main>
      </div>
    );
  }

  const socioAny = socio as any;

  const { data: familia } = await supabase
    .from("FAMILIAS")
    .select("*")
    .eq("ID_Familia", (socio as any).ID_Familia)
    .maybeSingle();

    const familiaAny = familia as any;

  const { data: miembrosFamilia } = await supabase
    .from("SOCIOS")
    .select("*")
    .eq("ID_Familia", (socio as any).ID_Familia)
    .order("Apellidos", { ascending: true });

    const miembrosFamiliaAny = (miembrosFamilia as any[]) || [];
    const numsFamilia = miembrosFamiliaAny.map((m) => m.NUMCENS);

  const { data: cuotasFamilia } =
    numsFamilia.length > 0
      ? await supabase
      .from("VISTA_CUOTAS_RESUMEN")
          .select("*")
          .in("NUMCENS", numsFamilia)
          .order("Ejercicio", { ascending: false })
      : { data: [] };

      const cuotasFamiliaAny = (cuotasFamilia as any[]) || [];

  const { data: cuotaActual } = await supabase
  .from("VISTA_CUOTAS_RESUMEN")
    .select("*")
    .eq("NUMCENS", (socio as any).NUMCENS)
    .order("Ejercicio", { ascending: false })
    .limit(1)
    .maybeSingle();

    const { data: resumenCuotaActual } = (cuotaActual as any)?.IDCuotaSocio
  ? await (supabase as any)
      .from("VISTA_CUOTAS_RESUMEN")
      .select("*")
      .eq("IDCuotaSocio", (cuotaActual as any)?.IDCuotaSocio)
      .maybeSingle()
  : { data: null };

const resumenCuotaActualAny = resumenCuotaActual as any;

const totalPagadoReal = Number(resumenCuotaActualAny?.TotalPagado || 0);
const totalPendienteReal = Number(resumenCuotaActualAny?.Pendiente || 0);

  const { data: datosBanco } = await supabase
    .from("DATOS_BANCARIOS")
    .select("*")
    .eq("NUMCENS", (socio as any).NUMCENS)
    .maybeSingle();

    const datosBancoAny = datosBanco as any;

    const { data: formaPago } = await supabase
  .from("FORMAS_PAGO_SOCIOS")
  .select("*")
  .eq("NUMCENS", (socio as any).NUMCENS)
  .eq("Activo", true)
  .maybeSingle();

  const formaPagoAny = formaPago as any;

  const { data: pagadoresExtra } = await supabase
  .from("PAGADORES_EXTRA_CUOTA")
  .select("*")
  .eq("NUMCENS", (socio as any).NUMCENS)
  .eq("Activo", true)
  .order("ID", { ascending: true });

const pagadoresExtraAny = (pagadoresExtra as any[]) || [];

const { data: socioPagador } =
  formaPagoAny?.NUMCENS_Pagador
    ? await supabase
        .from("SOCIOS")
        .select("NUMCENS, Nombre, Apellidos")
        .eq("NUMCENS", formaPagoAny.NUMCENS_Pagador)
        .maybeSingle()
    : { data: null };

const textoPagador =
  pagadoresExtraAny.length > 0
    ? pagadoresExtraAny
        .map(
          (p) =>
            `${Number(p.Porcentaje || 0)}% ${p.TitularCuenta || "-"}`
        )
        .join(" · ")
    : !formaPagoAny?.NUMCENS_Pagador ||
      Number(formaPagoAny.NUMCENS_Pagador) === Number((socio as any).NUMCENS)
    ? "Mismo socio"
    : `${socioPagador?.NUMCENS || ""} · ${
        socioPagador?.Apellidos || ""
      }, ${socioPagador?.Nombre || ""}`;

  function cuotaMiembro(numcensMiembro: number) {
    return (cuotasFamilia as any[])?.find(
      (c) =>
        Number(c.NUMCENS) === Number(numcensMiembro) &&
        Number(c.Ejercicio) === Number((cuotaActual as any)?.Ejercicio)
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <Link href={fromFamilia ? `/familias/${fromFamilia}` : "/"} className="mb-6 inline-block text-sm font-medium text-red-900 hover:text-red-950"
            >
            {fromFamilia ? "← Volver a familia" : "← Volver al listado"}
          </Link>

          <section className="mb-8 border border-zinc-200 bg-white shadow-sm">
  <div className="border-l-4 border-red-900 px-6 py-5">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          {socioAny.Apellidos}, {socioAny.Nombre}
        </h1>

        <p className="mt-2 text-sm text-zinc-600">
  NUMCENS {socioAny.NUMCENS}
  {" · "}
  {socioAny.CARREG || "Sin cargo"}
  {" · Antigüedad: "}
  {socioAny.Antiguedad_Calculada || "-"}
</p>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={
            socioAny.Estado === "Activo"
              ? "bg-green-100 px-4 py-2 text-sm font-semibold text-green-700"
              : "bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700"
          }
        >
          {socioAny.Estado || "Sin estado"}
        </span>

        {socioAny.Estado === "Activo" ? (
  <Link
    href={"/socios/" + socioAny.NUMCENS + "/baja"}
    className="bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
  >
    Dar de baja
  </Link>
) : (
  <Link
    href={"/socios/" + socioAny.NUMCENS + "/alta"}
    className="bg-green-100 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-200"
  >
    Dar de alta
  </Link>
)}
      </div>
    </div>
  </div>
</section>

<section className="mb-8 border border-zinc-200 bg-white">
  <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
        Datos personales
      </h2>

      <p className="text-xs text-zinc-500">
        Información principal del socio
      </p>
    </div>

    {socioAny.Estado?.toLowerCase() !== "baja" ? (
      <Link
        href={"/socios/" + socioAny.NUMCENS + "/editar"}
        className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
      >
        Editar
      </Link>
    ) : (
      <div className="cursor-not-allowed bg-zinc-400 px-4 py-2 text-sm font-medium text-white">
        Socio dado de baja
      </div>
    )}
  </div>

  <div className="grid grid-cols-2 lg:grid-cols-6">
  <Bloque
  label="Fecha nacimiento"
  value={
    socioAny["FECHA de NACIMIENTO"]
      ? new Date(socioAny["FECHA de NACIMIENTO"])
          .toLocaleDateString("es-ES")
      : "-"
  }
/>
<Bloque label="Teléfono 1" value={socioAny["Teléfono 1"]} />

<Bloque label="Teléfono 2" value={socioAny["Teléfono 2"]} />
    <Bloque label="NIF" value={socioAny.NIF} />
    <Bloque label="Código postal" value={socioAny["Código Postal"]} />
    <Bloque label="Ciudad" value={socioAny.Ciudad} />
  </div>
  <div className="border-t border-zinc-200">
  <Bloque
    label="Dirección"
    value={socioAny.Dirección}
  />
</div>
</section>

<section className="mb-8 border border-zinc-200 bg-white">
  <div className="bg-zinc-100 px-4 py-3">
    <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
      Configuración socio
    </h2>
  </div>

  <div className="grid grid-cols-2   lg:grid-cols-9">
    <Bloque label="Comisión" value={socioAny.Comision} />
    <Bloque label="Sexo" value={socioAny.SEXE} />
    <Bloque label="Banda" value={socioAny.EsBanda ? "Sí" : "No"} />
    <Bloque label="Cargo" value={socioAny.CARREG} />
    <Bloque label="Lotería" value={socioAny.ConLoteria ? "Sí" : "No"} />
    <Bloque label="Falla" value={socioAny.PapeletasFalla || 0} />
    <Bloque label="Virgen" value={socioAny.PapeletasVirgen || 0} />
    <Bloque label="Navidad" value={socioAny.PapeletasNavidad || 0} />
    <Bloque label="Niño" value={socioAny.PapeletasNino || 0} />
  </div>
</section>

<section className="mb-8 border border-zinc-200 bg-white">
  <div className="bg-zinc-100 px-4 py-3">
    <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
      Datos de pago
    </h2>

    <p className="text-xs text-zinc-500">
      Banco, forma de pago y cuota actual
    </p>
  </div>

  <div className="grid grid-cols-2 lg:grid-cols-5">
  <Bloque
    label="Cuota actual"
    value={
      (cuotaActual as any)?.Importe
        ? Number((cuotaActual as any).Importe).toFixed(2) + " €"
        : "-"
    }
  />

  <Bloque
    label="Tipo cuota"
    value={
      (cuotaActual as any)?.Descripcion ||
      (cuotaActual as any)?.TipoCuota ||
      (cuotaActual as any)?.IDCuota
    }
  />

  <Bloque
    label="IBAN"
    value={datosBancoAny?.IBAN}
  />

  <Bloque
    label="Forma pago"
    value={formaPagoAny?.Metodo || "-"}
  />

  <Bloque
    label="Nº plazos"
    value={formaPagoAny?.NumeroPlazos || "-"}
  />
</div>

<div className="border-t border-zinc-200">
  <Bloque
    label="Pagador"
    value={textoPagador}
  />
</div>
</section>
          <section className="mb-10 border border-zinc-200 bg-white">
          <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
  <div>
    <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
      Familia
    </h2>

    <p className="text-xs text-zinc-500">
      Miembros familiares y cuotas relacionadas
    </p>
  </div>

  {familia && (
  <Link
    href={"/familias/" + familiaAny.ID_Familia}
    className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
  >
    {familiaAny.Nombre_Familia || "Familia " + familiaAny.ID_Familia}
  </Link>
)}
</div>

<div className="overflow-hidden border-t border-zinc-200">
              {familia ? (
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
                    <tr>
                      <th className="px-4 py-3">Socio</th>
                      <th className="px-4 py-3">Comisión</th>
                      <th className="px-4 py-3">Lotería</th>
                      <th className="px-4 py-3">Tipo cuota</th>
                      <th className="px-4 py-3 text-right">Importe</th>
                      <th className="px-4 py-3">Estado</th>
                    </tr>
                  </thead>

                  <tbody>
                  {miembrosFamiliaAny.map((miembro) => {
                      const cuota = cuotaMiembro(miembro.NUMCENS);

                      return (
                        <tr
  key={miembro.NUMCENS}
  className={
    "border-t border-zinc-200 " +
    (Number(miembro.NUMCENS) === Number(socioAny.NUMCENS)
      ? "bg-red-50"
      : "bg-white")
  }
>
                          <td className="px-4 py-3">
                            <Link
                              href={"/socios/" + miembro.NUMCENS}
                              className="font-medium hover:underline"
                            >
                              {miembro.Apellidos}, {miembro.Nombre}
                            </Link>

                            <p className="text-xs text-zinc-500">
                              NUMCENS {miembro.NUMCENS}
                            </p>
                          </td>

                          <td className="px-4 py-3">
                            {miembro.Comision || "-"}
                          </td>

                          <td className="px-4 py-3">
  {miembro.ConLoteria === true ||
  miembro.ConLoteria === "true" ||
  miembro.ConLoteria === "Sí" ||
  miembro.ConLoteria === "SI" ||
  miembro.ConLoteria === "Si"
    ? "Sí"
    : "No"}
</td>

<td className="px-4 py-3">
  {
    cuota?.Descripcion ||
    cuota?.TipoCuota ||
    cuota?.IDCuota ||
    "-"
  }
</td>

                          <td className="px-4 py-3 text-right">
                            {cuota?.Importe
                              ? Number(cuota.Importe).toFixed(2) + " €"
                              : "-"}
                          </td>

                          <td className="px-4 py-3">
                            {cuota?.EstadoPago || miembro.Estado || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-zinc-500">
                  No pertenece a ninguna familia.
                </div>
              )}
            </div>
          </section>

          <section
  className={`mb-10 border border-zinc-200 bg-white ${
    socioAny.Estado?.toLowerCase() === "baja" ? "opacity-60 grayscale" : ""
  }`}
>
  <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
    <div>
  <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
    Gestión económica
  </h2>

  <p className="text-xs text-zinc-500">
    Cuotas, pagos y estado económico actual
  </p>
</div>

<div className="flex items-center gap-3">
{socioAny.Estado?.toLowerCase() !== "baja" && (
  <GenerarCuotasButton
    ejercicio={(cuotaActual as any)?.Ejercicio || 2027}
  />
)}

  <Link
    href={"/socios/" + socioAny.NUMCENS + "/cuotas"}
    className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
  >
    Ver cuotas y pagos
  </Link>
</div>
  </div>

  <div className="grid grid-cols-2 lg:grid-cols-5">
    <div className="border-r border-b border-zinc-200">
      <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
        Ejercicio
      </div>
      <div className="bg-white px-4 py-3 text-sm">
      {(cuotaActual as any)?.Ejercicio || "-"}
      </div>
    </div>

    <div className="border-r border-b border-zinc-200">
      <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
        Importe
      </div>
      <div className="bg-white px-4 py-3 text-sm">
      {Number((cuotaActual as any)?.Importe || 0).toFixed(2)} €
      </div>
    </div>

    <div className="border-r border-b border-zinc-200">
      <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
        Pagado
      </div>
      <div className="bg-white px-4 py-3 text-sm text-green-700">
      {totalPagadoReal.toFixed(2)} €
      </div>
    </div>

    <div className="border-b border-zinc-200">
      <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
        Pendiente
      </div>
      <div className="bg-white px-4 py-3 text-sm text-red-700">
      {totalPendienteReal.toFixed(2)} €
      </div>
    </div>
  </div>
</section>

<section className="mb-10 border border-zinc-200 bg-white">
  <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
        Historial
      </h2>

      <p className="text-xs text-zinc-500">
        Antigüedad y movimientos del socio
      </p>
    </div>

    <Link
      href={"/socios/" + socioAny.NUMCENS + "/historial"}
      className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
    >
      Ver historial completo
    </Link>
  </div>

  <div className="grid grid-cols-2 text-sm lg:grid-cols-4">
  <div>
  <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
    Antigüedad actual
  </div>
  <div className="bg-white px-4 py-3">
    {socioAny.Antiguedad_Calculada || "-"}
  </div>
</div>

<div>
  <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
    Primer ejercicio
  </div>
  <div className="bg-white px-4 py-3">
    {socioAny.FechaPrimerAlta
      ? new Date(socioAny.FechaPrimerAlta).getFullYear() + 1
      : "-"}
  </div>
</div>

<div>
  <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
    Estado actual
  </div>
      <div className="bg-white px-4 py-3">{socioAny.Estado || "-"}</div>
    </div>
  </div>
</section>

        </div>
      </main>
    </div>
  );
}

function Campo({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-zinc-500">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );
}

function Bloque({ label, value }: { label: string; value: any }) {
  return (
    <div className="border-r border-b border-zinc-200">
      <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
        {label}
      </div>

      <div className="bg-white px-4 py-3 text-sm">
        {value || "-"}
      </div>
    </div>
  );
}