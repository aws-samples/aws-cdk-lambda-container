// import * as cdk from '@aws-cdk/core';
import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apig from '@aws-cdk/aws-apigatewayv2';
import * as apigintegration from '@aws-cdk/aws-apigatewayv2-integrations';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
const path = require('path');

export class HttpApiAwsLambdaContainerStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const tableName = 'Movies';
    
    //Import existing Movies DynamoDB table
    
    const table = dynamodb.Table.fromTableName(this, 'MoviesTable', 'Movies');

    //AWS Lambda Functions
    
    const listMovieFunction = new lambda.DockerImageFunction(this, 'listMovieFunction',{
        functionName: 'listMovieFunction',
        code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../../src/movie-service'), {
        cmd: [ "list.list" ],
        entrypoint: ["/lambda-entrypoint.sh"],
        }),
        environment: {
            DYNAMODB_TABLE: tableName
        },
    });
    
    const getMovieFunction = new lambda.DockerImageFunction(this, 'getMovieFunction',{
        functionName: 'getMovieFunction',
        code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../../src/movie-service'), {
        cmd: [ "get.get" ],
        entrypoint: ["/lambda-entrypoint.sh"],
        }),
        environment: {
            DYNAMODB_TABLE: tableName
        },
    });
    
    //CloudWatch Logs Policy
    
    const cloudWatchLogsPolicyPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
            ]
    });
    
    cloudWatchLogsPolicyPolicy.addAllResources();
    
    //Grant CloudWatch access to Lambda Functions
    
    listMovieFunction.addToRolePolicy(cloudWatchLogsPolicyPolicy);
    getMovieFunction.addToRolePolicy(cloudWatchLogsPolicyPolicy);

    //Grant ReadWrite access to Lambda Functions
    
    table.grantReadWriteData(listMovieFunction);
    table.grantReadWriteData(getMovieFunction);
    
    // Lambda Integrations
    
    const listMovieFunctionIntegration = new apigintegration.LambdaProxyIntegration({
      handler: listMovieFunction,
    });
    
    const getMovieFunctionIntegration =  new apigintegration.LambdaProxyIntegration({
      handler: getMovieFunction,
    });
    
    //Http Api
    
    const httpApi = new apig.HttpApi(this, "httpApi", {
      apiName: "httpApi",
      createDefaultStage: true,
    });
    
    //Http Api Routes
    
    httpApi.addRoutes({
      integration: listMovieFunctionIntegration, 
      methods: [apig.HttpMethod.GET], 
      path: '/list',
    });
    
    httpApi.addRoutes({
      integration: getMovieFunctionIntegration,
      methods: [apig.HttpMethod.GET],
      path: '/get/{year}/{title}',
    });
    
    // API and Service Endpoints
    
    const httpApiEndpoint = httpApi.apiEndpoint;
    const listMovieFunctionEndpoint = httpApiEndpoint + "/list";
    const getMovieFunctionEndpoint = httpApiEndpoint + "/get/{year}/{title}";
    
    new cdk.CfnOutput(this, "Http Api endpoint: ", {
      value: httpApiEndpoint,
    });
    
    new cdk.CfnOutput(this, "Http Api endpoint - listMovieFunction : ", {
      value: listMovieFunctionEndpoint,
    });
    
    new cdk.CfnOutput(this, "Http Api endpoint - getMovieFunction : ", {
      value: getMovieFunctionEndpoint,
    });
  }
}
