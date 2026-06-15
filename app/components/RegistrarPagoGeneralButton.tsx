"use client";

import { useState } from "react";
import RegistrarPagoGeneralModal from "@/app/components/RegistrarPagoGeneralModal";

export default function RegistrarPagoGeneralButton() {
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

      <RegistrarPagoGeneralModal
        open={open}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}