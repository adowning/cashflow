import { zValidator } from '@hono/zod-validator';

import { createRoute, z } from '@hono/zod-openapi';
import * as controller from '../controllers/user.controller.v2';
import {
  BlockUserRequestSchema,
  CreateUserRequestSchema,
  ErrorResponseSchema,
  GetUsersRequestSchema,
  UpdateAdminPasswordRequestSchema,
  UpdatePasswordRequestSchema,
  UpdateUserRequestSchema,
  UpdateUserStatusRequestSchema,
  UserCountResponseSchema,
  UserResponseSchema,
  UsersResponseSchema,
} from '../schema/user.schema';
import { createRouter } from '../../../config/create-app';
import chalk from 'chalk';
import userService from '../services/user.service';
import ApiError from '@@/lib/utils/ApiError';
import httpStatus from 'http-status';
import { loggedIn } from '@@/middleware/auth';
import { ZGetAllUsersSchema, ZGetUserSchema } from '@/shared/types';

const router = createRouter()
  .get(
    '/users/:id',
    loggedIn,
    zValidator('param', ZGetUserSchema, async (result, c) => {
      if (!result.success) {
        return c.json('Invalid parameters', 400);
      }
    }),
    async (c) => {
      const { id } = c.req.valid('param');
      const user = await userService.findUserById(id);
      if (user) {
        return c.json(user);
      }
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    },
  )
  .get(
    '/users',
    zValidator('query', ZGetAllUsersSchema, (result, c) => {
      // console.log(c)
      if (!result.success) {
        return c.json('Invalid parameters', 400);
      }
    }),
    async (c) => {
      const { query, page, perPage } = c.req.valid('query');
      console.log(page);

      const users = await userService.getUsers(page, perPage);
      console.log(users);

      if (users) {
        return c.json(users);
      }
      throw new ApiError(httpStatus.NOT_FOUND, 'Users not found');
    },
  );

export default router;

// export const createUserRoute = createRoute({
//   method: 'post',
//   path: '/',
//   operationId: 'createUser',
//   tags: ['User'],
//   summary: 'Create New User',
//   description:
// 		'Creates a new user account with the specified username, email, and password.',
//   request: {
//     body: {
//       content: {
//         'application/json': {
//           schema: CreateUserRequestSchema,
//         },
//       },
//     },
//   },
//   responses: {
//     201: {
//       description: 'User created successfully.',
//       content: {
//         'application/json': {
//           schema: UserResponseSchema,
//         },
//       },
//     },
//     400: {
//       description: 'Bad Request - Username already taken or invalid data.',
//       content: { 'application/json': { schema: ErrorResponseSchema } },
//     },
//     500: {
//       description: 'Internal Server Error - Failed to create user.',
//       content: { 'application/json': { schema: ErrorResponseSchema } },
//     },
//   },
// });

// export const getUserRoute = createRoute({
//   method: 'get',
//   path: '/:userId',
//   operationId: 'getUser',
//   tags: ['User'],
//   summary: 'Get User by ID',
//   description:
//  		'Retrieves detailed information about a specific user by their unique ID.',
//   request: {
//     params: z.object({
//       userId: z.string().openapi({
//         description: 'The unique identifier of the user.',
//         example: 'user_123',
//       }),
//     }),
//   },
//   responses: {
//     200: {
//       description: 'User retrieved successfully.',
//       content: {
//         'application/json': {
//           schema: ZGetUserSchema,
//         },
//       },
//     },
//     404: {
//       description: 'User not found.',
//       content: { 'application/json': { schema: ErrorResponseSchema } },
//     },
//     500: {
//       description: 'Internal Server Error - Failed to retrieve user.',
//       content: { 'application/json': { schema: ErrorResponseSchema } },
//     },
//   },
// });

// export const getUserCountRoute = createRoute({
//   method: 'get',
//   path: '/count',
//   operationId: 'getUserCount',
//   tags: ['User'],
//   summary: 'Get Total User Count',
//   description: 'Retrieves the total number of users in the system.',
//   responses: {
//     200: {
//       description: 'User count retrieved successfully.',
//       content: {
//         'application/json': {
//           schema: UserCountResponseSchema,
//         },
//       },
//     },
//     500: {
//       description: 'Internal Server Error - Failed to retrieve user count.',
//       content: { 'application/json': { schema: ErrorResponseSchema } },
//     },
//   },
// });

// export const getUsersRoute = createRoute({
//   method: 'post',
//   path: '/list',
//   operationId: 'getUsers',
//   tags: ['User'],
//   summary: 'Get Users List',
//   description:
// 		'Retrieves a paginated list of users with optional filtering by status and role.',
//   request: {
//     body: {
//       content: {
//         'application/json': {
//           schema: GetUsersRequestSchema,
//         },
//       },
//     },
//   },
//   responses: {
//     200: {
//       description: 'Users retrieved successfully.',
//       content: {
//         'application/json': {
//           schema: UsersResponseSchema,
//         },
//       },
//     },
//     400: {
//       description: 'Bad Request - Invalid filter parameters.',
//       content: { 'application/json': { schema: ErrorResponseSchema } },
//     },
//     500: {
//       description: 'Internal Server Error - Failed to retrieve users.',
//       content: { 'application/json': { schema: ErrorResponseSchema } },
//     },
//   },
// });

// export const updateUserRoute = createRoute({
//   method: 'patch',
//   path: '/:userId',
//   operationId: 'updateUser',
//   tags: ['User'],
//   summary: 'Update User',
//   description:
// 		'Updates an existing user\'s information including username, email, avatar, or role.',
//   request: {
//     params: z.object({
//       userId: z.string().openapi({
//         description: 'The unique identifier of the user to update.',
//         example: 'user_123',
//       }),
//     }),
//     body: {
//       content: {
//         'application/json': {
//           schema: UpdateUserRequestSchema,
//         },
//       },
//     },
//   },
//   responses: {
//     200: {
//       description: 'User updated successfully.',
//       content: {
//         'application/json': {
//           schema: UserResponseSchema,
//         },
//       },
//     },
//     400: {
//       description: 'Bad Request - User not found or username already taken.',
//       content: { 'application/json': { schema: ErrorResponseSchema } },
//     },
//     404: {
//       description: 'User not found.',
//       content: { 'application/json': { schema: ErrorResponseSchema } },
//     },
//     500: {
//       description: 'Internal Server Error - Failed to update user.',
//       content: { 'application/json': { schema: ErrorResponseSchema } },
//     },
//   },
// });

// export const blockUserRoute = createRoute({
//   method: 'patch',
//   path: '/block',
//   operationId: 'blockUser',
//   tags: ['User'],
//   summary: 'Block/Unblock User',
//   description:
// 		'Changes a user\'s status to block or unblock them from accessing the system.',
//   request: {
//     body: {
//       content: {
//         'application/json': {
//           schema: BlockUserRequestSchema,
//         },
//       },
//     },
//   },
//   responses: {
//     200: {
//       description: 'User status updated successfully.',
//       content: {
//         'application/json': {
//           schema: UserResponseSchema,
//         },
//       },
//     },
//     400: {
//       description: 'Bad Request - Invalid user ID or status.',
//       content: { 'application/json': { schema: ErrorResponseSchema } },
//     },
//     500: {
//       description: 'Internal Server Error - Failed to update user status.',
//       content: { 'application/json': { schema: ErrorResponseSchema } },
//     },
//   },
// });

// export const updateUserStatusRoute = createRoute({
//   method: 'patch',
//   path: '/status',
//   operationId: 'updateUserStatus',
//   tags: ['User'],
//   summary: 'Update User Status',
//   description:
// 		'Updates a user\'s status (active, inactive, banned) in the system.',
//   request: {
//     body: {
//       content: {
//         'application/json': {
//           schema: UpdateUserStatusRequestSchema,
//         },
//       },
//     },
//   },
//   responses: {
//     200: {
//       description: 'User status updated successfully.',
//       content: {
//         'application/json': {
//           schema: UserResponseSchema,
//         },
//       },
//     },
//     400: {
//       description: 'Bad Request - Invalid user ID or status.',
//       content: { 'application/json': { schema: ErrorResponseSchema } },
//     },
//     404: {
//       description: 'User not found.',
//       content: { 'application/json': { schema: ErrorResponseSchema } },
//     },
//     500: {
//       description: 'Internal Server Error - Failed to update user status.',
//       content: { 'application/json': { schema: ErrorResponseSchema } },
//     },
//   },
// });

// export const updatePasswordRoute = createRoute({
//   method: 'patch',
//   path: '/:userId/password',
//   operationId: 'updateUserPassword',
//   tags: ['User'],
//   summary: 'Update User Password',
//   description:
// 		'Updates the password for a specific user. Logs the password change with IP and user agent information.',
//   request: {
//     params: z.object({
//       userId: z.string().openapi({
//         description: 'The unique identifier of the user.',
//         example: 'user_123',
//       }),
//     }),
//     body: {
//       content: {
//         'application/json': {
//           schema: UpdatePasswordRequestSchema,
//         },
//       },
//     },
//   },
//   responses: {
//     200: {
//       description: 'Password updated successfully.',
//       content: {
//         'application/json': {
//           schema: z
//             .object({
//               status: z.boolean().openapi({
//                 description: 'Update success status',
//                 example: true,
//               }),
//             })
//             .openapi('UpdatePasswordResponse'),
//         },
//       },
//     },
//     404: {
//       description: 'User not found.',
//       content: { 'application/json': { schema: ErrorResponseSchema } },
//     },
//     500: {
//       description: 'Internal Server Error - Failed to update password.',
//       content: { 'application/json': { schema: ErrorResponseSchema } },
//     },
//   },
// });

// export const updateAdminPasswordRoute = createRoute({
//   method: 'post',
//   path: '/admin-password',
//   operationId: 'updateAdminPassword',
//   tags: ['User'],
//   summary: 'Update Admin Password',
//   description:
// 		'Allows administrators to change their password after providing the current password and admin code for verification.',
//   request: {
//     body: {
//       content: {
//         'application/json': {
//           schema: UpdateAdminPasswordRequestSchema,
//         },
//       },
//     },
//   },
//   responses: {
//     204: {
//       description: 'Password updated successfully.',
//     },
//     400: {
//       description:
// 				'Bad Request - Current password incorrect or admin code wrong.',
//       content: { 'application/json': { schema: ErrorResponseSchema } },
//     },
//     500: {
//       description: 'Internal Server Error - Failed to update admin password.',
//       content: { 'application/json': { schema: ErrorResponseSchema } },
//     },
//   },
// });

// // export const generateRoutes = (router: any) => {
// // const router = createRouter();

// // router.basePath('/user');
// // // router.openapi(createUserRoute, controller.createUser);
// // router.openapi(getUserRoute, controller.getUser);
// // // router.openapi(getUserCountRoute, controller.getUserCount);
// // router.openapi(getUsersRoute, controller.getUsers);
// // router.openapi(updateUserRoute, controller.updateUser);
// // router.openapi(blockUserRoute, controller.blockUser);
// // router.openapi(updateUserStatusRoute, controller.updateUserStatus);
// // router.openapi(updatePasswordRoute, controller.updatePassword);
// // // router.openapi(
// // //   updateAdminPasswordRoute,
// // //   controller.updateAdminPassword,
// // // );
// // // };

// // export const userRoutes = router;
