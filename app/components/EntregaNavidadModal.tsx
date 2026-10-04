"use client";
import React from "react";

export default function EntregaNavidadModal(props: any) {
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
        editarMovimiento,
        eliminarMovimiento,
        movimientoEditando,
        movimientosEntrega,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
  
        <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden border border-zinc-200 bg-white shadow-xl">
  
          {/* CABECERA */}
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-5 py-3">
          <h2 className="text-lg font-semibold">
  {movimientoEditando
    ? "Editar entrega de Navidad"
    : entregaEditando
      ? "Nueva entrega para este socio"
      : "Nueva entrega de Navidad"}
</h2>
  
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-lg text-zinc-500 hover:bg-zinc-100"
              title="Cerrar"
            >
              ×
            </button>
          </div>
  
          {/* CONTENIDO */}
          <div className="overflow-y-auto p-4">
  
            <div className="space-y-3">
  
              {/* SOCIO + FECHA + RECIBO */}
              <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[minmax(0,1fr)_155px_125px]">
  
                {/* SOCIO */}
                <div className="relative min-w-0">
                  <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
                    Socio
                  </label>
  
                  <input
                    autoFocus
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
                    className="w-full border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-red-900"
                  />
  
                  {busquedaSocio && !entrega.NUMCENS && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto border border-zinc-200 bg-white shadow-lg">
  
                      {sociosFiltrados(busquedaSocio).map(
                        (socio: any) => (
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
                        )
                      )}
  
                    </div>
                  )}
                </div>
  
                {/* FECHA */}
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
                    className="w-full border border-zinc-300 px-2 py-1.5 text-sm"
                  />
                </div>
  
                {/* RECIBO */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
                    Recibo nº
                  </label>
  
                  <input
                    type="text"
                    value={entrega.Recibo ?? ""}
                    onChange={(e) =>
                      setEntrega({
                        ...entrega,
                        Recibo: e.target.value,
                      })
                    }
                    placeholder="Nº recibo"
                    className="w-full border border-zinc-300 px-2 py-1.5 text-sm"
                  />
                </div>
  
              </div>

 {/* PAPELETAS FALLA + VIRGEN */}
<div className="grid grid-cols-1 gap-3 md:grid-cols-2">

{/* FALLA */}
<div className="rounded border border-zinc-200 bg-zinc-50/40 p-3">

  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-700">
    Falla
  </div>

  <div className="grid grid-cols-[90px_90px_1fr] gap-2">

    <div>
      <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
        Papeletas
      </label>

      <input
        type="number"
        min={0}
        value={entrega.PapeletasFalla ?? 0}
        onChange={(e) =>
          setEntrega({
            ...entrega,
            PapeletasFalla: Number(e.target.value),
          })
        }
        className="w-full border border-zinc-300 bg-white px-2 py-1.5 text-sm"
      />
    </div>

    <div>
      <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
        Devueltas
      </label>

      <input
        type="number"
        min={0}
        value={entrega.DevueltasFalla ?? 0}
        onChange={(e) =>
          setEntrega({
            ...entrega,
            DevueltasFalla: Number(e.target.value),
          })
        }
        className="w-full border border-zinc-300 bg-white px-2 py-1.5 text-sm"
      />
    </div>

    <div>
      <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
        Serie
      </label>

      <input
        type="text"
        value={entrega.SerieFalla ?? ""}
        onChange={(e) =>
          setEntrega({
            ...entrega,
            SerieFalla: e.target.value,
          })
        }
        placeholder="001-500"
        className="w-full border border-zinc-300 bg-white px-2 py-1.5 text-sm"
      />
    </div>

  </div>
</div>

{/* VIRGEN */}
<div className="rounded border border-zinc-200 bg-zinc-50/40 p-3">

  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-700">
    Virgen
  </div>

  <div className="grid grid-cols-[90px_90px_1fr] gap-2">

    <div>
      <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
        Papeletas
      </label>

      <input
        type="number"
        min={0}
        value={entrega.PapeletasVirgen ?? 0}
        onChange={(e) =>
          setEntrega({
            ...entrega,
            PapeletasVirgen: Number(e.target.value),
          })
        }
        className="w-full border border-zinc-300 bg-white px-2 py-1.5 text-sm"
      />
    </div>

    <div>
      <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
        Devueltas
      </label>

      <input
        type="number"
        min={0}
        value={entrega.DevueltasVirgen ?? 0}
        onChange={(e) =>
          setEntrega({
            ...entrega,
            DevueltasVirgen: Number(e.target.value),
          })
        }
        className="w-full border border-zinc-300 bg-white px-2 py-1.5 text-sm"
      />
    </div>

    <div>
      <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
        Serie
      </label>

      <input
        type="text"
        value={entrega.SerieVirgen ?? ""}
        onChange={(e) =>
          setEntrega({
            ...entrega,
            SerieVirgen: e.target.value,
          })
        }
        placeholder="001-500"
        className="w-full border border-zinc-300 bg-white px-2 py-1.5 text-sm"
      />
    </div>

  </div>
  
  
</div>

</div>

<div className="mt-3 flex justify-end">
  <button
    type="button"
    onClick={guardarEntrega}
    className="rounded bg-red-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-950"
  >
    {movimientoEditando
      ? "💾 Guardar cambios"
      : "💾 Guardar entrega"}
  </button>
</div>

{/* HISTORIAL DE ENTREGAS */}
{movimientosEntrega?.length > 0 && (
  <div className="mt-4 border border-zinc-200">
    <div className="border-b border-zinc-200 bg-zinc-100 px-3 py-2">
      <div className="text-xs font-semibold uppercase text-zinc-700">
        Historial de entregas
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full min-w-[950px] text-xs">
        <thead className="bg-zinc-50 text-zinc-600">
          <tr>
            <th className="px-2 py-2 text-left">
              Fecha
            </th>

            <th className="px-2 py-2 text-center">
              Falla
            </th>

            <th className="px-2 py-2 text-center">
              Dev.
            </th>

            <th className="px-2 py-2 text-left">
              Serie Falla
            </th>

            <th className="px-2 py-2 text-center">
              Virgen
            </th>

            <th className="px-2 py-2 text-center">
              Dev.
            </th>

            <th className="px-2 py-2 text-left">
              Serie Virgen
            </th>

            <th className="px-2 py-2 text-left">
              Recibo
            </th>

            <th className="px-2 py-2 text-left">
              Observaciones
            </th>

            <th className="px-2 py-2 text-center">
  Acciones
</th>
          </tr>
        </thead>

        <tbody>
          {movimientosEntrega.map((movimiento: any) => (
            <tr
              key={movimiento.ID}
              className="border-t border-zinc-200"
            >
              <td className="whitespace-nowrap px-2 py-2">
                {movimiento.FechaEntrega
                  ? movimiento.FechaEntrega
                      .split("-")
                      .reverse()
                      .join("/")
                  : ""}
              </td>

              <td className="px-2 py-2 text-center">
                {Number(movimiento.PapeletasFalla || 0)}
              </td>

              <td className="px-2 py-2 text-center">
                {Number(movimiento.DevueltasFalla || 0)}
              </td>

              <td className="px-2 py-2">
                {movimiento.SerieFalla || "—"}
              </td>

              <td className="px-2 py-2 text-center">
                {Number(movimiento.PapeletasVirgen || 0)}
              </td>

              <td className="px-2 py-2 text-center">
                {Number(movimiento.DevueltasVirgen || 0)}
              </td>

              <td className="px-2 py-2">
                {movimiento.SerieVirgen || "—"}
              </td>

              <td className="px-2 py-2">
                {movimiento.Recibo || "—"}
              </td>

              <td className="max-w-[180px] truncate px-2 py-2">
                {movimiento.Observaciones || "—"}
              </td>

              <td className="px-2 py-2 text-center">
  <div className="flex items-center justify-center gap-1">
    <button
      type="button"
      onClick={() => editarMovimiento(movimiento)}
      title="Editar entrega"
      className="rounded bg-zinc-100 px-2 py-1 text-sm hover:bg-zinc-200"
    >
      ✏️
    </button>

    <button
      type="button"
      onClick={() => eliminarMovimiento(movimiento)}
      title="Eliminar entrega"
      className="rounded bg-zinc-100 px-2 py-1 text-sm hover:bg-zinc-200"
    >
      🗑️
    </button>
  </div>
</td>
            </tr>
          ))}
        </tbody>

        <tfoot className="border-t-2 border-zinc-300 bg-zinc-50 font-semibold">
          <tr>
            <td className="px-2 py-2">
              Totales
            </td>

            <td className="px-2 py-2 text-center">
              {movimientosEntrega.reduce(
                (suma: number, m: any) =>
                  suma + Number(m.PapeletasFalla || 0),
                0
              )}
            </td>

            <td className="px-2 py-2 text-center">
              {movimientosEntrega.reduce(
                (suma: number, m: any) =>
                  suma + Number(m.DevueltasFalla || 0),
                0
              )}
            </td>

            <td />

            <td className="px-2 py-2 text-center">
              {movimientosEntrega.reduce(
                (suma: number, m: any) =>
                  suma + Number(m.PapeletasVirgen || 0),
                0
              )}
            </td>

            <td className="px-2 py-2 text-center">
              {movimientosEntrega.reduce(
                (suma: number, m: any) =>
                  suma + Number(m.DevueltasVirgen || 0),
                0
              )}
            </td>

            <td />
            <td />
            <td />
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
)}
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
              className="rounded bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-300"
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>
    
    </>
  );
}