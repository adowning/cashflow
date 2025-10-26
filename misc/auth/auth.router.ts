/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRoute, z } from '@hono/zod-openapi';
import * as controller from './auth.controller';
import { UserSchema } from '../user/schema/user.schema';
import { createRouter } from '../../config/create-app';

const ErrorSchema = z.object({
  error: z.string(),
});

const auth = createRouter();

export const adminLoginRoute = createRoute({
  method: 'post',
  path: '/admin-login',
  tags: ['Auth'],
  summary: 'Admin Login',
  responses: {
    200: {
      description: 'Success',
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    500: {
      description: 'Internal Server Error',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

// auth.openapi(adminLoginRoute, controller.adminLogin as any);

export const logoutRoute = createRoute({
  method: 'post',
  path: '/logout',
  tags: ['Auth'],
  summary: 'Logout',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UserSchema,
        },
      },
      description: 'Retrieve the user',
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    500: {
      description: 'Internal Server Error',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

// auth.openapi(logoutRoute, controller.logout as any);

export const meRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Auth'],
  summary: 'Get Current User',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: { user: UserSchema.openapi('User') },
        },
      },
      description: 'Retrieve the user',
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    500: {
      description: 'Internal Server Error',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});
// auth.openapi(meRoute, controller.me as any);

export const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  tags: ['Auth'],
  summary: 'Login',
  responses: {
    200: {
      description: 'Success',
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    500: {
      description: 'Internal Server Error',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

// auth.openapi(loginRoute, controller.login as any);

export const registerRoute = createRoute({
  method: 'post',
  path: '/register',
  tags: ['Auth'],
  summary: 'Register',
  responses: {
    200: {
      description: 'Success',
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    500: {
      description: 'Internal Server Error',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

// auth.openapi(registerRoute, controller.register as any);

export const affiliateLoginRoute = createRoute({
  method: 'post',
  path: '/affiliate/login',
  tags: ['Auth'],
  summary: 'Affiliate Login',
  responses: {
    200: {
      description: 'Success',
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    500: {
      description: 'Internal Server Error',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

// auth.openapi(affiliateLoginRoute, controller.affiliateLogin as any);

export const affiliateRegisterRoute = createRoute({
  method: 'post',
  path: '/affiliate/register',
  tags: ['Auth'],
  summary: 'Affiliate Register',
  responses: {
    200: {
      description: 'Success',
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    500: {
      description: 'Internal Server Error',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

// auth.openapi(affiliateRegisterRoute, controller.affiliateRegister as any);

export const affiliateLogoutRoute = createRoute({
  method: 'post',
  path: '/affiliate/logout',
  tags: ['Auth'],
  summary: 'Affiliate Logout',
  responses: {
    200: {
      description: 'Success',
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    500: {
      description: 'Internal Server Error',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

// auth.openapi(affiliateLogoutRoute, controller.affiliateLogout as any);

export const affiliateMeRoute = createRoute({
  method: 'get',
  path: '/affiliate/me',
  tags: ['Auth'],
  summary: 'Get Affiliate User',
  responses: {
    200: {
      description: 'Success',
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: ErrorSchema } },
    },
    500: {
      description: 'Internal Server Error',
      content: { 'application/json': { schema: ErrorSchema } },
    },
  },
});

// auth.openapi(affiliateMeRoute, controller.affiliateMe as any);
// const router = createRoute()
// export const generateAuthRoutes = function (router: any) {
auth.openapi(adminLoginRoute, controller.adminLogin as any);
auth.openapi(logoutRoute, controller.logout as any);
auth.openapi(meRoute, controller.me as any);
auth.openapi(loginRoute, controller.login as any);
auth.openapi(registerRoute, controller.register as any);
// router.openapi(affiliateLoginRoute, controller.affiliateLogin as any);
// router.openapi(affiliateRegisterRoute, controller.affiliateRegister as any);
// router.openapi(affiliateLogoutRoute, controller.affiliateLogout as any);
// router.openapi(affiliateMeRoute, controller.affiliateMe as any);
// export  router.routes;
// };
export const authRoutes = auth;

// export default auth;
