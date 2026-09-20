"use client";

import { useState } from "react";

export default function LoteriaSocioDesplegable({
  conLoteria,
  falla,
  virgen,
  navidad,
  nino,
  responsable,
  numcens,
}: {
  conLoteria: boolean;
  falla: number;
  virgen: number;
  navidad: number;
  nino: number;
  responsable?: string | null;
  numcens: number;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="relative border-r border-b border-zinc-200">
      <div className="bg-zinc-100 px-4 py-2 text-xs font-medium uppercase text-zinc-600">
        Lotería
      </div>
  
      <div className="bg-white px-4 py-3 text-sm">
        <button
          type="button"
          onClick={() => conLoteria && setAbierto((actual) => !actual)}
          className={`flex items-center gap-2 ${
            conLoteria ? "cursor-pointer" : "cursor-default"
          }`}
        >
          {conLoteria ? "Sí" : "No"}
  
          {conLoteria && (
            <span className="text-[10px] text-zinc-500">
              {abierto ? "▲" : "▼"}
            </span>
          )}
        </button>
      </div>
  
      {abierto && conLoteria && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[220px] border border-zinc-200 bg-white p-4 shadow-xl">
          <div className="mb-3 text-xs font-semibold uppercase text-zinc-500">
            Papeletas asignadas
          </div>
  
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <span className="text-zinc-500">Falla</span>
            <span className="text-right font-medium">{falla}</span>
  
            <span className="text-zinc-500">Virgen</span>
            <span className="text-right font-medium">{virgen}</span>
  
            <span className="text-zinc-500">Navidad</span>
            <span className="text-right font-medium">{navidad}</span>
  
            <span className="text-zinc-500">Niño</span>
            <span className="text-right font-medium">{nino}</span>
          </div>
  
          {responsable && (
            <div className="mt-3 border-t border-zinc-200 pt-3 text-xs text-zinc-500">
              Responsable:{" "}
              <span className="font-medium text-zinc-800">
                {responsable}
              </span>
             
              <a
  href={`/loterias/socios-loteria?numcens=${numcens}&volver=${encodeURIComponent(
    `/socios/${numcens}`
  )}`}
  className="mt-3 block bg-red-900 px-3 py-2 text-center text-xs font-medium text-white hover:bg-red-950"
>
  Gestionar papeletas
</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}