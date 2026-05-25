import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const { numcens, idFamilia } = body;

  if (!numcens || !idFamilia) {
    return NextResponse.json(
      { error: "Faltan datos" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("SOCIOS")
    .update({
      ID_Familia: idFamilia,
    })
    .eq("NUMCENS", numcens)
    .select();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "No se ha actualizado ningún socio" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, data });
}