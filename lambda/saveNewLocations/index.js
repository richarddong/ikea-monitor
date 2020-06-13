const AWS = require('aws-sdk');

let dynamodb = new AWS.DynamoDB.DocumentClient();

async function checkNewAndSave(location, sourceTimestamp, localTimestamp) {
  const getParams = {
    TableName: 'locations',
    Key: {
      locationName: location.locationName,
      // iso3166: location.iso3166,
    }
  };
  let existingItem;
  try {
    existingItem = await dynamodb.get(getParams).promise();

    if (Object.entries(existingItem) == 0) {
      const putParams = {
        TableName: 'locations',
        Item: {
          locationName: location.locationName,
          iso3166: location.iso3166,
          countryCode: location.countryCode,
          subdivisionCode: location.subdivisionCode,
          sourceId: location.sourceId,
          createdAt: location.localTimestamp,
          active: false,
          updatedAt: '',
          status: '',
        },
        ConditionExpression: 'attribute_not_exists(locationName)',
      };
      let newItem;
      try {
        await dynamodb.put(putParams).promise();
        return true;
      } catch (err) {
        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
        throw new Error('Unable to add item into DynamoDB.');
      }
    } else {
      return false;
    }
  } catch (err) {
    console.error('Unable to read item. Error JSON:', JSON.stringify(err, null, 2));
    throw new Error('Unable to read item from DynamoDB.');
  }
}

exports.handler = async (event) => {
  const newAndSaved = await Promise.all(event.responsePayload.locations.map(location => checkNewAndSave(location)));

  return newAndSaved;
};
