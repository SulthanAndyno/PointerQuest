import type { CSSProperties } from "react";

// Aset: 0x72 "16x16 DungeonTileset II" (CC0) — https://0x72.itch.io/dungeontileset-ii
// Obor & anglo: OpenGameArt "Simple Torch Animation 16x16" dan "16x16 Torch" (CC0)
export const SPRITES = {
  torch: { src: "torch", w: 16, h: 16, frames: 5 },
  brazier: { src: "brazier", w: 16, h: 16, frames: 8 },
  column: { src: "column", w: 16, h: 48, frames: 1 },
  knight: { src: "knight_m_idle", w: 16, h: 28, frames: 4 },
  knightRun: { src: "knight_m_run", w: 16, h: 28, frames: 4 },
  knightHit: { src: "knight_m_hit_anim_f0", w: 16, h: 28, frames: 1 },
  skelet: { src: "skelet_idle", w: 16, h: 16, frames: 4 },
  goblin: { src: "goblin_idle", w: 16, h: 16, frames: 4 },
  imp: { src: "imp_idle", w: 16, h: 16, frames: 4 },
  chort: { src: "chort_idle", w: 16, h: 24, frames: 4 },
  maskedOrc: { src: "masked_orc_idle", w: 16, h: 20, frames: 4 },
  necromancer: { src: "necromancer_idle", w: 16, h: 20, frames: 4 },
  iceZombie: { src: "ice_zombie_idle", w: 16, h: 16, frames: 4 },
  ogre: { src: "ogre_idle", w: 32, h: 32, frames: 4 },
  bigZombie: { src: "big_zombie_idle", w: 32, h: 34, frames: 4 },
  bigDemon: { src: "big_demon_idle", w: 32, h: 36, frames: 4 },
  wizard: { src: "wizzard_m_idle", w: 16, h: 28, frames: 4 },
  spikes: { src: "floor_spikes", w: 16, h: 16, frames: 4 },
  coin: { src: "coin", w: 8, h: 8, frames: 4 },
  chest: { src: "chest_full_open", w: 16, h: 16, frames: 3 },
  fountainBlue: { src: "wall_fountain_mid_blue", w: 16, h: 16, frames: 3 },
  basinBlue: { src: "wall_fountain_basin_blue", w: 16, h: 16, frames: 3 },
  fountainRed: { src: "wall_fountain_mid_red", w: 16, h: 16, frames: 3 },
  basinRed: { src: "wall_fountain_basin_red", w: 16, h: 16, frames: 3 },
  fountainTop: { src: "wall_fountain_top", w: 16, h: 16, frames: 1 },
  heartFull: { src: "ui_heart_full", w: 16, h: 16, frames: 1 },
  heartEmpty: { src: "ui_heart_empty", w: 16, h: 16, frames: 1 },
  doorClosed: { src: "doors_leaf_closed", w: 32, h: 32, frames: 1 },
  doorOpen: { src: "doors_leaf_open", w: 32, h: 32, frames: 1 },
  wall: { src: "wall_mid", w: 16, h: 16, frames: 1 },
  bannerRed: { src: "wall_banner_red", w: 16, h: 16, frames: 1 },
  bannerBlue: { src: "wall_banner_blue", w: 16, h: 16, frames: 1 },
  bannerGreen: { src: "wall_banner_green", w: 16, h: 16, frames: 1 },
  bannerYellow: { src: "wall_banner_yellow", w: 16, h: 16, frames: 1 },
  flaskBlue: { src: "flask_big_blue", w: 16, h: 16, frames: 1 },
  flaskRed: { src: "flask_big_red", w: 16, h: 16, frames: 1 },
  flaskYellow: { src: "flask_big_yellow", w: 16, h: 16, frames: 1 },
  goldSword: { src: "weapon_golden_sword", w: 10, h: 22, frames: 1 },
  skull: { src: "skull", w: 16, h: 16, frames: 1 },
} as const;

export type SpriteName = keyof typeof SPRITES;

type Props = {
  name: SpriteName;
  scale?: number;
  fps?: number;
  once?: boolean; // putar sekali lalu berhenti di frame terakhir
  className?: string;
  style?: CSSProperties;
  label?: string; // alt text; tanpa label = dekoratif
};

export function Sprite({ name, scale = 3, fps = 7, once, className = "", style, label }: Props) {
  const s = SPRITES[name];
  const w = s.w * scale;
  const h = s.h * scale;
  const sw = w * s.frames;
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`sprite pixelated shrink-0 ${className}`}
      style={{
        width: w,
        height: h,
        backgroundImage: `url(/sprites/${s.src}.png)`,
        backgroundSize: `${sw}px ${h}px`,
        backgroundRepeat: "no-repeat",
        // mode once berhenti di frame terakhir, bukan di luar strip
        ["--sw" as string]: `${once ? sw - w : sw}px`,
        animation:
          s.frames > 1
            ? once
              ? `sprite ${s.frames / fps}s steps(${s.frames - 1}) forwards`
              : `sprite ${s.frames / fps}s steps(${s.frames}) infinite`
            : undefined,
        ...style,
      }}
    />
  );
}
