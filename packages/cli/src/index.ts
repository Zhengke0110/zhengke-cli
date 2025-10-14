#!/usr/bin/env node

import { createProgram, registerCommands, runProgram } from '@zhengke0110/command';
import { commands } from './lib/commands';
import { cli } from './lib/cli';

// 创建命令程序
const program = createProgram({
  name: 'zk-cli',
  description: 'ZK CLI - 一个基于 Nx 和 TypeScript 的命令行工具',
  version: '0.0.1',
});

// 注册所有命令
registerCommands(program, commands);

// 运行程序
runProgram(program);

cli();