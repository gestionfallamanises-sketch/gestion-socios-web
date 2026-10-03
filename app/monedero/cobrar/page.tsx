"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "../../../lib/supabaseClient";

export default function CobrarMonederoPage() {
  const [escaneando, setEscaneando] = useState(false);
  const [codigoLeido, setCodigoLeido] = useState("");
  const [monedero, setMonedero] = useState<any>(null);
const [buscandoMonedero, setBuscandoMonedero] = useState(false);
const [errorMonedero, setErrorMonedero] = useState("");
const [importeCobro, setImporteCobro] = useState("");
const [cobrando, setCobrando] = useState(false);
const [mensajeCobro, setMensajeCobro] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);


  async function iniciarEscaner() {
    setCodigoLeido("");
    setEscaneando(true);
  }

  async function buscarMonedero(tokenQR: string) {
    setBuscandoMonedero(true);
    setErrorMonedero("");
    setMonedero(null);
  
    const { data, error } = await (supabase as any).rpc(
      "obtener_monedero_por_qr",
      {
        p_token_qr: tokenQR,
      }
    );
  
    setBuscandoMonedero(false);
  
    if (error) {
      console.error(error);
      setErrorMonedero("No se ha podido consultar el monedero.");
      return;
    }
  
    if (!data || data.length === 0) {
      setErrorMonedero("QR no válido o monedero bloqueado.");
      return;
    }
  
    setMonedero(data[0]);
  }
  
  async function confirmarCobro() {
    const importe = Number(importeCobro);
  
    if (!codigoLeido || !importe || importe <= 0) {
      setMensajeCobro("Introduce un importe válido.");
      return;
    }
  
    setCobrando(true);
    setMensajeCobro("");
  
    const { data, error } = await (supabase as any).rpc(
      "cobrar_monedero",
      {
        p_token_qr: codigoLeido,
        p_importe: importe,
        p_concepto: "Consumo",
      }
    );
  
    setCobrando(false);
  
    if (error) {
      if (error.message?.includes("Saldo insuficiente")) {
        setMensajeCobro("Saldo insuficiente.");
      } else {
        console.error("Error realizando cobro:", error);
        setMensajeCobro("No se ha podido realizar el cobro.");
      }
    
      return;
    }
  
    const nuevoSaldo = Number(data);

setMonedero((actual: any) => ({
  ...actual,
  Saldo: nuevoSaldo,
}));

setImporteCobro("");

setMensajeCobro(
  `Cobro realizado correctamente: ${importe.toFixed(2)} €. Nuevo saldo: ${nuevoSaldo.toFixed(2)} €`
);

setTimeout(() => {
  setMensajeCobro("");
  setCodigoLeido("");
  setMonedero(null);
}, 3000);
}
  
  useEffect(() => {
    if (!escaneando) return;

    const scanner = new Html5Qrcode("lector-qr");
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          setCodigoLeido(decodedText);
        
          // Cada QR inicia un cobro nuevo
          setMonedero(null);
          setImporteCobro("");
          setMensajeCobro("");
          setErrorMonedero("");
        
          try {
            await scanner.stop();
          } catch {}
        
          scannerRef.current = null;
          setEscaneando(false);
        
          await buscarMonedero(decodedText);
        },
        () => {}
      )
      .catch((error) => {
        console.error("Error iniciando cámara:", error);
        setEscaneando(false);
      });

    return () => {
      const actual = scannerRef.current;

      if (actual?.isScanning) {
        actual.stop().catch(() => {});
      }

      scannerRef.current = null;
    };
  }, [escaneando]);

  function nuevoCobro() {
    setCodigoLeido("");
    setMonedero(null);
    setImporteCobro("");
    setMensajeCobro("");
    setErrorMonedero("");
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-4">
      <div className="mx-auto max-w-md">
        <div className="border border-zinc-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-bold text-zinc-900">
            Cobro de monedero
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Escanea el QR del socio para realizar un cobro.
          </p>

          {!escaneando && (
            <button
              type="button"
              onClick={iniciarEscaner}
              className="mt-6 w-full bg-red-900 px-4 py-4 text-base font-semibold text-white hover:bg-red-950"
            >
              Escanear QR
            </button>
          )}

          {escaneando && (
            <div className="mt-6">
              <div id="lector-qr" className="w-full" />

              <p className="mt-3 text-center text-sm text-zinc-500">
                Apunta la cámara al QR del socio
              </p>
            </div>
          )}

{buscandoMonedero && (
  <p className="mt-4 text-center text-sm text-zinc-500">
    Buscando monedero...
  </p>
)}

{errorMonedero && (
  <div className="mt-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    {errorMonedero}
  </div>
)}

{monedero && (
  <div className="mt-4 border border-zinc-200 bg-white p-4">
    <p className="text-lg font-semibold text-zinc-900">
      {monedero.Nombre}
    </p>

    <p className="mt-1 text-sm text-zinc-500">
      Socio {monedero.NUMCENS}
    </p>

    <div className="mt-4 border-t border-zinc-200 pt-4">
      <p className="text-xs font-medium uppercase text-zinc-500">
        Saldo disponible
      </p>

      <p className="mt-1 text-2xl font-bold text-zinc-900">
        {Number(monedero.Saldo).toFixed(2)} €
      </p>
    </div>
    <div className="mt-5 border-t border-zinc-200 pt-4">
  <label className="block text-xs font-medium uppercase text-zinc-500">
    Importe a cobrar
  </label>

  <div className="mt-2 flex items-center gap-2">
    <input
      type="number"
      min="0.01"
      step="0.01"
      value={importeCobro}
      onChange={(e) => setImporteCobro(e.target.value)}
      placeholder="0,00"
      className="min-w-0 flex-1 border border-zinc-300 bg-white px-3 py-3 text-xl font-semibold text-zinc-900 outline-none focus:border-red-900"
    />

    <span className="text-lg text-zinc-600">€</span>
  </div>

  <button
  type="button"
  onClick={confirmarCobro}
  disabled={
    cobrando ||
    !importeCobro ||
    Number(importeCobro) <= 0
  }
  className="mt-3 w-full bg-red-900 px-4 py-3 font-semibold text-white hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-40"
>
  {cobrando ? "Cobrando..." : "Cobrar"}
</button>

{mensajeCobro && (
  <p className="mt-3 text-sm text-zinc-600">
    {mensajeCobro}
  </p>
)}

{mensajeCobro && (
  <button
    type="button"
    onClick={nuevoCobro}
    className="mt-3 w-full border border-zinc-300 px-4 py-3 font-medium text-zinc-700 hover:bg-zinc-50"
  >
    Nuevo cobro
  </button>
)}
</div>
  </div>
)}
        </div>
      </div>
    </main>
  );
}