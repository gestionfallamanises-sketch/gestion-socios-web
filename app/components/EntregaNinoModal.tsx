"use client";

export default function EntregaNinoModal(props: any) {
    const {
        abierto,
        onClose,
        entregaEditando,
        entrega,
        setEntrega,
        busquedaSocio,
        setBusquedaSocio,
        sociosFiltrados,
        textoSocio,
        seleccionarSocio,
        guardarEntrega,
        pagosEntrega,
totalPagado,
importeTotal,
pendiente,
abrirNuevoPago,
editarPago,
eliminarPago,
      } = props;

  if (!abierto) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-xl border border-zinc-200 bg-white shadow-xl">

          <div className="border-b border-zinc-200 px-6 py-4">
          <h2 className="text-lg font-semibold">
  {entregaEditando ? "Editar entrega" : "Nueva entrega de Niño"}
</h2>
          </div>

          <div className="space-y-4 p-5">

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Socio
              </label>

              <input
  type="text"
  value={busquedaSocio}
  onChange={(e) => {
    setBusquedaSocio(e.target.value);
    setEntrega({
        ...entrega,
        NUMCENS: null,
      });
  }}
  placeholder="Buscar socio..."
  className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
/>

{busquedaSocio && !entrega.NUMCENS && (
  <div className="mt-1 max-h-40 overflow-y-auto border border-zinc-200 bg-white">

    {sociosFiltrados(busquedaSocio).map((socio: any) => (
      <button
        key={socio.NUMCENS}
        type="button"
        onClick={() => seleccionarSocio(socio)}
        className="block w-full px-3 py-2 text-left text-sm hover:bg-red-50"
      >
        {textoSocio(socio)}

        {socio.ConLoteria ? (
          <span className="ml-2 text-xs text-green-700">
            Con lotería
          </span>
        ) : (
          <span className="ml-2 text-xs text-zinc-400">
            Sin lotería
          </span>
        )}
      </button>
    ))}

  </div>
)}
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

  <div>
    <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
      Fecha entrega
    </label>

    <input
      type="date"
      value={entrega.FechaEntrega ?? ""}
      onChange={(e) =>
        setEntrega({
          ...entrega,
          FechaEntrega: e.target.value,
        })
      }
      className="w-full border border-zinc-300 px-2 py-1 text-sm"
    />
  </div>

  <div>
    <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
      Papeletas
    </label>

    <input
      type="number"
      min={0}
      value={entrega.Papeletas}
      onChange={(e) =>
        setEntrega({
          ...entrega,
          Papeletas: Number(e.target.value),
        })
      }
      className="w-full border border-zinc-300 px-2 py-1 text-sm"
    />
  </div>

  <div>
    <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
      Devueltas
    </label>

    <input
      type="number"
      min={0}
      value={entrega.Devueltas ?? 0}
      onChange={(e) =>
        setEntrega({
          ...entrega,
          Devueltas: Number(e.target.value),
        })
      }
      className="w-full border border-zinc-300 px-2 py-1 text-sm"
    />
  </div>

  <div>
    <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
      Serie
    </label>

    <input
      type="text"
      value={entrega.Serie ?? ""}
      onChange={(e) =>
        setEntrega({
          ...entrega,
          Serie: e.target.value,
        })
      }
      placeholder="001-500"
      className="w-full border border-zinc-300 px-2 py-1 text-sm"
    />
  </div>

</div>

            <div className="border border-zinc-200">
  <div className="flex items-center justify-between bg-zinc-100 px-4 py-3">
    <h3 className="text-sm font-semibold uppercase text-zinc-700">
      Pagos
    </h3>

    <button
  type="button"
  onClick={abrirNuevoPago}
  disabled={!entregaEditando}
  className="rounded bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40"
>
  + Añadir pago
</button>
  </div>

  <div className="p-4">
    {!entregaEditando ? (
      <p className="text-sm text-zinc-500">
        Guarda primero la entrega para poder registrar pagos.
      </p>
    ) : pagosEntrega.length === 0 ? (
      <p className="text-sm text-zinc-500">
        No hay pagos registrados.
      </p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase">
                Fecha
              </th>

              <th className="px-3 py-2 text-right text-xs font-semibold uppercase">
                Importe
              </th>

              <th className="px-3 py-2 text-center text-xs font-semibold uppercase">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-200">
            {pagosEntrega.map((pago: any) => (
              <tr key={pago.ID}>
                <td className="px-3 py-2">
  {pago.FechaPago
    ? pago.FechaPago.split("-").reverse().join("/")
    : "—"}
</td>

                <td className="px-3 py-2 text-right font-medium">
                  {Number(pago.Importe || 0).toFixed(2)} €
                </td>

                <td className="px-3 py-2 text-center">
                  <div className="flex justify-center gap-2">
                  <button
  type="button"
  onClick={() => editarPago(pago)}
  className="rounded bg-zinc-100 px-2 py-1 hover:bg-zinc-200"
>
  ✏️
</button>

<button
  type="button"
  onClick={() => eliminarPago(pago.ID)}
  className="rounded bg-red-100 px-2 py-1 hover:bg-red-200"
>
  🗑️
</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

<div className="mt-4 flex items-center justify-end gap-6 border-t border-zinc-200 pt-3 text-sm">

<div>
  <span className="text-zinc-500">Total:</span>{" "}
  <span className="font-semibold">
  {Number(importeTotal || 0).toFixed(2)} €
  </span>
</div>

<div>
  <span className="text-zinc-500">Pagado:</span>{" "}
  <span className="font-semibold text-green-700">
  {Number(totalPagado || 0).toFixed(2)} €
  </span>
</div>

<div>
  <span className="text-zinc-500">Pendiente:</span>{" "}
  <span
    className={
      Number(pendiente || 0) > 0
        ? "font-semibold text-red-700"
        : "font-semibold text-green-700"
    }
  >
    {Number(pendiente || 0).toFixed(2)} €
  </span>
</div>

</div>
  </div>
</div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Observaciones
              </label>

              <textarea
  rows={2}
  value={entrega.Observaciones ?? ""}
  onChange={(e) =>
    setEntrega({
      ...entrega,
      Observaciones: e.target.value,
    })
  }
  className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
/>
            </div>

          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-200 px-6 py-4">
            <button
              onClick={onClose}
              className="bg-zinc-300 px-4 py-2 text-sm"
            >
              Cancelar
            </button>

            <button
            onClick={guardarEntrega}
              className="bg-red-900 px-4 py-2 text-sm text-white hover:bg-red-950"
            >
              Guardar
            </button>
          </div>

        </div>
      </div>
    </>
  );
}