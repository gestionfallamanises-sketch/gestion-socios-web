"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type OpcionCuota = { IDCuota: string; Descripcion?: string | null; Importe?: number | null };
type OpcionPagador = { NUMCENS: number; Nombre: string; Apellidos: string; Estado?: string };

export default function EditarConfiguracionSocio({
  numcens, ejercicio, idCuota, metodo, numeroPlazos, pagador,
  tiposCuota, pagadores, puedeEditar,
}: {
  numcens: number;
  ejercicio: number | null;
  idCuota: string | null;
  metodo: string | null;
  numeroPlazos: number | null;
  pagador: number | null;
  tiposCuota: OpcionCuota[];
  pagadores: OpcionPagador[];
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  const [abierto, setAbierto] = useState(false);
  const [tarifa, setTarifa] = useState(idCuota || "");
  const [forma, setForma] = useState((metodo || "Efectivo").toUpperCase() === "BANCO" ? "Banco" : "Efectivo");
  const [plazos, setPlazos] = useState(numeroPlazos && numeroPlazos >= 1 ? numeroPlazos : 10);
  const [nuevoPagador, setNuevoPagador] = useState(String(pagador ?? numcens));
  const [guardando, setGuardando] = useState(false);

  const metodoOriginal = (metodo || "Efectivo").toUpperCase() === "BANCO" ? "Banco" : "Efectivo";
  const plazosOriginales = numeroPlazos && numeroPlazos > 0 ? numeroPlazos : 1;
  const plazosElegidos = forma === "Banco" ? plazos : 1;
  const cambiado = tarifa !== (idCuota || "") || forma !== metodoOriginal ||
    (forma === "Banco" && plazosElegidos !== plazosOriginales) ||
    Number(nuevoPagador) !== (pagador ?? numcens);

  async function guardar() {
    if (!ejercicio || !tarifa || !nuevoPagador || !puedeEditar || guardando) return;
    if (!cambiado) { setAbierto(false); return; }
    if (!window.confirm("¿Guardar los cambios de cuota, forma de pago y pagador de este socio? Se respetarán los movimientos anteriores.")) return;
    setGuardando(true);
    
    try {
      const { error } = await (supabase as any).rpc("actualizar_configuracion_socio_familia", {
        p_numcens: numcens,
        p_ejercicio: ejercicio,
        p_idcuota: tarifa,
        p_metodo: forma,
        p_numero_plazos: plazosElegidos,
        p_numcens_pagador: Number(nuevoPagador),
      });
      if (error) throw error;
      setAbierto(false);
      router.refresh();
    } catch (err: any) {
      alert("No se han guardado los cambios: " + (err?.message || "Error desconocido"));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="relative inline-block text-left print:hidden">
      <button type="button" onClick={() => setAbierto((v) => !v)} disabled={!puedeEditar || guardando}
        title={!puedeEditar ? "No existe cuota o forma de pago activa para editar" : "Editar cuota y pagos"}
        className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-900 hover:bg-red-100 disabled:opacity-40">
        Editar
      </button>
      {abierto && (
        <div className="absolute right-0 z-50 mt-2 w-[490px] max-w-[calc(100vw-2rem)] border border-zinc-200 bg-white p-4 text-left shadow-xl">
          <p className="mb-3 text-sm font-semibold text-zinc-900">
            Editar socio Nº {numcens} · {ejercicio}
          </p>

          <div className="grid grid-cols-[125px_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
            <label htmlFor={`tarifa-${numcens}`} className="text-xs font-medium text-zinc-600">Tipo de cuota</label>
            <select id={`tarifa-${numcens}`} value={tarifa} onChange={(e) => setTarifa(e.target.value)} className="min-w-0 w-full border border-zinc-300 px-2 py-1.5 text-sm">
              {tiposCuota.map((t) => <option key={String(t.IDCuota)} value={String(t.IDCuota)}>
                {t.Descripcion || t.IDCuota}{t.Importe != null ? ` · ${Number(t.Importe).toFixed(2)} €` : ""}
              </option>)}
            </select>

            <label htmlFor={`forma-${numcens}`} className="text-xs font-medium text-zinc-600">Forma de pago</label>
            <select id={`forma-${numcens}`} value={forma} onChange={(e) => setForma(e.target.value)} className="min-w-0 w-full border border-zinc-300 px-2 py-1.5 text-sm">
              <option value="Banco">Banco</option>
              <option value="Efectivo">Efectivo</option>
            </select>

            {forma === "Banco" && <>
              <label htmlFor={`plazos-${numcens}`} className="text-xs font-medium text-zinc-600">Nº de plazos</label>
              <select id={`plazos-${numcens}`} value={plazos} onChange={(e) => setPlazos(Number(e.target.value))} className="min-w-0 w-full border border-zinc-300 px-2 py-1.5 text-sm">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </>}

            <label htmlFor={`pagador-${numcens}`} className="text-xs font-medium text-zinc-600">Pagador</label>
            <select id={`pagador-${numcens}`} value={nuevoPagador} onChange={(e) => setNuevoPagador(e.target.value)} className="min-w-0 w-full border border-zinc-300 px-2 py-1.5 text-sm">
              {!pagadores.some((p) => p.NUMCENS === Number(nuevoPagador)) && <option value={nuevoPagador}>Pagador actual Nº {nuevoPagador}</option>}
              {pagadores.map((p) => <option key={p.NUMCENS} value={p.NUMCENS}>{p.NUMCENS} · {p.Nombre} {p.Apellidos}</option>)}
            </select>
          </div>

          <p className="mt-3 text-xs text-zinc-500">Los pagos y remesas protegidos no se modificarán.</p>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setAbierto(false)} disabled={guardando} className="border border-zinc-300 px-3 py-2 text-xs">Cancelar</button>
            <button type="button" onClick={guardar} disabled={guardando || !cambiado || !tarifa} className="bg-red-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
