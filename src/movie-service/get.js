'use strict';

const AWS = require('aws-sdk');
const log = require('lambda-log');

const dynamoDb = new AWS.DynamoDB();

module.exports.get = (event, context, callback) => {
  var params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      "year": { "N": event.pathParameters.year },
      "title": { "S": event.pathParameters.title.toString() }
    }
  };

  log.options.debug = true;
  log.debug(params);

  // fetch Movie from the database
  dynamoDb.getItem(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Couldn\'t fetch the Movie.',
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
    log.debug(response);
    callback(null, response);
  });
};

