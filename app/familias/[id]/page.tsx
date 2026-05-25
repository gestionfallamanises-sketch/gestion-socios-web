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

  const { data: familia, error } = await (supabase as any)
    .from("FAMILIAS")
    .select("*")
    .eq("ID_Familia", Number(id))
    .single();

  const familiaAny = familia as any;

  const { data: miembros } = await (supabase as any)
    .from("SOCIOS")
    .select("*")
    .eq("ID_Familia", Number(id))
    .order("Apellidos", { ascending: true });

  const miembrosAny = (miembros as any[]) || [];

  const { data: titular } = await (supabase as any)
    .from("SOCIOS")
    .select("*")
    .eq("NUMCENS", familiaAny?.Titular_NUMCENS)
    .single();

  const titularAny = titular as any;

  const numsFamilia = miembrosAny.map((s) => s.NUMCENS);

  const { data: formasPagoFamilia } =
    numsFamilia.length > 0
      ? await (supabase as any)
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

  const formasPagoAny = (formasPagoFamilia as any[]) || [];

  const { data: cuotasFamilia } =
    numsFamilia.length > 0
      ? await (supabase as any)
          .from("vista_cuotas_socios")
          .select("*")
          .in("NUMCENS", numsFamilia)
          .order("Ejercicio", { ascending: false })
      : { data: [] };

  const cuotasFamiliaAny = (cuotasFamilia as any[]) || [];

  const ejercicioActual =
    cuotasFamiliaAny.length > 0
      ? cuotasFamiliaAny[0].Ejercicio
      : null;

  const cuotasActuales =
    cuotasFamiliaAny.filter(
      (c) => Number(c.Ejercicio) === Number(ejercicioActual)
    ) || [];

  const idsCuotasActuales =
    cuotasActuales.map((c) => c.IDCuotaSocio) || [];

  const { data: plazosFamilia } =
    idsCuotasActuales.length > 0
      ? await (supabase as any)
          .from("CUOTAS_PLAZOS")
          .select("*")
          .in("IDCuotaSocio", idsCuotasActuales)
      : { data: [] };

  const plazosFamiliaAny = (plazosFamilia as any[]) || [];

  function cuotaSocio(numcens: number) {
    return cuotasActuales.find(
      (c) => Number(c.NUMCENS) === Number(numcens)
    );
  }

  const totalPapeletas =
    miembrosAny.reduce(
      (total, socio) => total + Number(socio.NumPapeletas || 0),
      0
    ) || 0;

  const totalCuotas = cuotasActuales.reduce(
    (total, cuota) => total + Number(cuota.Importe || 0),
    0
  );

  const totalPagado =
    plazosFamiliaAny.reduce(
      (total, plazo) =>
        total + Number(plazo.ImportePagado || 0),
      0
    ) || 0;

  const totalPendiente =
    plazosFamiliaAny.reduce(
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
                  {familiaAny.Nombre_Familia || "Familia sin nombre"}
                </h1>

                <p className="mt-2 text-sm text-zinc-600">
                  ID familia {familiaAny.ID_Familia} · {miembrosAny.length || 0} miembros ·{" "}
                  {totalPapeletas} papeletas
                </p>
              </div>

              <Link
                href={`/familias/${familiaAny.ID_Familia}/editar`}
                className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
              >
                Editar familia
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-8 border border-zinc-200 bg-white">
          <div className="grid grid-cols-1 text-sm md:grid-cols-5">
            <Bloque
              label="Titular"
              value={titularAny ? `${titularAny.Nombre} ${titularAny.Apellidos}` : "-"}
            />
            <Bloque label="Teléfono" value={titularAny?.["Teléfono 1"] || "-"} />
            <Bloque label="Dirección" value={titularAny?.Dirección || "-"} />
            <Bloque label="Población" value={titularAny?.Poblacion || titularAny?.Ciudad || "-"} />
            <Bloque label="Código postal" value={titularAny?.["Código Postal"] || "-"} />
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