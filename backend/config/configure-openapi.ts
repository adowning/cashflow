import type { AppOpenAPI } from '@/lib/utils/types';
import {
  games,
  OpenAPIGamesSchema,
  OpenAPIUserSchemaWithoutPassword,
  OpenAPIVipInfoSchema,
  OpenAPIVipRankSchema,
  OpenAPIWalletsSchema,
} from '@@/database/schema/index.js';
import { Scalar } from '@scalar/hono-api-reference';

export function configureOpenAPI(app: AppOpenAPI) {
  app.doc('/doc', {
    openapi: '3.0.0',
    // security: [
    //   {
    //     bearerHttpAuthentication: {
    //       type: 'http',
    //       scheme: 'Bearer',
    //       bearerFormat: 'JWT',
    //     }
    //   },
    // ],
    info: {
      version: '1.1.10',
      title: 'CashFlow Casino API',
      description:
        'API for CashFlow Casino platform including user management, VIP system, and wallet operations',
    },
    //  components: {
    //   schemas: {
    //     // Manually define each component
    //     User: UserSchema,
    //     VipRank: VipRankSchema,
    //     Wallet: WalletsSchema,
    //     // ... add all your schemas here
    //   }
    // }
  });
  const registry = app.openAPIRegistry;

  // Temporarily commented out due to OpenAPI metadata issues
  // TODO: Fix OpenAPI schema registration
  registry.register('User', OpenAPIUserSchemaWithoutPassword);
  registry.register('VipInfo', OpenAPIVipInfoSchema);
  registry.register('VipRank', OpenAPIVipRankSchema);
  registry.register('Wallet', OpenAPIWalletsSchema);
  registry.register('Game', OpenAPIGamesSchema);

  app.get(
    '/reference',
    Scalar({
      url: '/doc',
      theme: 'kepler',
      authentication: {
        preferredSecurityScheme: 'httpBearer',
        // securitySchemes: {
        //   httpBearer: {
        //     type: "http",
        //     bearerFormat: "JWT",
        //     nameKey: "Authorization",

        //   }
        //       operty) securitySchemes?: Record<string, PartialDeep<{
        // type: "apiKey";
        // name: string;
        // in: "cookie" | "query" | "header";
        // uid: string & $brand<"securityScheme">;
        // nameKey: string;
        // value: string;
        // description?: stri
        // apiKeyHeader: {
        //     value: 'tokenValue'
        // },
        // httpBearer: {
        //   token: "xyz token value",
        // },

        // httpBasic: {
        //     username: 'username',
        //     password: 'password'
        // },
        // flows: {
        //     authorizationCode: {
        //         token: 'auth code token'
        //     }
        // }
        // layout: "classic",
        // defaultHttpClient: {
        //     targetKey: 'js',
        //     clientKey: 'fetch',
        // },
        // },
      },
    }),
  );
}
