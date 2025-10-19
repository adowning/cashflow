 
 
/* eslint-disable @stylistic/indent */
import db from '../database';
import * as schema from '../database/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import
    {
        admin,
        bearer,
        jwt,
        organization,
        twoFactor,
        username,
    } from 'better-auth/plugins';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema
  }),
  emailAndPassword: {
    enabled: true,
    	// password: {
		// 	hash: async (password) => {
        //         console.log(password);
		// 		// Custom password hashing
		// 		const passwordHash = await Bun.password.hash(password);
        //         return passwordHash;
		// 	},
		// 	verify: async ({ hash, password }) => {
		// 		// Custom password verification
		// 		const isValid  = await Bun.password.verify(password, hash);
        //         				return isValid;
		// 	}
		// }
  },
  databaseHooks:{
    session: {
			create: {
				before: async (user) => {
					// Modify user data before creation
                    const playerId = user.userId;
					const customData = { data: { ...user,  playerId } };
                    return customData;
				},
				// after: async (user) => {
				// 	// Perform actions after user creation
				// }
			},
    },
        user: {
			create: {
				before: async (user) => {
					// Modify user data before creation
                    const playerId = user.id;
					return { data: { ...user, player_id: playerId } };
				},
				// after: async (user) => {
				// 	// Perform actions after user creation
				// }
			},
    }
  },
  session: {
		// modelName: "sessions",
		// fields: {
		// 	userId: "user_id"
		// },
		// expiresIn: 604800, // 7 days
		// updateAge: 86400, // 1 day
		// disableSessionRefresh: true, // Disable session refresh so that the session is not updated regardless of the `updateAge` option. (default: `false`)
		additionalFields: { // Additional fields for the session table
			playerId: {
				type: 'string',
                required: true                
			}
		},
		// storeSessionInDatabase: true, // Store session in database when secondary storage is provided (default: `false`)
		// preserveSessionInDatabase: false, // Preserve session records in database when deleted from secondary storage (default: `false`)
		// cookieCache: {
		// 	enabled: true, // Enable caching session in cookie (default: `false`)	
		// 	maxAge: 300 // 5 minutes
		// }
	},
  user: {
		// modelName: "users",
		// fields: {
		// 	email: "emailAddress",
		// 	name: "fullName"
		// },
		additionalFields: {
			playerId: {
				type: 'string',
                required: true
			}
		},
		// changeEmail: {
		// 	enabled: true,
		// 	sendChangeEmailVerification: async ({ user, newEmail, url, token }) => {
		// 		// Send change email verification
		// 	}
		// },
		// deleteUser: {
		// 	enabled: true,
		// 	sendDeleteAccountVerification: async ({ user, url, token }) => {
		// 		// Send delete account verification
		// 	},
		// 	beforeDelete: async (user) => {
		// 		// Perform actions before user deletion
		// 	},
		// 	afterDelete: async (user) => {
		// 		// Perform cleanup after user deletion
		// 	}
		// }
    },
  appName: 'backend',
  plugins: [
    admin(),
    organization(),
    bearer(),
    jwt(),
    username(),
    twoFactor(),
  ],
});
