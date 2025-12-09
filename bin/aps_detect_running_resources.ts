#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { ApsDetectRunningResourcesStack } from '../lib/aps_detect_running_resources-stack';

const app = new cdk.App();
const environment = app.node.tryGetContext('Env');
new ApsDetectRunningResourcesStack(app, `ApsDetectRunningResourcesStack-${environment}`, {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});
