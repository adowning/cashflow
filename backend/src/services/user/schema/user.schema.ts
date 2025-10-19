import { z } from '@hono/zod-openapi';

// User schemas based on controller requirements



export const UserSchema = z
  .object({
    id: z.string().openapi({ description: 'User ID', example: 'user_123' }),
    name: z
      .string()
      .openapi({ description: 'Username', example: 'john_doe' }),
    email: z
      .string()
      .email()
      .nullable()
      .openapi({
        description: 'Email address',
        example: 'john.doe@example.com',
      }),
    avatarUrl: z
      .string()
      .nullable()
      .openapi({
        description: 'Avatar URL',
        example: 'https://example.com/avatar.jpg',
      }),
    role: z.string().openapi({ description: 'User role', example: 'USER' }),
    // isActive: z
    //   .boolean()
    //   .openapi({ description: 'Whether user is active', example: true }),
    // totalXpGained: z
    //   .number()
    //   .openapi({ description: 'Total XP gained', example: 1500 }),
    // vipInfoId: z
    //   .string()
    //   .nullable()
    //   .openapi({ description: 'VIP info ID', example: 'vip_123' }),
    createdAt: z
      .string()
      .openapi({
        description: 'Creation timestamp',
        example: '2023-10-01T12:00:00Z',
      }),
    updatedAt: z
      .string()
      .openapi({
        description: 'Last update timestamp',
        example: '2023-10-01T12:00:00Z',
      }),
  })
  .openapi('User');

// Request schemas for user operations
export const CreateUserRequestSchema = z
  .object({
    username: z.string().min(3).max(20).openapi({
      description: 'Username for the new user.',
      example: 'john_doe',
    }),
    email: z.string().email().optional().openapi({
      description: 'Email address.',
      example: 'john.doe@example.com',
    }),
    password: z.string().min(8).openapi({
      description: 'Password for the new user.',
      example: 'securePassword123',
    }),
    role: z.string().optional().openapi({
      description: 'User role.',
      example: 'USER',
    }),
  })
  .openapi('CreateUserRequest');

export const UpdateUserRequestSchema = z
  .object({
    username: z.string().min(3).max(20).optional().openapi({
      description: 'New username.',
      example: 'new_username',
    }),
    email: z.string().email().optional().openapi({
      description: 'New email address.',
      example: 'new.email@example.com',
    }),
    avatarUrl: z.string().url().optional().openapi({
      description: 'New avatar URL.',
      example: 'https://example.com/new-avatar.jpg',
    }),
    role: z.string().optional().openapi({
      description: 'New user role.',
      example: 'ADMIN',
    }),
  })
  .openapi('UpdateUserRequest');

export const UpdatePasswordRequestSchema = z
  .object({
    password: z.string().min(8).openapi({
      description: 'New password for the user.',
      example: 'newSecurePassword123',
    }),
  })
  .openapi('UpdatePasswordRequest');

export const UpdateAdminPasswordRequestSchema = z
  .object({
    oldPassword: z.string().min(8).openapi({
      description: 'Current password for verification.',
      example: 'currentPassword123',
    }),
    newPassword: z.string().min(8).openapi({
      description: 'New password to set.',
      example: 'newPassword123',
    }),
    adminCode: z.string().openapi({
      description: 'Admin code for verification.',
      example: 'ADMIN123',
    }),
  })
  .openapi('UpdateAdminPasswordRequest');

export const BlockUserRequestSchema = z
  .object({
    userId: z.string().openapi({
      description: 'ID of the user to block/unblock.',
      example: 'user_123',
    }),
    status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']).openapi({
      description: 'New status for the user.',
      example: 'BANNED',
    }),
  })
  .openapi('BlockUserRequest');

export const UpdateUserStatusRequestSchema = z
  .object({
    userId: z.string().openapi({
      description: 'ID of the user to update.',
      example: 'user_123',
    }),
    status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']).openapi({
      description: 'New status for the user.',
      example: 'ACTIVE',
    }),
  })
  .openapi('UpdateUserStatusRequest');

export const GetUsersRequestSchema = z
  .object({
    limit: z.number().optional().openapi({
      description: 'Maximum number of users to return.',
      example: 20,
    }),
    offset: z.number().optional().openapi({
      description: 'Number of users to skip.',
      example: 0,
    }),
    status: z.string().optional().openapi({
      description: 'Filter by user status.',
      example: 'ACTIVE',
    }),
    role: z.string().optional().openapi({
      description: 'Filter by user role.',
      example: 'USER',
    }),
  })
  .openapi('GetUsersRequest');

// Response schemas
export const UserResponseSchema = z
  .object({
    id: z.string().openapi({ description: 'User ID', example: 'user_123' }),
    username: z
      .string()
      .openapi({ description: 'Username', example: 'john_doe' }),
    email: z
      .string()
      .email()
      .nullable()
      .openapi({
        description: 'Email address',
        example: 'john.doe@example.com',
      }),
    avatarUrl: z
      .string()
      .nullable()
      .openapi({
        description: 'Avatar URL',
        example: 'https://example.com/avatar.jpg',
      }),
    role: z.string().openapi({ description: 'User role', example: 'USER' }),
    isActive: z
      .boolean()
      .openapi({ description: 'Active status', example: true }),
    totalXpGained: z
      .number()
      .openapi({ description: 'Total XP gained', example: 1500 }),
    vipInfoId: z
      .string()
      .nullable()
      .openapi({ description: 'VIP info ID', example: 'vip_123' }),
    createdAt: z
      .string()
      .openapi({
        description: 'Creation timestamp',
        example: '2023-10-01T12:00:00Z',
      }),
    updatedAt: z
      .string()
      .openapi({
        description: 'Last update timestamp',
        example: '2023-10-01T12:00:00Z',
      }),
  })
  .openapi('UserResponse');

export const UsersResponseSchema = z
  .array(
    z.object({
      id: z.string().openapi({ description: 'User ID', example: 'user_123' }),
      username: z
        .string()
        .openapi({ description: 'Username', example: 'john_doe' }),
      email: z
        .string()
        .email()
        .nullable()
        .openapi({
          description: 'Email address',
          example: 'john.doe@example.com',
        }),
      role: z.string().openapi({ description: 'User role', example: 'USER' }),
      status: z
        .string()
        .openapi({ description: 'User status', example: 'ACTIVE' }),
      isActive: z
        .boolean()
        .openapi({ description: 'Active status', example: true }),
      totalXpGained: z
        .number()
        .openapi({ description: 'Total XP gained', example: 1500 }),
      createdAt: z
        .string()
        .openapi({
          description: 'Registration date',
          example: '2023-10-01T12:00:00Z',
        }),
    }),
  )
  .openapi('UsersResponse');

export const UserCountResponseSchema = z
  .object({
    count: z.number().openapi({
      description: 'Total number of users.',
      example: 1250,
    }),
  })
  .openapi('UserCountResponse');

// Generic response schemas
export const SuccessResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().openapi({ example: 'Operation was successful.' }),
  })
  .openapi('SuccessResponse');

export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({
      description: 'Error message.',
      example: 'Invalid request parameters',
    }),
    code: z.string().optional().openapi({
      description: 'Error code for programmatic handling.',
      example: 'VALIDATION_ERROR',
    }),
  })
  .openapi('ErrorResponse');
