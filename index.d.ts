declare interface Options {
    /**
     * Name of the opaque token used for injecting the base URL value.
     * Defaults to 'API_BASE_URL'
     */
    baseUrlToken?: string | undefined;

    /**
     * Suffix to add to each service class name.
     * Defaults to 'Client'
     */
    serviceClassSuffix?: string | undefined;
}
