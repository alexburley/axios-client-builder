#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { NPMPackagePipelineStack } from '../lib/NPMPackagePipelineStack';

export const SERVICE = 'axios-client-builder';
const app = new cdk.App();

new NPMPackagePipelineStack(app, `${SERVICE}-pipeline`, {
    repoName: SERVICE,
    service: SERVICE,
    pipelineSubdirectory: 'cicd',
});

app.synth();
