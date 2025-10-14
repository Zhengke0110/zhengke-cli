import { commands, initCommand, createCommand, buildCommand } from './commands.js';

describe('commands', () => {
  it('should export all commands', () => {
    expect(commands).toBeDefined();
    expect(commands.length).toBe(3);
  });

  it('should have initCommand defined', () => {
    expect(initCommand).toBeDefined();
    expect(initCommand.name).toBe('init');
    expect(initCommand.description).toBe('初始化一个新项目');
  });

  it('should have createCommand defined', () => {
    expect(createCommand).toBeDefined();
    expect(createCommand.name).toBe('create <name>');
    expect(createCommand.description).toBe('创建一个新的模块');
  });

  it('should have buildCommand defined', () => {
    expect(buildCommand).toBeDefined();
    expect(buildCommand.name).toBe('build');
    expect(buildCommand.description).toBe('构建项目');
  });
});
