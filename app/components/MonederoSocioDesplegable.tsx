"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { supabase } from "../../lib/supabaseClient";

type Props = {
    numcens: number;
    nombre: string;
    apellidos: string;
    monederoId: number | null;
    tokenQR: string | null;
    tieneMonedero: boolean;
    saldo: number;
    activo: boolean;
    compacto?: boolean;
    onSaldoChange?: (nuevoSaldo: number) => void;
  };

  export default function MonederoSocioDesplegable({
    numcens,
    nombre,
    apellidos,
    monederoId,
    tokenQR,
    tieneMonedero,
    saldo,
    activo,
    compacto = false,
    onSaldoChange,
  }: Props) {

    const [abierto, setAbierto] = useState(false);
    const [mostrarRecarga, setMostrarRecarga] = useState(false);
    const [importeRecarga, setImporteRecarga] = useState("");
const [cargando, setCargando] = useState(false);
const [mensaje, setMensaje] = useState("");
const [mostrarMovimientos, setMostrarMovimientos] = useState(false);
const [movimientos, setMovimientos] = useState<any[]>([]);
const [cargandoMovimientos, setCargandoMovimientos] = useState(false);
const [mostrarQR, setMostrarQR] = useState(false);
const [imagenQR, setImagenQR] = useState("");
const [activando, setActivando] = useState(false);
const [mensajeActivacion, setMensajeActivacion] = useState("");
const [primeraRecargaRealizada, setPrimeraRecargaRealizada] = useState(false);
const [saldoActual, setSaldoActual] = useState(saldo);



async function confirmarRecarga() {
    const importe = Number(importeRecarga);
  
    if (!importe || importe <= 0) {
      setMensaje("Introduce un importe válido");
      return;
    }
  
    setCargando(true);
    setMensaje("");
  
    const { data, error } = await (supabase as any).rpc(
  "recargar_monedero_efectivo",
  {
    p_numcens: numcens,
    p_importe: importe,
    p_concepto: "Recarga en efectivo",
  }
);
  
    setCargando(false);
  
    if (error) {
      setMensaje("Error al realizar la recarga");
      console.error(error);
      return;
    }
  
    const nuevoSaldo = Number(data);
    const eraPrimeraRecarga = saldoActual === 0;
    
    setSaldoActual(nuevoSaldo);
    
    if (eraPrimeraRecarga) {
      setPrimeraRecargaRealizada(true);
    }

    setMensaje(
        eraPrimeraRecarga
          ? `Recarga realizada. Nuevo saldo: ${nuevoSaldo.toFixed(2)} €. Recuerda compartir el QR con el socio.`
          : `Recarga realizada. Nuevo saldo: ${nuevoSaldo.toFixed(2)} €`
      );

setImporteRecarga("");
  }

  async function cargarMovimientos() {
    if (!monederoId) return;

    if (mostrarMovimientos) {
      setMostrarMovimientos(false);
      return;
    }
  
    setCargandoMovimientos(true);
  
    const { data, error } = await (supabase as any)
  .from("MONEDEROS_MOVIMIENTOS")
  .select(`
    IDMovimiento,
    Tipo,
    Importe,
    SaldoAnterior,
    SaldoPosterior,
    Concepto,
    Fecha,
    Anulado
  `)
      .eq("IDMonedero", monederoId)
      .order("Fecha", { ascending: false });
  
    setCargandoMovimientos(false);
  
    if (error) {
      console.error(error);
      return;
    }
  
    setMovimientos(data || []);
    setMostrarMovimientos(true);
  }

  async function verQR() {
    if (mostrarQR) {
      setMostrarQR(false);
      return;
    }
  
    if (!tokenQR) return;
  
    try {
      const qr = await QRCode.toDataURL(tokenQR, {
        width: 300,
        margin: 2,
      });
  
      setImagenQR(qr);
      setMostrarQR(true);
    } catch (error) {
      console.error("Error generando QR:", error);
    }
  }

  async function obtenerEnlaceConsulta() {
    if (!monederoId) return null;
  
    const { data, error } = await (supabase as any)
      .from("MONEDEROS")
      .select("TokenConsulta")
      .eq("IDMonedero", monederoId)
      .single();
  
    if (error) {
      console.error("Error obteniendo TokenConsulta:", error);
      return null;
    }
  
    if (!data?.TokenConsulta) return null;
  
    return `${window.location.origin}/mi-monedero/${data.TokenConsulta}`;
  }

  async function compartirQR() {
    if (!tokenQR) return;
  
    try {
        const enlaceConsulta = await obtenerEnlaceConsulta();

if (!enlaceConsulta) {
  alert("No se ha podido obtener el enlace de consulta del saldo.");
  return;
}
      // Generamos el QR
      const qrDataUrl = await QRCode.toDataURL(tokenQR, {
        width: 600,
        margin: 2,
      });
  
      const qrImagen = new Image();
  
      await new Promise<void>((resolve, reject) => {
        qrImagen.onload = () => resolve();
        qrImagen.onerror = reject;
        qrImagen.src = qrDataUrl;
      });
  
      // Creamos la tarjeta
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 1150;
  
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
  
      // Fondo
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      // Título
      ctx.fillStyle = "#7f1d1d";
      ctx.textAlign = "center";
      ctx.font = "bold 52px Arial";
      ctx.fillText("MONEDERO", canvas.width / 2, 100);
  
      // Nombre completo
      const nombreCompleto = `${nombre} ${apellidos}`.trim();
  
      ctx.fillStyle = "#18181b";
      ctx.font = "bold 34px Arial";
      ctx.fillText(nombreCompleto, canvas.width / 2, 175);
      ctx.fillStyle = "#71717a";
ctx.font = "24px Arial";
ctx.fillText(
  `Socio ${numcens}`,
  canvas.width / 2,
  215
);
  
      // QR
      const qrSize = 600;
  
      ctx.drawImage(
        qrImagen,
        (canvas.width - qrSize) / 2,
        260,
        qrSize,
        qrSize
      );
  
      // Texto inferior
      ctx.fillStyle = "#52525b";
      ctx.font = "26px Arial";
      ctx.fillText(
        "Guarda este código para utilizar tu monedero",
        canvas.width / 2,
        920
      );
  
      ctx.fillText(
        "Preséntalo al realizar tus compras",
        canvas.width / 2,
        965
      );

      ctx.fillStyle = "#7f1d1d";
ctx.font = "bold 22px Arial";

ctx.fillText(
  "Este QR es personal. No lo compartas con nadie.",
  canvas.width / 2,
  1035
);

ctx.fillStyle = "#71717a";
ctx.font = "20px Arial";

ctx.fillText(
  "Quien tenga acceso a este código podrá utilizar tu saldo.",
  canvas.width / 2,
  1070
);
  
      // Convertimos la tarjeta en PNG
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png");
      });
  
      if (!blob) return;
  
      const archivo = new File(
        [blob],
        `monedero-${numcens}.png`,
        { type: "image/png" }
      );
  
      // Compartir desde dispositivos compatibles
      if (
        navigator.share &&
        navigator.canShare?.({ files: [archivo] })
      ) {
        await navigator.share({
            files: [archivo],
            title: "Monedero",
            text:
              `Monedero de ${nombreCompleto}\n\n` +
              `Guarda la imagen QR para realizar tus pagos.\n\n` +
              `Consulta tu saldo y movimientos aquí:\n${enlaceConsulta}`,
          });
  
        return;
      }
  
      // Si no permite compartir archivos, descargar PNG
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
  
      enlace.href = url;
      enlace.download = `monedero-${numcens}.png`;
      enlace.click();
  
      URL.revokeObjectURL(url);
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.error("Error compartiendo QR:", error);
      }
    }
  }

  async function regenerarQR() {
    const confirmar = window.confirm(
      "¿Regenerar el QR de este socio?\n\n" +
        "El QR anterior dejará de funcionar inmediatamente.\n" +
        "El saldo y los movimientos no se modificarán."
    );
  
    if (!confirmar) return;
  
    try {
      const { error } = await (supabase as any).rpc(
        "regenerar_qr_monedero",
        {
          p_numcens: numcens,
        }
      );
  
      if (error) {
        console.error("Error regenerando QR:", error);
        alert("No se ha podido regenerar el QR.");
        return;
      }
  
      alert(
        "QR regenerado correctamente.\n\nEl QR anterior ya no es válido."
      );
  
      window.location.reload();
    } catch (error) {
      console.error("Error regenerando QR:", error);
      alert("No se ha podido regenerar el QR.");
    }
  }

  async function activarMonedero() {
    setActivando(true);
    setMensajeActivacion("");
  
    const { error } = await (supabase as any).rpc(
      "obtener_o_crear_monedero",
      {
        p_numcens: numcens,
      }
    );
  
    setActivando(false);
  
    if (error) {
      console.error(error);
      setMensajeActivacion("No se ha podido activar el monedero.");
      return;
    }
  
    setMensajeActivacion("Monedero activado correctamente.");
  
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
  
  return (
    <div
  className={`relative ${
    compacto ? "" : "border-l border-b border-zinc-200"
  }`}
>
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="w-full text-left"
      >
        {!compacto && (
  <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
    Monedero
  </div>
)}

<div
  className={`flex items-center justify-between text-sm ${
    compacto ? "gap-2" : "bg-white px-4 py-3"
  }`}
>
  <span className="font-medium text-zinc-700">
    {tieneMonedero ? "Ver monedero" : "Sin monedero"}
  </span>

          <span className="text-xs text-zinc-500">
  {abierto ? "▲" : "▼"}
</span>
        </div>
      </button>

      {abierto && (
  <div className="absolute right-0 top-full z-30 w-[760px] max-w-[90vw] border border-zinc-200 bg-white p-4 shadow-lg">
    
    {!tieneMonedero ? (
      <div>
        <p className="mb-3 text-sm text-zinc-500">
          Este socio todavía no tiene monedero.
        </p>

        <button
          type="button"
          onClick={activarMonedero}
          disabled={activando}
          className="w-full bg-red-900 px-3 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {activando ? "Activando..." : "Activar monedero"}
        </button>

        {mensajeActivacion && (
          <p className="mt-2 text-xs text-zinc-600">
            {mensajeActivacion}
          </p>
        )}
      </div>
    ) : (
      <>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs uppercase text-zinc-500">
            Saldo disponible
          </span>

          <span className="font-semibold">
          {saldoActual.toFixed(2)} €
          </span>
        </div>

        <div>
  {/* BARRA DE ACCIONES */}
  <div className="flex flex-wrap items-center gap-2">

    {/* RECARGAR */}
    <button
      type="button"
      onClick={() => {
        setMostrarRecarga(!mostrarRecarga);
        setMostrarMovimientos(false);
        setMostrarQR(false);
      }}
      className={`px-3 py-2 text-sm font-medium ${
        mostrarRecarga
          ? "bg-red-900 text-white"
          : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      Recargar
    </button>

    {/* MOVIMIENTOS */}
    <button
      type="button"
      onClick={async () => {
        setMostrarRecarga(false);
        setMostrarQR(false);
        await cargarMovimientos();
      }}
      disabled={cargandoMovimientos}
      className={`px-3 py-2 text-sm font-medium disabled:opacity-50 ${
        mostrarMovimientos
          ? "bg-zinc-800 text-white"
          : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      {cargandoMovimientos
        ? "Cargando..."
        : mostrarMovimientos
        ? "Ocultar movimientos"
        : "Movimientos"}
    </button>

    {/* VER QR */}
    <button
      type="button"
      onClick={async () => {
        setMostrarRecarga(false);
        setMostrarMovimientos(false);
        await verQR();
      }}
      className={`px-3 py-2 text-sm font-medium ${
        mostrarQR
          ? "bg-zinc-800 text-white"
          : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      {mostrarQR ? "Ocultar QR" : "Ver QR"}
    </button>

    {/* COMPARTIR MONEDERO */}
    <button
      type="button"
      onClick={async () => {
        const enlace = await obtenerEnlaceConsulta();

        if (!enlace) {
          alert("No se ha podido obtener el enlace del monedero.");
          return;
        }

        await navigator.clipboard.writeText(enlace);
        alert(
          "Enlace del monedero copiado.\n\nPuedes pegarlo en WhatsApp, correo o donde quieras."
        );
      }}
      className="border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
    >
      Compartir monedero
    </button>

    {/* REGENERAR QR */}
    <button
      type="button"
      onClick={regenerarQR}
      className="border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-50"
    >
      Regenerar QR
    </button>

  </div>

  {/* CONTENIDO QUE SE ABRE DEBAJO */}
  <div className="mt-3">

    {/* RECARGA */}
    {mostrarRecarga && (
      <div className="border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium uppercase text-zinc-500">
              Importe
            </label>

            <div className="flex items-center gap-2">
              <input
                type="number"
                value={importeRecarga}
                onChange={(e) => setImporteRecarga(e.target.value)}
                min="0.01"
                step="0.01"
                placeholder="0,00"
                className="min-w-0 flex-1 border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-900"
              />

              <span className="text-sm text-zinc-600">€</span>
            </div>
          </div>

          <button
            type="button"
            onClick={confirmarRecarga}
            disabled={cargando}
            className="bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando ? "Recargando..." : "Confirmar recarga"}
          </button>
        </div>

        {mensaje && (
          <p className="mt-2 text-xs text-zinc-600">
            {mensaje}
          </p>
        )}

        {primeraRecargaRealizada && (
          <p className="mt-2 text-xs font-medium text-red-900">
            Primera recarga realizada. Recuerda compartir el monedero con el socio.
          </p>
        )}
      </div>
    )}

    {/* MOVIMIENTOS */}
    {mostrarMovimientos && (
      <div className="max-h-72 overflow-y-auto border border-zinc-200 bg-white">
        {movimientos.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">
            No hay movimientos.
          </p>
        ) : (
          movimientos.map((movimiento) => (
            <div
              key={movimiento.IDMovimiento}
              className="border-b border-zinc-200 p-3 last:border-b-0"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-zinc-700">
                  {movimiento.Tipo === "RECARGA_EFECTIVO"
                    ? "Recarga en efectivo"
                    : movimiento.Tipo === "CONSUMO"
                    ? "Consumo"
                    : movimiento.Tipo}
                </span>

                <span
                  className={`text-sm font-semibold ${
                    movimiento.Tipo === "RECARGA_EFECTIVO"
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {movimiento.Tipo === "RECARGA_EFECTIVO" ? "+" : "-"}
                  {Number(movimiento.Importe).toFixed(2)} €
                </span>
              </div>

              <div className="mt-1 text-xs text-zinc-500">
  {new Date(movimiento.Fecha).toLocaleDateString("es-ES")}
</div>

              <div className="mt-1 text-xs text-zinc-400">
                {Number(movimiento.SaldoAnterior).toFixed(2)} €
                {" → "}
                {Number(movimiento.SaldoPosterior).toFixed(2)} €
              </div>
            </div>
          ))
        )}
      </div>
    )}

    {/* QR */}
    {mostrarQR && imagenQR && (
      <div className="border border-zinc-200 bg-white p-4 text-center">
        <img
          src={imagenQR}
          alt={`QR monedero socio ${numcens}`}
          className="mx-auto h-44 w-44"
        />

        <p className="mt-2 text-xs text-zinc-500">
          QR personal del socio
        </p>

        <p className="mt-1 text-xs font-medium text-red-800">
          No compartir con terceros. Quien tenga este QR podrá utilizar el saldo.
        </p>
      </div>
    )}

  </div>
</div>
      </>
    )}
  </div>
)}
    </div>
  );
}