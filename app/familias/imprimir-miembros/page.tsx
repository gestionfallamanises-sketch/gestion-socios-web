import { supabase } from "@/lib/supabaseClient";
import ExportarFamiliasMiembrosExcelButton from "@/app/components/ExportarFamiliasMiembrosExcelButton";
import PrintButton from "@/app/components/PrintButton";

export default async function ImprimirFamiliasMiembrosPage() {
  const { data: familias } = await supabase
    .from("FAMILIAS")
    .select("*")
    .order("Nombre_Familia", { ascending: true });

  const { data: socios } = await supabase
    .from("SOCIOS")
    .select("*")
    .order("Apellidos", { ascending: true });

  const filasExcel =
    familias?.flatMap((familia) => {
      const sociosAny = (socios as any[]) || [];

const miembros =
  sociosAny.filter(
    (s) => Number(s.ID_Familia) === Number((familia as any).ID_Familia)
  ) || [];

  const familiaAny = familia as any;

  return miembros.map((miembro) => ({
    Familia: familiaAny.Nombre_Familia || `Familia ${familiaAny.ID_Familia}`,
        NUMCENS: miembro.NUMCENS,
        Miembro: `${miembro.Apellidos}, ${miembro.Nombre}`,
        Comision: miembro.Comision || "-",
        Loteria: miembro.ConLoteria ? "Sí" : "No",
        Pagador:
          Number(miembro.NUMCENS) === Number(familia.Titular_NUMCENS)
            ? "Titular"
            : familia.Titular_NUMCENS || "-",
      }));
    }) || [];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Familias y miembros</h1>

        <div className="no-print flex items-center gap-3">
          <PrintButton />

          <ExportarFamiliasMiembrosExcelButton filas={filasExcel} />
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-zinc-100">
            <th className="border px-3 py-2 text-left">Familia</th>
            <th className="border px-3 py-2 text-left">NUMCENS</th>
            <th className="border px-3 py-2 text-left">Miembro</th>
            <th className="border px-3 py-2 text-left">Comisión</th>
            <th className="border px-3 py-2 text-left">Lotería</th>
            <th className="border px-3 py-2 text-left">Pagador</th>
          </tr>
        </thead>

        <tbody>
          {familias?.map((familia) => {
            const miembros =
              socios?.filter(
                (s) => Number(s.ID_Familia) === Number(familia.ID_Familia)
              ) || [];

            return miembros.map((miembro, index) => (
              <tr
                key={`${familia.ID_Familia}-${miembro.NUMCENS}`}
                className="border-t"
              >
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