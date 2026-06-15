"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RegistrarPagoGeneralModal({
  open,
  onCancel,
}: {
  open: boolean;
  onCancel: () => void;
}) {
  const [modo, setModo] = useState<"socio" | "pagador">("socio");
  const [numcensPagador, setNumcensPagador] = useState("");
  const [busquedaPagador, setBusquedaPagador] = useState("");
const [pagadoresEncontrados, setPagadoresEncontrados] = useState<any[]>([]);
  const [sociosPagador, setSociosPagador] = useState<any[]>([]);
  const [cargandoSocios, setCargandoSocios] = useState(false);
  const [importeTotal, setImporteTotal] = useState("");
  const [aplicaciones, setAplicaciones] = useState<
    Record<number, { seleccionado: boolean; importe: number }>
  >({});
  const [busquedaSocio, setBusquedaSocio] = useState("");
const [sociosEncontrados, setSociosEncontrados] = useState<any[]>([]);
const [socioSeleccionado, setSocioSeleccionado] = useState<any | null>(null);
const [importeSocio, setImporteSocio] = useState("");
const [observacionesSocio, setObservacionesSocio] = useState("");

  const totalAplicado = Object.entries(aplicaciones)
  .filter(([, valor]) => valor.seleccionado)
  .reduce(
    (acc, [, valor]) => acc + Number(valor.importe || 0),
    0
  );

const diferencia =
  Number(importeTotal || 0) - totalAplicado;

  async function cargarSociosPagador(numcensElegido?: number) {
    const pagadorFinal = numcensElegido || Number(numcensPagador);
  
    if (!pagadorFinal) return;
  
    setCargandoSocios(true);
  
    const { data, error } = await (supabase as any).rpc(
      "buscar_socios_por_pagador_con_pendiente",
      {
        p_numcens_pagador: pagadorFinal,
      }
    );
  
    setCargandoSocios(false);
  
    if (error) {
      alert(error.message);
      return;
    }
  
    setSociosPagador(data || []);
  
    const inicial: Record<
      number,
      { seleccionado: boolean; importe: number }
    > = {};
  
    (data || []).forEach((socio: any) => {
      inicial[socio.NUMCENS] = {
        seleccionado: true,
        importe: Number(socio.Pendiente || 0),
      };
    });
  
    setAplicaciones(inicial);
  }

  async function buscarSociosPagoIndividual(texto: string) {
    setBusquedaSocio(texto);
    setSocioSeleccionado(null);
  
    if (texto.trim().length < 2) {
      setSociosEncontrados([]);
      return;
    }
  
    const { data, error } = await supabase
      .from("vista_cuotas_socios")
      .select("*")
      .eq("Ejercicio", 2027)
      .or(
        `Nombre.ilike.%${texto}%,Apellidos.ilike.%${texto}%,NUMCENS.eq.${Number(texto) || -1}`
      )
      .limit(10);
  
    if (error) {
      alert(error.message);
      return;
    }
  
    setSociosEncontrados(data || []);
  }

  async function registrarPagoSocioIndividual() {
    if (!socioSeleccionado) return;
  
    const importe = Number(importeSocio || 0);
    const pendiente = Number(socioSeleccionado.Pendiente || 0);
  
    if (importe <= 0) {
      alert("Introduce un importe válido");
      return;
    }
  
    if (importe > pendiente) {
      alert(`El importe máximo pendiente es ${pendiente.toFixed(2)} €.`);
      return;
    }
  
    const { data, error } = await (supabase as any).rpc(
      "registrar_pago_manual_cuota",
      {
        p_id_cuota_socio: socioSeleccionado.IDCuotaSocio,
        p_importe: importe,
        p_observaciones: observacionesSocio || null,
      }
    );
  
    if (error) {
      alert(error.message);
      return;
    }
  
    alert("Pago registrado correctamente. ID: " + data);
    window.location.reload();
  }

  async function registrarPagoPagador() {
    const aplicacionesValidas = Object.entries(aplicaciones)
      .filter(([, valor]) => valor.seleccionado && Number(valor.importe) > 0)
      .map(([numcens, valor]) => ({
        numcens: Number(numcens),
        importe: Number(valor.importe),
      }));
  
    const { data, error } = await (supabase as any).rpc(
      "registrar_pago_manual_pagador",
      {
        p_numcens_pagador: Number(numcensPagador),
        p_importe_total: Number(importeTotal),
        p_aplicaciones: aplicacionesValidas,
        p_observaciones: null,
      }
    );
  
    if (error) {
      alert(error.message);
      return;
    }
  
    alert("Pago registrado correctamente. ID: " + data);
    window.location.reload();
  }

  if (!open) return null;
  
  async function buscarPagadores(texto: string) {
    setBusquedaPagador(texto);
    setNumcensPagador("");
    setSociosPagador([]);
  
    if (texto.trim().length < 2) {
      setPagadoresEncontrados([]);
      return;
    }
  
    const { data, error } = await supabase
      .from("SOCIOS")
      .select("NUMCENS, Nombre, Apellidos")
      .or(
        `Nombre.ilike.%${texto}%,Apellidos.ilike.%${texto}%,NUMCENS.eq.${Number(texto) || -1}`
      )
      .order("Apellidos", { ascending: true })
      .limit(10);
  
    if (error) {
      alert(error.message);
      return;
    }
  
    setPagadoresEncontrados(data || []);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-3xl border border-zinc-200 bg-white shadow-xl">
        <div className="border-l-4 border-red-900 px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-red-900">
                Registrar pago
              </h2>

              <p className="mt-2 text-sm text-zinc-600">
                Selecciona el tipo de pago que deseas registrar.
              </p>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="text-xl font-bold text-zinc-400 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Tipo de pago
            </label>

            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={modo === "socio"}
                  onChange={() => setModo("socio")}
                />
                Socio individual
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={modo === "pagador"}
                  onChange={() => setModo("pagador")}
                />
                Pagador/Familia
              </label>
            </div>
          </div>

          {modo === "socio" && (
  <div className="space-y-4 rounded border border-zinc-200 bg-zinc-50 p-4">
    <input
  value={busquedaSocio}
  onChange={(e) => buscarSociosPagoIndividual(e.target.value)}
  placeholder="Buscar socio por nombre, apellidos o NUMCENS..."
  className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm"
/>

{sociosEncontrados.length > 0 && !socioSeleccionado && (
  <div className="max-h-48 overflow-y-auto border border-zinc-200 bg-white">
    {sociosEncontrados.map((socio) => (
      <button
        key={socio.IDCuotaSocio}
        type="button"
        onClick={() => {
          setSocioSeleccionado(socio);
          setBusquedaSocio(
            `${socio.NUMCENS} · ${socio.Apellidos}, ${socio.Nombre}`
          );
          setSociosEncontrados([]);
          setImporteSocio(String(Number(socio.Pendiente || 0).toFixed(2)));
        }}
        className="block w-full px-3 py-2 text-left text-sm hover:bg-red-50"
      >
        {socio.NUMCENS} · {socio.Apellidos}, {socio.Nombre} · Pendiente{" "}
        {Number(socio.Pendiente || 0).toFixed(2)} €
      </button>
    ))}
  </div>
)}

{socioSeleccionado && (
  <div className="grid gap-3 md:grid-cols-3">
    <div>
      <label className="mb-1 block text-sm font-medium">
        Importe a cuenta
      </label>

      <input
        type="number"
        step="0.01"
        value={importeSocio}
        onChange={(e) => setImporteSocio(e.target.value)}
        className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm"
      />
    </div>

    <div className="md:col-span-2">
      <label className="mb-1 block text-sm font-medium">
        Observaciones
      </label>

      <input
        value={observacionesSocio}
        onChange={(e) => setObservacionesSocio(e.target.value)}
        className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm"
      />
    </div>

    <div className="md:col-span-3">
      <button
        type="button"
        onClick={registrarPagoSocioIndividual}
        className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
      >
        Registrar pago
      </button>
    </div>
  </div>
)}

  </div>
)}

          {modo === "pagador" && (
            <div className="space-y-4 rounded border border-zinc-200 bg-zinc-50 p-4">
              <div className="relative">
  <input
    value={busquedaPagador}
    onChange={(e) => buscarPagadores(e.target.value)}
    placeholder="Buscar pagador por nombre, apellidos o NUMCENS..."
    className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm"
  />

  {pagadoresEncontrados.length > 0 && (
    <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto border border-zinc-200 bg-white shadow-lg">
      {pagadoresEncontrados.map((pagador) => (
        <button
          key={pagador.NUMCENS}
          type="button"
          onClick={() => {
            setNumcensPagador(String(pagador.NUMCENS));
            setBusquedaPagador(
              `${pagador.NUMCENS} · ${pagador.Apellidos}, ${pagador.Nombre}`
            );
            setPagadoresEncontrados([]);

            cargarSociosPagador(Number(pagador.NUMCENS));
          }}
          className="block w-full px-3 py-2 text-left text-sm hover:bg-red-50"
        >
          {pagador.NUMCENS} · {pagador.Apellidos}, {pagador.Nombre}
        </button>
      ))}
    </div>
  )}
</div>

              {cargandoSocios && (
                <p className="text-sm text-zinc-500">Cargando...</p>
              )}

{!cargandoSocios &&
  numcensPagador &&
  sociosPagador.length === 0 && (
    <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      Este socio no tiene socios asociados como pagador. Para registrar un pago
      solo de este socio, usa la opción “Socio individual”.
    </p>
  )}
              {!cargandoSocios && sociosPagador.length > 0 && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Importe recibido
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      value={importeTotal}
                      onChange={(e) => setImporteTotal(e.target.value)}
                      className="w-40 border border-zinc-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                        <th className="py-2 text-center">✓</th>
                        <th className="py-2 text-left">Socio</th>
                        <th className="py-2 text-right">Pendiente</th>
                        <th className="py-2 text-right">Aplicar</th>
                      </tr>
                    </thead>

                    <tbody>
                      {sociosPagador.map((socio) => (
                        <tr
                          key={socio.NUMCENS}
                          className="border-b border-zinc-100"
                        >
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={
                                aplicaciones[socio.NUMCENS]?.seleccionado ??
                                false
                              }
                              onChange={(e) =>
                                setAplicaciones((prev) => ({
                                  ...prev,
                                  [socio.NUMCENS]: {
                                    ...prev[socio.NUMCENS],
                                    seleccionado: e.target.checked,
                                  },
                                }))
                              }
                            />
                          </td>

                          <td className="py-2">
                            {socio.NUMCENS} · {socio.Apellidos},{" "}
                            {socio.Nombre}
                          </td>

                          <td className="py-2 text-right">
                            {Number(socio.Pendiente || 0).toFixed(2)} €
                          </td>

                          <td className="py-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={
                                aplicaciones[socio.NUMCENS]?.importe ?? 0
                              }
                              onChange={(e) =>
                                setAplicaciones((prev) => ({
                                  ...prev,
                                  [socio.NUMCENS]: {
                                    ...prev[socio.NUMCENS],
                                    importe: Number(e.target.value) || 0,
                                  },
                                }))
                              }
                              className="w-24 border border-zinc-300 px-2 py-1 text-right"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-4 flex flex-col gap-1 text-sm">
  <p>
    Importe recibido:{" "}
    <span className="font-medium">
      {Number(importeTotal || 0).toFixed(2)} €
    </span>
  </p>

  <p>
    Total aplicado:{" "}
    <span className="font-medium">
      {totalAplicado.toFixed(2)} €
    </span>
  </p>

  <p
    className={
      Math.abs(diferencia) < 0.01
        ? "font-medium text-green-700"
        : "font-medium text-red-700"
    }
  >
    Diferencia: {diferencia.toFixed(2)} €
  </p>
</div>

<button
  type="button"
  disabled={
    !importeTotal ||
    Math.abs(diferencia) >= 0.01 ||
    totalAplicado <= 0
  }
  onClick={registrarPagoPagador}
  className="mt-4 bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50"
>
  Registrar pago
</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}