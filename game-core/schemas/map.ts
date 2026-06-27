import { z } from "zod";
import { MapData, EntityData } from "../types/game";

export const entityDataSchema = z.object({
  id: z.string(),
  type: z.enum(["ROCK", "IRON_BALL", "ICE", "BUTTON", "DOOR", "KEY", "SWITCH", "LIGHT"]),
  x: z.number(),
  y: z.number(),
  properties: z
    .object({
      targetId: z.string().optional(),
      tileId: z.string().optional(),
      useCount: z.number().optional(),
      isLocked: z.boolean().optional(),
    })
    .optional(),
}) satisfies z.ZodType<EntityData>;

export const mapDataSchema = z.object({
  tiles: z.array(z.array(z.string())),
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
