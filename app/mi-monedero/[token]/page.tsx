"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import QRCode from "qrcode";

type Movimiento = {
  tipo: string;
  importe: number;
  concepto: string | null;
  fecha: string;
  saldoPosterior: number;
};

type Monedero = {
    numcens: number;
    nombre: string | null;
    apellidos: string | null;
    saldo: number;
    tokenQR: string;
    movimientos: Movimiento[];
  };

export default function MiMonederoPage() {
  const params = useParams();
  const token = params.token as string;

  const [monedero, setMonedero] = useState<Monedero | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [imagenQR, setImagenQR] = useState("");

  useEffect(() => {
    if (!token) return;

    cargarMonedero();
  }, [token]);

  async function cargarMonedero() {
    setCargando(true);
    setError("");

    const { data, error } = await supabase.rpc(
      "consultar_mi_monedero",
      {
        p_token: token,
      }
    );

    if (error) {
      console.error(error);
      setError("No hemos podido consultar tu monedero.");
      setCargando(false);
      return;
    }

    if (!data) {
      setError("Este enlace de monedero no es válido.");
      setCargando(false);
      return;
    }

    setMonedero(data);

if (data.tokenQR) {
  const qr = await QRCode.toDataURL(data.tokenQR, {
    width: 500,
    margin: 2,
  });

  setImagenQR(qr);
}

setCargando(false);
  }

  function formatearImporte(importe: number) {
    return Number(importe).toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatearFecha(fecha: string) {
    return new Date(fecha).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function esEntrada(tipo: string) {
    return (
      tipo.includes("RECARGA") &&
      !tipo.includes("ANULACION")
    );
  }

  function signoMovimiento(tipo: string) {
    if (esEntrada(tipo)) return "+";
    return "−";
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-zinc-100 flex items-center justify-center p-6">
        <p className="text-zinc-600">Consultando monedero...</p>
      </main>
    );
  }

  if (error || !monedero) {
    return (
      <main className="min-h-screen bg-zinc-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-zinc-900">
            Mi monedero
          </h1>

          <p className="mt-4 text-zinc-600">
            {error || "No hemos podido encontrar este monedero."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8">
      <div className="mx-auto max-w-md">

        {/* CABECERA */}
<div className="text-center mb-6">
  <h1 className="text-2xl font-bold text-zinc-900">
    Mi monedero
  </h1>

  <p className="mt-2 text-lg font-semibold text-zinc-800">
    {monedero.nombre} {monedero.apellidos}
  </p>

  <p className="mt-1 text-sm text-zinc-500">
    Socio nº {monedero.numcens}
  </p>
</div>

{/* QR */}
<div className="rounded-3xl bg-white p-6 text-center shadow-sm">
  <p className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
    Mi QR para pagar
  </p>

  {imagenQR && (
    <img
      src={imagenQR}
      alt={`QR monedero socio ${monedero.numcens}`}
      className="mx-auto mt-4 h-56 w-56"
    />
  )}

  <p className="mt-3 text-sm text-zinc-500">
    Presenta este código al realizar tus compras
  </p>
  <div className="mt-4 rounded-xl bg-red-50 px-4 py-3">
  <p className="text-sm font-semibold text-red-900">
    Este monedero es personal. No compartas este enlace ni tu QR.
  </p>

  <p className="mt-1 text-xs text-red-700">
    Quien tenga acceso podrá utilizar tu saldo.
  </p>
</div>
</div>

{/* SALDO */}
<div className="mt-4 rounded-2xl bg-zinc-900 px-5 py-4 shadow-sm">
  <div className="flex items-center justify-between">
    <span className="text-sm text-zinc-300">
      Saldo disponible
    </span>

    <span className="text-2xl font-bold text-white">
      {formatearImporte(monedero.saldo)} €
    </span>
  </div>
</div>

        {/* MOVIMIENTOS */}
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">
            Últimos movimientos
          </h2>

          {monedero.movimientos.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <p className="text-sm text-zinc-500">
                Todavía no hay movimientos.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {monedero.movimientos.map((movimiento, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-zinc-100 p-4 last:border-b-0"
                >
                  <div className="pr-4">
                    <p className="font-medium text-zinc-900">
                      {movimiento.concepto || movimiento.tipo}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {formatearFecha(movimiento.fecha)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        esEntrada(movimiento.tipo)
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {signoMovimiento(movimiento.tipo)}
                      {formatearImporte(movimiento.importe)} €
                    </p>

                    <p className="mt-1 text-xs text-zinc-400">
                      Saldo:{" "}
                      {formatearImporte(
                        movimiento.saldoPosterior
                      )}{" "}
                      €
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-zinc-400">
          Consulta de monedero
        </p>

      </div>
    </main>
  );
}