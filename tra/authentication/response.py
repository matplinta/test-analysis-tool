from django.http.response import JsonResponse

__all__ = [
    'Response'
]


class Response(object):

    @staticmethod
    def success(msg=None, **additional_data):
        data = {"status": "success"}
        if msg is not None:
            data['msg'] = msg
        if additional_data:
            data.update(additional_data)
        return JsonResponse(data)

    @staticmethod
    def fail(cause):
        return JsonResponse({"status": "fail", "msg": cause})

    @staticmethod
    def error(cause):
        return JsonResponse({"status": "error", "msg": cause})
