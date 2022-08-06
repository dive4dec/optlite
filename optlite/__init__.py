import io, json
from . import pg_logger
from ._version import __version__


def exec_script(code):
    def jsonp(request, dictionary):
        if (request):
            return "%s(%s)" % (request, dictionary)
        return dictionary

    def json_finalizer(input_code, output_trace):
        ret = dict(code=input_code, trace=output_trace)
        json_output = json.dumps(ret, indent=None)
        out_s.write(json_output)

    out_s = io.StringIO()
    pg_logger.exec_script_str_local(code,
                                    None,
                                    False,
                                    False,
                                    json_finalizer,
                                    allow_all_modules=True)
    return jsonp(False, out_s.getvalue())