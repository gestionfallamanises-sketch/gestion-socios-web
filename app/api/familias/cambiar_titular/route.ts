import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const idFamilia = Number(body.idFamilia);
    const numcens = Number(body.numcens);

    const { error } = await supabase
      .from("FAMILIAS")
      .update({
        Titular_NUMCENS: numcens,
      })
      .eq("ID_Familia", idFamilia);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: String(err),
      },
      { status: 500 }
    );
  }
}