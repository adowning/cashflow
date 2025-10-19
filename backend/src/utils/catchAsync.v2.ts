import { Context } from 'hono';

const catchAsyncV2 = (fn: (c: Context) => Promise<any>) => {
  return async (c: Context) => {
    return await fn(c);
  };
};

export default catchAsyncV2;