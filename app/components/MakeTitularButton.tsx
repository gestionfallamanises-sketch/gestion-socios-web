"use client";

import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import ConfirmModal from "./ConfirmModal";

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
  
    const numsSocios = (sociosFamilia || []).map(
      (s: any) => s.NUMCENS
    );
  
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
  
    const { data: ejercicioData, error: errorEjercicio } =
      await supabase
        .from("EJERCICIOS")
        .select("Ejercicio")
        .eq("Activo", true)
        .maybeSingle();
  
    if (errorEjercicio) {
      alert(errorEjercicio.message);
      return;
    }
  
    const ejercicioActivo = Number(
      ejercicioData?.Ejercicio || 0
    );
  
    if (!ejercicioActivo) {
      alert("No se ha encontrado un ejercicio activo.");
      return;
    }
  
    const { error: errorCuotas } = await supabase.rpc(
      "generar_actualizar_cuotas_completo",
      {
        p_ejercicio: ejercicioActivo,
      }
    );
  
    if (errorCuotas) {
      alert(errorCuotas.message);
      return;
    }
  
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