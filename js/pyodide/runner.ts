import { OptLite, combineDefaults } from './global'

const pyodideWorker = new Worker(new URL("./optworker.js", import.meta.url));
const callbacks = {};

// ask worker to initialize pyodide based on the configuration 
// in a global OptLite object predefined before loading pyodide.
const initWorker = (() => {
  let id = -1; // use -ve job id for initialization
  combineDefaults( OptLite, {
    pyodide: "https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js", // pyodide url to load
    optlite: "optlite", // the required optlite package to install using micropip.
    // Use the latest version on pypi by default but can be changed to point to 
    // - other versions such as "optlite==0.0.1", or 
    // - a wheel file such as "dist/optlite-0.0.1-py2.py3-none-any.whl".
    packages: [], // list of packages to install using micropip, especially those not built-in to pyodide.
    // It is not required to put pyodide built-in packages (sucn as numpy) as those can be downloaded on-the-fly when visualizing a script that import them.
    // Nevertheless, putting them in the packages list allows them to be preloaded before visualizing any scripts.
  });
  return () => {
    return new Promise((onSuccess) => {
      callbacks[id] = onSuccess;
      pyodideWorker.postMessage({
        id, 
        ...OptLite
      });
    });
  }
})();
let init = initWorker();

// handle results from worker
pyodideWorker.onmessage = async (event) => {
  const { id, ...data } = event.data;
  const onSuccess = callbacks[id];
  if (onSuccess) { 
    // Only handle the first reply from worker for each job
    delete callbacks[id];
    onSuccess(data); 
  }
};

/**
 * Combine defaults into a configuration that may already have
 * user-provided values.  Values in src only go into dst if
 * there is not already a value for that key.
 *
 * @param {string} script      The code to execute and visualize
 * @param {string} options     The options for executing the script
 */
const asyncRun = (() => {
  let id = 0; // identify each visualization by a non-negative id
  return (script: string, rawInputLst: string[], options: any) => {
    id = (id + 1) % Number.MAX_SAFE_INTEGER;
    return (function(id){
      init = init.then(() => {
        // visualize after initialize
        return new Promise((onSuccess) => {
          callbacks[id] = onSuccess;
          pyodideWorker.postMessage({
            ...options,
            script: script,
            rawInputLst: rawInputLst,
            id: id
          });
        })
      });
      return init;
    })(id);
    
  };
})();

export { asyncRun };