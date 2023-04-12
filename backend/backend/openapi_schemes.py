from drf_yasg import openapi
from drf_yasg.utils import no_body, swagger_auto_schema


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

testsetfilter_branchoff_schema = openapi.Schema(
    title="TestSetFilters params for branchoff",
    type=openapi.TYPE_OBJECT,
    properties ={
        "new_branch": openapi.Schema(type=openapi.TYPE_STRING, description="FilterSet object ID"),
        "unsubscribe": openapi.Schema(type=openapi.TYPE_BOOLEAN, description="Denotes if migrated(old) TestSetFilters should be unsubscribed after performing branchoff to new ones"),
        "delete": openapi.Schema(type=openapi.TYPE_BOOLEAN, description="Denotes if migrated(old) TestSetFilters should be deleted after performing branchoff to new ones"),
        "testsetfilters": testsetfilter_id_schema
    }
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

limit_rp = openapi.Parameter(
    name="limit", 
    in_=openapi.IN_QUERY,
    description="RP API get limit",
    type=openapi.TYPE_INTEGER,
    required=False
)

testsetfilters_param = openapi.Parameter(
    name="testsetfilters", 
    in_=openapi.IN_QUERY,
    description="TestSetFilter ids sparated by commas",
    type=openapi.TYPE_STRING,
    required=True
)

task_id_param = openapi.Parameter(
    name="taskid", 
    in_=openapi.IN_QUERY,
    description="celery taskid UUID",
    type=openapi.TYPE_STRING,
    required=True
)

celery_task_ids_list = openapi.Schema(
    title="List of Celery TaskIds UUID",
    type=openapi.TYPE_ARRAY,
    items=task_id_param
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


fail_barchart_response_scheme = openapi.Schema(
    title="FailBarchart",
    type=openapi.TYPE_OBJECT,
    properties={
        "labels": openapi.Schema(
            type=openapi.TYPE_ARRAY, 
            items=openapi.Schema(type=openapi.TYPE_STRING)
        ),
        "Occurrences": openapi.Schema(
            type=openapi.TYPE_ARRAY, 
            items=openapi.Schema(type=openapi.TYPE_INTEGER)
        ),
        "info": openapi.Schema(type=openapi.TYPE_STRING, description="Data range")
    }
)


excel_response_scheme = openapi.Schema(
    title="Excel",
    type=openapi.FORMAT_BINARY,
)

rp_ids_scheme = openapi.Schema(
    type=openapi.TYPE_ARRAY, 
    description="List of ids of test_instances from reporting portal",
    items=openapi.Schema(
        type=openapi.TYPE_INTEGER, 
        description="Id of test_instance from reporting portal")
)


testrun_analyze_schema = openapi.Schema(
    title="AnalyzeToRP",
    type=openapi.TYPE_OBJECT,
    properties ={
        "rp_ids": rp_ids_scheme,
        "comment": openapi.Schema(type=openapi.TYPE_STRING, description="Comment"),
        "result": openapi.Schema(type=openapi.TYPE_STRING, description="Result: passed or failed"),
        "env_issue_type": openapi.Schema(type=openapi.TYPE_STRING, description="EnvIssueType name")
    }
)


testinstance_suspend_schema = openapi.Schema(
    title="SuspendTestInstanceToRP",
    type=openapi.TYPE_OBJECT,
    properties ={
        "rp_ids": rp_ids_scheme,
        "suspend": openapi.Schema(type=openapi.TYPE_BOOLEAN, description="Suspend status (true or false)")
    }
)


testinstance_sync_by_ids_schema = openapi.Schema(
    title="SyncSuspendInfoFromRPByTestInstanceIds",
    type=openapi.TYPE_OBJECT,
    properties ={
        "rp_ids": rp_ids_scheme
    }
)


by_testset_filter_param = openapi.Parameter(
    name="tsfid", 
    in_=openapi.IN_QUERY,
    description="TestSetFilter id",
    type=openapi.TYPE_INTEGER,
    required=True
)
