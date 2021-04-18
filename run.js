/* This file is used for local testing because I'm not a 'serverless' expert */
"use strict";

const handler = require('./handler');

console.log(Promise.resolve(handler.hello()));
