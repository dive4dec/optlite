/**
 * The OptLite variable as a configuration object
 */
export interface OptLiteConfig {
    package: string[]; // list of packages to load
    [name: string]: any;
}

declare const global: {OptLite: OptLiteConfig};

/**
 * Create the OptLite global, if it doesn't exist
 */
if (typeof global.OptLite === 'undefined') {
    global.OptLite = {
        package: []
    } as OptLiteConfig;
}

export const OptLite = global.OptLite as OptLiteConfig;