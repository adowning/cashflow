import { OpenAPIHono, z } from '@hono/zod-openapi';
import { HTTPException } from 'hono/http-exception';
import { notFound } from 'stoker/middlewares';
import { defaultHook } from 'stoker/openapi';

import type { AppBindings, AppOpenAPI } from '../utils/types';

/**
 * Reusable OpenAPI components for consistent API documentation
 */

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  });
}

export default function createApp() {
  const app = createRouter();

  app.notFound(notFound);

  // Centralized Error Handler
  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return err.getResponse();
    }

    if (err instanceof z.ZodError) {
      return c.json(
        {
          success: false,
          error: {
            message: 'Validation failed',
            issues: err.flatten().fieldErrors,
          },
        },
        422,
      );
    }

    // Generic fallback for all other errors
    console.error(`[InternalServerError] Path: ${c.req.path}`, err);
    return c.json(
      {
        success: false,
        error: {
          message: 'Internal Server Error',
        },
      },
      500,
    );
  });

  return app;
}

export function createTestApp(router: AppOpenAPI) {
  return createApp().route('/', router);
}
