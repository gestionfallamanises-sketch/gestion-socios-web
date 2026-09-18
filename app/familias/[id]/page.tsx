import React from "react";
import Link from "next/link";

import { supabase } from "../../../lib/supabaseClient";

import AddMemberForm from "../../components/AddMemberForm";
import MakeTitularButton from "../../components/MakeTitularButton";
import RemoveMemberButton from "../../components/RemoveMemberButton";
import TrasladarFamiliaButton from "../../components/TrasladarFamiliaButton";
import GenerarCuotasButton from "../../components/GenerarCuotasButton";
import PrintButton from "../../components/PrintButton";

export default async function FamiliaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: ejercicioActivoData } = await supabase
  .from("EJERCICIOS")
  .select("Ejercicio")
  .eq("Activo", true)
  .maybeSingle();

const ejercicioActivo =
  (ejercicioActivoData as any)?.Ejercicio ?? null;


  const { data: familia, error } = await supabase
  .from("FAMILIAS")
  .select("*")
  .eq("ID_Familia", Number(id))
  .single();

  const familiaAny = familia as any;

const { data: miembros } = await supabase
  .from("SOCIOS")
  .select("*")
  .eq("ID_Familia", Number(id))
  .order("Apellidos", { ascending: true });

  const miembrosAny = (miembros || []) as any[];

  const { data: titular } = await supabase
    .from("SOCIOS")
    .select("*")
    .eq("NUMCENS", (familia as any)?.Titular_NUMCENS)
    .single();

    const titularAny = titular as any;

    const { data: datosBancoTitular } = titular
  ? await supabase
      .from("DATOS_BANCARIOS")
      .select("IBAN")
      .eq("NUMCENS", titularAny?.NUMCENS)
      .maybeSingle()
  : { data: null };

  const datosBancoTitularAny = datosBancoTitular as any;

  const numsFamilia = miembrosAny?.map((s) => s.NUMCENS) || [];

  const { data: formasPagoFamilia, error: errorFormasPago } =
  numsFamilia.length > 0
    ? await supabase
        .from("FORMAS_PAGO_SOCIOS")
        .select("*")
        .in(
          "NUMCENS",
          numsFamilia.map((num) => Number(num))
        )
        .eq("Activo", true)
    : { data: [], error: null };

if (errorFormasPago) {
  console.error(
    "Error cargando formas de pago:",
    errorFormasPago.message
  );
}

    const formasPagoFamiliaAny = (formasPagoFamilia || []) as any[];

    const numsPagadoresSocios = [
      ...new Set(
        formasPagoFamiliaAny
          .map((fp) => Number(fp.NUMCENS_Pagador))
          .filter((num) => num > 0)
      ),
    ];
    
    const { data: sociosPagadores } =
      numsPagadoresSocios.length > 0
        ? await supabase
            .from("SOCIOS")
            .select("NUMCENS, Nombre, Apellidos")
            .in("NUMCENS", numsPagadoresSocios)
        : { data: [] };
    
    const sociosPagadoresAny = (sociosPagadores || []) as any[];
  
  const { data: cuotasFamilia } =
    numsFamilia.length > 0
      ? await supabase
      .from("VISTA_CUOTAS_RESUMEN")
          .select("*")
          .in("NUMCENS", numsFamilia)
          .order("Ejercicio", { ascending: false })
      : { data: [] };

      const cuotasFamiliaAny = (cuotasFamilia || []) as any[];

  const ejercicioActual =
    cuotasFamilia && cuotasFamilia.length > 0
      ? cuotasFamiliaAny[0].Ejercicio
      : null;

  const cuotasActuales =
    cuotasFamiliaAny?.filter(
      (c) => Number(c.Ejercicio) === Number(ejercicioActual)
    ) || [];

    const idsCuotasActuales =
  cuotasActuales.map((c) => c.IDCuotaSocio) || [];

const { data: plazosFamilia } =
  idsCuotasActuales.length > 0
    ? await supabase
        .from("CUOTAS_PLAZOS")
        .select("*")
        .in("IDCuotaSocio", idsCuotasActuales)
    : { data: [] };

    const plazosFamiliaAny = (plazosFamilia ?? []) as any[];

  function cuotaSocio(numcens: number) {
    return cuotasActuales.find(
      (c) => Number(c.NUMCENS) === Number(numcens)
    );
  }

  const totalPapeletas =
  miembrosAny.reduce(
    (total: number, socio: any) =>
      total + Number(socio.NumPapeletas || 0),
    0
  );

  const totalCuotas = cuotasActuales.reduce(
    (total, cuota) => total + Number(cuota.Importe || 0),
    0
  );

  const idsCuotasFamilia = cuotasActuales.map((c) => c.IDCuotaSocio);

const { data: resumenCuotasFamilia } =
  idsCuotasFamilia.length > 0
    ? await (supabase as any)
        .from("VISTA_CUOTAS_RESUMEN")
        .select("*")
        .in("IDCuotaSocio", idsCuotasFamilia)
    : { data: [] };

const resumenCuotasFamiliaAny = (resumenCuotasFamilia as any[]) || [];

const totalPagado =
  resumenCuotasFamiliaAny.reduce(
    (total, cuota) => total + Number(cuota.TotalPagado || 0),
    0
  ) || 0;

const totalPendiente =
  resumenCuotasFamiliaAny.reduce(
    (total, cuota) => total + Number(cuota.Pendiente || 0),
    0
  ) || 0;

  if (error || !familia) {
    return (
      <div className="min-h-screen bg-zinc-100 p-8">
        <main className="mx-auto max-w-5xl border border-zinc-200 bg-white p-8">
        <div className="mb-6 flex items-center justify-between">
  
  <Link
    href="/familias"
    className="text-sm font-medium text-red-900 hover:text-red-950 print:hidden"
  >
    ← Volver a familias
  </Link>

  <div className="print:hidden">
    <PrintButton />
  </div>
</div>

          <h1 className="text-2xl font-bold">Familia no encontrada</h1>

          <p className="mt-2 text-sm text-zinc-500">ID buscado: {id}</p>
        </main>
      </div>
    );
  }

  const ejercicioParaGenerar = ejercicioActual ?? ejercicioActivo;
  
  return (
    <div className="min-h-screen bg-zinc-100 p-8">
      <main className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
  <Link
    href="/familias"
    className="text-sm font-medium text-red-900 hover:text-red-950 print:hidden"
  >
    ← Volver a familias
  </Link>

  <div className="print:hidden">
    <PrintButton />
  </div>
</div>

        <section className="mb-5 border border-zinc-200 bg-white shadow-sm">
  <div className="border-l-4 border-red-900 px-5 py-4">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-xl font-bold text-zinc-900">
            {familiaAny.Nombre_Familia || "Familia sin nombre"}
          </h1>

          <span className="text-xs text-zinc-400">
            ID {familiaAny.ID_Familia}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-600">
          <span>
            <span className="font-medium text-zinc-800">Titular:</span>{" "}
            {titularAny
              ? `${titularAny.Nombre} ${titularAny.Apellidos}`
              : "-"}
          </span>

          <span>
            <span className="font-medium text-zinc-800">Tel:</span>{" "}
            {titularAny?.["Teléfono 1"] || "-"}
          </span>

          <span>
            <span className="font-medium text-zinc-800">Miembros:</span>{" "}
            {miembros?.length || 0}
          </span>

          <span>
            <span className="font-medium text-zinc-800">Papeletas:</span>{" "}
            {totalPapeletas}
          </span>
        </div>

        <div className="mt-1 text-xs text-zinc-500">
          {titularAny?.Dirección || "-"}
          {(titularAny?.Poblacion || titularAny?.Ciudad) &&
            ` · ${titularAny?.Poblacion || titularAny?.Ciudad}`}
        </div>
      </div>

      <Link
        href={`/familias/${familiaAny.ID_Familia}/editar`}
        className="shrink-0 border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        Editar familia
      </Link>

    </div>
  </div>
</section>

        <section className="mb-8 border border-zinc-200 bg-white">
          <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                Miembros de la familia
              </h2>

              <p className="text-xs text-zinc-500">
                Socios asignados a esta unidad familiar
              </p>
            </div>

            <div className="flex items-start gap-2">
  <TrasladarFamiliaButton idFamiliaOrigen={Number(id)} />
  <AddMemberForm idFamilia={Number(id)} />
</div>
          </div>

          {!miembros || miembros.length === 0 ? (
            <div className="p-6 text-sm text-zinc-500">
              Esta familia todavía no tiene socios asignados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
                <tr>
                <th className="px-4 py-3">Socio</th>
<th className="px-4 py-3">Tipo cuota</th>
<th className="px-4 py-3">Pagador</th>
<th className="px-4 py-3 text-right">Cuota</th>
<th className="px-4 py-3 text-right">Pagado</th>
<th className="px-4 py-3 text-right">Pendiente</th>
<th className="px-4 py-3 text-right">Acciones</th>
</tr>
                </thead>

                <tbody>
  {miembrosAny.map((socio) => {
    const cuota = cuotaSocio(socio.NUMCENS);

    const plazosCuota =
  plazosFamiliaAny.filter(
    (p: any) => Number(p.IDCuotaSocio) === Number(cuota?.IDCuotaSocio)
  );

    return (
      <tr
        key={socio.NUMCENS}
        className="border-t border-zinc-200 hover:bg-red-50"
      >
        <td className="px-4 py-3">
  <Link
    href={`/socios/${socio.NUMCENS}?fromFamilia=${familiaAny.ID_Familia}`}
    className="font-medium text-zinc-900 hover:text-red-900 hover:underline"
  >
    {socio.Nombre} {socio.Apellidos}
  </Link>

  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
    <span>Nº {socio.NUMCENS}</span>

    {socio.ConLoteria && (
      <span className="bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
        Lotería
      </span>
    )}
  </div>
</td>

        <td className="px-4 py-3 text-zinc-600">
  {cuota?.Tipo || cuota?.TipoCuota || cuota?.NombreCuota || cuota?.Descripcion || cuota?.IDCuota || "-"}
</td>

        <td className="px-4 py-3 text-zinc-600">
  {(() => {
    const formaPago = formasPagoFamiliaAny.find(
      (fp) =>
        Number(fp.NUMCENS) === Number(socio.NUMCENS) &&
        fp.Activo === true
    );

    if (!formaPago) {
      return "-";
    }

    if (formaPago.IDPagadorExterno) {
      const externo = formaPago.PAGADORES_EXTERNOS;

      return externo
        ? `Externo · ${externo.Nombre || ""} ${externo.Apellidos || ""}`.trim()
        : "Pagador externo";
    }

    const numcensPagador = formaPago.NUMCENS_Pagador;

    if (!numcensPagador) {
      return "-";
    }

    if (Number(numcensPagador) === Number(socio.NUMCENS)) {
      return "Él mismo";
    }

    return `Nº ${numcensPagador}`;
  })()}
</td>

        <td className="px-4 py-3 text-right font-medium">
          {Number(cuota?.Importe || 0).toFixed(2)} €
        </td>

        <td className="px-4 py-3 text-right font-medium text-green-700">
  {Number(cuota?.TotalPagado || 0).toFixed(2)} €
</td>

<td
  className={`px-4 py-3 text-right font-medium ${
    Number(cuota?.Pendiente || 0) > 0
      ? "text-red-700"
      : "text-zinc-500"
  }`}
>
  {Number(cuota?.Pendiente || 0).toFixed(2)} €
</td>

        <td className="px-4 py-3 text-right">
          {String(socio.NUMCENS) === String(familiaAny?.Titular_NUMCENS) ? (
            <span className="bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              Titular
            </span>
          ) : (
            <div className="flex justify-end gap-2">
              <MakeTitularButton
                idFamilia={Number(id)}
                numcens={String(socio.NUMCENS)}
              />

              <RemoveMemberButton numcens={String(socio.NUMCENS)} />
            </div>
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

        <section className="border border-zinc-200 bg-white shadow-sm">
  <div className="flex flex-col xl:flex-row xl:items-stretch">

    <div className="grid flex-1 grid-cols-2 divide-x divide-zinc-200 md:grid-cols-4">
      <div className="px-5 py-4">
        <div className="text-xs uppercase text-zinc-500">Ejercicio</div>
        <div className="mt-1 text-lg font-semibold text-zinc-900">
          {ejercicioActual || "-"}
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="text-xs uppercase text-zinc-500">Total cuotas</div>
        <div className="mt-1 text-lg font-semibold text-zinc-900">
          {totalCuotas.toFixed(2)} €
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="text-xs uppercase text-zinc-500">Total pagado</div>
        <div className="mt-1 text-lg font-semibold text-green-700">
          {totalPagado.toFixed(2)} €
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="text-xs uppercase text-zinc-500">Total pendiente</div>
        <div className="mt-1 text-lg font-semibold text-red-700">
          {totalPendiente.toFixed(2)} €
        </div>
      </div>
    </div>

    <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-zinc-200 p-4 xl:border-l xl:border-t-0">
      {(ejercicioActual ?? ejercicioActivo) !== null && (
        <GenerarCuotasButton
          ejercicio={ejercicioActual ?? ejercicioActivo!}
        />
      )}

      <Link
        href={`/familias/${familiaAny.ID_Familia}/cuotas`}
        className="whitespace-nowrap bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
      >
        Ver detalle económico
      </Link>
    </div>

  </div>
</section>
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

      <div className="bg-white px-4 py-3 text-sm">
        {value || "-"}
      </div>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  return (
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
  );
}