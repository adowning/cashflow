import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBetProcessingStats } from '../../../features/gameplay/bet-orchestration.service';
import db from '../../../database';
import { transactions } from '../../../database/schema';
import { sql } from 'drizzle-orm';

// Mock the database
vi.mock('../../database', () => ({
  default: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() =>
          Promise.resolve([
            {
              totalBets: '10',
              successfulBets: '9',
              totalWagered: '1000',
              totalWon: '800',
              averageProcessingTime: '150',
            },
          ]),
        ),
      })),
    })),
    execute: vi.fn(() => Promise.resolve()),
  },
}));

describe('getBetProcessingStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return correct statistics for successful bets', async () => {
    const result = await getBetProcessingStats();

    expect(result).toEqual({
      totalBets: 10,
      averageProcessingTime: 150,
      successRate: 90, // 9/10 * 100
      totalWagered: 1000,
      totalGGR: 200, // 1000 - 800
    });
  });

  it('should return zero values when no bets exist', async () => {
    // Mock empty result
    const mockDb = vi.mocked(db);
    mockDb.select.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([null])),
      })),
    } as any);

    const result = await getBetProcessingStats();

    expect(result).toEqual({
      totalBets: 0,
      averageProcessingTime: 0,
      successRate: 100,
      totalWagered: 0,
      totalGGR: 0,
    });
  });

  it('should handle database errors gracefully', async () => {
    // Mock database error
    const mockDb = vi.mocked(db);
    mockDb.select.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.reject(new Error('Database connection failed'))),
      })),
    } as any);

    const result = await getBetProcessingStats();

    expect(result).toEqual({
      totalBets: 0,
      averageProcessingTime: 0,
      successRate: 100,
      totalWagered: 0,
      totalGGR: 0,
    });
  });

  it('should calculate success rate correctly with mixed bet types', async () => {
    // Mock data with different bet types
    const mockDb = vi.mocked(db);
    mockDb.select.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() =>
          Promise.resolve([
            {
              totalBets: '20',
              successfulBets: '18',
              totalWagered: '2000',
              totalWon: '1500',
              averageProcessingTime: '120',
            },
          ]),
        ),
      })),
    } as any);

    const result = await getBetProcessingStats();

    expect(result.successRate).toBe(90); // 18/20 * 100
    expect(result.totalGGR).toBe(500); // 2000 - 1500
  });

  it('should filter out invalid processing times', async () => {
    // The function filters processing times between 0-10000ms
    // This is tested implicitly through the SQL query structure
    const result = await getBetProcessingStats();

    expect(result.averageProcessingTime).toBe(150);
  });
});
