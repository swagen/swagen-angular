/**
 * Options for Angular 2+ generators.
 */
export interface AngularTypescriptOptions {
    generation?: {
        generateInterfaces?: boolean;
        generateImplementations?: boolean;
    };

    baseUrl?: {
        strategy?: 'ImportedVar'|'Property'|'InjectedToken'|'Swagger';
        overrideUrl?: string;
        importVar?: {
            importFrom: string;
            importVariable: string;
            property?: string;
        };
        property?: string;
    };

    angular?: {
        httpFramework?: 'HttpClient'|'Http';
        tokenType?: 'InjectedToken'|'OpaqueToken';
        futuresType?: 'Observables'|'Promises';
    };

    customizations?: {
        importFrom: string;
        importVariable: string;
    };
}

/**
 * Options for AngularJS 1.x generators.
 */
export interface AngularJsTypescriptOptions {
    /**
     * Name of the Angular module to register the generated services under.
     */
    moduleName?: string;

    /**
     * Suffix to add to each service name.
     * Defaults to 'Client' if not specified.
     */
    serviceSuffix: string;

    /**
     * Details on how to access the base URL of web service.
     */
    baseUrl: {
        /**
         * The Typescript type of the service containing the base URL.
         */
        type: string;

        /**
         * The injectable name of the Angular service containing the base URL.
         */
        provider: string;

        /**
         * Array of member names needed to access the base URL in the service.
         */
        path?: string[];
    };

    /**
     * Typescript namespaces to generate the services and models in.
     */
    namespaces: {
        /**
         * Typescript namespace to generate the services interfaces and classes.
         */
        services: string;

        /**
         * Typescript namespace to generate the models and model factories.
         */
        models: string;
    };

    /**
     * Reference paths to be added to the top of the generated code.
     * Only specify the path; do not specify the full markup.
     */
    references?: string[];
}

export interface AngularJsJavascriptOptions {
    /**
     * Name of the AngularJS module to register the generated services under.
     */
    module: string;

    baseUrl: {
        /**
         * The injectable name of the Angular service containing the base URL.
         */
        provider: string;

        /**
         * Path to the member in the provider where the baseUrl can be retrieved from.
         */
        path?: string;
    };
}
