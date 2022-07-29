// webworker.js

// Setup your project to serve `py-worker.js`. You should also serve
// `pyodide.js`, and all its associated `.asm.js`, `.data`, `.json`,
// and `.wasm` files as well:
importScripts("https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js");

async function loadPyodideAndPackages() {
  self.pyodide = await loadPyodide();
  await self.pyodide.loadPackage(["numpy", "pytz"]);

  await pyodide.runPythonAsync(`
from pyodide.http import pyfetch

response = await pyfetch(".//pg_encoder.py")
with open("pg_encoder.py", "wb") as f:
  f.write(await response.bytes())
  
  `)
  
  
  await pyodide.runPythonAsync(`
from pyodide.http import pyfetch

response2 = await pyfetch(".//pg_logger.py")
with open("pg_logger.py", "wb") as f:
  f.write(await response2.bytes())
  
  `)
  
  let pkg = pyodide.pyimport("pg_encoder");
  
  let pkgg = pyodide.pyimport("pg_logger");

}
let pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event) => {
  // make sure loading is done
  await pyodideReadyPromise;
  // Don't bother yet with this line, suppose our API is built in such a way:
  const { id, python, ...context } = event.data;
  // The worker copies the context in its own "memory" (an object mapping name to values)
  for (const key of Object.keys(context)) {
    self[key] = context[key];
  }
  // Now is the easy part, the one that is similar to working in the main thread:
  try {
    await self.pyodide.loadPackagesFromImports(python);
    let results = await self.pyodide.runPythonAsync(python);
    self.postMessage({ results, id });
  } catch (error) {
    self.postMessage({ error: error.message, id });
  }
};