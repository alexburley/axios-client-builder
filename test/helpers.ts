import * as nock from 'nock';

interface TestContext {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export const createTestContext = <T>(): T => {
    const context = {} as TestContext;
    beforeEach(() => {
        nock.cleanAll();
    });
    afterEach(() => {
        Object.keys(context).forEach((key: string) => {
            delete context[key];
        });
    });
    afterAll(() => {
        nock.restore();
    });
    return context as T;
};

export const describeCITest = (name: string, fn: () => void): ReturnType<jest.Describe> => {
    if (process.env.TEST_ENV === 'ci') return describe(name, fn);
    return describe.skip(name, fn);
};
