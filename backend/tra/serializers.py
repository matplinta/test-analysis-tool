from .models import TestlineType, TestSet, TestInstance, TestRun, TestsFilter
from rest_framework import serializers


class TestSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestSet
        fields = ('id', 'name', 'test_lab_path', 'branch')


class TestInstanceSerializer(serializers.ModelSerializer):
    test_set = TestSetSerializer()

    class Meta:
        model = TestInstance
        fields = ('id', 'test_set', 'test_case_name', 'execution_suspended')

    def create(self, validated_data):
        test_set_data = validated_data.pop('test_set')
        TestSet.objects.create(**test_set_data)
        test_instance = TestInstance.objects.create(**validated_data)
        return test_instance


class TestRunSerializer(serializers.ModelSerializer):
    test_instance = TestInstanceSerializer()
    testline_type = serializers.CharField(source='testline_type.name')

    class Meta:
        model = TestRun
        fields = ('id', 'test_instance', 'testline_type', 'test_line', 'test_suite', 'organization', 
                  'result', 'env_issue_type', 'builds', 'fail_message', 'ute_exec_url', 'log_file_url', 
                  'log_file_url_ext', 'start_time', 'end_time', )


    def create(self, validated_data):
        test_instance_data = validated_data.pop('test_instance')
        TestInstance.objects.create(**test_instance_data)
        testrun = TestRun.objects.create(**validated_data)
        return testrun
#     def update(self, instance, validated_data):
#         old_status = instance.status
#         instance.counter = validated_data.get('counter', instance.counter)
#         instance.status = validated_data.get('status', instance.status)
#         if instance.status != old_status and instance.status == 'Confirmed' and instance.counter > 0:
#             instance.counter = instance.counter - 1

#         instance.ute_reservation_id = validated_data.get('ute_reservation_id', instance.ute_reservation_id)
#         instance.user = validated_data.get('user', instance.user)
#         instance.password = validated_data.get('password', instance.password)
#         instance.address = validated_data.get('address', instance.address)

#         if instance.password == "":
#             instance.password = None
#         if instance.user == "":
#             instance.user = None
#         if instance.address == "":
#             instance.address = None
#         if instance.status == "":
#             instance.status = None
#         if instance.status == "":
#             instance.status = None

#         instance.save()
#         return instance
