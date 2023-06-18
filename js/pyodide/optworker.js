// web worker

self.onmessage = async (event) => {
  // copy the context in worker's own "memory"
  const { id, ...context } = event.data;
  for (const key of Object.keys(context)) {
    self[key] = context[key];
  }

  try {
    let results;
    if (id < 0) { // initialize worker
      // load pyodide from its url
      importScripts(self.pyodide);
      self.pyodide = await loadPyodide();
      await self.pyodide.loadPackage("micropip");
      // fetch and install optlite from pypi
      results = await self.pyodide.runPythonAsync(`
      import micropip
      from js import packages, optlite
      await micropip.install(optlite)
      for p in packages:
          await micropip.install(p)
      `)
    } else { // visualize code
      await self.pyodide.loadPackagesFromImports(self.preamble);
      await self.pyodide.loadPackagesFromImports(self.script);
      results = await self.pyodide.runPythonAsync(`
      import optlite
      from js import script, rawInputLst, preamble
      optlite.exec_script(script, rawInputLst, preamble)
      `);
    }
    self.postMessage({ results, id });
  } catch (error) {
    self.postMessage({ error: "Failed to run code: " + error.message, id });
  }
};