import * as cdk from '@aws-cdk/core';
import * as kms from '@aws-cdk/aws-kms';
import * as s3 from '@aws-cdk/aws-s3';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import * as iam from '@aws-cdk/aws-iam';
import * as sm from '@aws-cdk/aws-secretsmanager';

interface DataStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class DataStack extends cdk.Stack {
  public readonly customerKey: kms.IKey;
  public readonly bucket: s3.Bucket;
  public readonly dbSecret: sm.Secret;
  public readonly dbCluster: rds.ServerlessCluster;
  public readonly appSyncServiceRole: iam.IRole;

  constructor(scope: cdk.Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    this.customerKey = new kms.Key(this, 'customer', {
      trustAccountIdentities: true,
    }).addAlias('customer');

    this.bucket = new s3.Bucket(this, 'bucket');

    this.dbSecret = new sm.Secret(this, `db-secret`, {
      secretName: `db-secret`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
      },
      encryptionKey: this.customerKey,
    });

    this.appSyncServiceRole = new iam.Role(this, 'AppSyncServiceRole', { assumedBy: new iam.ServicePrincipal('appsync') });

    /**
     * Create the Aurora Server Cluster
     * @type {ServerlessCluster}
     */
    this.dbCluster = new rds.ServerlessCluster(this, 'database', {
      clusterIdentifier: id,
      vpc: props.vpc,
      engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(
        this,
        'ParameterGroup',
        'default.aurora-postgresql10',
      ),
      credentials: rds.Credentials.fromSecret(this.dbSecret),
      defaultDatabaseName: 'test',
    });
  }
}