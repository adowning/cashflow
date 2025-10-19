/* eslint-disable @typescript-eslint/ban-ts-comment */
/** biome-ignore-all lint/suspicious/noTsIgnore: <> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import db from '../database/index';
import * as schema from '../database/schema';

import * as rawgames from './json/games_large.json';

// Type definition for the games JSON data
interface RawGameData
{
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

const GAMES: any[] = [];
//@ts-ignore
//@ts-ignore
for (const game of rawgames.default as RawGameData[]) {
  // Basic setup
  game.category = game.gamebank || game.type;
  game.tags = [];

  // Array conversions
  game.jpgIds = game.jpgId ? [game.jpgId] : [];
  // bids should be converted to array of strings
  (game as any).bids = game.bids ? [game.bids] : [];

  // Integer conversions - remove decimals and convert to integers
  game.totalWagered = Math.floor(parseFloat(String(game.statIn || '0'))) || 0;
  game.totalWon = Math.floor(parseFloat(String(game.statOut || '0'))) || 0;
  game.targetRtp = Math.floor(parseFloat(game.standard_rtp || '90')) || 90;
  game.statIn = Math.floor(parseFloat(String(game.statIn || '0'))) || 0;
  game.statOut = Math.floor(parseFloat(String(game.statOut || '0'))) || 0;
  game.rtpStatIn = Math.floor(parseFloat(String(game.rtpStatIn || '0'))) || 0;
  game.rtpStatOut = Math.floor(parseFloat(String(game.rtpStatOut || '0'))) || 0;

  // Boolean conversions
  game.isActive = game.active === 'true';
  game.isFeatured = game.featured === 'true';

  // Field conversions with proper radix and type handling
  game.status = game.device ? parseInt(String(game.device), 10) || 0 : 0;
  game.device = game.device ? parseInt(String(game.device), 10) || 0 : 0;
  // currentRtp doesn't exist in interface, removing this assignment

  // Clean up old fields - only delete if they exist
  if (game.jpgId !== undefined) delete (game as any).jpgId;
  if (game.statIn !== undefined) delete (game as any).statIn;
  if (game.statOut !== undefined) delete (game as any).statOut;
  if (game.active !== undefined) delete (game as any).active;
  if (game.featured !== undefined) delete (game as any).featured;
  if (game.standard_rtp !== undefined) delete (game as any).standard_rtp;
  if (game.current_rtp !== undefined) delete (game as any).current_rtp;


  GAMES.push(game);
}



// rawgames.forEach((game) => {
// })
export async function seedGames()
{
  console.log('🎮 Seeding games and categories...');

  // const createdCategories = await db
  //   .insert(gameCategories)
  //   .values(CATEGORIES)
  //   .returning()

  const gamesToInsert = GAMES.map((game) => ({
    ...game,
    jpgIds: [],
    // categoryId: rand(createdCategories).id,
  }));

  console.log('Type of bids:', typeof gamesToInsert[0].bids, 'Value:', gamesToInsert[0].bids);
  console.log('Type of jpgIds:', typeof gamesToInsert[0].jpgIds, 'Value:', gamesToInsert[0].jpgIds);

  // Add validation before insert
  const invalidGames = gamesToInsert.filter(game => {
    const jpgIdsValid = Array.isArray(game.jpgIds);
    if (!jpgIdsValid) {
      console.log('Invalid game:', game.id, 'jpgIds:', game.jpgIds);
      return true;
    }
    return false;
  });

  if (invalidGames.length > 0) {
    console.error('Found invalid games with non-array jpgIds field');
    throw new Error('Data validation failed');
  }

  console.log('First game to insert:', JSON.stringify(gamesToInsert[0], null, 2));
  console.log('Type of bids:', typeof gamesToInsert[0].bids);
  console.log('Type of jpgIds:', typeof gamesToInsert[0].jpgIds);

  await db.insert(schema.games).values(gamesToInsert).onConflictDoNothing();

  console.log('✅ Games and categories seeded.');
}
