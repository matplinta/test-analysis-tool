import axios from "axios";
import authHeader from "../auth-header";

export const getTestRuns = async (page) => {
    return (await axios.get('api/tra/test_runs/?page=' + page, { headers: authHeader() }));
}

export const getTestRunsUsingFilter = async (filter, page, pageSize) => {
    return (await axios.get('api/tra/test_runs/by_query/?page=' + page + "&page_size=" + pageSize + "&" + filter, { headers: authHeader() }));
}

export const schedulePullOfTestRunsDataByTestSetFilters = async (testsetfilter_ids) => {
    return (await axios.get(`api/tra/celery/pull_testruns_by_testsetfilters?testsetfilters=${testsetfilter_ids}`, { headers: authHeader() }));
}

export const getTestRunsFilters = async () => {
    return (await axios.get('api/tra/test_runs/dist_fields_values/', { headers: authHeader() }));
}

export const postTestRun = async (analyzedObiect) => {
    return (await axios.post('api/tra/test_runs/analyze_to_rp/', analyzedObiect, { headers: authHeader() }));
}
