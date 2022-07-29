// Interface of Host Language
export interface HostLanguage {
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
            'pyodide': this.pyodideRoot + 'exec_pyodide_jsonp'
        };
        // Backup server endpoint for code execution
        this.langSettingToJsonpEndpointBackup = {
            'pyodide': this.backupHttpServerRoot + 'exec_pyodide_jsonp',
        };
        
        this.langSettingToBackendScript = {
            'pyodide': 'web_exec_pyodide.py',
        };
    }
}