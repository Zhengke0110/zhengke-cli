#!/usr/bin/env node
import * as lib from '@zhengke996/test-cli-lib';
import { readFileSync } from 'fs';
import { join } from 'path';

// 读取 package.json 获取版本号
const packageJson = JSON.parse(
    readFileSync(join(__dirname, '../package.json'), 'utf-8')
);
const version = packageJson.version;
const packageName = packageJson.name;

// 定义命令处理器接口
interface CommandHandler {
    description: string;
    usage?: string;
    handler: (...args: string[]) => void;
}

// 命令映射表
const commands: Record<string, CommandHandler> = {
    '--init': {
        description: '初始化项目',
        handler: () => {
            if (typeof lib.init === 'function') {
                lib.init();
            } else {
                console.log('init 函数不可用');
            }
        }
    },
    '--sum': {
        description: '求和示例',
        usage: '--sum <数字1> <数字2>',
        handler: (a?: string, b?: string) => {
            const num1 = Number(a);
            const num2 = Number(b);

            if (isNaN(num1) || isNaN(num2)) {
                console.log('❌ 错误: 请提供两个有效的数字');
                console.log('用法: test-cli --sum <数字1> <数字2>');
                process.exit(1);
            }

            if (typeof lib.sum === 'function') {
                const result = lib.sum(num1, num2);
                console.log(`${num1} + ${num2} = ${result}`);
            } else {
                console.log('sum 函数不可用');
            }
        }
    }
};

// 解析命令行参数
const argv = process.argv.slice(2); // 移除 node 和脚本路径
const command = argv[0];
const args = argv.slice(1);

// 显示帮助信息
function showHelp() {
    console.log('📋 可用命令:\n');
    Object.entries(commands).forEach(([cmd, { description, usage }]) => {
        console.log(`  ${cmd.padEnd(12)} - ${description}`);
        if (usage) {
            console.log(`  ${''.padEnd(12)}   用法: ${usage}`);
        }
    });
    console.log('\n其他选项:');
    console.log('  --help, -h   - 显示帮助信息');
    console.log('  --version, -v - 显示版本号');
    console.log('\n示例:');
    console.log('  test-cli --init');
    console.log('  test-cli --sum 10 20');
    console.log('  test-cli --version');
}

// 主逻辑
if (!command || command === '--help' || command === '-h') {
    showHelp();
    process.exit(0);
}

// 处理 --version 命令
if (command === '--version' || command === '-v') {
    console.log(`${packageName} v${version}`);
    process.exit(0);
}

// 检查命令是否以 -- 开头
if (!command.startsWith('--')) {
    showHelp();
    process.exit(1);
}

// 执行命令
if (command in commands) {
    commands[command].handler(...args);
} else {
    showHelp();
    process.exit(1);
}