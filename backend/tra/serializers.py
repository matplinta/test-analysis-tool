from unittest import TestResult
from .models import (
    FailMessageTypeGroup,
    Organization, 
    TestRunResult, 
    TestlineType, 
    TestSetFilter, 
    TestInstance, 
    TestRun, 
    Branch,
    EnvIssueType, 
    FailMessageType,
    FeatureBuild
)
from rest_framework import serializers
from django.contrib.auth.models import User
from backend.serializers import UserSerializer


class FailMessageTypeSerializer(serializers.ModelSerializer):
    author = serializers.CharField(read_only=True, default=serializers.CurrentUserDefault())
    class Meta:
        model = FailMessageType
        fields = ('id', 'name', 'regex', 'author', 'description', 'env_issue_type')
        extra_kwargs = {
            'name': {'validators': []},
            'regex': {'validators': []},
        }


class FailMessageTypeGroupROSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()
    author = serializers.CharField(source="author.username")

    class Meta:
        model = FailMessageTypeGroup
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
                  'result', 'env_issue_type', 'comment', 'builds', 'fail_message', 'ute_exec_url', 'log_file_url', 
                  'log_file_url_ext', 'start_time', 'end_time', 'analyzed', 'analyzed_by')
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
    testline_type = serializers.CharField(source='testline_type.name')
    fail_message_type_groups = FailMessageTypeGroupROSerializer(many=True)
    owners = UserSerializer(many=True)
    subscribers = UserSerializer(many=True)


    class Meta:
        model = TestSetFilter
        fields = ('id', 'limit', 'test_set_name', 'test_lab_path', 'branch', 'testline_type', 'owners', 'subscribers', 'fail_message_type_groups',)
        # read_only_fields = ('owners', 'subscribers',)
        extra_kwargs = {
            'fail_message_type_groups': {'validators': []},
            'owners': {'validators': []},
            'subscribers': {'validators': []},
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
        testline_type_data = validated_data.pop('testline_type')
        fail_message_type_groups_data = validated_data.pop('fail_message_type_groups')
        owners_data = validated_data.pop('owners')
        subscribers_data = validated_data.pop('subscribers')

        testline_type_instance = TestlineType.objects.get(**testline_type_data)
        regression_filter_instance = TestSetFilter.objects.create(testline_type=testline_type_instance,
                                                                  **validated_data)
        
        fmtgs = [FailMessageTypeGroup.objects.get(**fmtg) for fmtg in fail_message_type_groups_data]
        owners = [User.objects.get(**owner) for owner in owners_data]
        subscribers = [User.objects.get(**subscriber) for subscriber in subscribers_data]
        regression_filter_instance.owners.add(*owners)
        regression_filter_instance.subscribers.add(*subscribers)
        regression_filter_instance.fail_message_type_groups.add(*fmtgs)
        return regression_filter_instance


    def update(self, instance, validated_data):
        instance.test_set_name = validated_data.pop('test_set_name')
        _ = validated_data.pop('branch')
        testline_type_data = validated_data.pop('testline_type')
        testline_type_instance = TestlineType.objects.get(**testline_type_data)
        instance.testline_type = testline_type_instance

        fail_message_type_groups_data = validated_data.pop('fail_message_type_groups')
        owners_data = validated_data.pop('owners')
        subscribers_data = validated_data.pop('subscribers')

        fmtgs = [FailMessageTypeGroup.objects.get(**fmtg) for fmtg in fail_message_type_groups_data]
        owners = [User.objects.get(**owner) for owner in owners_data]
        subscribers = [User.objects.get(**subscriber) for subscriber in subscribers_data]

        instance.fail_message_type_groups.set(fmtgs)
        instance.owners.set(owners)
        instance.subscribers.set(subscribers)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
