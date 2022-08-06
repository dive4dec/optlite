/**
 * The OptLite variable as a configuration object
 */
export interface OptLiteConfig {
    [name: string]: any;
}

declare const global: {OptLite: OptLiteConfig};

/**
 * Create the default OptLite global, if it doesn't exist.
 */
if (typeof global.OptLite === 'undefined') {
    global.OptLite = {} as OptLiteConfig;
}

/**
 * @param {any} x     An item to test if it is an object
 * @return {boolean}  True if the item is a non-null object
 */
 export function isObject(x: any): boolean {
    return typeof x === 'object' && x !== null;
  }

/**
 * Combine defaults into a configuration that may already have
 * user-provided values.  Values in src only go into dst if
 * there is not already a value for that key.
 *
 * @param {any} dst      The destination config object (to be merged into)
 * @param {string} name  The id of the configuration block to modify (created if doesn't exist, modify all if empty.)
 * @param {any} src      The source configuration object (to replace defaul values in dst}
 * @return {any}         The resulting (modified) config object
 */
 export function combineDefaults(dst: any, src: any, name: string = ""): any {
    if (name) {
        if (!dst[name]) {
            dst[name] = {};
        }
        dst = dst[name];      
    }
    for (const id of Object.keys(src)) {
      if (isObject(dst[id]) && isObject(src[id])) {
        combineDefaults(dst, id, src[id]);
      } else if (dst[id] == null && src[id] != null) {
        dst[id] = src[id];
      }
    }
    return dst;
  }

export const OptLite = global.OptLite as OptLiteConfig;