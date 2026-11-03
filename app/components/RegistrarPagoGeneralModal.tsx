"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { supabase } from "@/lib/supabaseClient";
import { normalizarTexto } from "@/lib/texto";

const clienteAutenticado = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function fechaLocal() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Reparte importes en céntimos para evitar descuadres por redondeo.
// La proporción se calcula según el saldo pendiente de cada socio.
function repartirPago(
  importe: string,
  socios: any[],
  aplicaciones: Record<number, { seleccionado: boolean; importe: number }>
): Record<number, { seleccionado: boolean; importe: number }> {
  const resultado = { ...aplicaciones };
  const elegibles = socios.filter((s) =>
    resultado[s.NUMCENS]?.seleccionado && Number(s.Pendiente || 0) > 0
  );
  socios.forEach((s) => {
    resultado[s.NUMCENS] = {
      seleccionado: resultado[s.NUMCENS]?.seleccionado ?? true,
      importe: 0,
    };
  });
  const recibido = Number(importe);
  if (!importe || !Number.isFinite(recibido) || recibido <= 0 || !elegibles.length) return resultado;

  const capacidad = elegibles.map((s) => Math.max(0, Math.round(Number(s.Pendiente || 0) * 100)));
  const sumaCapacidad = capacidad.reduce((acc, x) => acc + x, 0);
  let centimos = Math.min(Math.round(recibido * 100), sumaCapacidad);
  const pesos = capacidad.map((x) => x / sumaCapacidad);
  const exactos = pesos.map((peso) => centimos * peso);
  const unidades = exactos.map(Math.floor);
  let resto = centimos - unidades.reduce((acc, x) => acc + x, 0);
  const indices = exactos.map((_, i) => i).sort((a, b) =>
    (exactos[b] - unidades[b]) - (exactos[a] - unidades[a]) || a - b
  );
  for (const i of indices) {
    if (resto <= 0) break;
    if (unidades[i] < capacidad[i]) { unidades[i]++; resto--; }
  }
  elegibles.forEach((s, i) => {
    resultado[s.NUMCENS] = { seleccionado: true, importe: unidades[i] / 100 };
  });
  return resultado;
}

export default function RegistrarPagoGeneralModal({
  open,
  onCancel,
}: {
  open: boolean;
  onCancel: () => void;
}) {
  const [fechaPago, setFechaPago] = useState(fechaLocal);
  const [guardando, setGuardando] = useState(false);
  const [posicion, setPosicion] = useState<{ x: number; y: number } | null>(null);
  const ventanaRef = useRef<HTMLDivElement>(null);
  const cuerpoRef = useRef<HTMLDivElement>(null);
  const [dimensiones, setDimensiones] = useState<{ ancho: number; alto: number } | null>(null);
  const redimensionRef = useRef<{
    borde: string; x: number; y: number;
    izquierda: number; arriba: number; ancho: number; alto: number;
  } | null>(null);
  const arrastreRef = useRef<{ dx: number; dy: number } | null>(null);

  function limpiarFormulario() {
    setModo("socio");
    setNumcensPagador("");
    setBusquedaPagador("");
    setPagadoresEncontrados([]);
    setSociosPagador([]);
    setCargandoSocios(false);
    setImporteTotal("");
    setAplicaciones({});
    setBusquedaSocio("");
    setSociosEncontrados([]);
    setSocioSeleccionado(null);
    setImporteSocio("");
    setObservacionesSocio("");
    setFechaPago(fechaLocal());
    setPosicion(null);
    setDimensiones(null);
    redimensionRef.current = null;
    arrastreRef.current = null;
  }

  function cerrarFormulario() {
    if (guardando) return;
    limpiarFormulario();
    onCancel();
  }

  useEffect(() => {
    if (!open) {
      // El modal permanece montado cuando se cierra desde su componente padre.
      limpiarFormulario();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function mover(e: MouseEvent) {
      const elemento = ventanaRef.current;
      if (!elemento) return;
      const limiteX = window.innerWidth;
      const limiteY = window.innerHeight;
      if (redimensionRef.current) {
        const r = redimensionRef.current;
        const dx = e.clientX - r.x;
        const dy = e.clientY - r.y;
        const minAncho = Math.min(360, limiteX - 16);
        const minAlto = Math.min(280, limiteY - 16);
        let izquierda = r.izquierda, arriba = r.arriba;
        let derecha = r.izquierda + r.ancho, abajo = r.arriba + r.alto;
        if (r.borde.includes("e")) derecha = Math.min(limiteX - 8, Math.max(izquierda + minAncho, derecha + dx));
        if (r.borde.includes("s")) abajo = Math.min(limiteY - 8, Math.max(arriba + minAlto, abajo + dy));
        if (r.borde.includes("w")) izquierda = Math.max(8, Math.min(derecha - minAncho, izquierda + dx));
        if (r.borde.includes("n")) arriba = Math.max(8, Math.min(abajo - minAlto, arriba + dy));
        setPosicion({ x: izquierda, y: arriba });
        setDimensiones({ ancho: derecha - izquierda, alto: abajo - arriba });
        return;
      }
      if (!arrastreRef.current) return;
      const { dx, dy } = arrastreRef.current;
      setPosicion({
        x: Math.max(8, Math.min(limiteX - elemento.offsetWidth - 8, e.clientX - dx)),
        y: Math.max(8, Math.min(limiteY - elemento.offsetHeight - 8, e.clientY - dy)),
      });
    }
    function soltar() {
      arrastreRef.current = null;
      redimensionRef.current = null;
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", soltar);
    return () => {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseup", soltar);
      document.body.style.userSelect = "";
    };
  }, [open]);

  function comenzarArrastre(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0 || !ventanaRef.current) return;
    const rect = ventanaRef.current.getBoundingClientRect();
    arrastreRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    setPosicion({ x: rect.left, y: rect.top });
    document.body.style.userSelect = "none";
    e.preventDefault();
  }

  function comenzarRedimension(borde: string, e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0 || !ventanaRef.current) return;
    const r = ventanaRef.current.getBoundingClientRect();
    redimensionRef.current = {
      borde, x: e.clientX, y: e.clientY,
      izquierda: r.left, arriba: r.top, ancho: r.width, alto: r.height,
    };
    setPosicion({ x: r.left, y: r.top });
    setDimensiones({ ancho: r.width, alto: r.height });
    document.body.style.userSelect = "none";
    e.preventDefault();
    e.stopPropagation();
  }

  async function guardarFechaPago(idPago: number, importe: number, observaciones: string | null) {
    const { error } = await (clienteAutenticado as any).rpc("editar_pago_manual_seguro", {
      p_id_pago_manual: idPago,
      p_fecha_pago: fechaPago,
      p_importe: importe,
      p_observaciones: observaciones,
    });
    if (error) {
      alert(`El pago ${idPago} SE HA REGISTRADO, pero no se pudo guardar la fecha elegida: ${error.message}. No vuelvas a registrarlo; corrige la fecha con el lápiz desde la ficha del socio.`);
      window.location.reload();
      return false;
    }
    return true;
  }

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

  const repartoInvalido = sociosPagador.some((s) => {
    const a = aplicaciones[s.NUMCENS];
    if (!a?.seleccionado) return false;
    return !Number.isFinite(a.importe) || a.importe < 0 ||
      Math.round(a.importe * 100) > Math.round(Number(s.Pendiente || 0) * 100) ||
      Math.abs(a.importe * 100 - Math.round(a.importe * 100)) > 0.00001;
  });

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
        importe: 0,
      };
    });
  
    setAplicaciones(repartirPago(importeTotal, data || [], inicial));
  }

  async function buscarSociosPagoIndividual(texto: string) {
    setBusquedaSocio(texto);
    setSocioSeleccionado(null);
  
    if (texto.trim().length < 2) {
      setSociosEncontrados([]);
      return;
    }
  
    const { data: ejercicioData, error: errorEjercicio } = await supabase
      .from("EJERCICIOS")
      .select("Ejercicio")
      .eq("Activo", true)
      .maybeSingle();
  
    if (errorEjercicio) {
      alert(errorEjercicio.message);
      return;
    }
  
    const ejercicioActivo = Number((ejercicioData as any)?.Ejercicio || 0);
  
    if (!ejercicioActivo) {
      alert("No se ha encontrado un ejercicio activo.");
      return;
    }
  
    const { data, error } = await supabase
      .from("VISTA_CUOTAS_RESUMEN")
      .select("*")
      .eq("Ejercicio", ejercicioActivo)
      .limit(5000);

    if (error) { alert(error.message); return; }
    const termino = normalizarTexto(texto.trim());
    setSociosEncontrados((data || []).filter((socio: any) => {
      const nombre = normalizarTexto(`${socio.Apellidos || ""} ${socio.Nombre || ""}`);
      const inverso = normalizarTexto(`${socio.Nombre || ""} ${socio.Apellidos || ""}`);
      return nombre.includes(termino) || inverso.includes(termino) ||
        String(socio.NUMCENS).includes(termino);
    }).slice(0, 10));
  }

  async function registrarPagoSocioIndividual() {
    if (!socioSeleccionado || guardando) return;
    if (!fechaPago) { alert("Selecciona una fecha."); return; }
  
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
  
    setGuardando(true);
    const { data, error } = await (supabase as any).rpc(
      "registrar_pago_manual_cuota",
      {
        p_id_cuota_socio: socioSeleccionado.IDCuotaSocio,
        p_importe: importe,
        p_observaciones: observacionesSocio || null,
      }
    );
  
    if (error) {
      setGuardando(false);
      alert(error.message);
      return;
    }
    if (!(await guardarFechaPago(Number(data), importe, observacionesSocio || null))) return;
    alert("Pago registrado correctamente. ID: " + data);
    window.location.reload();
  }

  async function registrarPagoPagador() {
    if (guardando) return;
    if (!fechaPago) { alert("Selecciona una fecha."); return; }
    const importeRecibido = Number(importeTotal);
    const seleccionadas = sociosPagador.filter((s) => aplicaciones[s.NUMCENS]?.seleccionado);
    const excede = seleccionadas.some((s) => {
      const importe = Number(aplicaciones[s.NUMCENS]?.importe || 0);
      return !Number.isFinite(importe) || importe < 0 ||
        Math.round(importe * 100) > Math.round(Number(s.Pendiente || 0) * 100) ||
        Math.abs(importe * 100 - Math.round(importe * 100)) > 0.00001;
    });
    if (!Number.isFinite(importeRecibido) || importeRecibido <= 0 ||
        Math.abs(importeRecibido * 100 - Math.round(importeRecibido * 100)) > 0.00001 ||
        Math.round(importeRecibido * 100) !== Math.round(totalAplicado * 100) ||
        excede || !seleccionadas.length || !numcensPagador) {
      alert("Revisa el reparto: debe coincidir con el importe recibido y no superar el pendiente de ningún socio.");
      return;
    }
    const aplicacionesValidas = Object.entries(aplicaciones)
      .filter(([, valor]) => valor.seleccionado && Number(valor.importe) > 0)
      .map(([numcens, valor]) => ({
        numcens: Number(numcens),
        importe: Number(valor.importe),
      }));
  
    setGuardando(true);
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
      setGuardando(false);
      alert(error.message);
      return;
    }
    if (!(await guardarFechaPago(Number(data), Number(importeTotal), null))) return;
    alert("Pago registrado correctamente. ID: " + data);
    window.location.reload();
  }

  if (!open) return null;
  
  async function buscarPagadores(texto: string) {
    setBusquedaPagador(texto);
    setNumcensPagador("");
    setSociosPagador([]);
    setAplicaciones({});
    setImporteTotal("");
  
    if (texto.trim().length < 2) {
      setPagadoresEncontrados([]);
      return;
    }
  
    const { data, error } = await supabase
      .from("SOCIOS")
      .select("NUMCENS, Nombre, Apellidos")
      .order("Apellidos", { ascending: true })
      .limit(5000);

    if (error) { alert(error.message); return; }
    const termino = normalizarTexto(texto.trim());
    setPagadoresEncontrados((data || []).filter((socio: any) => {
      const nombre = normalizarTexto(`${socio.Apellidos || ""} ${socio.Nombre || ""}`);
      const inverso = normalizarTexto(`${socio.Nombre || ""} ${socio.Apellidos || ""}`);
      return nombre.includes(termino) || inverso.includes(termino) ||
        String(socio.NUMCENS).includes(termino);
    }).slice(0, 10));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2">
      <div
        ref={ventanaRef}
        style={{
          width: dimensiones?.ancho ?? "min(760px, calc(100vw - 24px))",
          height: dimensiones?.alto ?? "min(650px, calc(100vh - 24px))",
          ...(posicion ? { position: "fixed" as const, left: posicion.x, top: posicion.y, margin: 0 } : {}),
        }}
        className="relative flex min-w-0 flex-col border border-zinc-200 bg-white shadow-xl"
      >
        {/* Bordes y esquinas para cambiar el tamaño con el ratón. */}
        {([
          ["n", "absolute left-2 right-2 top-0 h-2 cursor-n-resize"],
          ["s", "absolute bottom-0 left-2 right-2 h-2 cursor-s-resize"],
          ["e", "absolute bottom-2 right-0 top-2 w-2 cursor-e-resize"],
          ["w", "absolute bottom-2 left-0 top-2 w-2 cursor-w-resize"],
          ["nw", "absolute left-0 top-0 h-3 w-3 cursor-nw-resize"],
          ["ne", "absolute right-0 top-0 h-3 w-3 cursor-ne-resize"],
          ["sw", "absolute bottom-0 left-0 h-3 w-3 cursor-sw-resize"],
          ["se", "absolute bottom-0 right-0 h-3 w-3 cursor-se-resize"],
        ] as const).map(([borde, clases]) => (
          <div key={borde} onMouseDown={(e) => comenzarRedimension(borde, e)} className={`${clases} z-30`} />
        ))}
        <div onMouseDown={comenzarArrastre} className="shrink-0 cursor-move select-none border-l-4 border-red-900 px-4 py-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-red-900">
                Registrar pago
              </h2>

              <p className="mt-1 text-xs text-zinc-600">
                Selecciona el tipo de pago que deseas registrar.
              </p>
            </div>

            <button
              type="button"
              onClick={cerrarFormulario}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-xl font-bold text-zinc-400 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>

        <div ref={cuerpoRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
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
  <div className="grid gap-2 border-t pt-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))" }}>
    <div className="min-w-0">
      <label className="mb-1 block text-xs font-medium">Socio</label>
      <div className="truncate border border-zinc-200 bg-white px-2 py-2 text-xs" title={busquedaSocio}>
        {busquedaSocio}
      </div>
    </div>
    <div>
      <label className="mb-1 block text-xs font-medium">Fecha pago</label>
      <input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} className="w-full min-w-0 border border-zinc-300 bg-white px-2 py-2 text-sm" />
    </div>
    <div>
      <label className="mb-1 block text-xs font-medium">Importe (€)</label>
      <input type="number" min="0.01" step="0.01" value={importeSocio} onChange={(e) => setImporteSocio(e.target.value)} className="w-full min-w-0 border border-zinc-300 bg-white px-2 py-2 text-sm" />
    </div>
    <div className="flex min-w-0 flex-wrap items-end gap-2" style={{ gridColumn: "1 / -1" }}>
      <div className="min-w-0 flex-1">
        <label className="mb-1 block text-xs font-medium">Observaciones</label>
        <input value={observacionesSocio} onChange={(e) => setObservacionesSocio(e.target.value)} className="w-full border border-zinc-300 bg-white px-2 py-2 text-sm" />
      </div>
      <button type="button" disabled={guardando} onClick={registrarPagoSocioIndividual} className="shrink-0 bg-red-900 px-3 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50">
        {guardando ? "Guardando..." : "Registrar pago"}
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
    <div className="mt-1 max-h-44 w-full overflow-y-auto border border-zinc-200 bg-white shadow-lg">
      {pagadoresEncontrados.map((pagador) => (
        <button
          key={pagador.NUMCENS}
          type="button"
          onClick={() => {
            setNumcensPagador(String(pagador.NUMCENS));
            setImporteTotal("");
            setAplicaciones({});
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
                  <div className="flex flex-wrap gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium">Fecha pago</label>
                    <input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} className="w-40 border border-zinc-300 bg-white px-2 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Importe recibido
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      value={importeTotal}
                      onChange={(e) => {
                        const nuevo = e.target.value;
                        setImporteTotal(nuevo);
                        setAplicaciones((prev) => repartirPago(nuevo, sociosPagador, prev));
                      }}
                      className="w-40 border border-zinc-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  </div>

                  <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[440px] text-sm">
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
                          className="h-9 border-b border-zinc-100"
                        >
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={
                                aplicaciones[socio.NUMCENS]?.seleccionado ??
                                false
                              }
                              onChange={(e) =>
                                setAplicaciones((prev) => repartirPago(importeTotal, sociosPagador, {
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
                              min="0"
                              max={Number(socio.Pendiente || 0)}
                              disabled={!aplicaciones[socio.NUMCENS]?.seleccionado}
                              value={
                                (aplicaciones[socio.NUMCENS]?.importe ?? 0) || ""
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
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
  <div className="flex flex-col gap-0.5 text-sm">
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
      {repartoInvalido && <span className="block text-xs">Algún importe supera el pendiente o no tiene dos decimales.</span>}
    </p>
  </div>

  <button
    type="button"
    disabled={
      !importeTotal ||
      Math.abs(diferencia) >= 0.01 ||
      totalAplicado <= 0 || repartoInvalido || guardando
    }
    onClick={registrarPagoPagador}
    className="shrink-0 bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50"
  >
    Registrar pago
  </button>
</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}