"use client";

import React, { useState } from "react";

export default function AdministracionNavidadModal({
    abierto,
    onClose,
    entregas,
    pagos,
    totalAdministracion,
totalPagadoAdministracion,
pendienteAdministracion,
    precioDecimoFalla,
    precioDecimoVirgen,
    onRegistrar,
    onActualizar,
    eliminarEntregaAdministracion,
    guardarPagoAdministracion,
    actualizarPagoAdministracion,
    eliminarPagoAdministracion,
  }: any) {

  const hoy = new Date().toISOString().slice(0, 10);

  const [nuevaEntrega, setNuevaEntrega] = useState({
    Fecha: hoy,
    Tipo: "FALLA",
    Decimos: 0,
    PapeletasEmitidas: 0,
    Importe: 0,
    Observaciones: "",
  });

  const [pagoEntregaAbierta, setPagoEntregaAbierta] =
  useState<number | null>(null);

const [nuevoPago, setNuevoPago] = useState({
  Fecha: hoy,
  Importe: "",
  Observaciones: "",
});

const [pagoAdministracionEditando, setPagoAdministracionEditando] =
  useState<any>(null);

  const [idEntregaEditando, setIdEntregaEditando] =
  useState<number | null>(null);

  function editarEntregaAdministracion(fila: any) {
    setIdEntregaEditando(Number(fila.ID));
  
    setNuevaEntrega({
      Fecha: fila.Fecha || hoy,
      Tipo: fila.Tipo || "FALLA",
      Decimos: Number(fila.Decimos || 0),
      PapeletasEmitidas: Number(fila.PapeletasEmitidas || 0),
      Importe: Number(fila.Importe || 0),
      Observaciones: fila.Observaciones || "",
    });
  }

  const precioDecimoActual =
  nuevaEntrega?.Tipo === "VIRGEN"
    ? Number(precioDecimoVirgen || 0)
    : Number(precioDecimoFalla || 0);

    const importeCalculado =
  Number(nuevaEntrega.Decimos || 0) * precioDecimoActual;

  async function registrarEntrega() {
    if (!nuevaEntrega.Fecha) {
      alert("Selecciona una fecha.");
      return;
    }
  
    if (Number(nuevaEntrega.Decimos || 0) <= 0) {
      alert("Introduce el número de décimos.");
      return;
    }
  
    let guardado;
  
    if (idEntregaEditando !== null) {
      guardado = await onActualizar(
        idEntregaEditando,
        nuevaEntrega
      );
    } else {
      guardado = await onRegistrar({
        ...nuevaEntrega,
        Importe: importeCalculado,
      });
    }
  
    if (!guardado) return;
  
    setNuevaEntrega({
      Fecha: hoy,
      Tipo: "FALLA",
      Decimos: 0,
      PapeletasEmitidas: 0,
      Importe: 0,
      Observaciones: "",
    });
  
    setIdEntregaEditando(null);
  }

  function euros(valor: number) {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(Number(valor || 0));
  }

  function totalPagadoEntrega(idEntrega: number) {
    return pagos
      .filter(
        (pago: any) =>
          Number(pago.IDEntrega) === Number(idEntrega)
      )
      .reduce(
        (total: number, pago: any) =>
          total + Number(pago.Importe || 0),
        0
      );
  }

  const totalDecimos = entregas.reduce(
    (total: number, entrega: any) =>
      total + Number(entrega.Decimos || 0),
    0
  );

  const totalPapeletas = entregas.reduce(
    (total: number, entrega: any) =>
      total + Number(entrega.PapeletasEmitidas || 0),
    0
  );

  const totalImporte = entregas.reduce(
    (total: number, entrega: any) =>
      total + Number(entrega.Importe || 0),
    0
  );

  const totalPagado = pagos.reduce(
    (total: number, pago: any) =>
      total + Number(pago.Importe || 0),
    0
  );

  const totalPendiente = Math.max(
    0,
    totalImporte - totalPagado
  );

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">

        {/* CABECERA */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">
              Administración de Loterías · Navidad
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Compra de décimos y pagos realizados a la Administración.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1 text-xl text-zinc-500 hover:bg-zinc-100"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-4">

        <div className="mb-2 text-sm font-semibold text-zinc-700">
  Totales Falla + Virgen
</div>

        {/* TOTALES */}
<div className="mb-4 overflow-hidden rounded border border-zinc-200 bg-zinc-50">
<div className="grid grid-cols-5 divide-x divide-zinc-200 text-center text-sm">
    <div className="px-2 py-2">
      <div className="text-zinc-500">Décimos</div>
      <div className="mt-0.5 font-semibold text-zinc-900">
        {totalDecimos}
      </div>
    </div>

    <div className="px-2 py-2">
      <div className="text-zinc-500">Papeletas</div>
      <div className="mt-0.5 font-semibold text-zinc-900">
        {totalPapeletas}
      </div>
    </div>

    <div className="px-2 py-2">
      <div className="text-zinc-500">Total</div>
      <div className="mt-0.5 font-semibold text-zinc-900">
      {euros(totalAdministracion)}
      </div>
    </div>

    <div className="px-2 py-2">
      <div className="text-zinc-500">Pagado</div>
      <div className="mt-0.5 font-semibold text-green-700">
      {euros(totalPagadoAdministracion)}
      </div>
    </div>

    <div className="px-2 py-2">
      <div className="text-zinc-500">Pendiente</div>
      <div className="mt-0.5 font-semibold text-red-700">
      {euros(pendienteAdministracion)}
      </div>
    </div>
  </div>
</div>

          {/* NUEVA COMPRA */}
          <div className="mb-6 rounded border border-zinc-200 bg-zinc-50 p-4">
            <h3 className="mb-3 font-semibold text-zinc-900">
             Décimos: compra y edición
            </h3>

            <div className="grid grid-cols-6 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">
                  Fecha
                </label>

                <input
                  type="date"
                  value={nuevaEntrega.Fecha}
                  onChange={(e) =>
                    setNuevaEntrega({
                      ...nuevaEntrega,
                      Fecha: e.target.value,
                    })
                  }
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">
                  Tipo
                </label>

                <select
                  value={nuevaEntrega.Tipo}
                  onChange={(e) =>
                    setNuevaEntrega({
                      ...nuevaEntrega,
                      Tipo: e.target.value,
                    })
                  }
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="FALLA">Falla</option>
                  <option value="VIRGEN">Virgen</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">
                  Décimos
                </label>

                <input
                  type="number"
                  min="0"
                  value={nuevaEntrega.Decimos}
                  onChange={(e) =>
                    setNuevaEntrega({
                      ...nuevaEntrega,
                      Decimos: Number(e.target.value),
                    })
                  }
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">
                  Papeletas emitidas
                </label>

                <input
                  type="number"
                  min="0"
                  value={nuevaEntrega.PapeletasEmitidas}
                  onChange={(e) =>
                    setNuevaEntrega({
                      ...nuevaEntrega,
                      PapeletasEmitidas: Number(e.target.value),
                    })
                  }
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
  <label className="mb-1 block text-xs font-medium text-zinc-600">
    Importe
  </label>

  <div className="flex h-[38px] items-center justify-end rounded bg-zinc-100 px-3 text-sm font-semibold text-zinc-800">
    {euros(importeCalculado)}
  </div>
</div>

              <div className="flex items-end">
              <div className="flex items-center justify-end gap-1.5">
  <button
    type="button"
    onClick={registrarEntrega}
    title={idEntregaEditando !== null ? "Guardar cambios" : "Registrar"}
    className="whitespace-nowrap rounded bg-red-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-800"
  >
    {idEntregaEditando !== null
      ? "💾 Guardar"
      : "+ Nueva comprar"}
  </button>

  {idEntregaEditando !== null && (
    <button
      type="button"
      title="Cancelar edición"
      onClick={() => {
        setIdEntregaEditando(null);

        setNuevaEntrega({
          Fecha: hoy,
          Tipo: "FALLA",
          Decimos: 0,
          PapeletasEmitidas: 0,
          Importe: 0,
          Observaciones: "",
        });
      }}
      className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 bg-white text-sm font-bold text-zinc-600 hover:bg-zinc-100"
    >
      ✕
    </button>
  )}
</div>
              </div>
            </div>
          </div>

          {/* HISTÓRICO */}
<div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.35fr_1fr]">

{/* =========================
    COMPRAS ADMINISTRACIÓN
========================== */}
<div className="min-w-0">
  <h3 className="mb-2 font-semibold text-zinc-900">
    Décimos comprados
  </h3>

  <div className="overflow-x-auto rounded border border-zinc-200">
    <table className="w-full text-xs">
      <thead className="bg-zinc-100">
        <tr>
          <th className="px-2 py-2 text-left">Fecha</th>
          <th className="px-2 py-2 text-center">Tipo</th>
          <th className="px-2 py-2 text-right">Décimos</th>
          <th className="px-2 py-2 text-right">Papeletas</th>
          <th className="px-2 py-2 text-right">Importe</th>
          <th className="px-2 py-2 text-center">Acciones</th>
        </tr>
      </thead>

      <tbody>
        {entregas.length === 0 ? (
          <tr>
            <td
              colSpan={6}
              className="px-3 py-6 text-center text-zinc-500"
            >
              Todavía no hay décimos comprados.
            </td>
          </tr>
        ) : (
          entregas.map((fila: any) => (
            <tr
              key={fila.ID}
              className="border-t border-zinc-200"
            >
              <td className="whitespace-nowrap px-2 py-2">
                {fila.Fecha
                  ? fila.Fecha.split("-").reverse().join("/")
                  : ""}
              </td>

              <td className="px-2 py-2 text-center">
                {fila.Tipo === "FALLA" ? "Falla" : "Virgen"}
              </td>

              <td className="px-2 py-2 text-right">
                {fila.Decimos}
              </td>

              <td className="px-2 py-2 text-right">
                {fila.PapeletasEmitidas}
              </td>

              <td className="whitespace-nowrap px-2 py-2 text-right">
                {euros(fila.Importe)}
              </td>

              <td className="px-2 py-2 text-center">
  <div className="flex justify-center gap-1">
    <button
      type="button"
      onClick={() =>
        editarEntregaAdministracion(fila)
      }
      title="Editar compra"
      className="rounded bg-zinc-100 px-2 py-1 hover:bg-zinc-200"
    >
      ✏️
    </button>

    <button
      type="button"
      onClick={() =>
        eliminarEntregaAdministracion(fila.ID)
      }
      title="Eliminar compra"
      className="rounded bg-zinc-100 px-2 py-1 hover:bg-red-50"
    >
      🗑️
    </button>
  </div>
</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>


{/* =========================
    PAGOS ADMINISTRACIÓN
========================== */}
<div className="min-w-0">
  <div className="mb-2 flex items-center justify-between gap-2">
    <h3 className="font-semibold text-zinc-900">
      Pagos a la Administración
    </h3>

    <button
      type="button"
      onClick={() => {
        setPagoAdministracionEditando(null);
      
        setNuevoPago({
          Fecha: hoy,
          Importe: "",
          Observaciones: "",
        });
      
        setPagoEntregaAbierta(0);
      }}
      className="whitespace-nowrap rounded bg-red-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-950"
    >
      + Registrar pago
    </button>
  </div>

  {/* NUEVO PAGO */}
  {pagoEntregaAbierta !== null && (
    <div className="mb-3 rounded border border-zinc-200 bg-zinc-50 p-3">
      <div className="mb-2 text-xs font-semibold uppercase text-zinc-700">
        Registrar pago
      </div>

      <div className="grid grid-cols-2 gap-2">

        <div>
          <label className="mb-1 block text-[11px] text-zinc-600">
            Fecha
          </label>

          <input
            type="date"
            value={nuevoPago.Fecha}
            onChange={(e) =>
              setNuevoPago({
                ...nuevoPago,
                Fecha: e.target.value,
              })
            }
            className="w-full border border-zinc-300 bg-white px-2 py-1.5 text-xs"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-zinc-600">
            Importe
          </label>

          <input
            type="number"
            step="0.01"
            min={0}
            value={nuevoPago.Importe}
            onChange={(e) =>
              setNuevoPago({
                ...nuevoPago,
                Importe: e.target.value,
              })
            }
            className="w-full border border-zinc-300 bg-white px-2 py-1.5 text-xs"
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1 block text-[11px] text-zinc-600">
            Observaciones
          </label>

          <input
            type="text"
            value={nuevoPago.Observaciones}
            onChange={(e) =>
              setNuevoPago({
                ...nuevoPago,
                Observaciones: e.target.value,
              })
            }
            placeholder="Opcional..."
            className="w-full border border-zinc-300 bg-white px-2 py-1.5 text-xs"
          />
        </div>

        <div className="col-span-2 flex justify-end gap-1">
          <button
            type="button"
            onClick={async () => {
              const ok = pagoAdministracionEditando
  ? await actualizarPagoAdministracion(
      pagoAdministracionEditando.ID,
      nuevoPago
    )
  : await guardarPagoAdministracion(nuevoPago);

              if (ok) {
                setPagoEntregaAbierta(null);
                setPagoAdministracionEditando(null);

                setNuevoPago({
                  Fecha: hoy,
                  Importe: "",
                  Observaciones: "",
                });
              }
            }}
            className="rounded bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800"
          >
            {pagoAdministracionEditando ? "Actualizar pago" : "Guardar pago"}
          </button>

          <button
            type="button"
            onClick={() => setPagoEntregaAbierta(null)}
            className="rounded bg-zinc-200 px-2 py-1.5 text-xs hover:bg-zinc-300"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )}

  {/* HISTORIAL PAGOS */}
  <div className="overflow-x-auto rounded border border-zinc-200">
    <table className="w-full text-xs">
      <thead className="bg-zinc-100">
        <tr>
          <th className="px-2 py-2 text-left">Fecha</th>
          <th className="px-2 py-2 text-right">Importe</th>
          <th className="px-2 py-2 text-left">Observaciones</th>
          <th className="px-2 py-2 text-center">Acciones</th>
        </tr>
      </thead>

      <tbody>
        {pagos.length === 0 ? (
          <tr>
            <td
              colSpan={4}
              className="px-3 py-6 text-center text-zinc-500"
            >
              Todavía no hay pagos registrados.
            </td>
          </tr>
        ) : (
          pagos.map((pago: any) => (
            <tr
              key={pago.ID}
              className="border-t border-zinc-200"
            >
              <td className="whitespace-nowrap px-2 py-2">
                {pago.Fecha
                  ? pago.Fecha.split("-").reverse().join("/")
                  : "—"}
              </td>

              <td className="whitespace-nowrap px-2 py-2 text-right font-medium">
                {euros(pago.Importe)}
              </td>

              <td className="px-2 py-2">
                {pago.Observaciones || "—"}
              </td>

              <td className="px-2 py-2 text-center">
  <div className="flex justify-center gap-1">
    <button
      type="button"
      onClick={() => {
        setPagoAdministracionEditando(pago);
        setNuevoPago({
          Fecha: pago.Fecha || hoy,
          Importe: String(pago.Importe ?? ""),
          Observaciones: pago.Observaciones || "",
        });
        setPagoEntregaAbierta(0);
      }}
      title="Editar pago"
      className="rounded bg-zinc-100 px-2 py-1 hover:bg-zinc-200"
    >
      ✏️
    </button>

    <button
      type="button"
      onClick={() => eliminarPagoAdministracion(pago.ID)}
      title="Eliminar pago"
      className="rounded bg-zinc-100 px-2 py-1 hover:bg-red-50"
    >
      🗑️
    </button>
  </div>
</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>


          </div>

        </div>
      </div>
    </div>
  );
}