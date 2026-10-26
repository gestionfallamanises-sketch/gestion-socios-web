"use client";

import React, { useMemo, useState } from "react";
import { exportarExcel as descargarExcel } from "@/lib/excel";

type Intervalo = { desde: number; hasta: number };
type Tramo = Intervalo & { tipo: string; estado: string; socio: string; recibo: string; fecha: string; movimiento: string };

function extraerIntervalos(texto: unknown): Intervalo[] | null {
  const serie = String(texto ?? "").trim();
  if (!serie) return [];
  const resultado: Intervalo[] = [];
  for (const parte of serie.split(/[,/;]/)) {
    const match = parte.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) return null;
    const desde = Number(match[1]);
    const hasta = Number(match[2] ?? match[1]);
    if (!Number.isSafeInteger(desde) || !Number.isSafeInteger(hasta) || desde < 1 || hasta < desde || hasta > 2147483646) return null;
    resultado.push({ desde, hasta });
  }
  return resultado;
}

function unir(intervalos: Intervalo[]): Intervalo[] {
  const orden = [...intervalos].sort((a, b) => a.desde - b.desde || a.hasta - b.hasta);
  const salida: Intervalo[] = [];
  for (const actual of orden) {
    const previo = salida[salida.length - 1];
    if (previo && actual.desde <= previo.hasta + 1) previo.hasta = Math.max(previo.hasta, actual.hasta);
    else salida.push({ ...actual });
  }
  return salida;
}

function restar(base: Intervalo[], ocupados: Intervalo[]): Intervalo[] {
  const resultado: Intervalo[] = [];
  const ocupadosUnidos = unir(ocupados);
  for (const segmento of unir(base)) {
    let inicio = segmento.desde;
    for (const usado of ocupadosUnidos) {
      if (usado.hasta < inicio) continue;
      if (usado.desde > segmento.hasta) break;
      if (usado.desde > inicio) resultado.push({ desde: inicio, hasta: Math.min(segmento.hasta, usado.desde - 1) });
      inicio = Math.max(inicio, usado.hasta + 1);
      if (inicio > segmento.hasta) break;
    }
    if (inicio <= segmento.hasta) resultado.push({ desde: inicio, hasta: segmento.hasta });
  }
  return resultado;
}

const cantidad = (tramos: Intervalo[]) => tramos.reduce((s, t) => s + t.hasta - t.desde + 1, 0);

export default function ControlSeriesModal({ abierto, onClose, sorteo, ejercicio, compras, movimientos, entregas, socios }: {
  abierto: boolean;
  onClose: () => void;
  sorteo: string;
  ejercicio: number | null;
  compras: any[];
  movimientos: any[];
  entregas: any[];
  socios: any[];
}) {
  const [tipo, setTipo] = useState<"FALLA" | "VIRGEN">("FALLA");
  const datos = useMemo(() => {
    const emisiones: Intervalo[] = [];
    const avisos: string[] = [];
    for (const compra of compras.filter(c => c.Tipo === tipo)) {
      if (compra.SerieDesde == null || compra.SerieHasta == null) {
        avisos.push(`Compra de Administración ID ${compra.ID}: falta indicar serie desde/hasta.`);
        continue;
      }
      const desde = Number(compra.SerieDesde), hasta = Number(compra.SerieHasta);
      if (!Number.isSafeInteger(desde) || !Number.isSafeInteger(hasta) || desde < 1 || hasta < desde) {
        avisos.push(`Compra ID ${compra.ID}: numeración de emisión incorrecta.`);
        continue;
      }
      if (hasta - desde + 1 !== Number(compra.PapeletasEmitidas)) avisos.push(`Compra ID ${compra.ID}: cantidad de papeletas diferente de la numeración.`);
      emisiones.push({ desde, hasta });
    }
    const emitidas = unir(emisiones);
    const idAEntrega = new Map(entregas.map(e => [Number(e.ID), e]));
    const sociosPorId = new Map(socios.map(s => [Number(s.NUMCENS), s]));
    const asignados: Tramo[] = [];
    for (const mov of movimientos) {
      const serie = tipo === "FALLA" ? mov.SerieFalla : mov.SerieVirgen;
      const intervalos = extraerIntervalos(serie);
      if (intervalos === null) {
        avisos.push(`Movimiento ID ${mov.ID}: serie ${tipo} no válida (${String(serie)}).`);
        continue;
      }
      const registro = idAEntrega.get(Number(mov.IDEntrega));
      const socio = sociosPorId.get(Number(registro?.NUMCENS));
      const nombre = registro?.NombreExterno || (socio ? `${socio.Apellidos || ""}, ${socio.Nombre || ""}` : `Ficha ID ${mov.IDEntrega}`);
      for (const tramo of intervalos) asignados.push({ ...tramo, tipo, estado: "Asignada", socio: nombre, recibo: String(mov.Recibo ?? ""), fecha: String(mov.FechaEntrega ?? ""), movimiento: String(mov.ID ?? "") });
    }
    asignados.sort((a,b) => a.desde - b.desde || a.hasta - b.hasta);
    for (let i = 0; i < asignados.length; i++) for (let j = i + 1; j < asignados.length && asignados[j].desde <= asignados[i].hasta; j++) {
      avisos.push(`Numeración repetida: movimientos ${asignados[i].movimiento} y ${asignados[j].movimiento}, números ${Math.max(asignados[i].desde, asignados[j].desde)}–${Math.min(asignados[i].hasta, asignados[j].hasta)}.`);
    }
    const usados = unir(asignados);
    const huecos = restar(emitidas, usados).map(x => ({ ...x, tipo, estado: "Sin asignar", socio: "", recibo: "", fecha: "", movimiento: "" }));
    const fuera = restar(usados, emitidas).map(x => ({ ...x, tipo, estado: "Fuera de emisión", socio: "", recibo: "", fecha: "", movimiento: "" }));
    return { emitidas, asignados, huecos, fuera, avisos, totalEmitidas: cantidad(emitidas), totalAsignadas: cantidad(emitidas) - cantidad(huecos) };
  }, [tipo, compras, movimientos, entregas, socios]);

  if (!abierto) return null;
  const exportar = () => {
    const filas = [...datos.asignados, ...datos.huecos, ...datos.fuera].sort((a,b) => a.desde - b.desde || a.estado.localeCompare(b.estado));
    descargarExcel({
      nombreArchivo: `control-series-${sorteo.toLowerCase()}-${ejercicio || "ejercicio"}-${tipo.toLowerCase()}.xlsx`,
      nombreHoja: `Control ${tipo}`,
      columnas: [
        { titulo: "Estado", campo: "estado", ancho: 20, tipo: "texto" },
        { titulo: "Tipo", campo: "tipo", ancho: 10, tipo: "texto" },
        { titulo: "Desde", campo: "desde", ancho: 12, tipo: "numero" },
        { titulo: "Hasta", campo: "hasta", ancho: 12, tipo: "numero" },
        { titulo: "Cantidad", campo: "cantidad", ancho: 12, tipo: "numero" },
        { titulo: "Socio / externo", campo: "socio", ancho: 36, tipo: "texto" },
        { titulo: "Recibo", campo: "recibo", ancho: 14, tipo: "texto" },
        { titulo: "Fecha", campo: "fecha", ancho: 14, tipo: "texto" },
        { titulo: "Movimiento ID", campo: "movimiento", ancho: 16, tipo: "texto" },
      ],
      datos: filas.map(f => ({ ...f, cantidad: f.hasta - f.desde + 1 })),
    });
  };
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-3">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col bg-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div><h2 className="font-bold text-lg">Control de series · {sorteo}</h2><p className="text-xs text-zinc-500">Ejercicio {ejercicio} · Se comprueba la emisión real de Administración, no solo el último número entregado.</p></div>
          <button type="button" onClick={onClose} className="rounded border px-3 py-1">Cerrar ×</button>
        </div>
        <div className="overflow-y-auto p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-semibold">Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value as "FALLA" | "VIRGEN")} className="border px-2 py-1 text-sm"><option value="FALLA">Falla</option><option value="VIRGEN">Virgen</option></select>
            <button type="button" onClick={exportar} className="ml-auto rounded bg-green-700 px-3 py-2 text-sm text-white">📗 Excel de control</button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-sm">
            <div className="border p-3"><div className="text-zinc-500">Emitidas con serie</div><strong>{datos.totalEmitidas.toLocaleString("es-ES")}</strong></div>
            <div className="border p-3"><div className="text-zinc-500">Asignadas dentro de emisión</div><strong>{datos.totalAsignadas.toLocaleString("es-ES")}</strong></div>
            <div className="border p-3"><div className="text-zinc-500">Sin asignar</div><strong>{cantidad(datos.huecos).toLocaleString("es-ES")}</strong></div>
            <div className="border p-3"><div className="text-zinc-500">Fuera de emisión</div><strong>{cantidad(datos.fuera).toLocaleString("es-ES")}</strong></div>
          </div>
          {datos.avisos.length > 0 && <div className="border border-amber-400 bg-amber-50 p-3 text-sm"><strong>Revisar datos</strong>{datos.avisos.map((a,i) => <p key={i}>{a}</p>)}</div>}
          <p className="text-xs text-zinc-600">Sin asignar significa que no consta en entregas; no implica que esté perdida. Las numeraciones devueltas siguen figurando como asignadas a la entrega.</p>
          <h3 className="text-sm font-semibold">Tramos sin asignar ({datos.huecos.length})</h3>
          <div className="max-h-48 overflow-auto border"><table className="w-full text-sm"><thead className="sticky top-0 bg-zinc-100"><tr><th className="p-2 text-left">Desde</th><th className="p-2 text-left">Hasta</th><th className="p-2 text-right">Cantidad</th></tr></thead><tbody>{datos.huecos.length ? datos.huecos.map((h,i) => <tr className="border-t" key={i}><td className="p-2">{h.desde}</td><td className="p-2">{h.hasta}</td><td className="p-2 text-right">{h.hasta - h.desde + 1}</td></tr>) : <tr><td colSpan={3} className="p-3 text-zinc-500">No hay huecos dentro de las emisiones registradas.</td></tr>}</tbody></table></div>
          <h3 className="text-sm font-semibold">Tramos asignados ({datos.asignados.length})</h3>
          <div className="max-h-64 overflow-auto border"><table className="w-full text-sm"><thead className="sticky top-0 bg-zinc-100"><tr><th className="p-2 text-left">Desde</th><th className="p-2 text-left">Hasta</th><th className="p-2 text-left">Socio / externo</th><th className="p-2 text-left">Recibo</th></tr></thead><tbody>{datos.asignados.map((a,i) => <tr className="border-t" key={i}><td className="p-2">{a.desde}</td><td className="p-2">{a.hasta}</td><td className="p-2">{a.socio}</td><td className="p-2">{a.recibo || "—"}</td></tr>)}</tbody></table></div>
        </div>
      </div>
    </div>
  );
}
