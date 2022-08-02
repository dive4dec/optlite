// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

/* TODO

- we're always referring to top-level CSS selectors on the page; maybe
  use a this.domRoot pattern like in pytutor.ts?

*/

/// <reference path="_references.ts" />

// for TypeScript
declare var diff_match_patch: any;
require('./lib/diff_match_patch.js');
require('./lib/jquery.ba-dotimeout.min.js');

// need to directly import the class for type checking to work
import { ExecutionVisualizer, assert, htmlspecialchars } from './pytutor';
import { nullTraceErrorLst, unsupportedFeaturesStr } from './footer-html';
import { HostConfig } from './config/HostConfig'
import { asyncRun } from './pyodide/runner';


// the main event!
//
// NB: this still relies on global state such as localStorage and the
// browser URL hash string, so you still can't have more than one of these
// objects per page; should still be instantiated as a SINGLETON
export abstract class AbstractBaseFrontend {
  sessionUUID: string = generateUUID(); // remains constant throughout one page load ("session")
  userUUID: string; // remains constant for a particular "user" throughout multiple page loads (stored in localStorage on a particular browser)

  myVisualizer: ExecutionVisualizer;
  originFrontendJsFile: string; // "abstract" -- must override in subclass

  // a cache where each element is a pair:
  // [appState, cached execution trace]
  // that way, if you execute the same code with the same settings again and
  // get a cache hit, then there's no need to make a server call
  traceCache = [];

  // 'edit' or 'display'. also support 'visualize' for backward
  // compatibility (same as 'display')
  appMode: string = 'edit';

  // inputted by user for raw_input / mouse_input events
  rawInputLst: string[] = [];

  isExecutingCode: boolean = false;

  // optional: not all frontends keep track of deltas
  dmp = new diff_match_patch();
  curCode = ''; // for dmp snapshots, kinda kludgy
  deltaObj: { start: string, deltas: any[], v: number, startTime: number, executeTime?: number } = undefined;

  num414Tries = 0;

  hostConfig: HostConfig;

  abstract executeCode(forceStartingInstr?: number, forceRawInputLst?: string[]): any;
  abstract finishSuccessfulExecution(): any; // called by executeCodeAndCreateViz
  abstract handleUncaughtException(trace: any[]): any; // called by executeCodeAndCreateViz

  constructor(params: any = {}) {
    this.hostConfig = new HostConfig();
    if (supports_html5_storage()) {
      // generate a unique UUID per "user" (as indicated by a single browser
      // instance on a user's machine, which can be more precise than IP
      // addresses due to sharing of IP addresses within, say, a school
      // computer lab)
      // added on 2015-01-27 for more precise user identification
      if (!localStorage.getItem('opt_uuid')) {
        localStorage.setItem('opt_uuid', generateUUID());
      }

      this.userUUID = localStorage.getItem('opt_uuid');
      assert(this.userUUID);
    } else {
      this.userUUID = undefined;
    }

    // register a generic AJAX error handler
    $(document).ajaxError((evt, jqxhr, settings, exception) => {
      if (this.ignoreAjaxError(settings)) {
        return; // early return!
      }

      // On my server ...

      // This jqxhr.responseText might mean the URL is too long, since the error
      // message returned by the server is something like this in nginx:
      //
      //   <html>
      //   <head><title>414 Request-URI Too Large</title></head>
      //   <body bgcolor="white">
      //   <center><h1>414 Request-URI Too Large</h1></center>
      //   <hr><center>nginx</center>
      //   </body>
      //   </html>
      //
      // Note that you'll probably need to customize this check for your server.
      if (jqxhr && jqxhr.responseText && jqxhr.responseText.indexOf('414') >= 0) {
        // ok this is an UBER UBER hack. If this happens just once, then
        // force click the "Visualize Execution" button again and re-try.
        // why? what's the difference the second time around? the diffs_json
        // parameter (derived from deltaObj) will be *empty* the second time
        // around since it gets reset on every execution. if diffs_json is
        // HUGE, then that might force the URL to be too big without your
        // code necessarily being too big, so give it a second shot with an
        // empty diffs_json. if it STILL fails, then display the error
        // message and give up.
        if (this.num414Tries === 0) {
          this.num414Tries++;
          $("#executeBtn").click();
        } else {
          this.setFronendError(["Server error! Your code might be too long for this tool. Shorten your code and re-try. [#CodeTooLong]"]);
          this.num414Tries = 0; // reset this to 0 AFTER setFronendError so that in setFronendError we can know that it's a 414 error (super hacky!)
        }
      } else {
        this.setFronendError(
          ["Server error! Your code might have an INFINITE LOOP or be running for too long.",
            "The server may also be OVERLOADED. Or you're behind a FIREWALL that blocks access.",
            "Try again later. This site is free with NO technical support. [#UnknownServerError]"]);
      }
      this.doneExecutingCode();
    });

    this.clearFrontendError();
    $("#embedLinkDiv").hide();
    $("#executeBtn")
      .attr('disabled', false)
      .click(this.executeCodeFromScratch.bind(this));
  }
  sendLogRequest(url: string, args: any) {
    url = this.hostConfig.pythonRoot + url;
    if (!this.hostConfig.isK8s && !this.hostConfig.isDevServer) {
      // support for calling cross site backend in local environment
      $.ajax({
        url: url,
        jsonp: "callback",
        dataType: "jsonp",
        data: args,
        success: (data) => { }
      })
    } else {
      $.get(url, args, function (dat) { });
    }
  }
  ignoreAjaxError(settings) { return false; } // subclasses should override

  // empty stub so that our code doesn't crash.
  // TODO: override this with a version in codeopticon-learner.js if needed
  logEventCodeopticon(obj) { } // NOP

  getAppState() { return {}; } // NOP -- subclasses need to override

  setFronendError(lines, ignoreLog = false) {
    $("#frontendErrorOutput").html(lines.map(htmlspecialchars).join('<br/>') +
      (ignoreLog ? '' : '<p/>(' + unsupportedFeaturesStr + ')'));

    // log it to the server as well (unless ignoreLog is on)
    if (!ignoreLog) {
      var errorStr = lines.join();

      var myArgs = this.getAppState();
      (myArgs as any).opt_uuid = this.userUUID;
      (myArgs as any).session_uuid = this.sessionUUID;
      (myArgs as any).error_msg = errorStr;

      // very subtle! if you have a 414 error, that means your original
      // code was too long to fit in the URL, so CLEAR THE FULL CODE from
      // myArgs, or else it will generate a URL that will give a 414 again
      // when you run error_log.py!!! this relies on this.num414Tries not
      // being reset yet at this point:
      if (this.num414Tries > 0) {
        (myArgs as any).code = '#CodeTooLong: ' + String((myArgs as any).code.length) + ' bytes';
      }
      //$.get('error_log.py', myArgs, function(dat) {}); // added this logging feature on 2018-02-18
      //this.sendLogRequest('error_log.py',myArgs);
    }
  }

  clearFrontendError() {
    $("#frontendErrorOutput").html('');
  }

  // parsing the URL query string hash
  getQueryStringOptions() {
    var ril = $.bbq.getState('rawInputLstJSON');
    var testCasesLstJSON = $.bbq.getState('testCasesJSON');
    // note that any of these can be 'undefined'
    return {
      preseededCode: $.bbq.getState('code'),
      preseededCurInstr: Number($.bbq.getState('curInstr')),
      verticalStack: $.bbq.getState('verticalStack'),
      appMode: $.bbq.getState('mode'),
      py: $.bbq.getState('py'),
      cumulative: $.bbq.getState('cumulative'),
      heapPrimitives: $.bbq.getState('heapPrimitives'),
      textReferences: $.bbq.getState('textReferences'),
      rawInputLst: ril ? $.parseJSON(ril) : undefined,
      demoMode: $.bbq.getState('demo'), // is 'demo mode' on? if so, hide a lot of excess stuff
      codcastFile: $.bbq.getState('codcast'), // load a codcast file created using ../recorder.html
      codeopticonSession: $.bbq.getState('cosession'),
      codeopticonUsername: $.bbq.getState('couser'),
      testCasesLst: testCasesLstJSON ? $.parseJSON(testCasesLstJSON) : undefined
    };
  }

  redrawConnectors() {
    if (this.myVisualizer &&
      (this.appMode == 'display' ||
        this.appMode == 'visualize' /* deprecated */)) {
      this.myVisualizer.redrawConnectors();
    }
  }

  getBaseBackendOptionsObj() {
    var ret = {
      cumulative_mode: ($('#cumulativeModeSelector').val() == 'true'),
      heap_primitives: ($('#heapPrimitivesSelector').val() == 'true'),
      show_only_outputs: false, // necessary for legacy reasons, ergh!
      origin: this.originFrontendJsFile
    };
    return ret;
  }

  getBaseFrontendOptionsObj() {
    var ret = {// tricky: selector 'true' and 'false' values are strings!
      disableHeapNesting: (($('#heapPrimitivesSelector').val() == 'true') ||
        ($('#heapPrimitivesSelector').val() == 'nevernest')),
      textualMemoryLabels: ($('#textualMemoryLabelsSelector').val() == 'true'),
      executeCodeWithRawInputFunc: this.executeCodeWithRawInput.bind(this),

      // always use the same visualizer ID for all
      // instantiated ExecutionVisualizer objects,
      // so that they can sync properly across
      // multiple clients using TogetherJS in shared sessions.
      // this shouldn't lead to problems since only ONE
      // ExecutionVisualizer will be shown at a time
      visualizerIdOverride: '1',
      updateOutputCallback: this.updateOutputCallbackFunc.bind(this),
      startingInstruction: 0,
    };
    return ret;
  }

  updateOutputCallbackFunc() {
    $('#urlOutput,#urlOutputShortened,#embedCodeOutput').val('');
  }

  executeCodeFromScratch() {
    this.rawInputLst = []; // reset!
    this.executeCode();
  }

  executeCodeWithRawInput(rawInputStr, curInstr) {
    this.rawInputLst.push(rawInputStr);
    this.executeCode(curInstr);
  }

  startExecutingCode(startingInstruction = 0) {
    $('#executeBtn').html("Please wait ... executing (takes up to 10 seconds)");
    $('#executeBtn').attr('disabled', true);
    this.isExecutingCode = true;
  }

  doneExecutingCode() {
    $('#executeBtn').html("Visualize Execution");
    $('#executeBtn').attr('disabled', false);
    this.isExecutingCode = false;
  }

  // execute codeToExec and create a new ExecutionVisualizer
  // object with outputDiv as its DOM parent
  executeCodeAndCreateViz(codeToExec,
    pyState,
    backendOptionsObj, frontendOptionsObj,
    outputDiv) {
    var vizCallback = (dataFromBackend) => {
      var trace = dataFromBackend.trace;
      // don't enter visualize mode if there are killer errors:
      if (!trace ||
        (trace.length == 0) ||
        (trace[trace.length - 1].event == 'uncaught_exception')) {
        this.handleUncaughtException(trace);

        if (trace.length == 1) {
          this.setFronendError([trace[0].exception_msg]);
        } else if (trace.length > 0 && trace[trace.length - 1].exception_msg) {
          this.setFronendError([trace[trace.length - 1].exception_msg]);
        } else {
          this.setFronendError(nullTraceErrorLst);
        }
      } else {
        // fail-soft to prevent running off of the end of trace
        if (frontendOptionsObj.startingInstruction >= trace.length) {
          frontendOptionsObj.startingInstruction = 0;
        }

        if (frontendOptionsObj.runTestCaseCallback) {
          // hacky! DO NOT actually create a visualization! instead call:
          frontendOptionsObj.runTestCaseCallback(trace);
        } else {
          // success!
          this.myVisualizer = new ExecutionVisualizer(outputDiv, dataFromBackend, frontendOptionsObj);
          // SUPER HACK -- slip in backendOptionsObj as an extra field
          // NB: why do we do this? for more detailed logging?
          (this.myVisualizer as any).backendOptionsObj = backendOptionsObj;
          this.finishSuccessfulExecution(); // TODO: should we also run this if we're calling runTestCaseCallback?
        }
      }
    }

    this.executeCodeAndRunCallback(codeToExec,
      pyState,
      backendOptionsObj, frontendOptionsObj,
      vizCallback.bind(this));
  }

  // execute code and call the execCallback function when the server
  // returns data via Ajax
  executeCodeAndRunCallback(codeToExec,
    pyState,
    backendOptionsObj, frontendOptionsObj,
    execCallback) {
    var callbackWrapper = (dataFromBackend) => {
      this.clearFrontendError(); // clear old errors first; execCallback may put in a new error:

      execCallback(dataFromBackend); // call the main event first

      // run this at the VERY END after all the dust has settled
      this.doneExecutingCode(); // rain or shine, we're done executing!
      // tricky hacky reset
      this.num414Tries = 0;
    };

    var backendScript = this.hostConfig.getLangSettingToBackendScript()[pyState];
    assert(backendScript);
    var jsonp_endpoint = this.hostConfig.getLangSettingToJsonpEndpoint()[pyState]; // maybe null
    var api_endpoint = this.hostConfig.getLangSettingToJsonpEndpoint()[pyState]; // need to make a new array to sort
    if (!backendScript) {
      this.setFronendError(["Server configuration error: No backend script"]);
      return;
    }

    this.clearFrontendError();
    this.startExecutingCode(frontendOptionsObj.startingInstruction);
    frontendOptionsObj.lang = pyState;
    // kludgy exceptions
    if (pyState === '2') {
      frontendOptionsObj.lang = 'py2';
    } else if (pyState === '3') {
      frontendOptionsObj.lang = 'py3';
    }  
      else if (pyState === 'pyodide') {
      frontendOptionsObj.lang = 'pyodide';
    } 
    else if (pyState === 'java') {
      // TODO: should we still keep this exceptional case?
      frontendOptionsObj.disableHeapNesting = true; // never nest Java objects, seems like a good default
    }

    // if we don't have any deltas, then don't bother sending deltaObj:
    // NB: not all subclasses will initialize this.deltaObj
    var deltaObjStringified = (this.deltaObj && (this.deltaObj.deltas.length > 0)) ? JSON.stringify(this.deltaObj) : null;
    if (deltaObjStringified) {
      // if deltaObjStringified is too long, then that will likely make
      // the URL way too long. in that case, just make it null and don't
      // send a delta (NB: actually set it to a canary value "overflow").
      // we'll lose some info but at least the URL will hopefully not overflow:
      if (deltaObjStringified.length > 4096) {
        deltaObjStringified = "overflow"; // set a canary to overflow
      }
    } else {
      pyState
      // if we got here due to the num414Tries retries hack, set
      // canary to "overflow"
      if (this.num414Tries > 0) {
        deltaObjStringified = "overflow_414";
      }
    }

    // if we can find a matching cache entry, then use it!!!
    if (this.traceCache) {
      var appState = this.getAppState();
      var cachedTrace = this.traceCacheGet(appState);
      if (cachedTrace) {
        //console.log("CACHE HIT!", appState);
        callbackWrapper({ code: (appState as any).code, trace: cachedTrace });
        return; // return early without going to the server at all!
      }
    }

    // everything below here is an ajax (async) call to the server ...
    if (frontendOptionsObj.lang === 'pyodide') {
      //this.pyodideRunner.runCode(callbackWrapper);
      let call = async () => {

        let result: any = await asyncRun(
`import optlite
from js import code
optlite.exec_script(code)`, { code:  codeToExec });
 
        callbackWrapper(JSON.parse(result.results))
      }
      call();
    } 
    else if (!this.hostConfig.isK8s) {
      //assert (pyState !== '2' && pyState !== '3');
      /* 
        /* 
      /* 
      // 2018-08-19: this is an uncommon use case (only used for https iframe embedding)
      if (jsonp_endpoint.indexOf('https:') == 0) {
          this.setFronendError(["Error: https execution of non-Python code is not currently supported. [#nonPythonHttps]"]);
          this.doneExecutingCode();
          return;
      }
      */
      var retryOnBackupServer = () => {
        // first log a #TryBackup error entry:
        this.setFronendError(["Main server is busy or has errors; re-trying using backup server " + this.hostConfig.backupHttpServerRoot + " ... [#TryBackup]"]);

        // now re-try the query using the backup server:
        var backup_jsonp_endpoint = this.hostConfig.getLangSettingToJsonpEndpointBackup()[pyState];
        assert(backup_jsonp_endpoint);
        $.ajax({
          url: backup_jsonp_endpoint,
          // The name of the callback parameter, as specified by the YQL service
          jsonp: "callback",
          dataType: "jsonp",
          data: {
            user_script: codeToExec,
            options_json: JSON.stringify(backendOptionsObj),
            raw_input_json: this.rawInputLst.length > 0 ? JSON.stringify(this.rawInputLst) : null,
          },
          success: callbackWrapper
        });
      }

      // for non-python, this should be a dummy script for logging
      // only, and to check whether there's a 414 error for #CodeTooLong
      $.ajax({
        url: jsonp_endpoint,
        // The name of the callback parameter, as specified by the YQL service
        jsonp: "callback",
        dataType: "jsonp",
        data: {
          user_script: codeToExec,
          options_json: JSON.stringify(backendOptionsObj),
          raw_input_json: this.rawInputLst.length > 0 ? JSON.stringify(this.rawInputLst) : null,
        },
        success: (dataFromBackend) => {
          var trace = dataFromBackend.trace;
          var shouldRetry = false;

          // the cokapi backend responded successfully, but the
          // backend may have issued an error. if so, then
          // RETRY with backupHttpServerRoot. otherwise let it
          // through to callbackWrapper
          if (!trace ||
            (trace.length == 0) ||
            (trace[trace.length - 1].event == 'uncaught_exception')) {
            if (trace.length == 1) {
              // we should only retry if there's a legit
              // backend error and not just a syntax error:
              var msg = trace[0].exception_msg;
              if (msg.indexOf('#BackendError') >= 0) {
                shouldRetry = true;
              }
            } else {
              shouldRetry = true;
            }
          }

          // don't bother re-trying for https since we don't
          // currently have an https backup server
          if (window.location.protocol === 'https:') {
            shouldRetry = false;
          }

          if (shouldRetry) {
            retryOnBackupServer();
          } else {
            // accept our fate without retrying
            callbackWrapper(dataFromBackend);
          }
        },
        // if there's a server error, then ALWAYS retry:
        error: (jqXHR, textStatus, errorThrown) => {
          retryOnBackupServer();
          // use 'global: false;' below to NOT run the generic ajaxError() function
        },

        global: false, // VERY IMPORTANT! do not call the generic ajaxError() function when there's an error;
        // only call our error handler above; http://api.jquery.com/ajaxerror/
      });

    } else if (api_endpoint) { // same origin in production
   
      var retryOnBackupServer = () => {
        // first log a #TryBackup error entry:
        this.setFronendError(["Main server is busy or has errors; re-trying using backup server " + this.hostConfig.backupHttpServerRoot + " ... [#TryBackup]"]);

        // now re-try the query using the backup server:
        var backup_jsonp_endpoint = this.hostConfig.getLangSettingToJsonpEndpointBackup()[pyState];
        assert(backup_jsonp_endpoint);
        $.ajax({
          url: backup_jsonp_endpoint,
          // The name of the callback parameter, as specified by the YQL service
          dataType: "json",
          data: {
            user_script: codeToExec,
            options_json: JSON.stringify(backendOptionsObj),
            raw_input_json: this.rawInputLst.length > 0 ? JSON.stringify(this.rawInputLst) : null,
          },
          success: callbackWrapper
        });
      }

      // for non-python, this should be a dummy script for logging
      // only, and to check whether there's a 414 error for #CodeTooLong
      $.ajax({
        url: jsonp_endpoint,
        // The name of the callback parameter, as specified by the YQL service
        dataType: "json",
        data: {
          user_script: codeToExec,
          options_json: JSON.stringify(backendOptionsObj),
          raw_input_json: this.rawInputLst.length > 0 ? JSON.stringify(this.rawInputLst) : null,
        },
        success: (dataFromBackend) => {
          var trace = dataFromBackend.trace;
          var shouldRetry = false;

          // the cokapi backend responded successfully, but the
          // backend may have issued an error. if so, then
          // RETRY with backupHttpServerRoot. otherwise let it
          // through to callbackWrapper
          if (!trace ||
            (trace.length == 0) ||
            (trace[trace.length - 1].event == 'uncaught_exception')) {
            if (trace.length == 1) {
              // we should only retry if there's a legit
              // backend error and not just a syntax error:
              var msg = trace[0].exception_msg;
              if (msg.indexOf('#BackendError') >= 0) {
                shouldRetry = true;
              }
            } else {
              shouldRetry = true;
            }
          }

          // don't bother re-trying for https since we don't
          // currently have an https backup server
          if (window.location.protocol === 'https:') {
            shouldRetry = false;
          }

          if (shouldRetry) {
            retryOnBackupServer();
          } else {
            // accept our fate without retrying
            callbackWrapper(dataFromBackend);
          }
        },
        // if there's a server error, then ALWAYS retry:
        error: (jqXHR, textStatus, errorThrown) => {
          retryOnBackupServer();
          // use 'global: false;' below to NOT run the generic ajaxError() function
        },

        global: false, // VERY IMPORTANT! do not call the generic ajaxError() function when there's an error;
        // only call our error handler above; http://api.jquery.com/ajaxerror/
      });
    } else {
      this.setFronendError(["Wrong endpoint"]);
    }
  }


  // manage traceCache

  // return whether two states match, except don't worry about mode or curInstr
  static appStateEqForCache(s1, s2) {
    // NB: this isn't always true if we're recording and replaying
    // in different frontend files ...
    //assert(s1.origin == s2.origin); // sanity check!
    return (s1.code == s2.code &&
      s1.cumulative == s2.cumulative &&
      s1.heapPrimitives == s1.heapPrimitives &&
      s1.textReferences == s2.textReferences &&
      s1.py == s2.py &&
      s1.rawInputLstJSON == s2.rawInputLstJSON);
  }

  // SILENTLY fail without doing anything if the current app state is
  // already in the cache
  traceCacheAdd() {
    // should only be called if you currently have a working trace;
    // otherwise it's useless
    assert(this.myVisualizer && this.myVisualizer.curTrace);
    var appState = this.getAppState();

    // make sure nothing in the cache currently matches appState
    for (var i = 0; i < this.traceCache.length; i++) {
      var e = this.traceCache[i];
      if (AbstractBaseFrontend.appStateEqForCache(e[0], appState)) {
        console.warn("traceCacheAdd silently failed, entry already in cache");
        return;
      }
    }

    this.traceCache.push([appState, this.myVisualizer.curTrace]);
    console.log('traceCacheAdd', this.traceCache);
  }

  traceCacheGet(appState) {
    for (var i = 0; i < this.traceCache.length; i++) {
      var e = this.traceCache[i];
      if (AbstractBaseFrontend.appStateEqForCache(e[0], appState)) {
        return e[1];
      }
    }
    return null;
  }

  traceCacheClear() {
    this.traceCache = [];
  }

} // END class AbstractBaseFrontend



// misc utilities:

// From http://stackoverflow.com/a/8809472
export function generateUUID() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
  });
  return uuid;
};

// Adapted from http://diveintohtml5.info/storage.html
export function supports_html5_storage() {
  try {
    if ('localStorage' in window && window['localStorage'] !== null) {
      // From: http://stackoverflow.com/questions/21159301/
      // Safari before v11, in Private Browsing Mode, looks like it supports localStorage but all calls to
      // setItem throw QuotaExceededError.  Making these calls in the try block will detect that situation
      // with the catch below, returning false.
      localStorage.setItem('_localStorage_test', '1');
      localStorage.removeItem('_localStorage_test');
      return true;
    }
    else {
      return false;
    }
  } catch (e) {
    return false;
  }
}
