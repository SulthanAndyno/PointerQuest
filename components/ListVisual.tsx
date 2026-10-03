type Props = { values: number[]; marker?: { value: number; name: string } };

/** Gambar list [data | next] → … → Nil, dengan L.first dan label pointer (P/Q). */
export function ListVisual({ values, marker }: Props) {
  return (
    <div className="overflow-x-auto pb-1" aria-label={`List: ${values.join(" → ")} → Nil`} role="img">
      <div className="flex w-max items-end gap-1 pt-1 font-code text-[15px]">
        <div className="mr-1 flex flex-col items-center self-center">
          <span className="text-[13px] text-ember">L.first</span>
          <span aria-hidden className="text-ember">↓→</span>
        </div>
        {values.map((v, i) => (
          <div key={i} className="flex items-end gap-1">
            <div className="flex flex-col items-center">
              <span className={`h-5 text-[13px] font-bold ${marker?.value === v ? "text-arcane" : "invisible"}`}>
                {marker?.name ?? "·"}↓
              </span>
              <div className="flex border-2 border-dim bg-stone-950">
                <span className="min-w-9 px-2 py-1 text-center font-bold text-bone">{v}</span>
                <span className="border-l-2 border-dim px-2 py-1 text-torch">•</span>
              </div>
            </div>
            <span aria-hidden className="pb-1 text-torch">→</span>
          </div>
        ))}
        <span className="pb-1 font-bold text-bad">Nil</span>
      </div>
    </div>
  );
}
