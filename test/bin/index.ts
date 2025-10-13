#!/usr/bin/env node
import { sum } from '@zhengke996/test-cli-lib';

console.log("I am test");

// 测试求和函数
const result = sum(5, 3);
console.log(`5 + 3 = ${result}`);
