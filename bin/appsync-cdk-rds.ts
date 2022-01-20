#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { AppsyncCdkRdsStack } from '../lib/appsync-cdk-rds-stack';
import { NetworkStack } from '../lib/network-stack';
import { DataStack } from '../lib/data-stack';

const app = new cdk.App();

const networkStack = new NetworkStack(app, 'NetworkStack');

const dataStack = new DataStack(app, 'DataStack', { vpc: networkStack.vpc });
const { bucket, dbCluster, dbSecret } = dataStack;

const svcStack = new AppsyncCdkRdsStack(app, 'AppsyncCdkRdsStack', { bucket, dbCluster, dbSecret });
