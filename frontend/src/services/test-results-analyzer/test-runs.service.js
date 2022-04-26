import axios from "axios";
import API_URL from '../../server-settings';
import authHeader from "../auth-header";

export const getTestRuns = async (page) => {
    return (await axios.get(API_URL + 'api/test_runs/?page=' + page, { headers: authHeader() }));
}

export const getTestRunsUsingFilter = async (filter, page) => {
    return (await axios.get(API_URL + 'api/test_runs/by_query/?page=' + page + "&" + filter, { headers: authHeader() }));
}

export const getTestRunsFilters = async () => {
    return (await axios.get(API_URL + 'api/test_runs/dist_fields_values/', { headers: authHeader() }));
}