#!/usr/bin/env node
import { evaluateOracle } from './lib/oracle.mjs';

const input = JSON.parse(process.env.ORACLE_INPUT ?? '{}');
const result = evaluateOracle(input);
console.log(JSON.stringify(result));
if (result.state !== 'success') process.exitCode = 1;
