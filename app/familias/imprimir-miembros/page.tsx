import { supabase } from "@/lib/supabaseClient";
import ExportarFamiliasMiembrosExcelButton from "@/app/components/ExportarFamiliasMiembrosExcelButton";
import PrintButton from "@/app/components/PrintButton";

export default async function ImprimirFamiliasMiembrosPage() {
  const { data: familias } = await (supabase as any)
    .from("FAMILIAS")
    .select("*")
    .order("Nombre_Familia", { ascending: true });

  const { data: socios } = await (supabase as any)
    .from("SOCIOS")
    .select("*")
    .order("Apellidos", { ascending: true });

  const familiasAny = (familias as any[]) || [];
  const sociosAny = (socios as any[]) || [];

  const filasExcel = familiasAny.flatMap((familia) => {
    const miembros = sociosAny.filter(
      (s) => Number(s.ID_Familia) === Number(familia.ID_Familia)
    );

    return miembros.map((miembro) => ({
      Familia: familia.Nombre_Familia || `Familia ${familia.ID_Familia}`,
      NUMCENS: miembro.NUMCENS,
      Miembro: `${miembro.Apellidos}, ${miembro.Nombre}`,
      Comision: miembro.Comision || "-",
      Loteria: miembro.ConLoteria ? "Sí" : "No",
      Pagador:
        Number(miembro.NUMCENS) === Number(familia.Titular_NUMCENS)
          ? "Titular"
          : familia.Titular_NUMCENS || "-",
    }));
  });

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
          {familiasAny.map((familia) => {
            const miembros = sociosAny.filter(
              (s) => Number(s.ID_Familia) === Number(familia.ID_Familia)
            );

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