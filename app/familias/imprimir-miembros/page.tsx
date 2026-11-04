import { supabase } from "@/lib/supabaseClient";
import ExportarFamiliasMiembrosExcelButton from "@/app/components/ExportarFamiliasMiembrosExcelButton";
import PrintButton from "@/app/components/PrintButton";

export default async function ImprimirFamiliasMiembrosPage() {
  const [
    { data: familias, error: errorFamilias },
    { data: socios, error: errorSocios },
    { data: ejercicioData, error: errorEjercicio },
  ] = await Promise.all([
    (supabase as any)
      .from("FAMILIAS")
      .select("*")
      .order("Nombre_Familia", { ascending: true }),
    (supabase as any)
      .from("SOCIOS")
      .select("*")
      .order("Apellidos", { ascending: true }),
    (supabase as any)
      .from("EJERCICIOS")
      .select("Ejercicio")
      .eq("Activo", true)
      .maybeSingle(),
  ]);

  const errorInicial = errorFamilias || errorSocios || errorEjercicio;
  if (errorInicial) {
    return (
      <div className="p-8 text-red-700">
        No se ha podido cargar el listado: {errorInicial.message}
      </div>
    );
  }

  const ejercicioActivo = ejercicioData?.Ejercicio ?? null;
  const { data: cuotas, error: errorCuotas } = ejercicioActivo == null
    ? { data: [], error: null }
    : await (supabase as any)
        .from("VISTA_CUOTAS_RESUMEN")
        .select("*")
        .eq("Ejercicio", ejercicioActivo);

  if (errorCuotas) {
    return (
      <div className="p-8 text-red-700">
        No se han podido consultar las cuotas: {errorCuotas.message}
      </div>
    );
  }

  const familiasAny = (familias as any[]) || [];
  const sociosAny = (socios as any[]) || [];
  const cuotasPorSocio = new Map<number, number>();

  for (const cuota of (cuotas as any[]) || []) {
    const numcens = Number(cuota.NUMCENS);
    const importe = cuota.ImporteCuota ?? cuota.Importe;
    if (Number.isFinite(numcens) && importe != null && importe !== "") {
      cuotasPorSocio.set(numcens, Number(importe));
    }
  }

  const filasExcel = familiasAny.flatMap((familia) => {
    const miembros = sociosAny.filter(
      (s) => Number(s.ID_Familia) === Number(familia.ID_Familia)
    );

    return miembros.map((miembro) => ({
      "N.º familia": familia.ID_Familia,
      Familia: familia.Nombre_Familia || `Familia ${familia.ID_Familia}`,
      NUMCENS: miembro.NUMCENS,
      Miembro: `${miembro.Apellidos}, ${miembro.Nombre}`,
      Comision: miembro.Comision || "-",
      Loteria: miembro.ConLoteria ? "Sí" : "No",
      "Cuota individual (€)": cuotasPorSocio.get(Number(miembro.NUMCENS)) ?? "-",
      Pagador:
        Number(miembro.NUMCENS) === Number(familia.Titular_NUMCENS)
          ? "Titular"
          : familia.Titular_NUMCENS || "-",
    }));
  });

  const formatoEuros = (valor: number | undefined) =>
    valor === undefined
      ? "-"
      : new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: "EUR",
        }).format(valor);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Familias y miembros</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Cuotas del ejercicio {ejercicioActivo ?? "sin ejercicio activo"}
          </p>
        </div>

        <div className="no-print flex items-center gap-3">
          <PrintButton />
          <ExportarFamiliasMiembrosExcelButton filas={filasExcel} />
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-zinc-100">
            <th className="border px-3 py-2 text-left">N.º familia</th>
            <th className="border px-3 py-2 text-left">Familia</th>
            <th className="border px-3 py-2 text-left">NUMCENS</th>
            <th className="border px-3 py-2 text-left">Miembro</th>
            <th className="border px-3 py-2 text-left">Comisión</th>
            <th className="border px-3 py-2 text-left">Lotería</th>
            <th className="border px-3 py-2 text-right">Cuota individual (€)</th>
            <th className="border px-3 py-2 text-left">Pagador</th>
          </tr>
        </thead>

        <tbody>
          {familiasAny.map((familia) => {
            const miembros = sociosAny.filter(
              (s) => Number(s.ID_Familia) === Number(familia.ID_Familia)
            );

            return miembros.map((miembro, index) => (
              <tr
                key={`${familia.ID_Familia}-${miembro.NUMCENS}`}
                className="border-t"
              >
                <td className="border px-3 py-2">{familia.ID_Familia}</td>

                <td className="border px-3 py-2">
                  {index === 0
                    ? familia.Nombre_Familia || `Familia ${familia.ID_Familia}`
                    : ""}
                </td>

                <td className="border px-3 py-2">{miembro.NUMCENS}</td>

                <td className="border px-3 py-2">
                  {miembro.Apellidos}, {miembro.Nombre}
                </td>

                <td className="border px-3 py-2">{miembro.Comision || "-"}</td>

                <td className="border px-3 py-2">
                  {miembro.ConLoteria ? "Sí" : "No"}
                </td>

                <td className="border px-3 py-2 text-right">
                  {formatoEuros(cuotasPorSocio.get(Number(miembro.NUMCENS)))}
                </td>

                <td className="border px-3 py-2">
                  {Number(miembro.NUMCENS) === Number(familia.Titular_NUMCENS)
                    ? "Titular"
                    : familia.Titular_NUMCENS || "-"}
                </td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}
