'use strict';

const fs = require('fs');
const _ = require('lodash');

const email = require('../app/email.js');
const subscribers = fs.readFileSync('./temp/allSubscribers.txt', 'utf8').split('\n');
subscribers.pop();
const chunkedSubscribers = _.chunk(subscribers, 900);
// console.log(chunkedSubscribers);

// (async () => {
//   for (const chunk of chunkedSubscribers) {
//     const result = await email.send(chunk, email.serviceSuspensionMsg());
//     console.log(result);
//   }
// })();

// (async () => {
//   // for (const chunk of chunkedSubscribers) {
//     const result = await email.send('test@dong.st', email.serviceSuspensionMsg());
//     console.log(result);
//   // }
// })();
