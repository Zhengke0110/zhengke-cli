import { createProgram, registerCommands } from './command.js';

describe('command', () => {
  it('should create a program', () => {
    const program = createProgram({
      name: 'test-cli',
      description: 'Test CLI',
      version: '1.0.0',
    });

    expect(program).toBeDefined();
    expect(program.name()).toBe('test-cli');
  });

  it('should register commands', () => {
    const program = createProgram({
      name: 'test-cli',
      description: 'Test CLI',
      version: '1.0.0',
    });

    const commands = [
      {
        name: 'test',
        description: 'Test command',
        action: () => {
          // Test action
        },
      },
    ];

    registerCommands(program, commands);

    expect(program.commands.length).toBeGreaterThan(0);
  });
});
