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
    
    const listMusicFunction = new lambda.DockerImageFunction(this, 'listMusicFunction',{
        functionName: 'listMusicFunction',
        code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../../src/music-service'), {
        cmd: [ "list.list" ],
        entrypoint: ["/lambda-entrypoint.sh"],
        }),
        environment: {
            DYNAMODB_TABLE: tableName
        },
    });
    
    const getMusicFunction = new lambda.DockerImageFunction(this, 'getMusicFunction',{
        functionName: 'getMusicFunction',
        code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../../src/music-service'), {
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
    
    listMusicFunction.addToRolePolicy(cloudWatchLogsPolicyPolicy);
    getMusicFunction.addToRolePolicy(cloudWatchLogsPolicyPolicy);

    //Grant ReadWrite access to Lambda Functions
    
    table.grantReadWriteData(listMusicFunction);
    table.grantReadWriteData(getMusicFunction);
    
    // Lambda Integrations
    
    const listMusicFunctionIntegration = new apigintegration.LambdaProxyIntegration({
      handler: listMusicFunction,
    });
    
    const getMusicFunctionIntegration =  new apigintegration.LambdaProxyIntegration({
      handler: getMusicFunction,
    });
    
    //Http Api
    
    const httpApi = new apig.HttpApi(this, "httpApi", {
      apiName: "httpApi",
      createDefaultStage: true,
    });
    
    //Http Api Routes
    
    httpApi.addRoutes({
      integration: listMusicFunctionIntegration, 
      methods: [apig.HttpMethod.GET], 
      path: '/list',
    });
    
    httpApi.addRoutes({
      integration: getMusicFunctionIntegration,
      methods: [apig.HttpMethod.GET],
      path: '/get/{year}/{title}',
    });
    
    // API and Service Endpoints
    
    const httpApiEndpoint = httpApi.apiEndpoint;
    const listMusicFunctionEndpoint = httpApiEndpoint + "/list";
    const getMusicFunctionEndpoint = httpApiEndpoint + "/get/{year}/{title}";
    
    new cdk.CfnOutput(this, "Http Api endpoint: ", {
      value: httpApiEndpoint,
    });
    
    new cdk.CfnOutput(this, "Http Api endpoint - listMusicFunction : ", {
      value: listMusicFunctionEndpoint,
    });
    
    new cdk.CfnOutput(this, "Http Api endpoint - getMusicFunction : ", {
      value: getMusicFunctionEndpoint,
    });
  }
}
