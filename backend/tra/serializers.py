from .models import TestlineType, TestSet, TestInstance, TestRun, TestsFilter
from rest_framework import serializers
from django.contrib.auth.models import User


class TestlineTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestlineType
        fields = ('id', 'name',)
        extra_kwargs = {
            'name': {'validators': []},
        }


class TestSetSerializer(serializers.ModelSerializer):
    branch = serializers.CharField(read_only=True)
    class Meta:
        model = TestSet
        fields = ('id', 'branch', 'name', 'test_lab_path')
        read_only_fields = ('branch',)
        extra_kwargs = {
            'name': {'validators': []},
            'test_lab_path': {'validators': []},
        }


class TestInstanceSerializer(serializers.ModelSerializer):
    test_set = TestSetSerializer()

    class Meta:
        model = TestInstance
        fields = ('id', 'test_set', 'test_case_name')
        extra_kwargs = {
            'test_set': {'validators': []},
            'test_case_name': {'validators': []},
            'execution_suspended': {'validators': []},
        }

    def create(self, validated_data):
        test_set_data = validated_data.pop('test_set')
        test_set_instance, bool = TestSet.objects.get_or_create(**test_set_data)
        test_instance_instance = TestInstance.objects.create(test_set=test_set_instance, **validated_data)
        return test_instance_instance


class TestRunSerializer(serializers.ModelSerializer):
    test_instance = TestInstanceSerializer()
    testline_type = TestlineTypeSerializer()

    class Meta:
        model = TestRun
        fields = ('id', 'test_instance', 'testline_type', 'test_line', 'test_suite', 'organization', 
                  'result', 'env_issue_type', 'builds', 'fail_message', 'ute_exec_url', 'log_file_url', 
                  'log_file_url_ext', 'start_time', 'end_time', )


    def create(self, validated_data):
        testline_type_data = validated_data.pop('testline_type')
        testline_type_instance, was_created_tl = TestlineType.objects.get_or_create(**testline_type_data)

        test_instance_data = validated_data.pop('test_instance')
        test_set_data = test_instance_data.pop('test_set')
        test_set_instance, was_created_ts = TestSet.objects.get_or_create(**test_set_data)
        test_instance_instance, was_created_ti = TestInstance.objects.get_or_create(test_set=test_set_instance, **test_instance_data)

        test_run_instance = TestRun.objects.create(testline_type=testline_type_instance, 
                                                   test_instance=test_instance_instance, **validated_data)
        return test_run_instance


    def update(self, instance, validated_data):
        test_instance_data = validated_data.pop('test_instance')
        testline_type_data = validated_data.pop('testline_type')
        validated_data['test_instance'] = instance.test_instance
        validated_data['testline_type'] = instance.testline_type 
        instance.result = validated_data.get('result', instance.result)
        instance.env_issue_type = validated_data.get('env_issue_type', instance.env_issue_type)
        instance.log_file_url_ext = validated_data.get('log_file_url_ext', instance.log_file_url_ext)
        instance.save()
        return instance



class TestsFilterSerializer(serializers.ModelSerializer):
    test_set = TestSetSerializer()
    testline_type = TestlineTypeSerializer()
    user = serializers.CharField(read_only=True, default=serializers.CurrentUserDefault())
    # user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), default=serializers.CurrentUserDefault())


    class Meta:
        model = TestsFilter
        fields = ('id', 'name', 'user', 'test_set', 'testline_type', )
        read_only_fields = ('user',)
        extra_kwargs = {
            'test_set': {'validators': []},
        }


    def create(self, validated_data):
        testline_type_data = validated_data.pop('testline_type')
        test_set_data = validated_data.pop('test_set')
        testline_type_instance, was_created_tl = TestlineType.objects.get_or_create(**testline_type_data)
        test_set_instance, bool = TestSet.objects.get_or_create(**test_set_data)
        tests_filter_instance = TestsFilter.objects.create(test_set=test_set_instance,
                                                           testline_type=testline_type_instance, **validated_data)
        return tests_filter_instance

    def update(self, instance, validated_data):
        testline_type_data = validated_data.pop('testline_type')
        test_set_data = validated_data.pop('test_set')
        testline_type_instance, bool = TestlineType.objects.get_or_create(**testline_type_data)
        test_set_instance, bool = TestSet.objects.get_or_create(**test_set_data)
        instance.test_set = test_set_instance
        instance.testline_type = testline_type_instance
        instance.save()
        return instance