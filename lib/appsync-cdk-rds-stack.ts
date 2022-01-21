import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as sm from '@aws-cdk/aws-secretsmanager';
import * as appsync from '@aws-cdk/aws-appsync';
import * as rds from '@aws-cdk/aws-rds';
import * as iam from '@aws-cdk/aws-iam';

interface AppsyncCdkRdsStackProps extends cdk.StackProps {
  bucket: s3.Bucket;
  dbCluster: rds.IServerlessCluster;
  dbSecret: sm.Secret;
  appSyncServiceRole: iam.IRole;
}

export class AppsyncCdkRdsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: AppsyncCdkRdsStackProps) {
    super(scope, id, props);

    this.addDependency(props.dbCluster.stack);

    const appSyncAuthorization: appsync.AuthorizationMode = {
      authorizationType: appsync.AuthorizationType.OIDC,
      openIdConnectConfig: {
        oidcProvider: '',
      },
    };

    const apiId = 'appsync-graphql';
    const api = new appsync.GraphqlApi(this, apiId, {
      name: apiId,
      schema: appsync.Schema.fromAsset('schema/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: appSyncAuthorization,
      },
    });

    const rdsDataSource = new appsync.RdsDataSource(this, 'rdsDataSource', {
      api: api,
      serverlessCluster: props.dbCluster,
      secretStore: props.dbSecret,
      databaseName: 'test',
      serviceRole: props.appSyncServiceRole,
    });
  }
}
