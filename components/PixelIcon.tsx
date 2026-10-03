// Ikon pixel kecil (pengganti emoji) — '#' = piksel terisi, warna ikut currentColor.
const ICONS = {
  speaker: ["....#....", "...##....", "#####.#..", "#####..#.", "#####..#.", "#####.#..", "...##....", "....#...."],
  mute: ["....#....", "...##....", "#####.#.#", "#####..#.", "#####.#.#", "#####....", "...##....", "....#...."],
  check: ["......#", ".....##", "#...##.", "##.##..", ".###...", "..#...."],
  cross: ["#.....#", "##...##", ".##.##.", "..###..", ".##.##.", "##...##", "#.....#"],
  hourglass: ["#######", ".#...#.", "..#.#..", "...#...", "..#.#..", ".#.#.#.", "#######"],
  map: [".########.", "#.#......#", "#.#.##.#.#", "#.#......#", "#.#.#.##.#", "#.#......#", ".#########", "..#......."],
  replay: ["..####..", ".#....#.", "#......#", "#...#...", "#..###..", "#.#####.", ".#......", "..####.."],
  download: ["...#...", "...#...", "...#...", "#..#..#", ".#.#.#.", "..###..", "...#...", "#######"],
  upload: ["...#...", "..###..", ".#.#.#.", "#..#..#", "...#...", "...#...", ".......", "#######"],
  search: [".###....", "#...#...", "#...#...", "#...#...", ".###....", "....#...", ".....#..", "......#."],
} as const;

export type IconName = keyof typeof ICONS;

export function PixelIcon({ name, size = 18, className = "" }: { name: IconName; size?: number; className?: string }) {
  const rows = ICONS[name];
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${w} ${h}`}
      width={(size * w) / h}
      height={size}
      shapeRendering="crispEdges"
      className={`inline-block shrink-0 ${className}`}
      fill="currentColor"
    >
      {rows.flatMap((row, y) =>
        [...row].map((c, x) => (c === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null)),
      )}
    </svg>
  );
}
