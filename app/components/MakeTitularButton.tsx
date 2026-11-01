
"use client";

import { useState } from "react";
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
  const [guardando, setGuardando] = useState(false);

  async function cambiarTitular() {
    if (guardando) return;

    setGuardando(true);

    try {
      const nuevoTitular = Number(numcens);

      // Comprobar que el socio pertenece a esta familia
      // y está activo.
      const { data: socio, error: errorSocio } =
        await supabase
          .from("SOCIOS")
          .select("NUMCENS, ID_Familia, Estado")
          .eq("NUMCENS", nuevoTitular)
          .eq("ID_Familia", idFamilia)
          .eq("Estado", "Activo")
          .maybeSingle();

      if (errorSocio) throw errorSocio;

      if (!socio) {
        alert(
          "No se puede cambiar el titular. " +
          "El socio no pertenece a esta familia " +
          "o no está activo."
        );
        return;
      }

      // Comprobar que la familia existe.
      const { data: familia, error: errorFamilia } =
        await supabase
          .from("FAMILIAS")
          .select("ID_Familia, Titular_NUMCENS")
          .eq("ID_Familia", idFamilia)
          .maybeSingle();

      if (errorFamilia) throw errorFamilia;

      if (!familia) {
        alert("No se ha encontrado la familia.");
        return;
      }

      if (Number(familia.Titular_NUMCENS) === nuevoTitular) {
        alert("Este socio ya es el titular de la familia.");
        return;
      }

      // ÚNICA MODIFICACIÓN:
      // cambiar el titular de la familia.
      const { data: actualizado, error: errorActualizar } =
        await supabase
          .from("FAMILIAS")
          .update({
            Titular_NUMCENS: nuevoTitular,
          })
          .eq("ID_Familia", idFamilia)
          .eq("Titular_NUMCENS", familia.Titular_NUMCENS)
          .select("ID_Familia")
          .maybeSingle();

      if (errorActualizar) throw errorActualizar;

      if (!actualizado) {
        alert(
          "No se ha podido confirmar el cambio. " +
          "Es posible que otro usuario haya modificado " +
          "el titular. Actualiza la página."
        );
        return;
      }

      window.location.reload();
    } catch (error: any) {
      alert(
        "Error al cambiar el titular: " +
        (error?.message || "Error desconocido")
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalAbierto(true)}
        disabled={guardando}
        className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 disabled:opacity-50"
      >
        {guardando ? "Guardando..." : "Cambiar"}
      </button>

      <ConfirmModal
        open={modalAbierto}
        title="Cambiar titular de la familia"
        message="Se cambiará únicamente el titular de la familia. No se modificarán los pagadores, las cuotas, los plazos ni las remesas. ¿Deseas continuar?"
        confirmText="Sí, cambiar titular"
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
