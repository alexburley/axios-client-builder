import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as httpErrors from 'http-errors';
import { merge } from 'lodash';

type AuthorizationGenerator = () => string;

export type ClientBuilderAuthHeader = string | AuthorizationGenerator;

export interface ClientBuilderLogger {
    info: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
}
export interface ClientBuilderParams {
    service: string;
    agent?: string;
    traceId?: string;
    logger?: ClientBuilderLogger;
    config?: AxiosRequestConfig;
}

export default class ClientBuilder {
    client: AxiosInstance;
    service: string;
    log?: ClientBuilderLogger;
    errorResponseInterceptors: [
        (res: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
        (err: AxiosError) => unknown,
    ][];

    /** Create an axios client builder, initializing with a timeout of 3 seconds
     *  and User-Agent and Trace-Id headers */
    constructor(params: ClientBuilderParams) {
        this.client = axios.create(
            merge(
                {
                    timeout: 3000,
                    headers: {
                        ...(params.traceId ? { 'Trace-Id': params.traceId } : {}),
                        ...(params.agent ? { 'User-Agent': params.agent } : {}),
                    },
                },
                params.config || {},
            ),
        );

        this.service = params.service;
        this.log = params.logger;
        this.errorResponseInterceptors = [];
    }

    /** Add handling for timeouts to return 504 Gateway Timeout
     *  and other 500 errors to return Bad Gateway as HttpErrors */
    add5xxErrorHandling(): ClientBuilder {
        this.errorResponseInterceptors.push([
            (response) => response,
            (error: AxiosError) => {
                if (error.code === 'ETIMEDOUT' || error?.message?.match(/timeout of [0-9]+ms exceeded/)) {
                    return Promise.reject(new httpErrors.GatewayTimeout());
                }
                if (axios.isAxiosError(error) && (error?.response?.status || 999) >= 500) {
                    return Promise.reject(new httpErrors.BadGateway());
                }
                return Promise.reject(error);
            },
        ]);
        return this;
    }

    /** Throws any 404 responses as HttpErrors */
    add404ErrorHandling(): ClientBuilder {
        this.errorResponseInterceptors.push([
            (response) => response,
            (error: AxiosError) => {
                if (axios.isAxiosError(error) && error?.response?.status === 404) {
                    return Promise.reject(new httpErrors.NotFound());
                }
                return Promise.reject(error);
            },
        ]);
        return this;
    }

    /** Given a logger is provided, request and responses will be logged */
    addRequestLogging(): ClientBuilder {
        if (!this.log) throw new Error('ClientBuilderError: No logger configured');
        this.client.interceptors.request.use((axiosRequest: AxiosRequestConfig) => {
            this.log &&
                this.log.info({
                    event: `${this.service}-request`,
                    method: axiosRequest?.method?.toUpperCase(),
                    host: axiosRequest.baseURL,
                    path: axiosRequest.url,
                });

            return axiosRequest;
        });

        this.client.interceptors.response.use(
            (axiosResponse: AxiosResponse) => {
                this.log &&
                    this.log.info({
                        event: `${this.service}-response`,
                        method: axiosResponse.config.method?.toUpperCase(),
                        host: axiosResponse.config.baseURL,
                        path: axiosResponse.config.url,
                        status: axiosResponse.status,
                    });
                return axiosResponse;
            },
            (error: AxiosError) => {
                this.log &&
                    this.log.error({
                        event: `${this.service}-error`,
                        status: error?.response?.status,
                        message: error?.message,
                        data: error?.response?.data,
                    });
                return Promise.reject(error);
            },
        );
        return this;
    }

    /** 401 and 403 responses will be thrown as HttpErrors and their statuses propagated to the user */
    addAuthErrorHandling(): ClientBuilder {
        this.errorResponseInterceptors.push([
            (response) => response,
            (error: AxiosError) => {
                if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
                    return Promise.reject(new httpErrors[error.response.status](JSON.stringify(error.response.data)));
                }
                return Promise.reject(error);
            },
        ]);
        return this;
    }

    /** Add a static or dynamic auth header to every request */
    addAuthorization(auth: ClientBuilderAuthHeader): ClientBuilder {
        this.client.interceptors.request.use((config) => {
            if (config.headers.Authorization) return config;
            const isDynamic = typeof auth === 'function';
            config.headers.Authorization = isDynamic ? (auth as AuthorizationGenerator)() : auth;
            return config;
        });
        return this;
    }

    /** Build the axios client with the provided settings */
    build(): AxiosInstance {
        this.errorResponseInterceptors.forEach((callbacks) => this.client.interceptors.response.use(...callbacks));
        return this.client;
    }
}
