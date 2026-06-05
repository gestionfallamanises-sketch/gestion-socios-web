"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import ConfirmModal from "@/app/components/ConfirmModal";

export default function MakeTitularButton({
  idFamilia,
  numcens,
}: {
  idFamilia: number;
  numcens: string;
}) {

  const [modalAbierto, setModalAbierto] = useState(false);

  async function cambiarTitular() {
    const { error } = await supabase
      .from("FAMILIAS")
      .update({
        Titular_NUMCENS: Number(numcens),
      })
      .eq("ID_Familia", Number(idFamilia));
  
    if (error) {
      alert(error.message);
      return;
    }
  
    const { data: sociosFamilia, error: errorSocios } = await supabase
      .from("SOCIOS")
      .select("NUMCENS")
      .eq("ID_Familia", Number(idFamilia))
      .eq("Estado", "Activo");
  
    if (errorSocios) {
      alert(errorSocios.message);
      return;
    }
  
    const numsSocios = (sociosFamilia || []).map((s: any) => s.NUMCENS);
  
    if (numsSocios.length > 0) {
      const { error: errorPagadores } = await supabase
        .from("FORMAS_PAGO_SOCIOS")
        .update({
          NUMCENS_Pagador: Number(numcens),
        })
        .in("NUMCENS", numsSocios)
        .eq("Activo", true);
  
      if (errorPagadores) {
        alert(errorPagadores.message);
        return;
      }
    }
  
    await supabase.rpc("generar_actualizar_cuotas_completo", {
      p_ejercicio: 2027,
    });
  
    window.location.reload();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalAbierto(true)}
        className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-200"
      >
        Cambiar
      </button>
  
      <ConfirmModal
        open={modalAbierto}
        title="ATENCIÓN"
        message="Está cambiando el titular de la familia. También se actualizará el pagador de todos los miembros activos de esta familia. ¿Desea continuar?"
        confirmText="Sí, cambiar"
        cancelText="Cancelar"
        onCancel={() => setModalAbierto(false)}
        onConfirm={() => {
          setModalAbierto(false);
          cambiarTitular();
        }}
      />
    </>
  );
}