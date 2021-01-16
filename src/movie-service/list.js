'use strict';

const AWS = require('aws-sdk'); 
// const DynamoDB = require('aws-sdk/clients/dynamodb')
// const documentClient = new DynamoDB.DocumentClient();
const log = require('lambda-log');

const dynamoDb = new AWS.DynamoDB();
const params = {
  TableName: process.env.DYNAMODB_TABLE,
};

module.exports.list = (event, context, callback) => {
  log.options.debug = true;
  log.debug(params);

  // fetch all Movies from the database
  
  dynamoDb.scan(params, (error, result) => {
    
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Couldn\'t fetch the Movies.',
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
    log.debug(response);
    callback(null, response);
  });
};