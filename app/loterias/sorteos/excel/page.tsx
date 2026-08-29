"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

function calcularFila(sorteo: any, tipo: "Falla" | "Virgen") {
  const decimos = Number(sorteo[`Decimos${tipo}`] || 0);
  const precioDecimo = Number(sorteo[`PrecioDecimo${tipo}`] || 0);
  const importePapeleta = Number(sorteo[`ImportePapeleta${tipo}`] || 0);
  const beneficioPapeleta = Number(sorteo[`Beneficio${tipo}`] || 0);
  const premioPapeleta = Number(sorteo[`Premio${tipo}PorPapeleta`] || 0);
  const papeletasSocios = Number(sorteo[`PapeletasTotales${tipo}`] || 0);

  const pagoAdministracion = decimos * precioDecimo;

  const papeletasEmitidas =
    importePapeleta > 0
      ? Math.floor(pagoAdministracion / importePapeleta)
      : 0;

  const restantes = Math.max(0, papeletasEmitidas - papeletasSocios);
  const precioVenta = importePapeleta + beneficioPapeleta;

  return {
    "Fecha sorteo": sorteo.FechaSorteo,
    Número: sorteo[`Numero${tipo}`] || "",
    Décimos: decimos,
    "Precio décimo": precioDecimo,
    "Precio papeleta": importePapeleta,
    "Beneficio papeleta": beneficioPapeleta,
    "Premio papeleta": premioPapeleta,
    "Papeletas emitidas": papeletasEmitidas,
    "Papeletas socios": papeletasSocios,
    Restantes: restantes,
    "Recaudación socios": papeletasSocios * precioVenta,
    "Importe jugado socios": papeletasSocios * importePapeleta,
    "Beneficio socios": papeletasSocios * beneficioPapeleta,
    "Pago administración": pagoAdministracion,
    "Jugado sobrantes": restantes * importePapeleta,
  };
}

function calcularTotales(filas: any[]) {
  return filas.reduce(
    (acc, fila) => ({
      Décimos: acc.Décimos + Number(fila.Décimos || 0),
      "Papeletas emitidas":
        acc["Papeletas emitidas"] +
        Number(fila["Papeletas emitidas"] || 0),
      "Papeletas socios":
        acc["Papeletas socios"] +
        Number(fila["Papeletas socios"] || 0),
      Restantes: acc.Restantes + Number(fila.Restantes || 0),
      "Recaudación socios":
        acc["Recaudación socios"] +
        Number(fila["Recaudación socios"] || 0),
      "Importe jugado socios":
        acc["Importe jugado socios"] +
        Number(fila["Importe jugado socios"] || 0),
      "Beneficio socios":
        acc["Beneficio socios"] +
        Number(fila["Beneficio socios"] || 0),
      "Pago administración":
        acc["Pago administración"] +
        Number(fila["Pago administración"] || 0),
      "Jugado sobrantes":
        acc["Jugado sobrantes"] +
        Number(fila["Jugado sobrantes"] || 0),
    }),
    {
      Décimos: 0,
      "Papeletas emitidas": 0,
      "Papeletas socios": 0,
      Restantes: 0,
      "Recaudación socios": 0,
      "Importe jugado socios": 0,
      "Beneficio socios": 0,
      "Pago administración": 0,
      "Jugado sobrantes": 0,
    }
  );
}

function crearHoja(
  filas: any[],
  titulo: string
) {
  const totales = calcularTotales(filas);

  const resumen = [
    [titulo],
    [],
    ["RESUMEN"],
    ["Décimos", totales.Décimos],
    ["Papeletas emitidas", totales["Papeletas emitidas"]],
    ["Papeletas socios", totales["Papeletas socios"]],
    ["Restantes", totales.Restantes],
    ["Recaudación socios", totales["Recaudación socios"]],
    ["Importe jugado socios", totales["Importe jugado socios"]],
    ["Beneficio socios", totales["Beneficio socios"]],
    ["Pago administración", totales["Pago administración"]],
    ["Jugado sobrantes", totales["Jugado sobrantes"]],
    [],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(resumen);

  XLSX.utils.sheet_add_json(worksheet, filas, {
    origin: `A${resumen.length + 1}`,
    skipHeader: false,
  });

  worksheet["!cols"] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 15 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 17 },
    { wch: 12 },
    { wch: 20 },
    { wch: 22 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
  ];

  return worksheet;
}

export default function ExcelSorteosPage() {
  const router = useRouter();

  useEffect(() => {
    exportarExcel();
  }, []);

  async function exportarExcel() {
    const { data, error } = await (supabase as any)
      .from("LOTERIA_SORTEOS")
      .select("*")
      .order("FechaSorteo", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    const sorteos = data || [];

    const filasFalla = sorteos.map((sorteo: any) =>
      calcularFila(sorteo, "Falla")
    );

    const filasVirgen = sorteos
      .filter((sorteo: any) => sorteo.TipoSorteo !== "ESPECIAL")
      .map((sorteo: any) =>
        calcularFila(sorteo, "Virgen")
      );

    const workbook = XLSX.utils.book_new();

    const hojaFalla = crearHoja(
      filasFalla,
      "RESUMEN ECONÓMICO - FALLA"
    );

    const hojaVirgen = crearHoja(
      filasVirgen,
      "RESUMEN ECONÓMICO - VIRGEN"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      hojaFalla,
      "Falla"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      hojaVirgen,
      "Virgen"
    );

    XLSX.writeFile(
      workbook,
      "resumen-sorteos.xlsx"
    );

    router.push("/loterias/sorteos");
  }

  return (
    <main className="p-8 text-sm">
      Generando Excel de sorteos...
    </main>
  );
}