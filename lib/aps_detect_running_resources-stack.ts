import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { StackMaps } from './mapping';
import * as lambdaservice from './lambda';
import { CfnParameter } from 'aws-cdk-lib';
import {SecurityGroupService} from "./securitygroup";
import { LookupServices } from './lookup';
import { RoleService } from './role';

export class ApsDetectRunningResourcesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    // ****************************************** import Classes ******************************************
    // import Classes
    const stackMap = new StackMaps(this)

    // ****************************************** GetContext  ******************************************
    const environment = this.node.tryGetContext('Env');
    // cdk init app --language typescript
    // cdk --profile STG deploy -c Env=Staging

    // ****************************************** Parameters ******************************************
    const ApplicationName = new CfnParameter(this, "Application", {
      type: "String",
      default: stackMap.genericMap.findInMap(environment,'AppName')
    })

    // ****************************************** Lookup ******************************************
    const Services = new LookupServices(this, 'Services', {
      map: stackMap.genericMap,
      environment: environment
    });

    // ****************************************** role ******************************************
    const Lambdarole = new RoleService(this, 'RoleService', {
      map: stackMap.genericMap,
      environment: environment
    });

    // ****************************************** SecurityGroup ******************************************
    const LambdaSG = new SecurityGroupService(this, 'SecurityGroupService', {
      map: stackMap.genericMap,
      environment: environment,
      vpc: Services.vpcID
    });

    // ****************************************** Create Lambda *********************************
    const lam = new lambdaservice.lambdaService(this, 'Lambda', {
          map: stackMap.genericMap,
          environment: environment,
          role: Lambdarole.role,
          vpc: Services.vpcID,
          VPCandSUBs: Services.VPCandSUBs,
          sg: LambdaSG.SG
        }
    )




  }
}
