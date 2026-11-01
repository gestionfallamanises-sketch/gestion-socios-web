"use client";

// Exportación .xlsx real con la librería xlsx ya instalada.
// No modifica datos ni realiza consultas nuevas a Supabase.
type Movimiento = {
  fecha: string;
  tipo: string;
  referencia: string;
  importe: number | null;
  estado: string;
};

type Bloque = {
  numcens: number;
  nombre: string;
  ejercicio: string;
  metodo: string;
  cuota: number;
  pagado: number;
  pendiente: number;
  movimientos: Movimiento[];
};

function textoSeguro(valor: unknown): string {
  const texto = String(valor ?? "");
  // No permitir fórmulas procedentes de textos de la base de datos.
  return /^[\s]*[=+@\-\t\r]/.test(texto) ? "'" + texto : texto;
}

function fechaVisible(fecha: string): string {
  const match = String(fecha ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : textoSeguro(fecha);
}

export default function ExportarExcelFamiliaButton({
  nombreFamilia,
  bloques,
}: {
  nombreFamilia: string;
  bloques: Bloque[];
}) {
  async function exportar() {
    // Carga la librería al pulsar, sin incluirla en el código inicial de la página.
    const XLSX = await import("xlsx");
    const libro = XLSX.utils.book_new();

    const resumen = bloques.map((socio) => ({
      "Nº socio": socio.numcens,
      "Nombre": textoSeguro(socio.nombre),
      "Ejercicio": textoSeguro(socio.ejercicio),
      "Método": textoSeguro(socio.metodo),
      "Cuota (€)": Number(socio.cuota) || 0,
      "Pagado (€)": Number(socio.pagado) || 0,
      "Pendiente (€)": Number(socio.pendiente) || 0,
    }));

    const columnasResumen = ["Nº socio", "Nombre", "Ejercicio", "Método", "Cuota (€)", "Pagado (€)", "Pendiente (€)"];
    const hojaResumen = XLSX.utils.json_to_sheet(resumen, { header: columnasResumen });
    hojaResumen["!cols"] = [
      { wch: 13 }, { wch: 36 }, { wch: 12 }, { wch: 13 },
      { wch: 15 }, { wch: 15 }, { wch: 17 },
    ];
    hojaResumen["!autofilter"] = { ref: hojaResumen["!ref"] || "A1:G1" };
    XLSX.utils.book_append_sheet(libro, hojaResumen, "Resumen socios");

    const movimientos = bloques.flatMap((socio) =>
      socio.movimientos.map((mov) => ({
        "Nº socio": socio.numcens,
        "Nombre": textoSeguro(socio.nombre),
        "Ejercicio": textoSeguro(socio.ejercicio),
        "Fecha": fechaVisible(mov.fecha),
        "Tipo": textoSeguro(mov.tipo),
        "Referencia": textoSeguro(mov.referencia),
        "Importe (€)": mov.importe == null ? null : Number(mov.importe),
        "Estado": textoSeguro(mov.estado),
      }))
    );
    const columnasMovimientos = ["Nº socio", "Nombre", "Ejercicio", "Fecha", "Tipo", "Referencia", "Importe (€)", "Estado"];
    const hojaMovimientos = XLSX.utils.json_to_sheet(movimientos, { header: columnasMovimientos });
    hojaMovimientos["!cols"] = [
      { wch: 13 }, { wch: 36 }, { wch: 12 }, { wch: 14 },
      { wch: 16 }, { wch: 32 }, { wch: 17 }, { wch: 17 },
    ];
    hojaMovimientos["!autofilter"] = { ref: hojaMovimientos["!ref"] || "A1:H1" };
    XLSX.utils.book_append_sheet(libro, hojaMovimientos, "Movimientos");

    // Las cantidades son números de Excel (no texto) para permitir cálculos y filtros.
    const nombreLimpio = nombreFamilia
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 60) || "Familia";
    XLSX.writeFile(libro, `Cuotas_${nombreLimpio}.xlsx`, { bookType: "xlsx" });
  }

  return (
    <button
      type="button"
      onClick={() => { void exportar(); }}
      className="rounded border border-green-700 bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800"
      title="Descargar archivo Excel (.xlsx)"
    >
      Exportar a Excel
    </button>
  );
}
