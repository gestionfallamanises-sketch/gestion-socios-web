"use client";

function euros(valor: number) {
  return `${Number(valor || 0).toFixed(2)} €`;
}

function calcularFila(sorteo: any, tipo: "Falla" | "Virgen") {
  const decimos = Number(sorteo[`Decimos${tipo}`] || 0);
  const precioDecimo = Number(sorteo[`PrecioDecimo${tipo}`] || 0);
  const importePapeleta = Number(sorteo[`ImportePapeleta${tipo}`] || 0);
  const beneficioPapeleta = Number(sorteo[`Beneficio${tipo}`] || 0);
  const premioPapeleta = Number(sorteo[`Premio${tipo}PorPapeleta`] || 0);
  const papeletasSocios = Number(sorteo[`PapeletasTotales${tipo}`] || 0);

  const pagoAdministracion = decimos * precioDecimo;
  const papeletasEmitidas =
    importePapeleta > 0
      ? Math.floor(pagoAdministracion / importePapeleta)
      : 0;

  const restantes = Math.max(0, papeletasEmitidas - papeletasSocios);
  const precioVenta = importePapeleta + beneficioPapeleta;

  return {
    fecha: sorteo.FechaSorteo,
    numero: sorteo[`Numero${tipo}`] || "",
    decimos,
    precioDecimo,
    importePapeleta,
    beneficioPapeleta,
    premioPapeleta,
    papeletasEmitidas,
    papeletasSocios,
    restantes,
    recaudacionSocios: papeletasSocios * precioVenta,
    importeJugadoSocios: papeletasSocios * importePapeleta,
    beneficioSocios: papeletasSocios * beneficioPapeleta,
    pagoAdministracion,
    jugadoSobrantes: restantes * importePapeleta,
  };
}

export default function TablaResumenSorteos({
  titulo,
  tipo,
  sorteos,
}: {
  titulo: string;
  tipo: "Falla" | "Virgen";
  sorteos: any[];
}) {
  const filas = [...sorteos]
    .sort(
      (a, b) =>
        new Date(b.FechaSorteo).getTime() -
        new Date(a.FechaSorteo).getTime()
    )
    .map((sorteo) => calcularFila(sorteo, tipo));

  const totales = filas.reduce(
    (acc, fila) => ({
      decimos: acc.decimos + fila.decimos,
      papeletasEmitidas: acc.papeletasEmitidas + fila.papeletasEmitidas,
      papeletasSocios: acc.papeletasSocios + fila.papeletasSocios,
      restantes: acc.restantes + fila.restantes,
      recaudacionSocios: acc.recaudacionSocios + fila.recaudacionSocios,
      importeJugadoSocios: acc.importeJugadoSocios + fila.importeJugadoSocios,
      beneficioSocios: acc.beneficioSocios + fila.beneficioSocios,
      pagoAdministracion: acc.pagoAdministracion + fila.pagoAdministracion,
      jugadoSobrantes: acc.jugadoSobrantes + fila.jugadoSobrantes,
    }),
    {
      decimos: 0,
      papeletasEmitidas: 0,
      papeletasSocios: 0,
      restantes: 0,
      recaudacionSocios: 0,
      importeJugadoSocios: 0,
      beneficioSocios: 0,
      pagoAdministracion: 0,
      jugadoSobrantes: 0,
    }
  );

  const colorTitulo =
    tipo === "Falla" ? "text-red-900 border-red-900" : "text-blue-900 border-blue-900";

  return (
    <section className="mb-10 break-after-page">
      <h2 className={`mb-3 border-b-4 pb-2 text-xl font-bold ${colorTitulo}`}>
        {titulo}
      </h2>

      <div className="mb-5 grid grid-cols-5 gap-3">
        <div className="border bg-zinc-100 p-2">
        <div className="text-zinc-500 text-xs">Recaudación</div>
        <div className="mt-1 text-lg font-bold">{euros(totales.recaudacionSocios)}</div>
        </div>

        <div className="border bg-zinc-100 p-2">
        <div className="text-zinc-500 text-xs">Jugado socios</div>
        <div className="mt-1 text-lg font-bold">{euros(totales.importeJugadoSocios)}</div>
        </div>

        <div className="border bg-zinc-100 p-2">
        <div className="text-zinc-500 text-xs">Beneficio socios</div>
        <div className="mt-1 text-lg font-bold">{euros(totales.beneficioSocios)}</div>
        </div>

        <div className="border bg-zinc-100 p-2">
        <div className="text-zinc-500 text-xs">Pago administración</div>
        <div className="mt-1 text-lg font-bold">{euros(totales.pagoAdministracion)}</div>
        </div>

        <div className="border bg-zinc-100 p-2">
        <div className="text-zinc-500 text-xs">Jugado sobrantes</div>
        <div className="mt-1 text-lg font-bold">{euros(totales.jugadoSobrantes)}</div>
        </div>
      </div>

      <table className="w-full border-collapse text-xs">
      <thead>
  <tr className="bg-zinc-100">
    <th className="w-24 border px-2 py-3 text-left text-[11px] font-semibold">Fecha</th>

    <th className="w-28 border px-2 py-3 text-center text-[11px] font-semibold">
      Número
    </th>

    <th className="w-16 border px-2 py-3 text-center text-[11px] font-semibold">
      Déc.
    </th>

    <th className="w-24 border px-2 py-3 text-right text-[11px] font-semibold">
      Precio déc.
    </th>

    <th className="w-24 border px-2 py-3 text-right text-[11px] font-semibold">
      Precio pap.
    </th>

    <th className="w-24 border px-2 py-3 text-right text-[11px] font-semibold">
      Benef. pap.
    </th>

    <th className="w-24 border px-2 py-3 text-right text-[11px] font-semibold">
      Premio pap.
    </th>

    <th className="w-20 border bg-yellow-50 px-2 py-3 text-center text-[11px] font-semibold">
      Emit.
    </th>

    <th className="w-20 border bg-yellow-50 px-2 py-3 text-center text-[11px] font-semibold">
      Socios
    </th>

    <th className="w-20 border bg-yellow-50 px-2 py-3 text-center text-[11px] font-semibold">
      Rest.
    </th>

    <th className="w-28 border bg-red-50 px-2 py-3 text-right text-[11px] font-semibold">
      Recaud.
    </th>

    <th className="w-28 border bg-red-50 px-2 py-3 text-right text-[11px] font-semibold">
      Jugado socios
    </th>

    <th className="w-24 border bg-red-50 px-2 py-3 text-right text-[11px] font-semibold">
      Beneficio
    </th>

    <th className="w-28 border bg-red-50 px-2 py-3 text-right text-[11px] font-semibold">
      Pago adm.
    </th>

    <th className="w-28 border bg-red-50 px-2 py-3 text-right text-[11px] font-semibold">
      Jugado sobr.
    </th>
  </tr>
</thead>

        <tbody>
          {filas.map((fila, index) => (
            <tr key={`${fila.fecha}-${index}`}>
            <td className="w-24 border px-2 py-2">{fila.fecha}</td>
          
            <td className="w-28 border px-2 py-2 text-center font-medium">
              {fila.numero}
            </td>
          
            <td className="w-16 border px-2 py-2 text-center">
              {fila.decimos}
            </td>
          
            <td className="w-24 border px-2 py-2 text-right whitespace-nowrap">
              {euros(fila.precioDecimo)}
            </td>
          
            <td className="w-24 border px-2 py-2 text-right whitespace-nowrap">
              {euros(fila.importePapeleta)}
            </td>
          
            <td className="w-24 border px-2 py-2 text-right whitespace-nowrap">
              {euros(fila.beneficioPapeleta)}
            </td>
          
            <td className="w-24 border px-2 py-2 text-right whitespace-nowrap">
              {euros(fila.premioPapeleta)}
            </td>
          
            <td className="w-20 border bg-yellow-50 px-2 py-2 text-center">
              {fila.papeletasEmitidas}
            </td>
          
            <td className="w-20 border bg-yellow-50 px-2 py-2 text-center font-semibold">
              {fila.papeletasSocios}
            </td>
          
            <td className="w-20 border bg-yellow-50 px-2 py-2 text-center">
              {fila.restantes}
            </td>
          
            <td className="w-28 border bg-red-50 px-2 py-2 text-right whitespace-nowrap">
              {euros(fila.recaudacionSocios)}
            </td>
          
            <td className="w-28 border bg-red-50 px-2 py-2 text-right whitespace-nowrap">
              {euros(fila.importeJugadoSocios)}
            </td>
          
            <td className="w-24 border bg-red-50 px-2 py-2 text-right whitespace-nowrap font-semibold">
              {euros(fila.beneficioSocios)}
            </td>
          
            <td className="w-28 border bg-red-50 px-2 py-2 text-right whitespace-nowrap">
              {euros(fila.pagoAdministracion)}
            </td>
          
            <td className="w-28 border bg-red-50 px-2 py-2 text-right whitespace-nowrap">
              {euros(fila.jugadoSobrantes)}
            </td>
          </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}