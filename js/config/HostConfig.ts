// Interface of Host Language
export interface HostLanguage {
    '2': string;
    '3': string;
    'js': string;
    'ts': string;
    'java': string;
    'ruby': string;
    'c': string;
    'cpp': string;
    'py3anaconda': string;
    'pyodide': string;
}
// Export a class that contain the host setting
// Can add abstract and extends for DevHostConfig and ProdHostConfig
// Figuring out how to do it better..
export class HostConfig {
    // these settings are all customized for my own server setup,
    // so you will need to customize for your server:
    readonly devServer: Array<string>;
    readonly entryHost: string;
    readonly productionHostName: string;
    readonly productionServerUrl: string;
    readonly serverRoot: string;
    readonly isDevServer: boolean;
    readonly isDevK8s: boolean;
    readonly isProd: boolean;
    readonly isProdK8s: boolean;
    readonly isK8s: boolean;

    // Root Path config
    readonly pythonRoot: string;
    readonly anacondaRoot: string;
    readonly javaRoot: string;
    readonly javascriptRoot: string;
    readonly rubyRoot: string;
    readonly cRoot: string;
    readonly cppRoot: string;
    readonly pyodideRoot: string;
    readonly backupHttpServerRoot: string;
    // see ../../v4-cokapi/cokapi.js for details
    protected langSettingToBackendScript: HostLanguage;
    protected langSettingToJsonpEndpoint: HostLanguage;
    protected langSettingToJsonpEndpointBackup: HostLanguage;


    constructor() {
        // Get the entry url
        this.entryHost = window.location.host;
        // Setting of production environment
        this.productionHostName = 'mytutor.cs.cityu.edu.hk';
        this.productionServerUrl = (window.location.protocol === 'https:') ?
            `https://${this.productionHostName}` : // my certificate for https is registeredstringpi.com, so use it for now
            `http://${this.productionHostName}`;
        // list development IPs
        this.devServer = [
            'localhost', '0.0.0.0', '127.0.0.1', // local ip
            'mytutorlocal.app', 'mytutorlocal.app:32080'                  // test ip for k8s
        ];
        // Determine the development server
        this.isDevServer = this.devServer.indexOf(window.location.hostname) > -1 ? true : false;
        this.isDevK8s = this.entryHost.includes('mytutorlocal.app') == true ;
        this.isProd = this.entryHost.includes(this.productionHostName) == true;
        this.isProdK8s = this.isProd;
        this.isK8s = this.isDevK8s || this.isProdK8s;

        if (this.isDevServer && !this.isDevK8s)// not equals k8s
        {
            this.entryHost = window.location.hostname;
            this.serverRoot = `${this.productionServerUrl}/nodejs/`;
            this.pythonRoot = `http://${this.entryHost}:8080/`;
            this.cRoot = `http://${this.entryHost}:8082/`;
            this.javascriptRoot = `http://${this.entryHost}:8084/`;
 
        } else if (this.isDevServer) {
            this.entryHost = window.location.host;
            this.serverRoot = `${this.productionServerUrl}/nodejs/`;
            this.pythonRoot = `http://${this.entryHost}/python/`;
            this.anacondaRoot = `${this.entryHost}/anaconda/`;
            this.javaRoot = `${this.entryHost}/java/`;
            this.javascriptRoot = `${this.entryHost}/javascript/`;
            this.rubyRoot = `${this.entryHost}/ruby/`;
            this.cRoot = `${this.entryHost}/c/`;
            this.cppRoot = `${this.entryHost}/cpp/`;
            this.pyodideRoot = `${this.entryHost}/pyodide/`;
        } else {
            this.serverRoot = `${this.productionServerUrl}/nodejs/`;
            this.pythonRoot = `${this.productionServerUrl}/python/`;
            this.anacondaRoot = `${this.productionServerUrl}/anaconda/`;
            this.javaRoot = `${this.productionServerUrl}/java/`;
            this.javascriptRoot = `${this.productionServerUrl}/javascript/`;
            this.rubyRoot = `${this.productionServerUrl}/ruby/`;
            this.cRoot = `${this.productionServerUrl}/c/`;
            this.cppRoot = `${this.productionServerUrl}/cpp/`;
            this.pyodideRoot = `${this.productionServerUrl}/pyodide/`;
        }
        // randomly pick one backup server to load balance:
        this.backupHttpServerRoot = (Math.random() >= 0.5) ? this.serverRoot : this.serverRoot;
        // Setting the endpoint
        this.setEndpoint();
    }

    public getLangSettingToBackendScript = () => this.langSettingToBackendScript;
    public getLangSettingToJsonpEndpoint = () => this.langSettingToJsonpEndpoint;
    public getLangSettingToJsonpEndpointBackup = () => this.langSettingToJsonpEndpointBackup;

    private setEndpoint = () => {
        // Main server endpoint for code execution
        this.langSettingToJsonpEndpoint = {
            '2': this.pythonRoot + 'web_exec_py2.py',
            '3': this.pythonRoot + 'web_exec_py3.py',
            'js': this.javascriptRoot + 'exec_js_jsonp',
            'ts': this.javascriptRoot + 'exec_ts_jsonp',
            'java': this.javaRoot + 'exec_java_jsonp',
            'ruby': this.rubyRoot + 'exec_ruby_jsonp',
            'c': this.cRoot + 'exec_c_jsonp',
            'cpp': this.cppRoot + 'exec_cpp_jsonp',
            'py3anaconda': this.anacondaRoot + 'exec_pyanaconda_jsonp',
            'pyodide': this.pyodideRoot + 'exec_pyodide_jsonp'
        };
        // Backup server endpoint for code execution
        this.langSettingToJsonpEndpointBackup = {
            '2': this.pythonRoot + 'web_exec_py2.py',
            '3': this.pythonRoot + 'web_exec_py3.py',
            'js': this.javascriptRoot + 'exec_js_jsonp',
            'ts': this.javascriptRoot + 'exec_ts_jsonp',
            'java': this.backupHttpServerRoot + 'exec_java_jsonp',
            'ruby': this.backupHttpServerRoot + 'exec_ruby_jsonp',
            'c': this.cRoot + 'exec_c_jsonp',
            'cpp': this.cRoot + 'exec_cpp_jsonp',
            'py3anaconda': this.backupHttpServerRoot + 'exec_pyanaconda_jsonp',
            'pyodide': this.backupHttpServerRoot + 'exec_pyodide_jsonp',
        };
        // for logging, but it will be abandoned after setting up the nginx ingress in k8s
        this.langSettingToBackendScript = {
            // backend scripts to execute (Python 2 and 3 variants, if available)
            // make two copies of ../web_exec.py and give them the following names,
            // then change the first line (starting with #!) to the proper version
            // of the Python interpreter (i.e., Python 2 or Python 3).
            // Note that your hosting provider might have stringent rules for what
            // kind of scripts are allowed to execute. For instance, my provider
            // (Webfaction) seems to let scripts execute only if permissions are
            // something like:
            // -rwxr-xr-x 1 pgbovine pgbovine 2.5K Jul  5 22:46 web_exec_py2.py*
            // (most notably, only the owner of the file should have write
            //  permissions)
            '2': 'web_exec_py2.py',
            '3': 'web_exec_py3.py',

            // empty dummy scripts just to do logging on Apache server
            'js': 'web_exec_js.py',
            'ts': 'web_exec_ts.py',
            'java': 'web_exec_java.py',
            'ruby': 'web_exec_ruby.py',
            'c': 'web_exec_c.py',
            'cpp': 'web_exec_cpp.py',
            // experimental!
            'py3anaconda': 'web_exec_py3anaconda.py',
            'pyodide': 'web_exec_pyodide.py',
        };
    }
}