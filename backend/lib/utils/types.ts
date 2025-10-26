import type { OpenAPIHono, RouteConfig, RouteHandler } from '@hono/zod-openapi';
import type { Schema } from 'hono';
import type { User } from '@backend/database/interfaces';
export interface AppBindings
{
  Variables: {
    user: User;
    // authSession: AuthSessions;
    // gameSession: GameSessionsWithRelations;
    // wallet: Wallets;
    // vipInfo: VipInfo;
    // operator: OperatorsWithRelations;
    // affiliate: Affiliate;
  };
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type AppOpenAPI<S extends Schema = {}> = OpenAPIHono<AppBindings, S>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
  R,
  AppBindings
>;
