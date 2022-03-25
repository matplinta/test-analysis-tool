from .models import TestlineType, TestSet, TestInstance, TestRun, TestsFilter
from rest_framework import serializers


class TestlineTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestlineType
        fields = ('id', 'name',)
        extra_kwargs = {
            'name': {'validators': []},
        }


class TestSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestSet
        fields = ('id', 'name', 'test_lab_path')
        read_only_fields = ['branch']
        extra_kwargs = {
            'name': {'validators': []},
            'test_lab_path': {'validators': []},
        }


class TestInstanceSerializer(serializers.ModelSerializer):
    test_set = TestSetSerializer()

    class Meta:
        model = TestInstance
        fields = ('id', 'test_set', 'test_case_name', 'execution_suspended')
        extra_kwargs = {
            'test_set': {'validators': []},
            'test_case_name': {'validators': []},
            'execution_suspended': {'validators': []},
        }

    def create(self, validated_data):
        test_set_data = validated_data.pop('test_set')
        test_set_serializer = TestSetSerializer(data=test_set_data)
        test_set_serializer.is_valid(raise_exception=True)
        validated_data['test_set'] = test_set_serializer.save()
        instance = super().create(validated_data)
        return instance



class TestRunSerializer(serializers.ModelSerializer):
    # test_instance = TestInstanceSerializer()
    testline_type = TestlineTypeSerializer()

    class Meta:
        model = TestRun
        # fields = ('id', 'test_instance', 'testline_type', 'test_line', 'test_suite', 'organization', 
        fields = ('id', 'testline_type', 'test_line', 'test_suite', 'organization', 
                  'result', 'env_issue_type', 'builds', 'fail_message', 'ute_exec_url', 'log_file_url', 
                  'log_file_url_ext', 'start_time', 'end_time', )


    def create(self, validated_data):
        # # test_instance_data = validated_data.pop('test_instance')
        # testline_type_data = validated_data.pop('testline_type')
        # # test_instance_serializer = TestInstanceSerializer(data=test_instance_data)
        # testline_type_serializer = TestlineTypeSerializer(data=testline_type_data)
        # # test_instance_serializer.is_valid(raise_exception=True)
        # testline_type_serializer.is_valid(raise_exception=True)
        # # validated_data['test_instance'] = test_instance_serializer.save()
        # validated_data['testline_type'] = testline_type_serializer.save()
        # instance = TestRun.objects.create(**validated_data)
        testline_type_data = validated_data.pop('testline_type')
        testline_type_instance, bool = TestlineType.objects.get_or_create(**testline_type_data)
        test_run_instance = TestRun.objects.create(testline_type=testline_type_instance, **validated_data)
        return test_run_instance


    def update(self, instance, validated_data):
        # test_instance_data = validated_data.pop('test_instance')
        testline_type_data = validated_data.pop('testline_type')
        # validated_data['test_instance'] = instance.test_instance_data 
        validated_data['testline_type'] = instance.testline_type 
        instance.result = validated_data.get('result', instance.result)
        instance.env_issue_type = validated_data.get('env_issue_type', instance.env_issue_type)
        instance.log_file_url_ext = validated_data.get('log_file_url_ext', instance.log_file_url_ext)
        instance.save()
        return instance
