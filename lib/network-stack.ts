import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, id, {
      cidr: '10.0.0.0/16',
      natGateways: 1,
      maxAzs: 2,
      subnetConfiguration: [
        { name: 'data-subnet', subnetType: ec2.SubnetType.ISOLATED, cidrMask: 22 },
        { name: 'private-subnet', subnetType: ec2.SubnetType.PRIVATE, cidrMask: 22 },
        { name: 'public-subnet', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 22 },
      ],
    });
  }
}