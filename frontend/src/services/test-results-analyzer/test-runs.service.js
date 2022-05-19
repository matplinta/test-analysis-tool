import axios from "axios";
import authHeader from "../auth-header";

export const getTestRuns = async (page) => {
    return (await axios.get('api/test_runs/?page=' + page, { headers: authHeader() }));
}

export const getTestRunsUsingFilter = async (filter, page, pageSize) => {
    return (await axios.get('api/test_runs/by_query/?page=' + page + "&page_size=" + pageSize + "&" + filter, { headers: authHeader() }));
}

export const getTestRunsFilters = async () => {
    return (await axios.get('api/test_runs/dist_fields_values/', { headers: authHeader() }));
}