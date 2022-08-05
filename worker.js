// web worker
importScripts("https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js");

async function loadPyodideAndPackages() {
  self.pyodide = await loadPyodide();
  // await self.pyodide.loadPackage(["numpy", "pytz", "pandas"]);
  await self.pyodide.loadPackage("micropip");
  await pyodide.runPythonAsync(`
import micropip
micropip.install('optlite')
`)
//   await pyodide.runPythonAsync(`
// from pyodide.http import pyfetch

// response = await pyfetch(".//pg_encoder.py")
// with open("pg_encoder.py", "wb") as f:
//   f.write(await response.bytes())
  
//   `)
  
  
//   await pyodide.runPythonAsync(`
// from pyodide.http import pyfetch

// response2 = await pyfetch(".//pg_logger.py")
// with open("pg_logger.py", "wb") as f:
//   f.write(await response2.bytes())
  
//   `)

//   await pyodide.runPythonAsync(`
//   from pyodide.http import pyfetch
//   response = await pyfetch(".//optlite.py")
//   with open("optlite.py", "wb") as f:
//       f.write(await response.bytes())
// `)

}
let pyodideReadyPromise = loadPyodideAndPackages();


self.onmessage = async (event) => {
  // make sure loading is done
  await pyodideReadyPromise;
  // The worker copies the context in its own "memory" (an object mapping name to values)
  if (event.data.id < 0) { // initialize worker
    try {
      let id = event.data.id;
      let results = await self.pyodide.loadPackage(event.data.package);
      self.postMessage({ results, id });
    } catch (error) {
      self.postMessage({ error: "Failed to initialize worker: "+error.message, id });
    }
  } else { // run code
    const { id, python, ...context } = event.data;
    for (const key of Object.keys(context)) {
      self[key] = context[key];
    }
    // Now is the easy part, the one that is similar to working in the main thread:
    try {
      await self.pyodide.loadPackagesFromImports(python);
      let results = await self.pyodide.runPythonAsync(python);

      self.postMessage({ results, id });
    } catch (error) {
      self.postMessage({ error: "Failed to run code" + error.message, id });
    }
  }
};