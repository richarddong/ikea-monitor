const AWS = require('aws-sdk');

const sqs = new AWS.SQS();
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function scanOutdatedLocations() {
  const params = {
    // ExpressionAttributeValues: {
    //   ':1MinuteAgo':  new Date(Date.now()-60*1000).toISOString(),
    // },
    // // ProjectionExpression: 'locationName, iso3166, sourceId',
    // FilterExpression: 'updatedAt < :1MinuteAgo',
    TableName: 'locations'
  };
  const outdatedLocations = await dynamodb.scan(params).promise();
  return outdatedLocations.Items;
}

exports.handler = async (event) => {
  const outdatedLocations = await scanOutdatedLocations();
  // console.log(outdatedLocations);
  const msgs = await Promise.all(outdatedLocations.map(location => {
    return sqs.sendMessage({
      MessageBody: JSON.stringify(location),
      QueueUrl: 'https://sqs.us-west-2.amazonaws.com/811369596438/locationsToUpdate'}
    ).promise();
  }));
  return msgs;

};
