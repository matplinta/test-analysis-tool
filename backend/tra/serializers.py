from django.contrib.auth.models import User
from rest_framework import serializers

from backend.serializers import UserSerializer
from .models import (Branch, EnvIssueType, FailMessageType,
                     FailMessageTypeGroup, FeatureBuild, LastPassingLogs,
                     Notification, Organization, TestInstance, TestlineType,
                     TestRun, TestRunResult, TestSetFilter)
from . import utils


class NotificationSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source="user.username", read_only=True)
    class Meta:
        model = Notification
        fields = ('id', 'message', 'read', 'user', 'date')

class FailMessageTypeSerializer(serializers.ModelSerializer):
    author = serializers.CharField(read_only=True, default=serializers.CurrentUserDefault())
    class Meta:
        model = FailMessageType
        fields = ('id', 'name', 'regex', 'author', 'description', 'env_issue_type')


class FailMessageTypeGroupROSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()
    author = UserSerializer(read_only=True)

    class Meta:
        model = FailMessageTypeGroup
        read_only_fields = ('author', 'name')
        fields = ('id', 'name', 'author')


class FailMessageTypeGroupSerializer(serializers.ModelSerializer):
    author = serializers.CharField(read_only=True, default=serializers.CurrentUserDefault())
    fail_message_types = FailMessageTypeSerializer(many=True)
    class Meta:
        model = FailMessageTypeGroup
        fields = ('id', 'name', 'fail_message_types', 'author')

    def create(self, validated_data):
        fail_message_types_data = validated_data.pop('fail_message_types')
        fail_message_type_group_instance = FailMessageTypeGroup.objects.create(**validated_data)
        for elem in fail_message_types_data:
            fail_message_type_instance = FailMessageType.objects.get(**elem)
            fail_message_type_group_instance.fail_message_types.add(fail_message_type_instance)
        return fail_message_type_group_instance

    def update(self, instance, validated_data):
        fail_message_types_data = validated_data.pop('fail_message_types')
        fmts = [FailMessageType.objects.get(**fmt) for fmt in fail_message_types_data]
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        instance.fail_message_types.set(fmts)
        return instance

class LastPassingLogsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LastPassingLogs
        fields = ('id', 'utecloud_run_id', 'location', 'url', 'size', 'build', 'airphone', )

class FeatureBuildSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureBuild
        fields = ('name',)


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ('name',)


class TestRunResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestRunResult
        fields = ('name',)


class TestlineTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestlineType
        fields = ('name',)
        extra_kwargs = {
            'name': {'validators': []}
        }


class EnvIssueTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnvIssueType
        fields = ('name',)



class TestSetSerializer(serializers.ModelSerializer):
    branch = serializers.CharField(source="branch.name", read_only=True)
    class Meta:
        model = TestSetFilter
        fields = ('id', 'branch', 'test_set_name', 'test_lab_path')
        read_only_fields = ('branch',)
        extra_kwargs = {
            'test_set_name': {'validators': []},
            'test_lab_path': {'validators': []},
        }


class TestInstanceSerializer(serializers.ModelSerializer):
    test_set = TestSetSerializer()
    last_passing_logs = LastPassingLogsSerializer(read_only=True)
    organization = serializers.CharField(source='organization.name')
    # pass_ratio = serializers.SerializerMethodField()
    pass_ratio = serializers.IntegerField(read_only=True)

    class Meta:
        model = TestInstance
        fields = ('id', 'rp_id', 'test_set', 'testline_type', 'test_case_name', 'last_passing_logs',
                  'organization', 'no_run_in_rp', 'execution_suspended', 'test_entity', 'pass_ratio',)
        read_only_fields = ('last_passing_logs', 'pass_ratio', )
        extra_kwargs = {
            'test_set': {'validators': []},
            'test_case_name': {'validators': []},
            'execution_suspended': {'validators': []},
        }

    # def get_pass_ratio(self, obj):
    #     all_trs = obj.test_runs.count()
    #     passing_trs = obj.test_runs.filter(result=utils.get_passed_result_instance()).count()
    #     if passing_trs == 0:
    #         return 0
    #     else:
    #         return round((passing_trs/all_trs) * 100)

    def create(self, validated_data):
        test_set_data = validated_data.pop('test_set')
        test_set_instance = TestSetFilter.objects.get(**test_set_data)
        test_instance_instance = TestInstance.objects.create(test_set=test_set_instance, **validated_data)
        return test_instance_instance


class TestRunSerializer(serializers.ModelSerializer):
    test_instance = TestInstanceSerializer()
    testline_type = serializers.CharField(source='testline_type.name')
    organization = serializers.CharField(source='organization.name')
    result = serializers.CharField(source='result.name')
    env_issue_type = serializers.CharField(source='env_issue_type.name')
    fb = serializers.CharField(read_only=True, source='fb.name')
    analyzed_by = serializers.CharField(read_only=True, default=serializers.CurrentUserDefault())

    class Meta:
        model = TestRun
        fields = ('id', 'rp_id', 'fb', 'test_instance', 'testline_type', 'test_line', 'test_suite', 'organization',
                  'result', 'env_issue_type', 'comment', 'builds', 'airphone', 'fail_message', 'ute_exec_url', 'log_file_url',
                  'log_file_url_ext', 'start_time', 'end_time', 'analyzed', 'analyzed_by', 'exec_trigger', 'execution_id', 'pronto')
        read_only_fields = ('analyzed', )


    def create(self, validated_data):
        testline_type_data = validated_data.pop('testline_type')
        testline_type_instance, _ = TestlineType.objects.get_or_create(**testline_type_data)

        organization_data = validated_data.pop('organization')
        organization_instance, _ = Organization.objects.get_or_create(**organization_data)

        result_data = validated_data.pop('result')
        result_instance, _ = TestRunResult.objects.get_or_create(**result_data)

        env_issue_type_data = validated_data.pop('env_issue_type')
        env_issue_type_instance, _ = EnvIssueType.objects.get_or_create(**env_issue_type_data)

        test_instance_data = validated_data.pop('test_instance')
        test_set_data = test_instance_data.pop('test_set')
        test_set_instance = TestSetFilter.objects.get(**test_set_data)
        test_instance_instance, _ = TestInstance.objects.get_or_create(test_set=test_set_instance, **test_instance_data)

        test_run_instance = TestRun.objects.create(testline_type=testline_type_instance,
                                                   test_instance=test_instance_instance,
                                                   organization=organization_instance,
                                                   result=result_instance,
                                                   env_issue_type=env_issue_type_instance,
                                                   **validated_data)
        return test_run_instance


    def update(self, instance, validated_data):
        result_data = validated_data.pop('result')
        env_issue_type_data = validated_data.pop('env_issue_type')
        result_instance, _ = TestRunResult.objects.get_or_create(**result_data)
        env_issue_type_instance, _ = EnvIssueType.objects.get_or_create(**env_issue_type_data)
        instance.result = result_instance
        instance.env_issue_type = env_issue_type_instance
        instance.log_file_url_ext = validated_data.get('log_file_url_ext', instance.log_file_url_ext)
        instance.analyzed = validated_data.get('analyzed', instance.analyzed)
        instance.analyzed_by = validated_data.get('analyzed_by', instance.analyzed_by)
        instance.comment = validated_data.get('comment', instance.comment)
        instance.save()
        return instance


class TestSetFilterSerializer(serializers.ModelSerializer):
    testline_types = TestlineTypeSerializer(many=True)
    fail_message_type_groups = FailMessageTypeGroupROSerializer(many=True)
    owners = UserSerializer(many=True)
    subscribers = UserSerializer(many=True)


    class Meta:
        model = TestSetFilter
        fields = ('id', 'limit', 'test_set_name', 'test_lab_path', 'branch', 'testline_types', 'owners', 'subscribers', 'fail_message_type_groups',)
        # read_only_fields = ('owners', 'subscribers',)
        extra_kwargs = {
            'fail_message_type_groups': {'validators': []},
            'owners': {'validators': []},
            'subscribers': {'validators': []},
            'testline_types': {'validators': []},  #TODO handle testline_types validation
        }

    def validate_owners(self, value):
        try:
            owners = [User.objects.get(**owner) for owner in value]
            if len(owners) == 0:
                raise serializers.ValidationError(f"Owners field must not be empty: there must be at least one owner for TestSetFilter")
        except User.DoesNotExist:
            raise serializers.ValidationError(f"Specified owner does not exist")
        return value


    def create(self, validated_data):
        testline_types_data = validated_data.pop('testline_types')
        fail_message_type_groups_data = validated_data.pop('fail_message_type_groups')
        owners_data = validated_data.pop('owners')
        subscribers_data = validated_data.pop('subscribers')

        tsfilter_instance = TestSetFilter.objects.create(**validated_data)

        testline_types = [TestlineType.objects.get(**ttd) for ttd in testline_types_data]
        fmtgs = [FailMessageTypeGroup.objects.get(**fmtg) for fmtg in fail_message_type_groups_data]
        owners = [User.objects.get(**owner) for owner in owners_data]
        subscribers = [User.objects.get(**subscriber) for subscriber in subscribers_data]
        tsfilter_instance.testline_types.add(*testline_types)
        tsfilter_instance.owners.add(*owners)
        tsfilter_instance.subscribers.add(*subscribers)
        tsfilter_instance.fail_message_type_groups.add(*fmtgs)
        return tsfilter_instance


    def update(self, instance, validated_data):
        instance.test_set_name = validated_data.pop('test_set_name')
        _ = validated_data.pop('branch', None)
        testline_types_data = validated_data.pop('testline_types')
        fail_message_type_groups_data = validated_data.pop('fail_message_type_groups')
        owners_data = validated_data.pop('owners')
        subscribers_data = validated_data.pop('subscribers')

        testline_types = [TestlineType.objects.get(**ttd) for ttd in testline_types_data]
        fmtgs = [FailMessageTypeGroup.objects.get(**fmtg) for fmtg in fail_message_type_groups_data]
        owners = [User.objects.get(**owner) for owner in owners_data]
        subscribers = [User.objects.get(**subscriber) for subscriber in subscribers_data]


        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        instance.testline_types.set(testline_types)
        instance.fail_message_type_groups.set(fmtgs)
        instance.owners.set(owners)
        instance.subscribers.set(subscribers)

        return instance
