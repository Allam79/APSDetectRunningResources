import { Construct } from 'constructs';
import {CfnMapping} from 'aws-cdk-lib';
import {ISecurityGroup, IVpc} from "aws-cdk-lib/aws-ec2";
import {LookupServices} from "./lookup";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from "aws-cdk-lib";

export interface SecurityGroupServiceProps {
    readonly map: CfnMapping,
    readonly environment: string,
    readonly vpc: IVpc
}

export class SecurityGroupService extends Construct {
    public readonly SG: ISecurityGroup;

    constructor(scope: Construct, id: string, props: SecurityGroupServiceProps) {
        super(scope, id);


        // ****************************************** SecurityGroup ******************************************
        // create a security group
        this.SG = new ec2.SecurityGroup(this, 'SecurityGroup', {
            vpc: props.vpc,
            securityGroupName: `${props.map.findInMap(String(props.environment), 'AppName')}-SG`,
            description: `${props.map.findInMap(String(props.environment), 'AppName')}-SG`,
            allowAllOutbound: true
        });
        // ********************** Tagging
        cdk.Tags.of(this.SG).add('Name', `${props.map.findInMap(String(props.environment), 'AppName')}-SG`);

    }
}