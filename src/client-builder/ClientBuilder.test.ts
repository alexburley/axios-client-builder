import { AxiosInstance, AxiosResponse } from 'axios';
import nock from 'nock';
import { createTestContext, describeCITest } from '../../test/helpers';
import ClientBuilder from './';

interface TestContext {
    act: () => Promise<AxiosResponse>;
    client: AxiosInstance;
    httpScope: nock.Scope;
    httpRequestHeaders: Record<string, string>;
    log: {
        info: jest.Mock;
        error: jest.Mock;
        warn: jest.Mock;
    };
}
describe('ClientBuilder', () => {
    const context = createTestContext<TestContext>();

    beforeEach(() => {
        context.httpScope = nock('https://someDomain.com');
        context.act = () => context.client.get('https://someDomain.com/foo');
        context.log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    });

    describe('Given an instance with no helpers', () => {
        beforeEach(() => {
            context.client = new ClientBuilder({
                service: 'some-service',
                traceId: 'someTraceId',
                agent: 'someAgent',
                config: {},
            }).build();
            context.httpScope.get('/foo').reply(200, function () {
                context.httpRequestHeaders = this.req.headers;
            });
        });

        it('Should set trace-id header on requests', async () => {
            await context.act();
            expect(context.httpRequestHeaders).toMatchObject({ 'trace-id': 'someTraceId' });
        });

        it('Should set user-agent header on requests', async () => {
            await context.act();
            expect(context.httpRequestHeaders).toMatchObject({ 'user-agent': 'someAgent' });
        });

        describeCITest('Given the request takes longer than three seconds', () => {
            beforeEach(() => {
                context.httpScope.get('/bar').delay(3000).reply(200);
                context.act = async () => {
                    return await context.client.get('https://someDomain.com/bar');
                };
            });
            it('Should time out by default', async () => {
                expect.assertions(1);
                await context.act().catch((err) => expect(err).toEqual(new Error('timeout of 3000ms exceeded')));
            });
        });

        describe('And we overwrite the axios config', () => {
            describe('By setting the baseURL', () => {
                beforeEach(() => {
                    context.client = new ClientBuilder({
                        service: 'some-service',
                        agent: 'someAgent',
                        config: { baseURL: 'https://someDomain.com' },
                    }).build();
                    context.act = () => context.client.get('https://someDomain.com/foo');
                });
                it('Should use that baseURL in requests', async () => {
                    const res = await context.act();
                    expect(res.status).toEqual(200);
                });
            });
            describeCITest('By setting a higher timeout', () => {
                beforeEach(() => {
                    context.client = new ClientBuilder({
                        service: 'some-service',
                        agent: 'someAgent',
                        config: { timeout: 5000 },
                    }).build();
                    context.httpScope.get('/bar').delay(5000).reply(200);
                    context.act = async () => {
                        return await context.client.get('https://someDomain.com/bar');
                    };
                });
                it('Should overwrite the default timeout in the request', async () => {
                    expect.assertions(1);
                    await context.act().catch((err) => expect(err).toEqual(new Error('timeout of 5000ms exceeded')));
                });
            });
        });
    });

    describe('Given an instance with 5xx error handling', () => {
        beforeEach(() => {
            context.client = new ClientBuilder({
                service: 'some-service',
                agent: 'someAgent',
                config: {},
            })
                .add5xxErrorHandling()
                .build();
        });

        describe('Given a 400 status code', () => {
            beforeEach(() => {
                context.httpScope.get('/foo').reply(400);
            });
            it('Should pass the error through', async () => {
                expect.assertions(1);
                await context.act().catch((err) => {
                    expect(err.message).toEqual('Request failed with status code 400');
                });
            });
        });

        describe('Given a 500 status code', () => {
            beforeEach(() => {
                context.httpScope.get('/foo').reply(500);
            });
            it('Should throw a 502 Bad Gateway HTTP error', async () => {
                expect.assertions(1);
                await context.act().catch((err) => {
                    expect({
                        message: err.message,
                        statusCode: err.statusCode,
                    }).toEqual({
                        message: 'Bad Gateway',
                        statusCode: 502,
                    });
                });
            });
        });

        describe('Given a 503 status code', () => {
            beforeEach(() => {
                context.httpScope.get('/foo').reply(503);
            });
            it('Should throw a 502 Bad Gateway HTTP error', async () => {
                expect.assertions(1);
                await context.act().catch((err) => {
                    expect({
                        message: err.message,
                        statusCode: err.statusCode,
                    }).toEqual({
                        message: 'Bad Gateway',
                        statusCode: 502,
                    });
                });
            });
        });

        describe('Given a HTTP timeout', () => {
            describe('Where axios has errored', () => {
                beforeEach(() => {
                    context.httpScope.get('/foo').replyWithError({ code: 'ETIMEDOUT' });
                });
                it('Should throw a 504 Gateway Timeout HTTP error', async () => {
                    expect.assertions(1);
                    await context.act().catch((err) => {
                        expect({
                            message: err.message,
                            statusCode: err.statusCode,
                        }).toEqual({ message: 'Gateway Timeout', statusCode: 504 });
                    });
                });
            });

            describe('Where node http has errored', () => {
                beforeEach(() => {
                    context.httpScope.get('/foo').replyWithError('timeout of 3000ms exceeded');
                });
                it('Should throw a 504 Gateway Timeout HTTP error', async () => {
                    expect.assertions(1);
                    await context.act().catch((err) => {
                        expect({
                            message: err.message,
                            statusCode: err.statusCode,
                        }).toEqual({ message: 'Gateway Timeout', statusCode: 504 });
                    });
                });
            });
        });
    });
    describe('Given an instance with 404 error handling', () => {
        beforeEach(() => {
            context.client = new ClientBuilder({
                service: 'some-service',
                agent: 'someAgent',
                config: {},
            })
                .add404ErrorHandling()
                .build();
        });
        describe('Given a 400 status code', () => {
            beforeEach(() => {
                context.httpScope.get('/foo').reply(400);
            });
            it('Should pass the error through', async () => {
                expect.assertions(1);
                await context.act().catch((err) => {
                    expect(err.message).toEqual('Request failed with status code 400');
                });
            });
        });
        describe('Given a 404 status code', () => {
            beforeEach(() => {
                context.httpScope.get('/foo').reply(404);
            });
            it('Should throw a 404 Not Found HTTP error', async () => {
                expect.assertions(1);
                await context.act().catch((err) => {
                    expect({
                        message: err.message,
                        statusCode: err.statusCode,
                    }).toEqual({ message: 'Not Found', statusCode: 404 });
                });
            });
        });
    });

    describe('Given an instance with request logging', () => {
        beforeEach(() => {
            context.client = new ClientBuilder({
                service: 'some-service',
                agent: 'someAgent',
                logger: context.log,
                config: {
                    baseURL: 'https://someDomain.com',
                },
            })
                .addRequestLogging()
                .build();
            context.act = () => context.client.get('/foo');
        });

        describe('Where no logger is defined', () => {
            it('Should error', () => {
                expect(() =>
                    new ClientBuilder({
                        service: 'some-service',
                        agent: 'someAgent',
                        config: {
                            baseURL: 'https://someDomain.com',
                        },
                    }).addRequestLogging(),
                ).toThrowError('ClientBuilderError: No logger configured');
            });
        });
        describe('Given any successful request', () => {
            beforeEach(() => {
                context.httpScope.get('/foo').reply(200);
            });
            it('Should log the request', async () => {
                await context.act();
                expect(context.log.info).toBeCalledWith({
                    event: 'some-service-request',
                    host: 'https://someDomain.com',
                    method: 'GET',
                    path: '/foo',
                });
            });
            it('Should log the response', async () => {
                await context.act();
                expect(context.log.info).toBeCalledWith({
                    event: 'some-service-response',
                    host: 'https://someDomain.com',
                    method: 'GET',
                    path: '/foo',
                    status: 200,
                });
            });

            it('Should only have logged twice', async () => {
                await context.act();
                expect(context.log.info).toBeCalledTimes(2);
            });

            it.todo('Should log the latency');
        });

        describe('Given any errored request', () => {
            beforeEach(() => {
                context.httpScope.get('/foo').reply(400, 'BadRequest');
            });
            it('Should log the error', async () => {
                await context.act().catch(() => null);
                expect(context.log.error).toBeCalledWith({
                    data: 'BadRequest',
                    event: 'some-service-error',
                    message: 'Request failed with status code 400',
                    status: 400,
                });
            });

            it('Should only have logged twice', async () => {
                await context.act().catch(() => null);
                expect(context.log.info).toBeCalledTimes(1);
                expect(context.log.error).toBeCalledTimes(1);
            });
        });
    });

    describe('Given an instance with error logging', () => {
        beforeEach(() => {
            context.client = new ClientBuilder({
                service: 'some-service',
                agent: 'someAgent',
                logger: context.log,
                config: {
                    baseURL: 'https://someDomain.com',
                },
            }).build();
            context.act = () => context.client.get('/foo');
        });

        describe('Where no logger is defined', () => {
            it('Should error', () => {
                expect(() =>
                    new ClientBuilder({
                        service: 'some-service',
                        agent: 'someAgent',
                        config: {
                            baseURL: 'https://someDomain.com',
                        },
                    }).addRequestLogging(),
                ).toThrowError('ClientBuilderError: No logger configured');
            });
        });

        describe('Given any successful request', () => {
            beforeEach(() => {
                context.httpScope.get('/foo').reply(200);
            });
            it('Should not log anything', async () => {
                await context.act();
                expect(context.log.info).not.toBeCalled();
            });
        });
    });

    describe('Given an instance with authorization error handling', () => {
        beforeEach(() => {
            context.client = new ClientBuilder({
                service: 'some-service',
                agent: 'someAgent',
                config: {},
            })
                .addAuthErrorHandling()
                .build();
        });
        describe('Given a 401 status code', () => {
            beforeEach(() => {
                context.httpScope.get('/foo').reply(401, 'Unauthorized User');
            });
            it('Should throw a 401 Unauthorized response using the given error', async () => {
                expect.assertions(1);
                await context.act().catch((err) => {
                    expect({
                        message: err.message,
                        statusCode: err.statusCode,
                    }).toEqual({ message: '"Unauthorized User"', statusCode: 401 });
                });
            });
        });

        describe('Given a 403 status code', () => {
            beforeEach(() => {
                context.httpScope.get('/foo').reply(403, 'Forbidden User');
            });
            it('Should throw a 403 Forbidden response using the given error', async () => {
                expect.assertions(1);
                await context.act().catch((err) => {
                    expect({
                        message: err.message,
                        statusCode: err.statusCode,
                    }).toEqual({ message: '"Forbidden User"', statusCode: 403 });
                });
            });
        });
        describe('Given a 500 status code', () => {
            beforeEach(() => {
                context.httpScope.get('/foo').reply(500, 'Server Error');
            });
            it('Should pass the error through', async () => {
                expect.assertions(1);
                await context.act().catch((err) => {
                    expect(err.message).toEqual('Request failed with status code 500');
                });
            });
        });
    });

    describe('Given an instance with authorization', () => {
        describe('That is a static string', () => {
            beforeEach(() => {
                context.client = new ClientBuilder({
                    service: 'some-service',
                    agent: 'someAgent',
                    config: {},
                })
                    .addAuthorization('someStaticAuth')
                    .build();
                context.httpScope.get('/foo').reply(200, function () {
                    context.httpRequestHeaders = this.req.headers;
                });
            });
            it('Should add the authorization header to the request', async () => {
                await context.act();
                expect(context.httpRequestHeaders).toMatchObject({
                    authorization: 'someStaticAuth',
                });
            });

            describe('Given I overwrite the auth', () => {
                beforeEach(() => {
                    context.act = () =>
                        context.client.get('https://someDomain.com/foo', {
                            headers: {
                                Authorization: 'someDifferentAuth',
                            },
                        });
                });
                it('Should add the authorization header to the request', async () => {
                    await context.act();
                    expect(context.httpRequestHeaders).toMatchObject({
                        authorization: 'someDifferentAuth',
                    });
                });
            });
        });

        describe('That is a dynamic function', () => {
            beforeEach(() => {
                context.client = new ClientBuilder({
                    service: 'some-service',
                    agent: 'someAgent',
                    config: {},
                })
                    .addAuthorization(() => 'someDynamicAuth')
                    .build();
                context.httpScope.get('/foo').reply(200, function () {
                    context.httpRequestHeaders = this.req.headers;
                });
            });
            it('Should add the authorization header to the request', async () => {
                await context.act();
                expect(context.httpRequestHeaders).toMatchObject({
                    authorization: 'someDynamicAuth',
                });
            });
        });
    });

    describe('Given we add all error functions', () => {
        beforeEach(() => {
            context.client = new ClientBuilder({
                service: 'some-service',
                agent: 'someAgent',
                config: {},
            })
                .addAuthorization(() => 'someDynamicAuth')
                .add404ErrorHandling()
                .addAuthErrorHandling()
                .add5xxErrorHandling()
                .build();
        });
        describe('Given a 500 status code', () => {
            beforeEach(() => {
                context.httpScope.get('/foo').reply(500);
            });
            it('Should throw a 502 Bad Gateway HTTP error', async () => {
                expect.assertions(1);
                await context.act().catch((err) => {
                    expect({
                        message: err.message,
                        statusCode: err.statusCode,
                    }).toEqual({
                        message: 'Bad Gateway',
                        statusCode: 502,
                    });
                });
            });
        });

        describe('Given a 503 status code', () => {
            beforeEach(() => {
                context.httpScope.get('/foo').reply(503);
            });
            it('Should throw a 502 Bad Gateway HTTP error', async () => {
                expect.assertions(1);
                await context.act().catch((err) => {
                    expect({
                        message: err.message,
                        statusCode: err.statusCode,
                    }).toEqual({
                        message: 'Bad Gateway',
                        statusCode: 502,
                    });
                });
            });
        });

        describe('Given a HTTP timeout', () => {
            describe('Where axios has errored', () => {
                beforeEach(() => {
                    context.httpScope.get('/foo').replyWithError({ code: 'ETIMEDOUT' });
                });
                it('Should throw a 504 Gateway Timeout HTTP error', async () => {
                    expect.assertions(1);
                    await context.act().catch((err) => {
                        expect({
                            message: err.message,
                            statusCode: err.statusCode,
                        }).toEqual({ message: 'Gateway Timeout', statusCode: 504 });
                    });
                });
            });

            describe('Where node http has errored', () => {
                beforeEach(() => {
                    context.httpScope.get('/foo').replyWithError('timeout of 3000ms exceeded');
                });
                it('Should throw a 504 Gateway Timeout HTTP error', async () => {
                    expect.assertions(1);
                    await context.act().catch((err) => {
                        expect({
                            message: err.message,
                            statusCode: err.statusCode,
                        }).toEqual({ message: 'Gateway Timeout', statusCode: 504 });
                    });
                });
            });
        });

        describe('Given a 404 status code', () => {
            beforeEach(() => {
                context.httpScope.get('/foo').reply(404);
            });
            it('Should throw a 404 Not Found HTTP error', async () => {
                expect.assertions(1);
                await context.act().catch((err) => {
                    expect({
                        message: err.message,
                        statusCode: err.statusCode,
                    }).toEqual({ message: 'Not Found', statusCode: 404 });
                });
            });
        });

        describe('Given a 401 status code', () => {
            beforeEach(() => {
                context.httpScope.get('/foo').reply(401, 'Unauthorized User');
            });
            it('Should throw a 401 Unauthorized response using the given error', async () => {
                expect.assertions(1);
                await context.act().catch((err) => {
                    expect({
                        message: err.message,
                        statusCode: err.statusCode,
                    }).toEqual({ message: '"Unauthorized User"', statusCode: 401 });
                });
            });
        });

        describe('Given a 403 status code', () => {
            beforeEach(() => {
                context.httpScope.get('/foo').reply(403, 'Forbidden User');
            });
            it('Should throw a 403 Forbidden response using the given error', async () => {
                expect.assertions(1);
                await context.act().catch((err) => {
                    expect({
                        message: err.message,
                        statusCode: err.statusCode,
                    }).toEqual({ message: '"Forbidden User"', statusCode: 403 });
                });
            });
        });
    });
});
