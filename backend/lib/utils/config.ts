import dotenv from 'dotenv';
import path from 'path';
// import Joi from 'joi';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// const Bun.envSchema = Joi.object()
//     .keys({
//         NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
//         PORT: Joi.number().default(5000),
//         DATABASE_URL: Joi.string().description('MongoDB Connection URL'),
//         POSTGRES_URL: Joi.string().description('PostgreSQL Connection URL'),
//         JWT_SECRET: Joi.string().required().description('JWT secret key'),
//         JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(60).description('minutes after which access tokens expire'),
//         SENDGRID_API_KEY: Joi.string().required().description('SendGrid API key'),
//         SUPPORT_EMAIL: Joi.string().required().description('Support Email'),
//         ADMIN_CODE: Joi.string().required().description('Admin Code'),
//         EXCHANGE_RATE_KEY: Joi.string().required().description('Exchange Rate API key'),
//         GS_OPERATOR_CODE: Joi.string().required().description('GS operator key'),
//         GS_SECRET_KEY: Joi.string().required().description('GS secret key'),
//         GS_HOST: Joi.string().required().description('GS host'),
//         AGSOFT_MERCHANT_CODE: Joi.string().required().description('AGSOFT merchant key'),
//         AGSOFT_SECRET_KEY: Joi.string().required().description('AGSOFT key'),
//         AGSOFT_HOST: Joi.string().required().description('AGSOFT host'),
//         GSPAY_HOST: Joi.string().required().description('GSPAY host'),
//         GSPAY_MERCHANT_NO: Joi.string().required().description('GSPAY merchant no'),
//         GSPAY_OAUTH_KEY: Joi.string().required().description('GSPAY oauth key'),
//         GSPAY_OSECRET_KEY: Joi.string().required().description('GSPAY secret key'),
//         NOWPAY_HOST: Joi.string().required().description('Nowpayment host'),
//         NOWPAY_API_KEY: Joi.string().required().description('Nowpayment API key'),
//         NOWPAY_EMAIL: Joi.string().required().description('Nowpayment Email'),
//         NOWPAY_PASSWORD: Joi.string().required().description('Nowpayment Password'),
//         AGPAY_HOST: Joi.string().required().description('AGPAY host'),
//         AGPAY_SN: Joi.string().required().description('AGPAY sn'),
//         AGPAY_MERCHANT_NAME: Joi.string().required().description('AGPAY merchant name'),
//         AGPAY_SECRET_KEY: Joi.string().required().description('AGPAY secret key')
//     })
//     .unknown();

// const { value: Bun.env, error } = Bun.envSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

// if (error) {
//     throw new Error(`Config validation error: ${error.message}`);
// }

export default {
    env: Bun.env.NODE_ENV,
    port: Bun.env.PORT,
    mongodbURL: Bun.env.DATABASE_URL,
    postgresURL: Bun.env.POSTGRES_URL,
    exchangeRateKey: Bun.env.EXCHANGE_RATE_KEY,
    sendGridApiKey: Bun.env.SENDGRID_API_KEY,
    fromEmail: Bun.env.SUPPORT_EMAIL,
    adminCode: Bun.env.ADMIN_CODE,
    nowpay: {
        apiKey: Bun.env.NOWPAY_API_KEY,
        host: Bun.env.NOWPAY_HOST,
        email: Bun.env.NOWPAY_EMAIL,
        password: Bun.env.NOWPAY_PASSWORD
    },
    jwt: {
        secret: Bun.env.JWT_SECRET,
        accessExpirationMinutes: Bun.env.JWT_ACCESS_EXPIRATION_MINUTES
    },
    casino: {
        operatorCode: Bun.env.GS_OPERATOR_CODE,
        secretKey: Bun.env.GS_SECRET_KEY,
        host: Bun.env.GS_HOST
    },
    agCasino: {
        merchantCode: Bun.env.AGSOFT_MERCHANT_CODE,
        secretKey: Bun.env.AGSOFT_SECRET_KEY,
        host: Bun.env.AGSOFT_HOST
    },
    gsPay: {
        host: Bun.env.GSPAY_HOST,
        apiKey: Bun.env.GSPAY_API_KEY,
        merchantNo: Bun.env.GSPAY_MERCHANT_NO,
        authKey: Bun.env.GSPAY_OAUTH_KEY,
        secretKey: Bun.env.GSPAY_OSECRET_KEY
    },
    agPay: {
        host: Bun.env.AGPAY_HOST,
        sn: Bun.env.AGPAY_SN,
        merchantName: Bun.env.AGPAY_MERCHANT_NAME,
        secretKey: Bun.env.AGPAY_SECRET_KEY
    }
};
