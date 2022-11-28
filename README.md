# OPT Lite

[Online Python Tutor](https://pythontutor.com/) (OPT) is a popular virtual learning tool that provides interactive visualisation of program execution in a browser without login. However, such a tool is not easy to maintain because serving allowing the public to run programs in a server without login incurs high computational cost in addition to security risks. 

This project makes OPT serverless, i.e., usuable offline without a server. Python programs are run by the browser using [pyodide](https://pyodide.org). Hence, teachers can enable more python packages/functions than the original setup without worrying about network attacks. For online exam, students may also use the tool to debug programs without worry of network outage. It can also run in [Safe Exam Browser](https://safeexambrowser.org/).

## How to use

Simply visit 

> https://dive4dec.github.io/optlite/

The live edit mode is at

> https://dive4dec.github.io/optlite/live.html

Programs can be shared using permalinks

- [System information and available modules](https://dive4dec.github.io/optlite/live.html#code=from%20sys%20import%20*%0Ahelp%28%22modules%22%29&curInstr=2&mode=display&origin=opt-live.js&py=pyodide&rawInputLstJSON=%5B%5D)
- [Enumerate subsets](https://dive4dec.github.io/optlite/live.html#code=import%20functools%0A%0A%0A%40functools.lru_cache%0Adef%20combination%28n,%20k%29%3A%0A%20%20%20%20output%20%3D%20%5B%5D%0A%20%20%20%20if%200%20%3C%3D%20k%20%3C%3D%20n%3A%0A%20%20%20%20%20%20%20%20if%20k%20%3D%3D%200%3A%0A%20%20%20%20%20%20%20%20%20%20%20%20output.append%28set%28%29%29%0A%20%20%20%20%20%20%20%20else%3A%0A%20%20%20%20%20%20%20%20%20%20%20%20output.extend%28combination%28n%20-%201,%20k%29%29%0A%20%20%20%20%20%20%20%20%20%20%20%20output.extend%28%7B*s,%20n%20-%201%7D%20for%20s%20in%20combination%28n%20-%201,%20k%20-%201%29%29%0A%20%20%20%20return%20output%0A%0An%20%3D%203%0Apowersets%20%3D%20%5Bcombination%283,%20k%29%20for%20k%20in%20range%284%29%5D&curInstr=142&mode=display&origin=opt-live.js&py=pyodide&rawInputLstJSON=%5B%5D)
- [Recursion for Fibonacci](https://dive4dec.github.io/optlite/#code=import%20functools%0A%0A%23pythontutor_skip%3A%20argument_string%0Adef%20argument_string%28*args,%20**kwargs%29%3A%0A%20%20%20%20%22%22%22Return%20the%20string%20representation%20of%20the%20list%20of%20arguments.%22%22%22%0A%20%20%20%20return%20%22%28%7B%7D%29%22.format%28%22,%20%22.join%28%5B*%5B%22%7B!r%7D%22.format%28v%29%20for%20v%20in%20args%5D,*%5B%22%7B%7D%3D%7B!r%7D%22.format%28k,%20v%29%20for%20k,%20v%20in%20kwargs.items%28%29%5D%5D%29%29%0A%0Adef%20print_function_call%28f%29%3A%0A%20%20%20%20%22%22%22Decorate%20a%20recursive%20function%20to%20print%20the%20call%20stack.%22%22%22%0A%20%20%20%20%40functools.wraps%28f%29%20%20%23%20give%20wrapper%20the%20identity%20of%20f%20and%20more%0A%20%20%20%20def%20wrapper%28*args,%20**kwargs%29%3A%0A%20%20%20%20%20%20%20%20nonlocal%20count,%20depth%0A%20%20%20%20%20%20%20%20count%20%2B%3D%201%0A%20%20%20%20%20%20%20%20depth%20%2B%3D%201%0A%20%20%20%20%20%20%20%20call%20%3D%20%22%7B%7D%7B%7D%22.format%28f.__name__,%20argument_string%28*args,%20**kwargs%29%29%0A%20%20%20%20%20%20%20%20print%28%22%7B%3A%3E3%7D%3A%7B%7D%7B%7D%22.format%28count,%20%22%7C%22%20*%20depth,%20call%29%29%0A%20%20%20%20%20%20%20%20value%20%3D%20f%28*args,%20**kwargs%29%20%20%23%20calls%20f%0A%20%20%20%20%20%20%20%20depth%20-%3D%201%0A%20%20%20%20%20%20%20%20if%20depth%20%3D%3D%20-1%3A%0A%20%20%20%20%20%20%20%20%20%20%20%20print%28%22Done%22%29%0A%20%20%20%20%20%20%20%20%20%20%20%20count%20%3D%200%0A%20%20%20%20%20%20%20%20return%20value%0A%0A%20%20%20%20count,%20depth%20%3D%200,%20-1%0A%20%20%20%20return%20wrapper%20%20%23%20return%20the%20decorated%20function%0A%20%20%20%20%0A%40print_function_call%0Adef%20fibonacci%28n%29%3A%0A%20%20%20%20return%20fibonacci%28n%20-%201%29%20%2B%20fibonacci%28n%20-%202%29%20if%20n%20%3E%201%20else%201%20if%20n%20%3D%3D%201%20else%200&mode=edit&origin=opt-frontend.js&rawInputLstJSON=%5B%5D&testCasesJSON=%5B%22assert%20fibonacci%280%29%20%3D%3D%200%22,%22assert%20fibonacci%281%29%20%3D%3D%201%22,%22assert%20fibonacci%282%29%20%3D%3D%201%22,%22assert%20fibonacci%283%29%20%3D%3D%202%22,%22assert%20fibonacci%284%29%20%3D%3D%203%22,%22assert%20fibonacci%285%29%20%3D%3D%205%22%5D)

## Create a custom site

Git clone the current repository by running

```
git clone https://github.com/dive4dec/optlite
```

Setup a python environment. In the root folder of the repository, run the following to create the python wheel file under `dist` folder.

```
pip install -r optlite/requirements.txt
python setup.py bdist_wheel -d dist
```

Setup [NodeJs]. Install the required packages as

```
npm install
npm run build:prod
```

Serve the content in `build` directory using an http server, e.g.:

```
python -m simple.http -d build
```

To install addition packages, take a look at the OptLite object at
- [`runner.ts`](js/pyodide/runner.ts)
- [`global.ts`](js/pyodide/global.ts)

E.g., to install `snowballstemmer`, modify the `script` tag in the header of `build/index.html` to

```
<script>
OptLite = {
  packages: ['snowballstemmer']
};

(function () {
  let script = document.createElement('script');
  script.src = 'visualize.bundle.js';
  script.defer = true;
  document.head.appendChild(script);
}) ();
</script>
```

and modify the `script` tag in the header of `build/live.html` to

```
<script>
OptLite = {
  packages: ['snowballstemmer']
};

(function () {
  let script = document.createElement('script');
  script.src = 'opt-live.bundle.js';
  script.defer = true;
  document.head.appendChild(script);
}) ();
</script>
```



