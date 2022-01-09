import type { Config } from '@jest/types';
const config: Config.InitialOptions = {
    preset: 'ts-jest',
    globals: {
        'ts-jest': {
            isolatedModules: true,
        },
    },
    testEnvironment: 'node',
    coveragePathIgnorePatterns: ['node_modules', 'test/'],
    testPathIgnorePatterns: ['<rootDir>/dist', 'test/'],
    clearMocks: true,
    setupFiles: ['./test/setup.js'],
    testTimeout: 10000,
};
export default config;
