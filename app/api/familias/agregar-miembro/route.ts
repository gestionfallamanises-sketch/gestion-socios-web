import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
  const { numcens, idFamilia } = body;

  if (!numcens || !idFamilia) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const numSocio = Number(numcens);
  const familiaId = Number(idFamilia);

  const { data, error } = await supabase
    .from("SOCIOS")
    .update({ ID_Familia: familiaId })
    .eq("NUMCENS", numSocio)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: familia, error: errorFamilia } = await supabase
    .from("FAMILIAS")
    .select("Titular_NUMCENS")
    .eq("ID_Familia", familiaId)
    .single();

  if (errorFamilia) {
    return NextResponse.json({ error: errorFamilia.message }, { status: 500 });
  }

  let titularNumcens = familia?.Titular_NUMCENS;

  if (!titularNumcens) {
    const { error: errorTitular } = await supabase
      .from("FAMILIAS")
      .update({ Titular_NUMCENS: numSocio })
      .eq("ID_Familia", familiaId);

    if (errorTitular) {
      return NextResponse.json({ error: errorTitular.message }, { status: 500 });
    }

    titularNumcens = numSocio;
  }

  if (Number(titularNumcens) !== numSocio) {
    const { data: formaPagoTitular, error: errorFormaTitular } = await supabase
      .from("FORMAS_PAGO_SOCIOS")
      .select("*")
      .eq("NUMCENS", Number(titularNumcens))
      .eq("Activo", true)
      .maybeSingle();

    if (errorFormaTitular) {
      return NextResponse.json(
        { error: errorFormaTitular.message },
        { status: 500 }
      );
    }

    if (formaPagoTitular) {
      await supabase
        .from("FORMAS_PAGO_SOCIOS")
        .update({ Activo: false })
        .eq("NUMCENS", numSocio);

      const { error: errorFormaPago } = await supabase
        .from("FORMAS_PAGO_SOCIOS")
        .insert({
          NUMCENS: numSocio,
          Metodo: formaPagoTitular.Metodo,
          Fraccionado: formaPagoTitular.Fraccionado,
          NumeroPlazos: formaPagoTitular.NumeroPlazos,
          Activo: true,
          Observaciones: formaPagoTitular.Observaciones || null,
          NUMCENS_Pagador: Number(titularNumcens),
          IDPagadorExterno: null,
        });

      if (errorFormaPago) {
        return NextResponse.json(
          { error: errorFormaPago.message },
          { status: 500 }
        );
      }
    }
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "No se ha actualizado ningún socio" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, data });
}