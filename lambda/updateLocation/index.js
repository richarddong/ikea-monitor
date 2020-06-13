const crypto = require('crypto');
const https = require('https');
const util = require('util');

function webForm(location) {
  let payload = '';
  switch (location.countryCode) {
    case 'US':
      payload = `{"selectedService":"fetchlocation",\
"customerView":"desktop",\
"locale":"en_US",\
"selectedServiceValue":"${location.sourceId}",\
"slId":"1241241241",\
"articles":[{"articleNo":"20011408","count":1},\
{"articleNo":"30449908","count":1},\
{"articleNo":"40064702","count":1}]}`;
      break;
    case 'CA':
      payload = `{"selectedService":"fetchlocation",\
"customerView":"desktop",\
"locale":"en_CA",\
"selectedServiceValue":"${location.sourceId}",\
"slId":"1241241241",\
"articles":[{"articleNo":"20011408","count":1},\
{"articleNo":"30449908","count":1},\
{"articleNo":"40064702","count":1}]}`;
      break;
  }

  const hash = crypto.createHmac('sha1', 'G6XxMY7n')
                     .update(payload)
                     .digest('hex');

  return 'payload=' + payload + '&hmac=' + hash;
}

async function getIkeaRaw(location) {
  return new Promise(function (resolve, reject) {
    const req = https.request({
        host: process.env.IKEA_HOST,
        port: 443,
        path: 'https://ww8.ikea.com/clickandcollect/'
              + `${location.countryCode}/receive/`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Host': 'ww8.ikea.com'
        },
        timeout: 5000,
      }, (res) => {
        const { statusCode } = res;
        const contentType = res.headers['content-type'];

        let error;
        if (statusCode !== 200) {
          error = new Error('Request Failed.\n' +
                            `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
          error = new Error('Invalid content-type.\n' +
                            `Expected application/json but received ${contentType}`);
        }
        if (error) {
          // Consume response data to free up memory
          res.resume();
          reject(error);
          return;
        }

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            const localTimestamp = new Date();
            const parsedData = JSON.parse(rawData);
            const sourceTimestamp = new Date(res.headers['date']);
            resolve([parsedData, sourceTimestamp, localTimestamp]);
          } catch (error) {
            reject(error);
          }
        });
    }).on('error', reject)
      .on('timeout', () => {
        req.abort();
        reject(new Error('HTTP request timeout.'));
      });

    req.write(webForm(location));

    req.end();
  });
}

function ikeaRaw2Status (ikeaRaw) {
  const legitClosed1 =  {
    status: 'ERROR',
    message: 'The commission capacity of this store is exhausted for today',
    code: 1470143968
  };
  const legitClosed2 =  {
    status: 'ERROR',
    message: 'Store has no available commissions',
    code: 1410693100
  };
  const legitClosed3 =  {
    status: 'ERROR',
    message: 'Tried 100 without success. Probably you have no handover or \
collection capacity set. Store in Charge: ',
    code: 0
  };
  const legitClosed4 =  {
    status: 'ERROR',
    message: 'No common capacity in configured time window',
    code: 1472475118
  };
  const legitClosed5 = {
    status: 'ERROR',
    message: 'Catchable Fatal Error: Argument 1 passed to Inwebs\\IkeaClickCollect\\Domain\\Model\\Basket_Original::setDeliveryTimeWindowDto() must be an instance of Inwebs\\IkeaClickCollect\\Domain\\Dto\\DeliveryWindowDto, boolean given, called in /var/www/ClickCollect/Data/Temporary/Production/Cache/Code/Flow_Object_Classes/Inwebs_IkeaClickCollect_Service_ISell_Communicator.php on line 358 and defined in /var/www/ClickCollect/Data/Temporary/Production/Cache/Code/Flow_Object_Classes/Inwebs_IkeaClickCollect_Domain_Model_Basket.php line 929',
    code: 1
  };
  const error = null;
  if (util.isDeepStrictEqual(ikeaRaw, legitClosed1)) return [error, 'closed'];
  if (util.isDeepStrictEqual(ikeaRaw, legitClosed2)) return [error, 'closed'];
  if (ikeaRaw.status == legitClosed3.status
      && ikeaRaw.message.startsWith(legitClosed3.message)
      && ikeaRaw.code == legitClosed3.code) return [error, 'closed'];
  if (util.isDeepStrictEqual(ikeaRaw, legitClosed4)) return [error, 'closed'];
  if (util.isDeepStrictEqual(ikeaRaw, legitClosed5)) return [error, 'closed'];
  if (ikeaRaw.status == 'OK') return [error, 'open'];
  return [new Error('Unhandled form of raw JSON of availability from IKEA.'), 'unknown'];
}

async function get(location) {
  let ikeaRaw, sourceTimestamp, localTimestamp, status, error;
  try {
    [ikeaRaw, sourceTimestamp, localTimestamp] = await getIkeaRaw(location);
    [error, status] = ikeaRaw2Status(ikeaRaw);
  } catch (e) {
    localTimestamp = new Date();
    sourceTimestamp = null;
    ikeaRaw = null;
    status = 'unknown';
    error = e;
  }
  return [ikeaRaw, status, sourceTimestamp, localTimestamp, error];
}

const AWS = require('aws-sdk');

let dynamodb = new AWS.DynamoDB.DocumentClient();

async function putUpdate(update) {
  const params = {
    TableName: 'updates',
    Item: update,
  }
  return dynamodb.put(params).promise();
}

async function updateLocation(update) {
  const params = {
    TableName: 'locations',
    Key: {locationName: update.locationName},
    UpdateExpression: 'set updatedAt = :localTimestamp, #s = :st',
    ExpressionAttributeNames: {
      '#s': 'status'
    },
    ExpressionAttributeValues:{
      ':localTimestamp': update.localTimestamp,
      ':st': update.status,
    },
  }
  return dynamodb.update(params).promise();
}

exports.handler = async (event) => {
    // TODO implement
    const location = JSON.parse(event.Records[0].body);
    const [ikeaRaw, status, sourceTimestamp, localTimestamp, error] = await get(location);

    const update = {
        locationName: location.locationName,
        localTimestamp: localTimestamp.toISOString(),
        status: status,
    };
    if (sourceTimestamp) update.sourceTimestamp = sourceTimestamp.toISOString();
    if (ikeaRaw) update.ikeaRaw = ikeaRaw;
    if (error) update.error = error.message;

    console.log(update);

    const putAndUpdate = await Promise.all([putUpdate(update), updateLocation(update)]);

    return putAndUpdate;
};
