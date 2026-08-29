"use client";

function euros(valor: number) {
  return `${Number(valor || 0).toFixed(2)} €`;
}

export default function ResumenEconomicoSorteos({
  titulo,
  resumen,
}: {
  titulo: string;
  resumen: {
    recaudacion: number;
    jugadoSocios: number;
    beneficioSocios: number;
    pagoAdministracion: number;
    jugadoSobrantes: number;
    beneficioSobrantes: number;
    beneficioTotal: number;
  };
}) {
    const color = "border-zinc-300";

      return (
        <div className={`rounded border ${color} bg-white p-4 shadow-sm`}>
          <h2 className="mb-4 -mx-4 -mt-4 border-b border-zinc-300 bg-zinc-100 px-4 py-3 text-base font-semibold text-zinc-800">
  {titulo}
</h2>
      
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span>Recaudación</span>
              <span className="font-semibold text-zinc-800">
                {euros(resumen.recaudacion)}
              </span>
            </div>
      
            <div className="flex justify-between">
              <span>Pago adm.</span>
              <span className="font-semibold text-zinc-800">
                {euros(resumen.pagoAdministracion)}
              </span>
            </div>
      
            <div className="flex justify-between">
              <span>Jugado socios</span>
              <span className="font-semibold text-zinc-800">
                {euros(resumen.jugadoSocios)}
              </span>
            </div>
      
            <div className="flex justify-between">
              <span>Jugado sobr.</span>
              <span className="font-semibold text-zinc-800">
                {euros(resumen.jugadoSobrantes)}
              </span>
            </div>
      
            <div className="flex justify-between">
              <span>Beneficio socios</span>
              <span className="font-semibold text-zinc-800">
                {euros(resumen.beneficioSocios)}
              </span>
            </div>
      
            <div className="flex justify-between">
              <span>Beneficio sobr.</span>
              <span className="font-semibold text-zinc-800">
                {euros(resumen.beneficioSobrantes)}
              </span>
            </div>
      
            <div className="col-span-2 mt-2 border-t border-zinc-200 pt-2">
              <div className="flex justify-between text-base font-bold">
                <span>BENEFICIO TOTAL</span>
      
                <span className="text-green-700">
                  {euros(resumen.beneficioTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
}