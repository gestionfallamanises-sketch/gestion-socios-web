"use client";

import { useState } from "react";
import RegistrarPagoModal from "@/app/components/RegistrarPagoModal";

export default function RegistrarPagoModalButton({
    idCuotaSocio,
    numcens,
    pendienteMaximo,
  }: {
    idCuotaSocio: number;
    numcens: number;
    pendienteMaximo: number;
  }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950"
      >
        Registrar pago
      </button>

      <RegistrarPagoModal
  open={open}
  idCuotaSocio={idCuotaSocio}
  numcens={numcens}
  pendienteMaximo={pendienteMaximo}
  onCancel={() => setOpen(false)}
/>
    </>
  );
}