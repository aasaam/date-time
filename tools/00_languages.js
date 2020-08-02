#!/usr/bin/env node
const languages = require('../lib/languages');

const { log } = console;

log(`('${languages.join("'|'")}')`);
