from django.test import TestCase
from rep_portal.api import *
from django.conf import settings
from time import time


class GetDataTestCase(TestCase):
    def setUp(self):
        self.auth_params = {"token": None, "user": settings.RP_USER, "passwd": settings.RP_PASSWORD, "debug": settings.DEBUG}
        self.organization = "RAN_L2_SW_KRK_2_SG02"
        self.filters = {
        "result": "not analyzed",
        "testline_type": "CLOUD_5G_I_LO_AP_LO_SANSA_FS_ECPRI_CMWV_TDD",
        "test_set": "5GC002175-QB",
        "test_lab_path": "Root\Test_Sets\Trunk\RAN_L2_SW_KRK_2\\5GC002175_Spillover_from_SA_Mobility_(5GC000704_5GC000708)"
    }


    def test_get_data_from_testruns(self):
        test_runs_data, _ = RepPortal(**self.auth_params).get_data_from_testruns(limit=100, filters=self.filters)
        assert len(test_runs_data) != 0


    # def test_api_get_throttle_handler(self):
    #     then = time()
    #     for i in range(100):
    #         test_runs_data, _ = RepPortal(**self.auth_params).get_data_from_testruns(filters=self.filters)
    #     now = time()
    #     print(now - then)

    #     assert now - then > 60


    def test_get_data_from_testinstances(self):
        results, _ = RepPortal(**self.auth_params).get_data_from_testinstances(test_lab_path=self.filters["test_lab_path"])
        assert len(results) == 7

    
    def test_get_test_instances_for_present_feature_build_with_specified_status(self):
        results = RepPortal(**self.auth_params).get_test_instances_for_present_feature_build_with_specified_status(organization=self.organization, status="no_run")
        assert len(results) >= 0
        results = RepPortal(**self.auth_params).get_test_instances_for_present_feature_build_with_specified_status(organization=self.organization, status="passed")
        assert len(results) >= 0
        results = RepPortal(**self.auth_params).get_test_instances_for_present_feature_build_with_specified_status(organization=self.organization, status="total")
        assert len(results) > 0


class PostDataTestCase(TestCase):
    def setUp(self):
        self.auth_params = {"token": None, "user": settings.RP_USER, "passwd": settings.RP_PASSWORD, "debug": settings.DEBUG}


    def test_analyze_testruns(self):
        resp, url, data = RepPortal(**self.auth_params).analyze_testruns(runs=[70132157], comment="Testing", common_build="SBTS22R2_ENB_0000_001564_000013", result="environment issue", env_issue_type="Other")
        assert resp.status_code == 200
        assert bool(url) is True
        assert bool(data) is True

    # def test_api_post_throttle_handler(self):
    #     then = time()
    #     for i in range(65):
    #         resp, url, data = RepPortal(**self.auth_params).analyze_testruns(runs=["70132157"], comment="Testing", common_build="SBTS22R2_ENB_0000_001564_000013", result="environment issue", env_issue_type="Other")
    #         assert resp.status_code == 200
    #         assert bool(url) is True
    #         assert bool(data) is True
    #     now = time()
    #     print(now - then)
    #     assert now - then > 60

    def test_set_suspension_status_for_test_instances(self):
        resp, url, data = RepPortal(**self.auth_params).set_suspension_status_for_test_instances(ti_ids=[19587705], suspend_status=True)
        assert resp.status_code == 202
        assert bool(url) is True
        assert bool(data) is True
