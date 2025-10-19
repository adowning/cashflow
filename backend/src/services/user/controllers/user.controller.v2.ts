import type { Context } from 'hono';
import httpStatus from 'http-status';
// service
import userService from '../services/user.service';
// utils
import ApiError from '../../../utils/ApiError';
import catchAsyncV2 from '../../../utils/catchAsync.v2';

export const getUser = catchAsyncV2(async (c: Context) => {
  const { userId } = c.req.param();

  const user = await userService.findUserById(userId);
  if (user) {
    return c.json(user);
  }

  throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
});

export const getUsers = catchAsyncV2(async (c: Context) => {
  const users = await userService.getUsers();

  return c.json(users);
});

export const updateUser = catchAsyncV2(async (c: Context) => {
  const { userId } = c.req.param();
  const updateData = await c.req.json();

  const user = await userService.findUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  if (updateData.username) {
    if (await userService.usernameTaken(updateData.username)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
    }
  }
  const updatedUser = await userService.updateUser(
    userId ,
    updateData,
  );
  return c.json(updatedUser);
});

export const blockUser = catchAsyncV2(async (c: Context) => {
  const { userId, status } = await c.req.json();

  const updatedUser = await userService.updateUser(
    userId ,
    { status },
  );
  return c.json(updatedUser);
});

export const updatePassword = catchAsyncV2(async (c: Context) => {
  const { userId } = c.req.param();
  const user = await userService.findUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const updated = await userService.updateUser(
    userId,
    (await c.req.json()).password,
  );

  return c.json({ status: !!updated });
});


export const updateUserStatus = catchAsyncV2(async (c: Context) => {
  const { userId, status } = await c.req.json();
  const user = await userService.findUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const updated = await userService.updateUser(userId , { status });
  return c.json(updated);
});
