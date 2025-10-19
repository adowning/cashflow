import concurrently, { type ConcurrentlyCommandInput } from 'concurrently';

const commandInputs: ConcurrentlyCommandInput[] = [
  { name: 'backend', command: 'bun --cwd backend dev | pino-pretty', prefixColor: 'blue' },
  { name: 'dashboard', command: 'bun --cwd dashboard dev', prefixColor: 'green' },
];

concurrently(commandInputs);
