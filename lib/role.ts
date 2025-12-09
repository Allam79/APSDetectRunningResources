import { Construct } from 'constructs';
import {CfnMapping} from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import {CfnInstanceProfile, IRole} from "aws-cdk-lib/aws-iam";
import * as cdk from "aws-cdk-lib";

export interface RoleServiceProps {
    readonly map: CfnMapping,
    readonly environment: string,
}

export class RoleService extends Construct {
    public readonly role: IRole;

    constructor(scope: Construct, id: string, props: RoleServiceProps) {
        super(scope, id);

        // ****************************************** Role ******************************************
        // 👇 create a Role
        this.role = new iam.Role(this, 'lambda-role', {
            roleName: `${props.map.findInMap(String(props.environment), 'AppName')}-Role-${props.environment}`,
            description: 'This is a Lambda role',
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ReadOnlyAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonRDSReadOnlyAccess'),

            ],
        });
        // ********************** Tagging
        cdk.Tags.of(this.role).add('Name', `${props.map.findInMap(String(props.environment), 'AppName')}-Role`);

        // ****************************************** Inline Policy 1 ******************************************
        // 👇 attach an Inline Policy to role
        this.role.attachInlinePolicy(
            new iam.Policy(this, 'ExecutionRole', {
                policyName: 'Lambda-ExecutionRole',
                statements: [
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: [
                            "logs:CreateLogGroup",
                        ],
                        resources: [`arn:aws:logs:${process.env.CDK_DEFAULT_REGION}:${process.env.CDK_DEFAULT_ACCOUNT}:*`],

                    }),
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: [
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                        ],
                        resources: [`arn:aws:logs:${process.env.CDK_DEFAULT_REGION}:${process.env.CDK_DEFAULT_ACCOUNT}:log-group:/aws/lambda/${props.map.findInMap(String(props.environment), 'AppName')}-*:*`],
                    }),
                ],
            }),
        )

        // ****************************************** Inline Policy 3 ******************************************
        // 👇 attach an Inline Policy to role
        this.role.attachInlinePolicy(
            new iam.Policy(this, 'InlineSES', {
                policyName: 'SES',
                statements: [
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: [
                            "ses:SendEmail"
                        ],
                        resources: ["*"],
                    })
                ],
            }),
        )

    }
}