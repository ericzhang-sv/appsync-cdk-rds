# Welcome to your CDK TypeScript project!

## Summary

This is a simplified repository to demonstrate the "cyclic reference" error I am getting in my real project using Aurora Serverless and AppSync.

This app consists of 3 stacks: Network, Data and AppSync. The AppSync stack depends on Data stack, and then Data stack depends on Network stack.

This was working fine until a Customer managed key is added into the Data stack. I am getting the following error:

```
/Users/eric/projects/appsync-cdk-rds/node_modules/@aws-cdk/core/lib/stack.ts:400
      throw new Error(`'${target.node.path}' depends on '${this.node.path}' (${cycle.join(', ')}). Adding this dependency (${reason}) would create a cyclic reference.`);
            ^
Error: 'DataStack' depends on 'AppsyncCdkRdsStack' (DataStack -> AppsyncCdkRdsStack/appsync-graphql/rdsDataSource/ServiceRole/Resource.Arn). Adding this dependency (AppsyncCdkRdsStack -> DataStack/db-secret/Resource.Ref) would create a cyclic reference.
...
```

I believe it is because that when AppSync API adds an RDS datasource, it creates a service role under the hood, and then [grant read permission on the DB secret to the role](https://github.com/aws/aws-cdk/blob/v1.130.0/packages/@aws-cdk/aws-appsync/lib/data-source.ts#L350). When granting, the codes also [grant decrypt permission on the customer managed key to the service role](https://github.com/aws/aws-cdk/blob/v1.130.0/packages/@aws-cdk/aws-secretsmanager/lib/secret.ts#L224-L229) if `encryptionKey` of the secret is specified. The KMS will need to know the service role ARN first so as to compose the key policy for the customer managed key, therefore the cyclic reference happens. In [the KMS grant method](https://github.com/aws/aws-cdk/blob/v1.130.0/packages/@aws-cdk/aws-kms/lib/key.ts#L141-L145) there are some comments / check related to this but is not working for the AppSync `addRdsDataSoource` scenario.

## Step to re-produce the error
* Run `npm install` to install all dependencies.
* Run `npm run cdk synth` and you will get the error.


## Notes
* The CDK version is locked at 1.130.0, this is the version imposed by our organisation before we upgrade to CDK 2.
* I understand KMS requires the use of key policies, have read [the doc](https://docs.aws.amazon.com/cdk/api/v1/docs/aws-kms-readme.html#key-policies) and tried setting `@aws-cdk/aws-kms:defaultKeyPolicies` feature flag to `true` but it is not working.
* If have to, I can move the creation of the customer managed key to the AppSync stack to work around the problem. However in our real project, my idea is to create one customer managed key in Data stack and reference it by multiple places in stacks depending on the data stack. Also we might rebuild the AppSync and other service stacks if required but would not delete the Data stack in production. Hope this makes sense.