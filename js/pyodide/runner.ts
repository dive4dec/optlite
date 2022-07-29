const pyodideWorker = new Worker("worker.js");

const callbacks = {};

pyodideWorker.onmessage = (event) => {
  const { id, ...data } = event.data;
  const onSuccess = callbacks[id];
  delete callbacks[id];
  onSuccess(data);
};

const asyncRun = (() => {
  let id = 0; // identify a Promise
  return (script,context) => {
    // the id could be generated more carefully
    id = (id + 1) % Number.MAX_SAFE_INTEGER;
    return new Promise((onSuccess) => {
      callbacks[id] = onSuccess;
      pyodideWorker.postMessage({
        ...context,
        python: script,
        id,
      });
    });
  };
})();

export { asyncRun };
/*
export class PyodideRunner{
    pyodide_py : any;
    PyodideRunner(){
        this.pyodide_py = null;
    }
    async getPyodide(){
        if(this.pyodide_py === null) 
            //this.pyodide_py = await import('../lib/pyodide'); // await import('pyodide/pyodide.js')
            this.pyodide_py = await import('pyodide/load-pyodide.js');
        return this.pyodide_py;
    }
    public async runCode(callback:any){
        
        let pyodide_py = await this.getPyodide();
        let pyodide = await pyodide_py.loadPyodide();
        let output = await pyodide.runPythonAsync(script);
        callback(output);
    }
}
let script : string = `
import sys, pg_logger, json
from optparse import OptionParser

request = False
try:
	import StringIO # NB: don't use cStringIO since it doesn't support unicode!!!
except:
	import io as StringIO # py3
		   
def jsonp(request, dictionary):
    if (request):
        return "%s(%s)" % (request, dictionary)
    return dictionary


out_s = StringIO.StringIO()


def json_finalizer(input_code, output_trace):
	ret = dict(code=input_code, trace=output_trace)
	json_output = json.dumps(ret, indent=None)
	out_s.write(json_output)


pg_logger.exec_script_str_local(code,
							  None,
							  False,
							  False,
							  json_finalizer)



jsonp(False, out_s.getvalue())	  
`;
*/