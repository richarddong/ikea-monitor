const fs = require('fs');
const emailApi = require('./email.js');

var subscribers = {};
if (fs.existsSync('./data/subscribers.json')) subscribers = require('./data/subscribers.json');

function output(){
  fs.writeFileSync('./data/subscribers.json', JSON.stringify(subscribers, null, 2));
}

function subscribe(email, stores_names) {
  subscribers[email] = stores_names;
  console.log(email, stores_names);
  output();
}

function unsubscribe_all(email) {
  delete subscribers[email];
  console.log(`Unsubscribe All: ${email}`);
  output();
}

function get(email) {
  return subscribers[email];
}

function subscribers_of(store_name) {
  const subscribers_of = [];
  for (email in subscribers) {
    if (subscribers[email].includes(store_name)) subscribers_of.push(email);
  }
  return subscribers_of;
}

// {
//   name: 'name',
//   ok_to_notify: true,
//   last_notified: 'Some Date'
// }

var stores_to_notify = [];
if (fs.existsSync('./data/stores-to-notify.json')) stores_to_notify = require('./data/stores-to-notify.json');

function notify(store_to_notify) {
  const subscribers = subscribers_of(store_to_notify.name);
  if (subscribers.length == 0) return;
  emailApi.send(subscribers, store_to_notify);
  console.log(`Store: ${store_to_notify.name} Notified!`, subscribers);
  // emailApi.notify(subscribers, store_name);
  // textApi.notify(subscribers, store_name);
}

function check_and_notify(){
  console.log('Checking');
  let changed = false;
  const latest = JSON.parse(fs.readFileSync('./public/latest.json'));
  for (store of latest) {
    var store_to_notify = stores_to_notify.find(store_to_notify => store_to_notify.name == store.name);

    if (!store_to_notify) {
      store_to_notify = {
        name: store.name,
        ok_to_notify: true,
        last_notified: new Date('2000-01-01T00:00:00')
      };
      stores_to_notify.push(store_to_notify);
      changed = true;
    }
    if (store.status == 'open'
        && store_to_notify.ok_to_notify == true
        && (new Date() - Date.parse(store_to_notify.last_notified)) > 300000
      ) {
      notify(store_to_notify);
      store_to_notify.ok_to_notify = false;
      store_to_notify.last_notified = new Date();
      changed = true;
    } else if (store.status == 'closed') {
      store_to_notify.ok_to_notify = true;
      changed = true;
    }
  }
  if (changed) fs.writeFileSync('./data/stores-to-notify.json', JSON.stringify(stores_to_notify, null, 2));
}

fs.watch('./public/latest.json', (eventType, filename) => {
  if (eventType == 'change') setTimeout(check_and_notify, 1000);
});

exports.subscribe = subscribe;
exports.unsubscribe_all = unsubscribe_all;

// subscribe('test@dong.st', []);

// subscribe('test@dong.st', ['Covina', 'Calgary']);

// setTimeout(() => {
//   unsubscribe_all('test@dong.st');
// }, 10000);

// setTimeout(() => {
//   subscribe('test2@dong.st', ['Covina', 'Costa Mesa', 'Carson']);
// }, 10000);

// setTimeout(() => {
//   subscribe('test@dong.st', ['Covina', 'Calgary']);
// }, 10000);


