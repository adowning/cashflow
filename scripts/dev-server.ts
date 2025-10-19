import concurrently, { type ConcurrentlyCommandInput } from 'concurrently';

const commandInputs: ConcurrentlyCommandInput[] = [
  { name: 'backend', command: 'bun --cwd backend dev | pino-pretty', prefixColor: 'blue' },
];

concurrently(commandInputs);
