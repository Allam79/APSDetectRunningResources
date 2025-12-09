import {CfnMapping} from 'aws-cdk-lib';
import { Construct } from 'constructs';


export class StackMaps {

    public readonly genericMap: CfnMapping;
    // public readonly codeBuildRole: Role;

    constructor(scope: Construct) {

    // create mapping
    this.genericMap = new CfnMapping(scope,
        "mainMap", {
          lazy: true,
            mapping: {
              "Staging": {
                AppName: "APSDetectRunningResources",
                VPCName: "LT",
                PrivateSubnetA: "subnet-00d0e7fdfd25b42da",
                PrivateSubnetB: "subnet-0e9f78f5e5ebaee40",



              },
              "StagingDR": {
                AppName: "APSDetectRunningResources",


              },
              "Sandbox": {

              },
              "Prod": {
                AppName: "APSDetectRunningResources",
                VPCName: "Fort",
                PrivateSubnetA: "subnet-00d0e7fdfd25b42da",
                PrivateSubnetB: "subnet-0e9f78f5e5ebaee40",
                accounts: "{\"Production\": \"578084145834\", \"Staging\": \"816692805244\"}",
                  recipients: "jallam@amazon.com",
                TimeHour: '00',
                TimeMinute: '00',
              }


            }
        })
    }}