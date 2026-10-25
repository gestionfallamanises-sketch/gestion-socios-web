
"use client";
import React, { useEffect, useState } from "react";

function contarNumeros(texto: string): number | null {
  if (!texto?.trim()) return 0;
  let total = 0;
  const partes: Array<[number, number]> = [];
  for (const segmento of texto.split(/[,/;]/)) {
    const m = segmento.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) return null;
    const desde = Number(m[1]);
    const hasta = m[2] ? Number(m[2]) : desde;
    if (hasta < desde || hasta > 2147483646) return null;
    if (partes.some(([a,b]) => desde <= b && a <= hasta)) return null;
    partes.push([desde, hasta]);
    total += hasta - desde + 1;
  }
  return total;
}

type FilaIntervalo = { desde: string; hasta: string };

function leerFilas(serie: string): FilaIntervalo[] {
  const partes = (serie || "").split(/[,/;]/).map(x => x.trim()).filter(Boolean);
  if (!partes.length) return [{ desde: "", hasta: "" }];
  return partes.map(parte => {
    const m = parte.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    return m ? { desde: m[1], hasta: m[2] || "" } : { desde: parte, hasta: "" };
  });
}

function escribirFilas(filas: FilaIntervalo[]): string {
  return filas.map(f => f.desde.trim()
    ? `${f.desde.trim()}${f.hasta.trim() ? `-${f.hasta.trim()}` : ""}`
    : "").filter(Boolean).join(", ");
}

function EditorIntervalos({ serie, onChange }: {
  serie: string;
  onChange: (serie: string) => void;
}) {
  const [filas, setFilas] = useState<FilaIntervalo[]>(() => leerFilas(serie));

  // Permite cambiar de entrega en el historial sin arrastrar filas de otra.
  // Conserva las filas vacías que el usuario acaba de añadir.
  useEffect(() => {
    if (escribirFilas(filas) !== (serie || "").trim()) {
      setFilas(leerFilas(serie));
    }
  }, [serie]);

  function actualizar(nuevas: FilaIntervalo[]) {
    setFilas(nuevas);
    onChange(escribirFilas(nuevas));
  }

  return (
    <div className="space-y-1">
      {filas.map((fila, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_26px] gap-2 items-end">
          <div>
            {i === 0 && <label className="mb-1 block text-[11px] font-semibold text-zinc-600">Desde</label>}
            <input type="text" inputMode="numeric" value={fila.desde} placeholder="0001"
              onChange={e => actualizar(filas.map((f, n) => n === i ? {...f, desde: e.target.value} : f))}
              className="w-full min-w-0 border border-zinc-300 bg-white px-2 py-1.5 text-sm" />
          </div>
          <div>
            {i === 0 && <label className="mb-1 block text-[11px] font-semibold text-zinc-600">Hasta</label>}
            <input type="text" inputMode="numeric" value={fila.hasta} placeholder="Opcional"
              onChange={e => actualizar(filas.map((f, n) => n === i ? {...f, hasta: e.target.value} : f))}
              className="w-full min-w-0 border border-zinc-300 bg-white px-2 py-1.5 text-sm" />
          </div>
          {i > 0 ? <button type="button" title="Quitar intervalo"
            onClick={() => actualizar(filas.filter((_, n) => n !== i))}
            className="h-8 text-red-800 hover:bg-red-50">×</button> : <div />}
        </div>
      ))}
      <button type="button" onClick={() => setFilas([...filas, { desde: "", hasta: "" }])}
        className="mt-1 text-[11px] font-semibold text-red-900 hover:underline">+ Añadir intervalo</button>
    </div>
  );
}

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
        seleccionarVendedorExterno,
        limpiarSeleccionVendedor,
        vendedoresExternos = [],
        guardarEntrega,
        precioFalla = 0,
        precioVirgen = 0,
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

  const [cobrarAhora, setCobrarAhora] = useState(false);
  const [importeManual, setImporteManual] = useState("");
  const [fechaCobro, setFechaCobro] = useState(new Date().toISOString().slice(0,10));
  const totalNuevaEntrega = Math.max(0, Number(entrega.PapeletasFalla || 0) - Number(entrega.DevueltasFalla || 0)) * Number(precioFalla) + Math.max(0, Number(entrega.PapeletasVirgen || 0) - Number(entrega.DevueltasVirgen || 0)) * Number(precioVirgen);
  const importeCobro = importeManual === "" ? totalNuevaEntrega : Number(importeManual);
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

   <div className="rounded border border-zinc-200 bg-zinc-50 p-3">
    <label className="mb-1 block text-xs font-semibold text-zinc-700">
      Vendedor externo (si no es socio)
    </label>
    <input
      type="text"
      value={entrega.NUMCENS ? "" : (entrega.NombreExterno || "")}
      disabled={Boolean(movimientoEditando)}
      onChange={(e) => {
        limpiarSeleccionVendedor?.();
        setBusquedaSocio("");
        setEntrega({ ...entrega, NUMCENS: null, NombreExterno: e.target.value });
      }}
      placeholder="Nombre del vendedor o comprador externo"
      className="w-full border border-zinc-300 bg-white px-3 py-1.5 text-sm"
    />
    {!entrega.NUMCENS && entrega.NombreExterno?.trim() &&
      vendedoresExternos.filter((fila: any) =>
        (fila.NombreExterno || "").toLocaleLowerCase("es").includes(entrega.NombreExterno.toLocaleLowerCase("es"))
      ).slice(0,5).map((fila: any) => (
        <button type="button" key={fila.ID}
          onClick={() => seleccionarVendedorExterno(fila)}
          className="mt-1 mr-2 border border-zinc-200 bg-white px-2 py-1 text-xs hover:bg-zinc-100">
          Utilizar ficha existente: {fila.NombreExterno}
        </button>
      ))}
    <p className="mt-1 text-[11px] text-zinc-500">Para vender papeletas sueltas, escribe aquí el nombre y registra cada número individual.</p>
  </div>

{/* PAPELETAS FALLA + VIRGEN */}
<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
  {([
    { titulo: "Falla", serie: "SerieFalla", papeletas: "PapeletasFalla", devueltas: "DevueltasFalla" },
    { titulo: "Virgen", serie: "SerieVirgen", papeletas: "PapeletasVirgen", devueltas: "DevueltasVirgen" },
  ] as const).map(tipo => (
    <div key={tipo.titulo} className="rounded border border-zinc-200 bg-zinc-50/40 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-700">{tipo.titulo}</div>
      <div className="grid grid-cols-[78px_78px_minmax(0,1fr)] gap-2 items-start">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-zinc-600">Papeletas</label>
          <input type="number" min={0} value={entrega[tipo.papeletas] ?? 0}
            onChange={e => setEntrega((anterior: any) => ({...anterior, [tipo.papeletas]: Number(e.target.value)}))}
            className="w-full min-w-0 border border-zinc-300 bg-white px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-zinc-600">Devueltas</label>
          <input type="number" min={0} value={entrega[tipo.devueltas] ?? 0}
            onChange={e => setEntrega((anterior: any) => ({...anterior, [tipo.devueltas]: Number(e.target.value)}))}
            className="w-full min-w-0 border border-zinc-300 bg-white px-2 py-1.5 text-sm" />
        </div>
        <EditorIntervalos serie={entrega[tipo.serie] || ""}
          onChange={serie => {
            const cantidad = contarNumeros(serie);
            setEntrega((anterior: any) => ({...anterior, [tipo.serie]: serie,
              ...(cantidad !== null ? {[tipo.papeletas]: cantidad} : {})}));
          }} />
      </div>
    </div>
  ))}
</div>

{!movimientoEditando && (
  <div className="mt-2 flex flex-wrap items-center gap-3 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs">
    <label className="flex items-center gap-2 font-medium">
      <input type="checkbox" checked={cobrarAhora} onChange={(e) => setCobrarAhora(e.target.checked)} /> Cobrar ahora
    </label>
    {cobrarAhora && <>
      <label>Importe € <input type="number" min={0.01} step="0.01" value={importeManual === "" ? totalNuevaEntrega.toFixed(2) : importeManual}
        onChange={(e) => setImporteManual(e.target.value)} className="ml-1 w-24 border border-zinc-300 px-2 py-1" /></label>
      <label>Fecha <input type="date" value={fechaCobro} onChange={(e) => setFechaCobro(e.target.value)} className="ml-1 border border-zinc-300 px-2 py-1" /></label>
    </>}
  </div>
)}
<div className="mt-3 flex justify-end">
  <button
    type="button"
    onClick={async () => { const ok = await guardarEntrega(cobrarAhora && !movimientoEditando ? { importe: importeCobro, fecha: fechaCobro } : null); if (ok) { setCobrarAhora(false); setImporteManual(""); } }}
    className="rounded bg-red-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-950"
  >
    {movimientoEditando
      ? "💾 Guardar cambios"
      : cobrarAhora ? "💾 Guardar y cobrar" : "💾 Guardar entrega"}
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
