import { Construct } from 'constructs';
import {CfnMapping,Fn} from 'aws-cdk-lib';
import { LookupServices } from './lookup';
import * as cdk from "aws-cdk-lib";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { RoleService } from './role';
import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as events from 'aws-cdk-lib/aws-events'
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import {IRole} from "aws-cdk-lib/aws-iam";
import {ISecurityGroup, IVpc} from "aws-cdk-lib/aws-ec2";
import * as logs from "aws-cdk-lib/aws-logs";


export interface lambdaServiceProps {
    readonly map: CfnMapping,
    readonly environment: string,
    readonly role: IRole,
    readonly vpc: IVpc,
    readonly VPCandSUBs: IVpc,
    readonly sg: ISecurityGroup
}

export class lambdaService extends Construct {
    constructor(scope: Construct, id: string, props: lambdaServiceProps) {
            super(scope, id);

        // ****************************************** Lambda
        const fn = new lambda.Function(this, 'lambda', {
            // vpc: Services.VpcLambda,
            functionName: `${props.map.findInMap(String(props.environment), 'AppName')}-lambda`,
            description: 'Lambda Function To DetectRunningEC2Instances',
            runtime: lambda.Runtime.PYTHON_3_13,
            memorySize: 128,
            timeout: cdk.Duration.minutes(15),
            handler: 'DetectRunningResources.lambda_handler',
            code: lambda.Code.fromAsset("lambdacode/latest"),
            role: props.role,
            // 👇 place lambda in VPC and Private Subnets
            // vpc: props.VPCandSUBs,
            // securityGroups: [props.sg],
            environment: {
                accounts: props.map.findInMap(String(props.environment), 'accounts'),
                recipients: props.map.findInMap(String(props.environment), 'recipients'),

            }
        })

        // 👇 subscribe Lambda to EventBridge topic
        const eventRule = new events.Rule(this, 'DetectscheduleRule', {
            schedule: events.Schedule.cron({ minute: props.map.findInMap(String(props.environment), 'TimeMinute'), hour: props.map.findInMap(String(props.environment), 'TimeHour') }),
        });
        eventRule.addTarget(new targets.LambdaFunction(fn))



    }
}