import * as XLSX from "xlsx";

type TipoColumna = "texto" | "numero" | "fecha" | "moneda";

type ColumnaExcel = {
  titulo: string;
  campo: string;
  ancho?: number;
  tipo?: TipoColumna;
};

type OpcionesExcel = {
  nombreArchivo: string;
  nombreHoja: string;
  columnas: ColumnaExcel[];
  datos: Record<string, any>[];
};

function convertirFechaExcel(valor: any) {
    if (!valor) return "";
  
    const texto = String(valor).slice(0, 10);
  
    const fechaISO = texto.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );
  
    if (fechaISO) {
      const [, year, month, day] = fechaISO;
  
      return (
        Date.UTC(
          Number(year),
          Number(month) - 1,
          Number(day)
        ) /
          86400000 +
        25569
      );
    }
  
    const fechaEspañola = texto.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    );
  
    if (fechaEspañola) {
      const [, day, month, year] = fechaEspañola;
  
      return (
        Date.UTC(
          Number(year),
          Number(month) - 1,
          Number(day)
        ) /
          86400000 +
        25569
      );
    }
  
    return "";
  }

export function exportarExcel({
  nombreArchivo,
  nombreHoja,
  columnas,
  datos,
}: OpcionesExcel) {
  const filas = datos.map((fila) => {
    const resultado: Record<string, any> = {};

    columnas.forEach((columna) => {
      const valor = fila[columna.campo];

      if (columna.tipo === "fecha") {
  resultado[columna.titulo] =
    convertirFechaExcel(valor);
  return;
}

      if (
        columna.tipo === "numero" ||
        columna.tipo === "moneda"
      ) {
        resultado[columna.titulo] = Number(valor || 0);
        return;
      }

      resultado[columna.titulo] = valor ?? "";
    });

    return resultado;
  });

  const hoja = XLSX.utils.json_to_sheet(filas, {
    dateNF: "dd/mm/yyyy",
  });

  hoja["!cols"] = columnas.map((columna) => ({
    wch: columna.ancho || 15,
  }));

  const rango = XLSX.utils.decode_range(
    hoja["!ref"] || "A1:A1"
  );

  columnas.forEach((columna, indiceColumna) => {
    for (let indiceFila = 1; indiceFila <= rango.e.r; indiceFila++) {
      const referencia = XLSX.utils.encode_cell({
        r: indiceFila,
        c: indiceColumna,
      });

      const celda = hoja[referencia];

      if (!celda) continue;

      if (columna.tipo === "fecha") {
        celda.t = "n";
        celda.z = "dd/mm/yyyy";
      }

      if (columna.tipo === "moneda") {
        celda.t = "n";
        celda.z = '#,##0.00 [$€-es-ES]';
      }

      if (columna.tipo === "numero") {
        celda.t = "n";
        celda.z = "0";
      }
    }
  });

  const libro = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    libro,
    hoja,
    nombreHoja
  );

  XLSX.writeFile(libro, nombreArchivo);
}