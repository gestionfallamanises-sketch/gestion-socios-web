"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function TrasladarFamiliaButton({
  idFamiliaOrigen,
}: {
  idFamiliaOrigen: number;
}) {
  const router = useRouter();

  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [familias, setFamilias] = useState<any[]>([]);
  const [familiaDestino, setFamiliaDestino] = useState<any>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarFamilias();
  }, []);

  async function cargarFamilias() {
    const { data, error } = await (supabase as any)
      .from("FAMILIAS")
      .select("ID_Familia, Nombre_Familia, Titular_NUMCENS")
      .neq("ID_Familia", idFamiliaOrigen)
      .order("Nombre_Familia", { ascending: true });

    if (error) {
      alert("Error cargando familias: " + error.message);
      return;
    }

    setFamilias(data || []);
  }

  const familiasFiltradas = familias.filter((familia) =>
    normalizar(familia.Nombre_Familia || "").includes(normalizar(busqueda))
  );

  async function trasladar() {
    if (!familiaDestino) {
      alert("Selecciona una familia destino.");
      return;
    }

    const confirmar = confirm(
      `¿Trasladar todos los miembros a "${familiaDestino.Nombre_Familia}"?`
    );

    if (!confirmar) return;

    setCargando(true);

    const titularDestino = familiaDestino.Titular_NUMCENS;

    if (!titularDestino) {
      alert("La familia destino no tiene titular asignado.");
      setCargando(false);
      return;
    }

    const { data: formaPagoTitular, error: errorFormaTitular } =
      await (supabase as any)
        .from("FORMAS_PAGO_SOCIOS")
        .select("Metodo, Fraccionado, NumeroPlazos")
        .eq("NUMCENS", titularDestino)
        .eq("Activo", true)
        .maybeSingle();

    if (errorFormaTitular) {
      alert("Error cargando forma de pago del titular.");
      setCargando(false);
      return;
    }

    const { data: miembrosOrigen, error: errorMiembros } = await (supabase as any)
      .from("SOCIOS")
      .select("NUMCENS")
      .eq("ID_Familia", idFamiliaOrigen);

    if (errorMiembros || !miembrosOrigen || miembrosOrigen.length === 0) {
      alert("No se han encontrado miembros en la familia origen.");
      setCargando(false);
      return;
    }

    const nums = miembrosOrigen.map((m: any) => m.NUMCENS);

    const { error: errorSocios } = await (supabase as any)
      .from("SOCIOS")
      .update({
        ID_Familia: familiaDestino.ID_Familia,
      })
      .in("NUMCENS", nums);

    if (errorSocios) {
      alert("Error trasladando miembros: " + errorSocios.message);
      setCargando(false);
      return;
    }

    const { error: errorFormaPago } = await (supabase as any)
      .from("FORMAS_PAGO_SOCIOS")
      .update({
        Metodo: formaPagoTitular?.Metodo || "Banco",
        Fraccionado: formaPagoTitular?.Fraccionado ?? true,
        NumeroPlazos: formaPagoTitular?.NumeroPlazos || 10,
        NUMCENS_Pagador: titularDestino,
        IDPagadorExterno: null,
      })
      .in("NUMCENS", nums)
      .eq("Activo", true);

    if (errorFormaPago) {
      alert("Miembros trasladados, pero error actualizando forma de pago: " + errorFormaPago.message);
      setCargando(false);
      return;
    }

    setCargando(false);
    alert("Miembros trasladados correctamente con el pagador del titular.");
    setAbierto(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="h-10 bg-zinc-700 px-4 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Trasladar miembros
      </button>

      {abierto && (
        <div className="absolute right-0 z-50 mt-2 w-80 border border-zinc-200 bg-white p-4 shadow-lg">
          <label className="mb-1 block text-xs font-medium uppercase text-zinc-600">
            Buscar familia destino
          </label>

          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setFamiliaDestino(null);
            }}
            placeholder="Escribe el nombre de la familia..."
            className="mb-3 w-full border border-zinc-300 px-3 py-2 text-sm"
          />

          <div className="max-h-48 overflow-y-auto border border-zinc-200">
            {familiasFiltradas.length === 0 ? (
              <div className="px-3 py-2 text-sm text-zinc-500">
                No hay resultados.
              </div>
            ) : (
              familiasFiltradas.map((familia) => (
                <button
                  key={familia.ID_Familia}
                  type="button"
                  onClick={() => {
                    setFamiliaDestino(familia);
                    setBusqueda(familia.Nombre_Familia || "");
                  }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-red-50"
                >
                  {familia.Nombre_Familia || `Familia ${familia.ID_Familia}`}
                </button>
              ))
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="px-3 py-2 text-sm text-zinc-600 hover:underline"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={trasladar}
              disabled={cargando || !familiaDestino}
              className="bg-red-900 px-3 py-2 text-sm font-medium text-white hover:bg-red-950 disabled:opacity-50"
            >
              {cargando ? "Trasladando..." : "Confirmar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}