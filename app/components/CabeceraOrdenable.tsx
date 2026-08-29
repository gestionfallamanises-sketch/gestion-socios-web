type Props = {
    titulo: string;
    campo: string;
    campoOrden: string;
    direccionOrden: "asc" | "desc";
    alOrdenar: (campo: string) => void;
    className?: string;
  };
  
  export default function CabeceraOrdenable({
    titulo,
    campo,
    campoOrden,
    direccionOrden,
    alOrdenar,
    className = "",
  }: Props) {
    const activo = campoOrden === campo;
  
    return (
      <th
        onClick={() => alOrdenar(campo)}
        className={`cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase hover:bg-zinc-200 ${className}`}
      >
        <div className="flex items-center gap-1">
          <span>{titulo}</span>
  
          {activo ? (
            direccionOrden === "asc" ? (
              <span>▲</span>
            ) : (
              <span>▼</span>
            )
          ) : (
            <span className="text-zinc-300">▲▼</span>
          )}
        </div>
      </th>
    );
  }