import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codecommit from '@aws-cdk/aws-codecommit';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as actions from '@aws-cdk/aws-codepipeline-actions';
import * as iam from '@aws-cdk/aws-iam';
import * as pipelines from '@aws-cdk/pipelines';
import { App, Stack, StackProps } from '@aws-cdk/core';
import policies from './policy';

export interface PipelineStackProps extends StackProps {
    readonly repoName: string;
    readonly service: string;
    readonly pipelineSubdirectory: string;
}

export class NPMPackagePipelineStack extends Stack {
    constructor(app: App, id: string, props: PipelineStackProps) {
        super(app, id, props);

        const { service, repoName, pipelineSubdirectory } = props;

        const code = codecommit.Repository.fromRepositoryName(this, 'ImportedRepo', repoName);
        const role = new iam.Role(this, 'Role', {
            assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
        });
        policies.forEach((policy) => {
            role.addToPolicy(new iam.PolicyStatement(policy));
        });

        const cloudAssemblyArtifact = new codepipeline.Artifact();
        const sourceCodeArtifact = new codepipeline.Artifact();
        const pipelineId = `${service}-cdk-pipeline`;

        const pipeline = new pipelines.CdkPipeline(this, pipelineId, {
            crossAccountKeys: false,
            pipelineName: service,
            cloudAssemblyArtifact,
            selfMutating: true,
            sourceAction: new actions.CodeCommitSourceAction({
                actionName: 'Clone',
                repository: code,
                output: sourceCodeArtifact,
            }),
            synthAction: pipelines.SimpleSynthAction.standardNpmSynth({
                sourceArtifact: sourceCodeArtifact,
                cloudAssemblyArtifact,
                subdirectory: pipelineSubdirectory,
                actionName: 'Synth',
            }),
        });

        const buildStage = pipeline.addStage('Publish');
        const buildArtifact = new codepipeline.Artifact();
        const buildImage = codebuild.LinuxBuildImage.STANDARD_5_0;

        buildStage.addActions(
            new actions.CodeBuildAction({
                actionName: 'TestPublish',
                runOrder: 1,
                project: new codebuild.PipelineProject(this, `${pipelineId}-publish`, {
                    role,
                    environment: {
                        buildImage,
                    },
                    buildSpec: codebuild.BuildSpec.fromObject({
                        version: 0.2,
                        phases: {
                            install: {
                                'runtime-versions': { nodejs: '12.x' },
                            },
                            pre_build: { commands: ['npm i --silent'] },
                            build: {
                                commands: ['npm run check:ci', 'npm run release'],
                            },
                        },
                        artifacts: {
                            files: './**/*',
                        },
                    }),
                }),
                input: sourceCodeArtifact,
                outputs: [buildArtifact],
            }),
        );
    }
}
