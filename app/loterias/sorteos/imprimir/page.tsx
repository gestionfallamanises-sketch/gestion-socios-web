"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import TablaResumenSorteos from "@/app/loterias/componentes/TablaResumenSorteos";

export default function ImprimirSorteosPage() {
  const [sorteos, setSorteos] = useState<any[]>([]);

  useEffect(() => {
    cargarSorteos();
  }, []);

  async function cargarSorteos() {
    const { data, error } = await (supabase as any)
      .from("LOTERIA_SORTEOS")
      .select("*")
      .order("FechaSorteo", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setSorteos(data || []);
  }

  return (
    <main className="bg-white p-6 text-sm text-zinc-900">
      <div className="mb-4 flex justify-between no-print">
        <button onClick={() => window.history.back()} className="text-red-900">
          ← Volver
        </button>

        <button
          onClick={() => window.print()}
          className="bg-red-900 px-4 py-2 text-white"
        >
          Imprimir
        </button>
      </div>

<TablaResumenSorteos
  titulo="Sorteos Falla"
  tipo="Falla"
  sorteos={sorteos}
/>

<div className="break-before-page" />

<TablaResumenSorteos
  titulo="Sorteos Virgen"
  tipo="Virgen"
  sorteos={sorteos}
/>

      <style jsx global>{`
  @media print {
    .no-print {
      display: none !important;
    }

    @page {
      size: landscape;
      margin: 1cm;
    }
  }
`}</style>
    </main>

    
  );
}