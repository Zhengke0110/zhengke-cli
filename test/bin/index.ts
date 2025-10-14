#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { readFileSync } from 'fs';
import { join } from 'path';

// 读取 package.json 获取版本号
const packageJson = JSON.parse(
    readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

// 配置 yargs
yargs(hideBin(process.argv))
    .scriptName('test-cli')
    .version(packageJson.version)
    .alias('v', 'version')
    .alias('h', 'help')
    .command(
        'init',
        '初始化项目',
        () => { },
        () => {
            console.log('✨ 正在初始化项目...');
            console.log('📦 项目初始化完成！');
        }
    )
    .command(
        'sum <a> <b>',
        '计算两个数字的和',
        (yargs) => {
            return yargs
                .positional('a', {
                    describe: '第一个数字',
                    type: 'number'
                })
                .positional('b', {
                    describe: '第二个数字',
                    type: 'number'
                });
        },
        (argv) => {
            const { a, b } = argv;
            if (typeof a === 'number' && typeof b === 'number') {
                const result = a + b;
                console.log(`${a} + ${b} = ${result}`);
            } else {
                console.log('❌ 错误: 请提供两个有效的数字');
            }
        }
    )
    .command(
        'greet [name]',
        '问候某人',
        (yargs) => {
            return yargs.positional('name', {
                describe: '要问候的人的名字',
                type: 'string',
                default: 'World'
            });
        },
        (argv) => {
            console.log(`👋 Hello, ${argv.name}!`);
        }
    )
    .demandCommand(1, '请提供一个命令')
    .strict()
    .help()
    .parse();
