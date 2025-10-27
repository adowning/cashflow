/* eslint-disable @typescript-eslint/ban-ts-comment */
/** biome-ignore-all lint/suspicious/noTsIgnore: <> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import db from "./index";
import * as schema from "./schema";

import { rawgames } from "./json/games_large";
import { createId } from "@paralleldrive/cuid2";

// Type definition for the games JSON data
interface RawGameData {
  id: string;
  developer: string;
  provider: string;
  type: string;
  vipLevel: string;
  name: string;
  title: string;
  shopId: string;
  jpgId: string;
  label: string;
  device: string | number;
  gamebank: string;
  lines_percent_config_spin: string;
  lines_percent_config_spin_bonus: string;
  lines_percent_config_bonus: string;
  lines_percent_config_bonus_bonus: string;
  rezerv: string;
  cask: string;
  advanced: string;
  bet: string;
  scalemode: string;
  slotviewstate: string;
  view: string;
  denomination: string;
  category_temp: string;
  original_id: string;
  bids: string[];
  statIn: string | number;
  statOut: string | number;
  created_at: string;
  updated_at: string;
  standard_rtp: string;
  active: string;
  featured: string;
  popularity: string;
  current_rtp: string;
  rtpStatIn: string | number;
  rtpStatOut: string | number;
  // Additional properties that will be added during processing
  category?: string;
  tags?: string[];
  jpgIds?: string[];
  totalWagered?: number;
  totalWon?: number;
  targetRtp?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  status?: number;
}

// const CATEGORIES = [
//   { name: 'Slots', slug: 'slots', type: 'slot' },
//   { name: 'Lobby', slug: 'lobby', type: 'lobby' },
//   { name: 'Live Casino', slug: 'live-casino', type: 'live' },
//   { name: 'Table Games', slug: 'table-games', type: 'table' },
// ]

// rawgames.forEach((game) => {
// })
export async function seedGames() {
  const GAMES: any[] = [];
  //@ts-ignore
  //@ts-ignore
  for (const rawgame of rawgames as RawGameData[]) {
    // // Basic setup
    rawgame.category =
      rawgame.gamebank.toUpperCase() || rawgame.type.toUpperCase();
    // game.tags = [];

    // // Array conversions
    rawgame.jpgIds = rawgame.jpgId ? [rawgame.jpgId] : [];
    // bids should be converted to array of strings
    (rawgame as any).bids = rawgame.bids ? [rawgame.bids] : [];

    // Integer conversions - remove decimals and convert to integers
    rawgame.totalWagered =
      Math.floor(parseFloat(String(rawgame.statIn || "0"))) || 0;
    rawgame.totalWon =
      Math.floor(parseFloat(String(rawgame.statOut || "0"))) || 0;
    rawgame.targetRtp =
      Math.floor(parseFloat(rawgame.standard_rtp || "90")) || 90;
    rawgame.statIn = Math.floor(parseFloat(String(rawgame.statIn || "0"))) || 0;
    rawgame.statOut =
      Math.floor(parseFloat(String(rawgame.statOut || "0"))) || 0;
    rawgame.rtpStatIn =
      Math.floor(parseFloat(String(rawgame.rtpStatIn || "0"))) || 0;
    rawgame.rtpStatOut =
      Math.floor(parseFloat(String(rawgame.rtpStatOut || "0"))) || 0;

    // Boolean conversions
    rawgame.isActive = rawgame.active === "true";
    rawgame.isFeatured = rawgame.featured === "true";

    // Field conversions with proper radix and type handling
    rawgame.status = rawgame.device
      ? parseInt(String(rawgame.device), 10) || 0
      : 0;
    rawgame.device = rawgame.device
      ? parseInt(String(rawgame.device), 10) || 0
      : 0;
    // // currentRtp doesn't exist in interface, removing this assignment

    // // Clean up old fields - only delete if they exist
    if (rawgame.jpgId !== undefined) delete (rawgame as any).jpgId;
    if (rawgame.statIn !== undefined) delete (rawgame as any).statIn;
    if (rawgame.statOut !== undefined) delete (rawgame as any).statOut;
    if (rawgame.active !== undefined) delete (rawgame as any).active;
    if (rawgame.featured !== undefined) delete (rawgame as any).featured;
    if (rawgame.standard_rtp !== undefined)
      delete (rawgame as any).standard_rtp;
    if (rawgame.current_rtp !== undefined) delete (rawgame as any).current_rtp;
    if (rawgame.id !== undefined) delete (rawgame as any).id;
    if (rawgame.type !== undefined) delete (rawgame as any).type;
    let goldsvetData = {};
    if (rawgame.lines_percent_config_spin !== "1") {
      goldsvetData = rawgame;
    }
    const game = {
      name: rawgame.name,
      title: rawgame.title,
      description: "",
      category: rawgame.category,
      thumbnailUrl: "",
      bannerUrl: "",
      developer: rawgame.developer,
      operatorId: "house",
      targetRtp: "85",
      status: "ACTIVE",
      minBet: 20,
      maxBet: 1000,
      isFeatured: false,
      jackpotGroup: "",
      goldsvetData,
    };
    GAMES.push(game);
  }

  console.log("🎮 Seeding games and categories...");

  // const createdCategories = await db
  //   .insert(gameCategories)
  //   .values(CATEGORIES)
  //   .returning()

  const gamesToInsert = GAMES.map((game) => ({
    ...game,
    jpgIds: [],
    category: game.category.toUpperCase(),
    status: "ACTIVE",
    id: createId(),
    // categoryId: rand(createdCategories).id,
  }));

  console.log(
    "Type of bids:",
    typeof gamesToInsert[0].bids,
    "Value:",
    gamesToInsert[0].bids
  );
  console.log(
    "Type of jpgIds:",
    typeof gamesToInsert[0].jpgIds,
    "Value:",
    gamesToInsert[0].jpgIds
  );

  // Add validation before insert
  const invalidGames = gamesToInsert.filter((game) => {
    const jpgIdsValid = Array.isArray(game.jpgIds);
    if (!jpgIdsValid) {
      console.log("Invalid game:", game.id, "jpgIds:", game.jpgIds);
      return true;
    }
    return false;
  });

  if (invalidGames.length > 0) {
    console.error("Found invalid games with non-array jpgIds field");
    throw new Error("Data validation failed");
  }

  console.log(
    "First game to insert:",
    JSON.stringify(gamesToInsert[0], null, 2)
  );
  console.log("Type of bids:", typeof gamesToInsert[0].bids);
  console.log("Type of jpgIds:", typeof gamesToInsert[0].jpgIds);
  await db.insert(schema.games).values(gamesToInsert).onConflictDoNothing();

  console.log("✅ Games and categories seeded.");
}
