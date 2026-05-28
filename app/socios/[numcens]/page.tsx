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
          .from("vista_cuotas_socios")
          .select("*")
          .in("NUMCENS", numsFamilia)
          .order("Ejercicio", { ascending: false })
      : { data: [] };

      const cuotasFamiliaAny = (cuotasFamilia as any[]) || [];

  const { data: cuotaActual } = await supabase
    .from("vista_cuotas_socios")
    .select("*")
    .eq("NUMCENS", (socio as any).NUMCENS)
    .order("Ejercicio", { ascending: false })
    .limit(1)
    .maybeSingle();

    const { data: plazosCuotaActual } = (cuotaActual as any)?.IDCuotaSocio
  ? await supabase
      .from("CUOTAS_PLAZOS")
      .select("*")
      .eq("IDCuotaSocio", (cuotaActual as any)?.IDCuotaSocio)
  : { data: [] };

  const totalPagadoReal =
  (plazosCuotaActual as any[])?.reduce(
    (total, plazo) => total + Number(plazo.ImportePagado || 0),
    0
  ) || 0;

const totalPendienteReal =
  (plazosCuotaActual as any[])?.reduce(
    (total, plazo) => total + Number(plazo.Pendiente || 0),
    0
  ) || 0;

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
  <div className="bg-zinc-100 px-4 py-3">
    <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
      Configuración socio
    </h2>
  </div>

  <div className="grid grid-cols-2 lg:grid-cols-5">
    <div className="border-r border-b border-zinc-200">
      <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
        Comisión
      </div>

      <div className="bg-white px-4 py-3 text-sm">
        {socioAny.Comision || "-"}
      </div>
    </div>

    <div className="border-r border-b border-zinc-200">
      <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
        Sexo
      </div>

      <div className="bg-white px-4 py-3 text-sm">
        {socioAny.SEXE || "-"}
      </div>
    </div>

    <div className="border-r border-b border-zinc-200">
      <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
        Banda
      </div>

      <div className="bg-white px-4 py-3 text-sm">
        {socioAny.EsBanda ? "Sí" : "No"}
      </div>
    </div>

    <div className="border-b border-zinc-200">
      <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
        Cargo
      </div>

      <div className="bg-white px-4 py-3 text-sm">
        {socioAny.CARREG || "-"}
      </div>
    </div>
    
    <div className="border-r border-b border-zinc-200">
      <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
        Lotería
      </div>

      <div className="bg-white px-4 py-3 text-sm">
        {socioAny.ConLoteria ? "Sí" : "No"}
      </div>
    </div>

    <div className="border-r border-b border-zinc-200">
  <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
    Papeletas falla
  </div>

  <div className="bg-white px-4 py-3 text-sm">
    {socioAny.PapeletasFalla || 0}
  </div>
</div>

<div className="border-r border-b border-zinc-200">
  <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
    Virgen
  </div>

  <div className="bg-white px-4 py-3 text-sm">
    {socioAny.PapeletasVirgen || 0}
  </div>
</div>

<div className="border-r border-b border-zinc-200">
  <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
    Navidad
  </div>

  <div className="bg-white px-4 py-3 text-sm">
    {socioAny.PapeletasNavidad || 0}
  </div>
</div>

<div className="border-r border-b border-zinc-200">
  <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
    Niño
  </div>

  <div className="bg-white px-4 py-3 text-sm">
    {socioAny.PapeletasNino || 0}
  </div>
</div>
  </div>
</section>

          <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="border border-zinc-200 bg-white">
          <div className="flex items-center justify-between">
  <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
    Datos personales
  </h2>

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

<div className="p-4 text-sm">

                <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 py-3">
                  <Campo label="Sexo" value={socioAny.SEXE} />
                  <Campo
                    label="Fecha nacimiento"
                    value={socio["FECHA de NACIMIENTO"]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 py-3">
                  <Campo label="Teléfono" value={socio["Teléfono 1"]} />
                  <Campo label="NIF" value={socioAny.NIF} />
                </div>

                <div className="border-b border-zinc-100 py-3">
                  <Campo label="Dirección" value={socioAny.Dirección} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Campo
                    label="Código Postal"
                    value={socio["Código Postal"]}
                  />
                  <Campo label="Ciudad" value={socioAny.Ciudad} />
                </div>
              </div>
            </section>

            <section className="border border-zinc-200 bg-white">
            <div className="bg-zinc-100 px-4 py-3">
  <div>
    <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
      Datos de pago
    </h2>

    <p className="text-xs text-zinc-500">
      Banco, forma de pago y cuota actual
    </p>
  </div>
</div>

              <div className="p-4 text-sm">
                <div className="border-b border-zinc-100 py-3">
                  <Campo label="IBAN" value={datosBancoAny?.IBAN} />
                </div>

                <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 py-3">
                <Campo
  label="Forma de pago"
  value={formaPagoAny?.Metodo || ((cuotaActual as any)?.Metodo)}
/>

<Campo
  label="Pagador"
  value={
    formaPagoAny?.NUMCENS_Pagador
      ? formaPagoAny.NUMCENS_Pagador
      : "-"
  }
/>

<Campo
  label="Nº plazos"
  value={formaPagoAny?.NumeroPlazos || "-"}
/>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Campo
                    label="Cuota actual"
                    value={
                      (cuotaActual as any)?.Importe
                        ? Number((cuotaActual as any).Importe).toFixed(2) + " €"
                        : "-"
                    }
                  />
                  <Campo
                    label="Tipo cuota"
                    value={
                      (cuotaActual as any)?.Descripcion ||
                      (cuotaActual as any)?.TipoCuota ||
                      (cuotaActual as any)?.IDCuota
                    }
                  />
                </div>
              </div>
            </section>
          </div>

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