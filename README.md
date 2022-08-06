# OPT Lite

[Online Python Tutor](https://pythontutor.com/) (OPT) is a popular virtual learning tool that provides interactive visualisation of program execution in a browser without login. However, such a tool is not easy to maintain because serving allowing the public to run programs in a server without login incurs high computational cost in addition to security risks. 

This project makes OPT serverless, i.e., usuable offline without a server. Python programs are run by the browser using [pyodide](https://pyodide.org). Teachers can enable more python packages/functions than the original setup without worring about network attacks. For online exam, students may also use the tool to debug programs without worry of network outage. 

The project is in development phase. Using it in production without understanding the source code is *not recommended*.