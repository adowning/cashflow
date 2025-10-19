import type { Context } from 'hono';
import * as dashboardService from './dashboard.service';
import type { AppRouteHandler } from '#/lib/types';
import { getDashboardDataRoute } from './dashboard.router';
import chalk from 'chalk';

export const getDashboardData: AppRouteHandler<typeof getDashboardDataRoute> = async (c: Context) => {
   console.log('hit');
    const { startDate, endDate, sortKey, sortDirection,  } = c.req.query();
    console.log(startDate);

    const type  = c.req.param('type');
    console.log(chalk.yellow('Dashboard data request received for type', type));

    const parseDate = (dateStr: string | undefined) => dateStr ? new Date(dateStr) : undefined;

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    try {
        let data;
        switch(type) {
            case 'daily':
                data = await dashboardService.getDailyReport(start, end);
                break;
            case 'transaction':
                data = await dashboardService.getTransactionReport(start, end);
                break;
            case 'general':
                data = await dashboardService.getGeneralGraph(start, end);
                break;
            case 'token':
                data = await dashboardService.getTokenReport(start, end, sortKey, sortDirection);
                break;
            case 'user':
                data = await dashboardService.getUserReport(start, end, sortKey, sortDirection);
                break;
            case 'game':
                data = await dashboardService.getGameReport(start, end, sortKey);
                break;
            default:
                return c.json({ status: 'error', message: 'Invalid report type' }, 400);
        }
        return c.json({ status: 'success', data });
    } catch (error) {
        console.error(chalk.red('Error in getDashboardData controller:'), error);
        return c.json({ status: 'error', message: 'Failed to fetch dashboard data' }, 500);
    }
};
