import * as iam from '@aws-cdk/aws-iam';

export default [
    {
        actions: ['ssm:ssm:GetParameter'],
        effect: iam.Effect.ALLOW,
        resources: ['*'],
    },
];
