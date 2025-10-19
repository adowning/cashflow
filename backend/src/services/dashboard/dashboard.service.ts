/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import db from '#/database';
import { players, transactions,  balances } from '#/database/schema';
import { and, eq, gte, lte, sql,  } from 'drizzle-orm';
import chalk from 'chalk';

/**
 * Dashboard Service
 * Handles data aggregation and processing for the admin dashboard.
 */

/**
 * Get Daily Report
 * Fetches statistics for active players, new players, turnover, and GGR for the day.
 */
export async function getDailyReport(startDate?: Date, endDate?: Date) {
  console.log(chalk.blue('Fetching daily report...'));
  try {
    const today = new Date();
    const startOfDay = startDate || new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = endDate || new Date(today.setHours(23, 59, 59, 999));

    const activePlayersResult = await db
      .select({ count: sql<number>`count(distinct ${transactions.playerId})` })
      .from(transactions)
      .where(and(gte(transactions.createdAt, startOfDay), lte(transactions.createdAt, endOfDay)));

    const newPlayersResult = await db
      .select({ count: sql<number>`count(${players.id})` })
      .from(players)
      .where(and(gte(players.createdAt, startOfDay), lte(players.createdAt, endOfDay)));

    const turnoverResult = await db
      .select({ sum: sql<number>`sum(${transactions.amount})` })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, 'BET'),
          gte(transactions.createdAt, startOfDay),
          lte(transactions.createdAt, endOfDay),
        ),
      );

    const ggrResult = await db
      .select({ ggr: sql<number>`sum(case when ${transactions.type} = 'BET' then ${transactions.amount} else -${transactions.amount} end)` })
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, startOfDay),
          lte(transactions.createdAt, endOfDay),
        ),
      );

    return {
      activePlayer: Number(activePlayersResult[0]?.count) || 0,
      newPlayer: Number(newPlayersResult[0]?.count) || 0,
      turnOver: Number(turnoverResult[0]?.sum) || 0,
      ggr: Number(ggrResult[0]?.ggr) || 0,
    };
  } catch (error) {
    console.error(chalk.red('Error fetching daily report:'), error);
    throw new Error('Failed to fetch daily report');
  }
}

/**
 * Get Transaction Report
 * Fetches statistics for deposits, withdrawals, cashback, and rewards.
 */
export async function getTransactionReport(startDate?: Date, endDate?: Date) {
  console.log(chalk.blue('Fetching transaction report...'));
  try {
    const start = startDate || new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate || new Date();

    const depositResult = await db
      .select({ sum: sql<number>`sum(${transactions.amount})` })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, 'DEPOSIT'),
          eq(transactions.status, 'COMPLETED'),
          gte(transactions.createdAt, start),
          lte(transactions.createdAt, end),
        ),
      );

    const withdrawResult = await db
      .select({ sum: sql<number>`sum(${transactions.amount})` })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, 'WITHDRAWAL'),
          eq(transactions.status, 'COMPLETED'),
          gte(transactions.createdAt, start),
          lte(transactions.createdAt, end),
        ),
      );

    return {
      deposit: Number(depositResult[0]?.sum) || 0,
      withdraw: Number(withdrawResult[0]?.sum) || 0,
      cashback: 0, // Placeholder for now
      reward: 0, // Placeholder for now
    };
  } catch (error) {
    console.error(chalk.red('Error fetching transaction report:'), error);
    throw new Error('Failed to fetch transaction report');
  }
}

/**
 * Interface for the row structure returned by the general graph query.
 */
interface GeneralGraphRow extends Record<string, unknown> {
  day: Date;
  turnOver: string;
  ggr: string;
  activePlayer: string;
  newPlayer: string;
}
/**
 * Get General Graph Data
 * Fetches time-series data for charts on the dashboard.
 */
export async function getGeneralGraph(startDate?: Date, endDate?: Date) {
  console.log(chalk.blue('Fetching general graph data...'));
  try {
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 7));
    const end = endDate || new Date();

    const query = sql`
      SELECT
          d.day::date,
          COALESCE(t."turnOver", 0) as "turnOver",
          COALESCE(t.ggr, 0) as "ggr",
          COALESCE(a."activePlayer", 0) as "activePlayer",
          COALESCE(n."newPlayer", 0) as "newPlayer"
      FROM
          generate_series(
              ${start.toISOString()}::date,
              ${end.toISOString()}::date,
              '1 day'::interval
          ) d(day)
      LEFT JOIN (
          SELECT
              date_trunc('day', created_at) as day,
              SUM(CASE WHEN type = 'BET' THEN amount ELSE 0 END) as "turnOver",
              SUM(CASE WHEN type = 'BET' THEN amount WHEN type = 'WIN' THEN -amount ELSE 0 END) as "ggr"
          FROM transactions
          WHERE created_at BETWEEN ${start.toISOString()} AND ${end.toISOString()}
          GROUP BY day
      ) t ON d.day = t.day
      LEFT JOIN (
          SELECT
              date_trunc('day', created_at) as day,
              COUNT(DISTINCT player_id) as "activePlayer"
          FROM transactions
          WHERE created_at BETWEEN ${start.toISOString()} AND ${end.toISOString()}
          GROUP BY day
      ) a ON d.day = a.day
      LEFT JOIN (
          SELECT
              date_trunc('day', created_at) as day,
              COUNT(id) as "newPlayer"
          FROM players
          WHERE created_at BETWEEN ${start.toISOString()} AND ${end.toISOString()}
          GROUP BY day
      ) n ON d.day = n.day
      ORDER BY d.day;
    `;

    const queryResult = await db.execute<GeneralGraphRow>(query);
    const result: GeneralGraphRow[] = (queryResult).rows;
    
    const time: string[] = [];
    const turnOver: number[] = [];
    const ggr: number[] = [];
    const activePlayer: number[] = [];
    const newPlayer: number[] = [];

    result.forEach(row => {
        time.push(new Date(row.day).toISOString().split('T')[0]);
        turnOver.push(Number(row.turnOver));
        ggr.push(Number(row.ggr));
        activePlayer.push(Number(row.activePlayer));
        newPlayer.push(Number(row.newPlayer));
    });

    return { time, turnOver, ggr, activePlayer, newPlayer };

  } catch (error) {
    console.error(chalk.red('Error fetching general graph data:'), error);
    throw new Error('Failed to fetch general graph data');
  }
}


/**
 * Get Token Report
 * Fetches data about different tokens/currencies.
 */
export async function getTokenReport(startDate?: Date, endDate?: Date, sortKey: string = 'deposit', sortDirection: string = 'desc') {
    console.log(chalk.blue('Fetching token report...'));
    const start = startDate || new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate || new Date();

    const result = await db
        .select({
            symbol: transactions.currencyName,
            deposit: sql<number>`COALESCE(SUM(CASE WHEN type = 'DEPOSIT' AND status = 'COMPLETED' THEN amount ELSE 0 END), 0)::real`,
            withdraw: sql<number>`COALESCE(SUM(CASE WHEN type = 'WITHDRAWAL' AND status = 'COMPLETED' THEN amount ELSE 0 END), 0)::real`,
            turnover: sql<number>`COALESCE(SUM(CASE WHEN type = 'BET' THEN amount ELSE 0 END), 0)::real`,
            ggr: sql<number>`COALESCE(SUM(CASE WHEN type = 'BET' THEN amount WHEN type = 'WIN' THEN -amount ELSE 0 END), 0)::real`,
        })
        .from(transactions)
        .where(and(gte(transactions.createdAt, start), lte(transactions.createdAt, end), sql`${transactions.currencyName} IS NOT NULL`))
        .groupBy(transactions.currencyName)
        .execute();

    const balancesResult = await db.select({
        symbol: balances.currencyId,
        balance: sql<number>`SUM(${balances.amount})::real`
    }).from(balances).groupBy(balances.currencyId);

    const balancesMap = new Map(balancesResult.map(b => [b.symbol, b.balance]));

    const combined = result.map(r => ({
        symbol: r.symbol!,
        deposit: r.deposit,
        withdraw: r.withdraw,
        turnover: r.turnover,
        ggr: r.ggr,
        balance: balancesMap.get(r.symbol!) || 0
    }));

    const sortOrder = sortDirection === 'desc' ? -1 : 1;
    combined.sort((a, b) => (a[sortKey as keyof typeof a] > b[sortKey as keyof typeof a] ? 1 : -1) * sortOrder);

    return combined;
}

/**
 * Get User Report
 * Fetches data about user activity.
 */
export async function getUserReport(startDate?: Date, endDate?: Date, sortKey: string = 'ggr', sortDirection: string = 'desc') {
    console.log(chalk.blue('Fetching user report...'));
    const start = startDate || new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate || new Date();

    const results = await db
        .select({
            playerId: transactions.playerId,
            username: players.playername,
            turnover: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'BET' THEN ${transactions.amount} ELSE 0 END), 0)::real`,
            wins: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'WIN' THEN ${transactions.amount} ELSE 0 END), 0)::real`,
        })
        .from(transactions)
        .leftJoin(players, eq(transactions.playerId, players.id))
        .where(and(gte(transactions.createdAt, start), lte(transactions.createdAt, end), sql`${transactions.playerId} IS NOT NULL`))
        .groupBy(transactions.playerId, players.playername)
        .execute();

    const processed = results.map(r => {
        const turnover = r.turnover;
        const ggr = turnover - r.wins;
        const winRate = turnover > 0 ? ((r.wins / turnover) * 100).toFixed(2) + '%' : '0.00%';
        return {
            username: r.username,
            winRate,
            turnover,
            ggr
        };
    }).filter(r => r.username);

    const sortOrder = sortDirection === 'desc' ? -1 : 1;
    processed.sort((a, b) => {
        const valA = sortKey === 'winRate' ? parseFloat(a.winRate) : a[sortKey as 'turnover' | 'ggr'];
        const valB = sortKey === 'winRate' ? parseFloat(b.winRate) : b[sortKey as 'turnover' | 'ggr'];
        return (valA > valB ? 1 : -1) * sortOrder;
    });

    return processed;
}

/**
 * Get Game Report
 * Fetches data about game performance.
 */
export async function getGameReport(startDate?: Date, endDate?: Date, sortKey: string = 'ggr') {
    console.log(chalk.blue('Fetching game report...'));
    const start = startDate || new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate || new Date();

    const results = await db
        .select({
            name: transactions.gameName,
            turnover: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'BET' THEN ${transactions.amount} ELSE 0 END), 0)::real`,
            wins: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'WIN' THEN ${transactions.amount} ELSE 0 END), 0)::real`,
        })
        .from(transactions)
        .where(and(
            gte(transactions.createdAt, start),
            lte(transactions.createdAt, end),
            sql`${transactions.gameName} IS NOT NULL`,
        ))
        .groupBy(transactions.gameName)
        .execute();

    const processed = results.map(r => {
        const turnover = r.turnover;
        const ggr = turnover - r.wins;
        const winRate = turnover > 0 ? ((r.wins / turnover) * 100).toFixed(2) + '%' : '0.00%';
        return {
            name: r.name,
            winRate,
            turnover,
            ggr
        };
    }).filter(r => r.name);

    const sortOrder = -1; // always desc
    processed.sort((a, b) => {
        const valA = sortKey === 'winRate' ? parseFloat(a.winRate) : a[sortKey as 'turnover' | 'ggr'];
        const valB = sortKey === 'winRate' ? parseFloat(b.winRate) : b[sortKey as 'turnover' | 'ggr'];
        return (valA > valB ? 1 : -1) * sortOrder;
    });

    return processed;
}

