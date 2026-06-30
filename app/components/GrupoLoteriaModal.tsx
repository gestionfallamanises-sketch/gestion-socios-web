"use client";

export default function GrupoLoteriaModal(props: any) {
    const {
      mostrarModal,
      grupoEditando,
      busquedaResponsable,
      setBusquedaResponsable,
      responsableSeleccionado,
      setResponsableSeleccionado,
      sociosFiltrados,
      textoSocio,
      sociosIncluidos,
setSociosIncluidos,
busquedaSocio,
setBusquedaSocio,
agregarSocioIncluido,
quitarSocioIncluido,
papeletasFalla,
setPapeletasFalla,

papeletasVirgen,
setPapeletasVirgen,

papeletasNavidad,
setPapeletasNavidad,

papeletasNino,
setPapeletasNino,

observaciones,
setObservaciones,

limpiarFormulario,

setGrupoEditando,
setMostrarModal,

guardarGrupoLoteria,
      
    } = props;
  
    if (!mostrarModal) return null; 

  return (
    <>
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="w-full max-w-2xl border border-zinc-200 bg-white shadow-xl">

      <div className="border-b border-zinc-200 px-6 py-4">
        <h2 className="text-lg font-semibold">
        {grupoEditando ? "Editar grupo de lotería" : "Nuevo grupo de lotería"}
        </h2>
      </div>

      <div className="space-y-5 p-6">

      <div>
  <label className="mb-1 block text-sm font-medium text-zinc-700">
    Responsable
  </label>

  <input
    type="text"
    value={busquedaResponsable}
    onChange={(e) => {
      setBusquedaResponsable(e.target.value);
      setResponsableSeleccionado(null);
    }}
    placeholder="Buscar socio responsable..."
    className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
  />

  {busquedaResponsable && !responsableSeleccionado && (
    <div className="mt-1 max-h-40 overflow-y-auto border border-zinc-200 bg-white">
      {sociosFiltrados(busquedaResponsable).map((socio) => (
        <button
          key={socio.NUMCENS}
          type="button"
          onClick={() => {
            setResponsableSeleccionado(socio);
            setBusquedaResponsable(textoSocio(socio));
          
            const yaIncluido = sociosIncluidos.some(
              (s) => Number(s.NUMCENS) === Number(socio.NUMCENS)
            );
          
            if (!yaIncluido) {
              setSociosIncluidos([...sociosIncluidos, socio]);
            }
          }}
          className="block w-full px-3 py-2 text-left text-sm hover:bg-red-50"
        >
          {textoSocio(socio)}
          {socio.ConLoteria ? (
            <span className="ml-2 text-xs text-green-700">Con lotería</span>
          ) : (
            <span className="ml-2 text-xs text-zinc-400">Sin lotería</span>
          )}
        </button>
      ))}
    </div>
  )}
</div>

<div>
  <label className="mb-1 block text-sm font-medium text-zinc-700">
    Socios incluidos
  </label>

  <input
    type="text"
    value={busquedaSocio}
    onChange={(e) => setBusquedaSocio(e.target.value)}
    placeholder="Buscar socio para añadir..."
    className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
  />

  {busquedaSocio && (
    <div className="mt-1 max-h-40 overflow-y-auto border border-zinc-200 bg-white">
      {sociosFiltrados(busquedaSocio).map((socio) => (
        <button
          key={socio.NUMCENS}
          type="button"
          onClick={() => agregarSocioIncluido(socio)}
          className="block w-full px-3 py-2 text-left text-sm hover:bg-red-50"
        >
          {textoSocio(socio)}
          {socio.ConLoteria ? (
            <span className="ml-2 text-xs text-green-700">Con lotería</span>
          ) : (
            <span className="ml-2 text-xs text-zinc-400">Sin lotería</span>
          )}
        </button>
      ))}
    </div>
  )}

  {sociosIncluidos.length === 0 ? (
    <div className="mt-3 border border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
      Todavía no hay socios añadidos.
    </div>
  ) : (
    <div className="mt-3 divide-y divide-zinc-200 border border-zinc-200">
      {sociosIncluidos.map((socio) => (
        <div
          key={socio.NUMCENS}
          className="flex items-center justify-between px-3 py-2 text-sm"
        >
          <span>
            {textoSocio(socio)}
            {socio.ConLoteria ? (
              <span className="ml-2 text-xs text-green-700">Con lotería</span>
            ) : (
              <span className="ml-2 text-xs text-zinc-400">Sin lotería</span>
            )}
          </span>

          {Number(socio.NUMCENS) !== Number(responsableSeleccionado?.NUMCENS) ? (
  <button
    type="button"
    onClick={() => quitarSocioIncluido(socio.NUMCENS)}
    className="text-xs font-medium text-red-900 hover:underline"
  >
    Quitar
  </button>
) : (
  <span className="text-xs text-zinc-400">
    Responsable
  </span>
)}
        </div>
      ))}
    </div>
  )}
</div>

<div className="grid grid-cols-2 gap-2 md:grid-cols-7">
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
        Miembros
      </label>
      <input
  type="number"
  value={sociosIncluidos?.length ?? 0}
  readOnly
  className="w-full border border-zinc-300 bg-zinc-100 px-2 py-1 text-sm text-zinc-600"
/>
    </div>

    <div>
  <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
    Con lotería
  </label>

  <input
    type="number"
    value={
      sociosIncluidos.filter(
        (socio) => socio.ConLoteria === true
      ).length
    }
    readOnly
    className="w-full border border-zinc-300 bg-zinc-100 px-2 py-1 text-sm text-zinc-600"
  />
</div>

    <div>
  <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
    Sin lotería
  </label>

  <input
    type="number"
    value={
      sociosIncluidos.filter(
        (socio) => socio.ConLoteria === false
      ).length
    }
    readOnly
    className="w-full border border-zinc-300 bg-zinc-100 px-2 py-1 text-sm text-zinc-600"
  />
</div>

    <div>
      <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
        Falla
      </label>
      <input
  type="number"
  value={papeletasFalla}
  onChange={(e) => setPapeletasFalla(Number(e.target.value))}
  className="w-full border border-zinc-300 px-2 py-1 text-sm"
/>
    </div>

    <div>
      <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
        Virgen
      </label>
      <input
  type="number"
  value={papeletasVirgen}
  onChange={(e) => setPapeletasVirgen(Number(e.target.value))}
  className="w-full border border-zinc-300 px-2 py-1 text-sm"
/>
    </div>

    <div>
      <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
        Navidad
      </label>
      <input
  type="number"
  value={papeletasNavidad}
  onChange={(e) => setPapeletasNavidad(Number(e.target.value))}
  className="w-full border border-zinc-300 px-2 py-1 text-sm"
/>
    </div>

    <div>
      <label className="mb-1 block text-[11px] font-semibold text-zinc-600">
        Niño
      </label>
      <input
  type="number"
  value={papeletasNino}
  onChange={(e) => setPapeletasNino(Number(e.target.value))}
  className="w-full border border-zinc-300 px-2 py-1 text-sm"
/>
    </div>
  </div>

  <div>
    <label className="mb-1 block text-sm font-medium text-zinc-700">
      Observaciones
    </label>

    <textarea
  rows={3}
  value={observaciones}
  onChange={(e) => setObservaciones(e.target.value)}
  className="w-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-red-900"
/>
  </div>

</div>

      <div className="flex justify-end gap-2 border-t border-zinc-200 px-6 py-4">

        <button
          onClick={() => {
            limpiarFormulario();
            setGrupoEditando(null);
            setMostrarModal(false);
          }}
          className="bg-zinc-300 px-4 py-2 text-sm"
        >
          Cancelar
        </button>

        <button
  onClick={guardarGrupoLoteria}
  className="bg-red-900 px-4 py-2 text-sm text-white hover:bg-red-950"
>
  Guardar
</button>
      </div>

    </div>
  </div>
    </>
  );
}