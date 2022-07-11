from django.shortcuts import render
from rep_portal.api import RepPortal
from rest_framework import generics
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.decorators import action
from .serializers import FilterSerializer, FilterSetSerializer, FilterFieldSerializer, FilterSerializerListOnly

from .permissions import IsAuthorOfRelatedObject
from backend.permissions import IsAuthorOfObject
from stats.models import * 
import tra.models as tra_models
from tra.views import TestRunsBasedOnQueryDictinctValues
from stats.analyzer import Analyzer
from datetime import date, datetime
from itertools import chain



class ListFiltersWithFilterSetView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)   
    serializer_class = FilterSerializerListOnly

    def get_queryset(self):
        filterset_id = self.kwargs['filterset_id']
        filter_set = FilterSet.objects.get(pk=filterset_id)
        queryset = Filter.objects.all()
        return queryset.filter(filter_set=filter_set)


class FilterSetView(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)   
    serializer_class = FilterSetSerializer
    queryset = FilterSet.objects.all()

    @action(detail=False, url_path="my")
    def user_is_owner(self, request):
        filtersets = FilterSet.objects.all().filter(author=self.request.user)
        page = self.paginate_queryset(filtersets)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(filtersets, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_permissions(self):
        permissions = [permission() for permission in self.permission_classes]
        if self.request.method in ['PUT', 'DELETE']:
            return permissions + [IsAuthorOfObject()]
        return permissions



class FilterSetDetailView(APIView):
    def get(self, request, filterset_id=None):
        def serialize_data_with_filters(filtersets):
            all = []
            for filterset in filtersets:
                filters = Filter.objects.filter(filter_set=filterset)
                serialized_filters = FilterSerializerListOnly(filters, many=True).data
                serialized_data = FilterSetSerializer(filterset).data
                serialized_data["filters"] = serialized_filters
                all.append(serialized_data)
            return all

        if filterset_id:
            filtersets = FilterSet.objects.filter(pk=filterset_id)
        else:
            filtersets = FilterSet.objects.all()
        return Response(serialize_data_with_filters(filtersets))

    


class FilterView(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = FilterSerializer
    queryset = Filter.objects.all()
    pagination_class = None

    def get_permissions(self):
        permissions = [permission() for permission in self.permission_classes]
        if self.request.method in ['POST', 'PUT', 'DELETE']:
            return permissions + [IsAuthorOfRelatedObject()]
        return permissions


class FilterFieldView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)   
    serializer_class = FilterFieldSerializer
    queryset = FilterField.objects.all()
    pagination_class = None


class GetDataForFailChartBase(APIView):
    permission_classes = (IsAuthenticated,)   

    def _handle_filterset_id_in_request(self, request):
        filterset = request.query_params.get("filterset", None)
        return int(filterset) if filterset else filterset

    def _handle_dates_in_request(self, request):
        date_middle = request.query_params.get("date_middle", None)
        date_start = request.query_params.get("date_start", None)
        date_end = request.query_params.get("date_end", None)
        dates_keys = ["date_middle", "date_start", "date_end"]
        dates_values = [date_middle, date_start, date_end]
        dates = {}
        for date_key, date_str in zip(dates_keys, dates_values):
            if date_str:
                dates[date_key] = datetime.strptime(date_str, "%Y-%m-%d").date()
        return dates

    def parse_filters_and_fmtgs(self, filterset_id):
        filter_set = FilterSet.objects.get(pk=filterset_id)
        filters_by_filterset = Filter.objects.filter(filter_set=filter_set)
        filters = {filter.field.name: filter.value for filter in filters_by_filterset}
        fmtgs = filters.pop("fail_message_type_groups", [])
        if fmtgs:
            fmtgs = [int(value) for value in fmtgs.split(",")]
        return filters, fmtgs

    def parse_failmessagetypes(self, ids_list):
        querysets = []
        for _id in ids_list:
            fail_message_type_group = tra_models.FailMessageTypeGroup.objects.get(id=_id)
            querysets.append(fail_message_type_group.fail_message_types.all())

        fail_message_types = list(chain(*querysets))
        fail_message_dict = {fm_type.regex: fm_type.name for fm_type in fail_message_types}
        return fail_message_dict

    def get_filters_and_failmessagetypes_from_post_data(self):
        data = self.request.data
        filters = data["filters"]
        fmtgs = data["fail_message_type_groups"]
        fail_message_dict = self.parse_failmessagetypes(ids_list=fmtgs)
        return fail_message_dict, filters

    def init_analyzer_and_get_chart_data(self, fail_message_dict, filters):
        dates = self._handle_dates_in_request(self.request)
        analyzer = Analyzer(fail_message_dict, filters)
        analyzer.get_data_from_rp()
        if dates:
            data = analyzer.plot_runs_by_exception_types_by_date_ranges(**dates)
        else:
            data = analyzer.plot_runs_by_exception_types(plot=False)
        return data

    def download_df_csv_data(self):
        return self.df.to_csv()


class GetChartForFailAnalysis(GetDataForFailChartBase):

    def get(self, request):
        filterset_id = self._handle_filterset_id_in_request(self.request)
        if not filterset_id:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        filters, fmtgs = self.parse_filters_and_fmtgs(filterset_id)
        fail_message_dict = self.parse_failmessagetypes(ids_list=fmtgs)
        data = self.init_analyzer_and_get_chart_data(fail_message_dict, filters)
        return Response(data)

    def post(self, request):
        fail_message_dict, filters = self.get_filters_and_failmessagetypes_from_post_data()
        data = self.init_analyzer_and_get_chart_data(fail_message_dict, filters)
        return Response(data)


class GetFailChartForUsersAllSubscribedRegFilters(GetDataForFailChartBase, TestRunsBasedOnQueryDictinctValues):
    def _handle_limit_in_request(self, request):
        return request.query_params.get("limit", None)

    def prepare_failmessagetypes_for_users_all_subs_regfilters(self, request):
        fmtgs = request.query_params.get("fail_message_type_groups", [])
        if fmtgs:
            fmtgs = [int(value) for value in fmtgs.split(",")]
        return self.parse_failmessagetypes(ids_list=fmtgs), fmtgs

    def prepare_filters_for_users_all_subs_regfilters(self):
        def _parse_branches(branches):
            branches_new = []
            for branch in branches:
                if branch.lower() == "trunk":
                    branches_new.append("SBTS00")
                else:
                    branches_new.append(f"SBTS{branch}")
            return branches_new

        fields_dict = self.get_distinct_values_based_on_subscribed_regfilters()
        test_sets =      [elem["pk"] for elem in fields_dict["test_set_name"]]
        testline_types = [elem["pk"] for elem in fields_dict["testline_type"]]
        branches =       [elem["pk"] for elem in fields_dict["branch"]]
        branches = _parse_branches(branches)
        results = ["environment issue", "not analyzed"]

        return {
            "test_set": ",".join(test_sets),
            "testline_type": ",".join(testline_types),
            "builds": ",".join(branches),
            "result": ",".join(results)
        }

    def handle_creation_or_update_of_users_allsubs_filterset(self, filters):
        user_allsubs_filterset_name = f"AUTOGEN-SUBS-REGFILTERS: {self.request.user.username}"
        user_allsubs_filterset, created = FilterSet.objects.get_or_create(name=user_allsubs_filterset_name, author=self.request.user)
        for key, value in filters.items():
            key = FilterField.objects.get(name=key)
            obj, created = Filter.objects.update_or_create(field=key, value=value, filter_set=user_allsubs_filterset)


    def get(self, request):
        fail_message_dict, _fmtgs = self.prepare_failmessagetypes_for_users_all_subs_regfilters(request)
        limit = self._handle_limit_in_request(request)
        filters = self.prepare_filters_for_users_all_subs_regfilters()
        if _fmtgs:
            filters["fail_message_type_groups"] = ",".join([str(s) for s in _fmtgs])
        if limit:
            filters["limit"] = limit
        self.handle_creation_or_update_of_users_allsubs_filterset(filters)
        filters.pop('fail_message_type_groups', None)
        data = self.init_analyzer_and_get_chart_data(fail_message_dict, filters)
        return Response(data)




