from drf_yasg.utils import swagger_auto_schema, no_body
from drf_yasg import openapi


def get_paged_scheme(object_scheme):
    return openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            "count": openapi.Schema(type=openapi.TYPE_INTEGER),
            "next": openapi.Schema(type=openapi.TYPE_STRING),
            "previous": openapi.Schema(type=openapi.TYPE_STRING),
            "results": openapi.Schema(
                type=openapi.TYPE_ARRAY, 
                items=object_scheme
            )
        }
    )


testsetfilter_id_schema = openapi.Schema(
    title="TestSetFilter ID only",
    type=openapi.TYPE_ARRAY,
    items=openapi.Schema(
        type=openapi.TYPE_OBJECT, 
        properties={
            'id': openapi.Schema(type=openapi.TYPE_INTEGER, description="ID of TestSetFilter object"),
        }
    )
)

filterset_detailed_filters_array_scheme = openapi.Schema(
    type=openapi.TYPE_ARRAY, 
    items=openapi.Schema(
        type=openapi.TYPE_OBJECT, 
        properties={
            'field': openapi.Schema(type=openapi.TYPE_STRING, description="Filter field"),
            'value': openapi.Schema(type=openapi.TYPE_STRING, description="Filter value"),
    })
)

filterset_detailed_scheme = openapi.Schema(
    title="FilterSet(detailed)",
    type=openapi.TYPE_OBJECT,
    properties ={
        "id": openapi.Schema(type=openapi.TYPE_INTEGER, description="FilterSet object ID", read_only=True),
        "name": openapi.Schema(type=openapi.TYPE_STRING, description="FilterSet object name"),
        "author": openapi.Schema(type=openapi.TYPE_STRING, description="FilterSet object owner username", read_only=True),
        "filters": filterset_detailed_filters_array_scheme
    }
)

filterset_detailed_array_scheme = openapi.Schema(
    title="List of FilterSet(detailed)",
    type=openapi.TYPE_ARRAY,
    items=filterset_detailed_scheme
)

fail_barchart_param_filterset = openapi.Parameter(
    name="filterset", 
    in_=openapi.IN_QUERY,
    description="FilterSet id",
    type=openapi.TYPE_INTEGER,
    required=True
)

fail_barchart_param_date_middle = openapi.Parameter(
    name="date_middle", 
    in_=openapi.IN_QUERY,
    description="Separation date (e.g. 2022-12-03)",
    type=openapi.TYPE_STRING,
    required=False
)

fail_barchart_param_date_start = openapi.Parameter(
    name="date_start", 
    in_=openapi.IN_QUERY,
    description="Start date (e.g. 2022-12-03) to filter against; must be used with date_end",
    type=openapi.TYPE_STRING,
    required=False
)

fail_barchart_param_date_end = openapi.Parameter(
    name="date_end", 
    in_=openapi.IN_QUERY,
    description="End date (e.g. 2022-12-03) to filter against;  must be used with date_start",
    type=openapi.TYPE_STRING,
    required=False
)

fail_barchart_param_limit = openapi.Parameter(
    name="limit", 
    in_=openapi.IN_QUERY,
    description="Limit used in quering RP",
    type=openapi.TYPE_INTEGER,
    required=False
)

fail_barchart_param_fail_message_type_groups = openapi.Parameter(
    name="fail_message_type_groups", 
    in_=openapi.IN_QUERY,
    description="fail_message_type_groups ids separated by commas",
    type=openapi.TYPE_STRING,
    required=False
)