import { OptLite } from './global'

const pyodideWorker = new Worker("worker.js");
const callbacks = {};

// ask worker to initialize pyodide based on the configuration 
// in a global OptLite object predefined before loading pyodide.
const initWorker = (() => {
  let id = -1; // use -ve job id for initialization
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

const asyncRun = (() => {
  let id = 0; // identify each visualization by a non-negative id
  return (script: string, context: any) => {
    id = (id + 1) % Number.MAX_SAFE_INTEGER;
    return new Promise((onSuccess) => {
      init.then(() => {
        // visualize after initialize
        callbacks[id] = onSuccess;
        pyodideWorker.postMessage({
          ...context,
          python: script,
          id,
        });  
      })
    });
  };
})();

export { asyncRun };