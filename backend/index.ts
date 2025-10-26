import { getSessionFromToken, signInUsername } from './middleware/auth.ws';
import { wsRouter, type UserData } from './app.ws';
import homepageHtml from './public/client-example.html';
import app from './app';
import { setupDatabase } from './database/setup';
import { startManufacturedGameplay } from './features/gameplay/bot.service';

await setupDatabase();
// Assign the server instance to a constant
Bun.serve<UserData>({
  port: 6001,
  fetch: app.fetch,
  websocket: wsRouter.websocket,
});

startManufacturedGameplay();
//    {
//     '/testhtml': homepageHtml,
//   },
//   development: true,
//   async fetch(req, server) {
//     if (req.method === 'OPTIONS') {
//       return new Response('OK', { status: 200 });
//     }
//     const url = new URL(req.url);
//     console.log(url.pathname);
//     if (url.pathname === '/api/auth/sign-in/username') {
//       //@ts-ignore
//       const { username, password } = await req.json();
//       console.log(username);
//       console.log(password);
//       const data = await signInUsername(username, password);
//       if (data !== null)
//         return new Response(JSON.stringify(data), {
//           status: 200,
//           headers: { 'Content-Type': 'application/json' },
//         });
//       return new Response('Auth Failed', { status: 401 });
//     }
//     if (url.pathname === '/ws') {
//       const protocols = req.headers.get('sec-websocket-protocol');
//       let token: string | undefined;

//       // try{
//       if (protocols?.includes(','))
//         token = protocols
//           ?.split(',')
//           .map((p) => p.trim())
//           .find((p) => p.startsWith('bearer.'))
//           ?.slice(7); // Remove "bearer." prefix
//       // }catch(e){
//       //   console.log(e);
//       // }
//       console.log(token);
//       // if (!token || !validateToken(token)) {
//       //   return new Response('Unauthorized', { status: 401 });
//       // }
//       let data;
//       if (token) {
//         data = getSessionFromToken(token);
//       } else {
//         data = {
//           userId: 'unauthenticated',
//           username: 'guest',
//           roles: [],
//           authenticated: false,
//           token: undefined,
//         };
//       }
//       console.log(data);
//       // router.upgrade() auto-generates clientId (UUID v7) and returns Response
//       // try{
//       return router.upgrade(req, {
//         server,
//         data,
//         // headers: {
//         //   'Sec-WebSocket-Protocol': 'bearer.' + token || '', // Select auth protocol
//         // },
//       });
//       // }catch(e){
//       //   console.log(e);
//     }
//     return app.fetch(req, server);
//     // }
//     // return req;
//   },
//   websocket: router.websocket,
// });
// Initialize VIP cache and queue systems
// await initializeVipCache();
// initializeVipQueue();

// runExample();

// Export the server instance
// export { server };
