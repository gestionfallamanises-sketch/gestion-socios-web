import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import AddMemberForm from "../../components/AddMemberForm";
import MakeTitularButton from "../../components/MakeTitularButton";
import RemoveMemberButton from "../../components/RemoveMemberButton";
import RegistrarPagoFamiliaForm from "../../components/RegistrarPagoFamiliaForm";
import GenerarCuotasButton from "@/app/components/GenerarCuotasButton";

export default async function FamiliaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: familia, error } = await supabase
  .from("FAMILIAS")
  .select("*")
  .eq("ID_Familia", Number(id))
  .single();

const { data: miembros } = await supabase
  .from("SOCIOS")
  .select("*")
  .eq("ID_Familia", Number(id))
  .order("Apellidos", { ascending: true });

  const { data: titular } = await supabase
    .from("SOCIOS")
    .select("*")
    .eq("NUMCENS", familia?.Titular_NUMCENS)
    .single();

    const { data: datosBancoTitular } = titular
  ? await supabase
      .from("DATOS_BANCARIOS")
      .select("IBAN")
      .eq("NUMCENS", titular.NUMCENS)
      .maybeSingle()
  : { data: null };

  const numsFamilia = miembros?.map((s) => s.NUMCENS) || [];

  const { data: formasPagoFamilia } =
  numsFamilia.length > 0
    ? await supabase
        .from("FORMAS_PAGO_SOCIOS")
        .select(`
          *,
          PAGADORES_EXTERNOS (
            Nombre,
            Apellidos,
            NIF
          )
        `)
        .in("NUMCENS", numsFamilia)
        .eq("Activo", true)
    : { data: [] };
  
  const { data: cuotasFamilia } =
    numsFamilia.length > 0
      ? await supabase
          .from("vista_cuotas_socios")
          .select("*")
          .in("NUMCENS", numsFamilia)
          .order("Ejercicio", { ascending: false })
      : { data: [] };

  const ejercicioActual =
    cuotasFamilia && cuotasFamilia.length > 0
      ? cuotasFamilia[0].Ejercicio
      : null;

  const cuotasActuales =
    cuotasFamilia?.filter(
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

  function cuotaSocio(numcens: number) {
    return cuotasActuales.find(
      (c) => Number(c.NUMCENS) === Number(numcens)
    );
  }

  const totalPapeletas =
    miembros?.reduce(
      (total, socio) => total + Number(socio.NumPapeletas || 0),
      0
    ) || 0;

  const totalCuotas = cuotasActuales.reduce(
    (total, cuota) => total + Number(cuota.Importe || 0),
    0
  );

  const totalPagado =
  plazosFamilia?.reduce(
    (total, plazo) =>
      total + Number(plazo.ImportePagado || 0),
    0
  ) || 0;

const totalPendiente =
  plazosFamilia?.reduce(
    (total, plazo) =>
      total + Number(plazo.Pendiente || 0),
    0
  ) || 0;

  if (error || !familia) {
    return (
      <div className="min-h-screen bg-zinc-100 p-8">
        <main className="mx-auto max-w-5xl border border-zinc-200 bg-white p-8">
          <Link
            href="/familias"
            className="mb-6 inline-block text-sm font-medium text-red-900 hover:text-red-950"
          >
            ← Volver a familias
          </Link>

          <h1 className="text-2xl font-bold">Familia no encontrada</h1>

          <p className="mt-2 text-sm text-zinc-500">ID buscado: {id}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 p-8">
      <main className="mx-auto max-w-7xl">
        <Link
          href="/familias"
          className="mb-6 inline-block text-sm font-medium text-red-900 hover:text-red-950"
        >
          ← Volver a familias
        </Link>

        <section className="mb-8 border border-zinc-200 bg-white shadow-sm">
          <div className="border-l-4 border-red-900 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">
                  {familia.Nombre_Familia || "Familia sin nombre"}
                </h1>

                <p className="mt-2 text-sm text-zinc-600">
                  ID familia {familia.ID_Familia} · {miembros?.length || 0} miembros ·{" "}
                  {totalPapeletas} papeletas
                </p>
              </div>

              <Link
                href={`/familias/${familia.ID_Familia}/editar`}
                className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
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
                Datos del titular
              </h2>

              <p className="text-xs text-zinc-500">
                Información principal de contacto
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 text-sm md:grid-cols-5">
  <Bloque
    label="Titular"
    value={titular ? `${titular.Nombre} ${titular.Apellidos}` : "-"}
  />
  <Bloque label="Teléfono" value={titular?.["Teléfono 1"] || "-"} />
  <Bloque label="Dirección" value={titular?.Dirección || "-"} />
  <Bloque label="Población" value={titular?.Poblacion || titular?.Ciudad || "-"} />
  <Bloque
  label="Cuenta"
  value={datosBancoTitular?.IBAN || "-"}
/>
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

            <AddMemberForm idFamilia={Number(id)} />
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
                    <th className="px-4 py-3">NUMCENS</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Comisión</th>
                    <th className="px-4 py-3">Lotería</th>
                    <th className="px-4 py-3">Pagador</th>
                    <th className="px-4 py-3 text-right">Cuota</th>
                    <th className="px-4 py-3 text-right">Titular / acciones</th>
                  </tr>
                </thead>

                <tbody>
  {miembros.map((socio) => {
    const cuota = cuotaSocio(socio.NUMCENS);

    const plazosCuota =
      plazosFamilia?.filter(
        (p) => Number(p.IDCuotaSocio) === Number(cuota?.IDCuotaSocio)
      ) || [];

    return (
      <tr
        key={socio.NUMCENS}
        className="border-t border-zinc-200 hover:bg-red-50"
      >
        <td className="px-4 py-3 text-zinc-600">{socio.NUMCENS}</td>

        <td className="px-4 py-3">
          <Link
            href={`/socios/${socio.NUMCENS}?fromFamilia=${familia.ID_Familia}`}
            className="font-medium text-zinc-900 hover:text-red-900 hover:underline"
          >
            {socio.Nombre} {socio.Apellidos}
          </Link>
        </td>

        <td className="px-4 py-3 text-zinc-600">{socio.Comision || "-"}</td>

        <td className="px-4 py-3 text-zinc-600">
          {socio.ConLoteria ? "Sí" : "No"}
        </td>

        <td className="px-4 py-3 text-zinc-600">
  {(() => {
    const formaPago = formasPagoFamilia?.find(
      (fp) =>
        Number(fp.NUMCENS) === Number(socio.NUMCENS) &&
        fp.Activo === true
    );

    return (
      formaPago?.NUMCENS_Pagador ||
      cuota?.NUMCENS_Pagador ||
      "-"
    );
  })()}
</td>

        <td className="px-4 py-3 text-right font-medium">
          {Number(cuota?.Importe || 0).toFixed(2)} €
        </td>

        <td className="px-4 py-3 text-right">
          {String(socio.NUMCENS) === String(familia.Titular_NUMCENS) ? (
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

        <section className="border border-zinc-200 bg-white">
          <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
            <div> 
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                Cuotas y pagos
              </h2> 

              <p className="text-xs text-zinc-500">
                Resumen económico familiar del ejercicio actual
              </p>
            </div>

            <div className="flex items-center gap-3">
  <GenerarCuotasButton
    ejercicio={ejercicioActual || 2027}
  />

  <Link
    href={"/familias/" + familia.ID_Familia + "/cuotas"}
    className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
  >
    Ver detalle económico
  </Link>
</div>
          </div>

          <div className="grid grid-cols-1 text-sm md:grid-cols-4">
            <Bloque label="Ejercicio" value={ejercicioActual || "-"} />
            <Bloque label="Total cuotas" value={`${totalCuotas.toFixed(2)} €`} />
            <Bloque label="Total pagado" value={`${totalPagado.toFixed(2)} €`} />
            <Bloque label="Total pendiente" value={`${totalPendiente.toFixed(2)} €`} />
          </div>

          <div className="border-t border-zinc-200 p-4">
  <RegistrarPagoFamiliaForm idFamilia={Number(id)} />
</div>

          <div className="overflow-x-auto border-t border-zinc-200">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-600">
                <tr>
                  <th className="px-4 py-3">Socio</th>
                  <th className="px-4 py-3">Ejercicio</th>
                  <th className="px-4 py-3 text-right">Cuota</th>
                  <th className="px-4 py-3 text-right">Pagado</th>
                  <th className="px-4 py-3 text-right">Pendiente</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Método</th>
                </tr>
              </thead>

              <tbody>
              {cuotasActuales.length === 0 ? (
  <tr>
    <td colSpan={7} className="px-4 py-6 text-center text-zinc-500">
      No hay cuotas generadas para esta familia.
    </td>
  </tr>
) : (
  cuotasActuales.map((cuota) => {
    const plazosCuota =
      plazosFamilia?.filter(
        (p) => Number(p.IDCuotaSocio) === Number(cuota.IDCuotaSocio)
      ) || [];

    const pagadoCuota = plazosCuota.reduce(
      (total, plazo) => total + Number(plazo.ImportePagado || 0),
      0
    );

    const pendienteCuota = plazosCuota.reduce(
      (total, plazo) => total + Number(plazo.Pendiente || 0),
      0
    );

    return (
      <tr
        key={cuota.IDCuotaSocio}
        className="border-t border-zinc-200 hover:bg-red-50"
      >
        <td className="px-4 py-3 font-medium">
          {cuota.Apellidos}, {cuota.Nombre}
        </td>

        <td className="px-4 py-3 text-zinc-600">
          {cuota.Ejercicio}
        </td>

        <td className="px-4 py-3 text-right">
          {Number(cuota.Importe || 0).toFixed(2)} €
        </td>

        <td className="px-4 py-3 text-right text-green-700">
          {pagadoCuota.toFixed(2)} €
        </td>

        <td className="px-4 py-3 text-right text-red-700">
          {pendienteCuota.toFixed(2)} €
        </td>

        <td className="px-4 py-3">
          <EstadoBadge estado={cuota.EstadoPago} />
        </td>

        <td className="px-4 py-3 text-zinc-600">
          {cuota.Metodo || "-"}
        </td>
      </tr>
    );
  })
)}
              </tbody>
            </table>
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