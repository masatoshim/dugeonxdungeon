import { z } from "zod";
import { MapData, EntityData } from "@/game-core/types/game";
import { TILE_CONFIG, TileConfigKey } from "@/game-core/master";

const zodTileKeyEnum = z.custom<TileConfigKey>((val) => {
  return typeof val === "string" && val in TILE_CONFIG;
});

export const entityDataSchema = z.object({
  id: z.string(),
  type: z.enum(["ROCK", "IRON_BALL", "ICE", "BUTTON", "DOOR", "KEY", "SWITCH", "LIGHT"]),
  x: z.number(),
  y: z.number(),
  properties: z
    .object({
      targetId: z.string().optional(),
      tileId: zodTileKeyEnum.optional(),
      useCount: z.number().optional(),
      isLocked: z.boolean().optional(),
    })
    .optional(),
}) satisfies z.ZodType<EntityData>;

export const mapDataSchema = z.object({
  tiles: z.preprocess(
    (val) => {
      if (Array.isArray(val)) {
        return val.map((row) => (Array.isArray(row) ? row.map((tile) => (tile === " " ? " " : tile)) : row));
      }
      return val;
    },
    z.array(z.array(zodTileKeyEnum)),
  ),
  entities: z.array(entityDataSchema).optional(),
  settings: z
    .object({
      isDark: z.boolean(),
      ambientLight: z.number(),
    })
    .optional(),
  width: z.number(),
  height: z.number(),
}) satisfies z.ZodType<MapData>;
