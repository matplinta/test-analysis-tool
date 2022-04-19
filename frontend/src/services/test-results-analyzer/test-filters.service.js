import axios from "axios";
import API_URL from '../../server-settings';
import authHeader from "../auth-header";

export const getTestFilters = async () => {
    return (await axios.get(API_URL + 'api/regression_filters/', { headers: authHeader() }));
}

export const postTestFilter = async (testFilter) => {
    return (await axios.post(API_URL + 'api/regression_filters/', testFilter, { headers: authHeader() }));
}

export const deleteTestFilter = async (id) => {
    return (await axios.delete(API_URL + 'api/regression_filters/' + id, { headers: authHeader() }));
}

export const getTestSets = async () => {
    return (await axios.get(API_URL + 'api/test_sets/', { headers: authHeader() }));
}

export const postTestSet = async (testSet) => {
    return (await axios.post(API_URL + 'api/test_sets/', testSet, { headers: authHeader() }));
}

export const getTestLineTypes = async () => {
    return (await axios.get(API_URL + 'api/testline_types/', { headers: authHeader() }));
}

