import { Construct } from 'constructs';
import {CfnMapping, Fn} from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

export interface LookupServicesProps {
    readonly map: CfnMapping,
    readonly environment: string,
}

export class LookupServices extends Construct {

    public readonly vpcID: ec2.IVpc;
    public readonly VPCandSUBs: ec2.IVpc;

    constructor(scope: Construct, id: string, props: LookupServicesProps) {
            super(scope, id);

        // ****************************************** VPC Lookup ******************************************
        // // 👇 import existing VPC by Name
         this.vpcID = ec2.Vpc.fromLookup(this, 'VPC', {
             vpcName: props.map.findInMap(String(props.environment), 'VPCName')
        });

        // ****************************************** Subnet Lookup ******************************************
        // this.VpcLambda = ec2.Vpc.fromVpcAttributes(this, 'VpcLambda', {

        //get VPC Info form AWS account, FYI we are not rebuilding we are referencing
         this.VPCandSUBs = ec2.Vpc.fromVpcAttributes(this, 'VpcLambda', {
            vpcId: this.vpcID.vpcId,
            availabilityZones: Fn.getAzs(),
            privateSubnetIds: [
                props.map.findInMap(String(props.environment), 'PrivateSubnetA'),
                props.map.findInMap(String(props.environment), 'PrivateSubnetB')
            ],
            // publicSubnetIds: ['subnet-028b610fb193290c2']
        });

        // ****************************************** Subnet Lookup ******************************************
        // 👇 import existing Subnet
        //  this.subnetervice1 = ec2.Subnet.fromSubnetId(this, 'Subnet', props.map.findInMap(String(props.environment), 'PrivateSubnet'));

        // // ****************************************** S3 Lookup ******************************************
        // // 👇 import existing S3
        //  this.bucketservice = s3.Bucket.fromBucketName(
        //     this,
        //     'imported-bucketname',
        //     props.map.findInMap(String(props.environment), 'S3BuectLambdaCode')
        // );

    }
}