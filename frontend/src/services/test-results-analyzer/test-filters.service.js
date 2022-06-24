import axios from "axios";
import authHeader from "../auth-header";

export const getTestFilters = async (type) => {
    let url = "";
    if (type === 'all') {
        url = 'api/tra/regression_filters/';
    } else if (type === 'owned') {
        url = 'api/tra/regression_filters/owned/';
    } else if (type === 'subscribed') {
        url = 'api/tra/regression_filters/subscribed/';
    }
    return (await axios.get(url, { headers: authHeader() }));
}

export const getTestFilter = async (id) => {
    return (await axios.get('api/tra/regression_filters/' + id, { headers: authHeader() }));
}

export const postTestFilter = async (testFilter) => {
    return (await axios.post('api/tra/regression_filters/', testFilter, { headers: authHeader() }));
}

export const postTestFilterSubscribe = async (testFilterId) => {
    return (await axios.post('api/tra/regression_filters/' + testFilterId + "/subscribe/", testFilterId, { headers: authHeader() }));
}

export const postTestFilterUnsubscribe = async (testFilterId) => {
    return (await axios.post('api/tra/regression_filters/' + testFilterId + "/unsubscribe/", testFilterId, { headers: authHeader() }));
}

export const putTestFilter = async (id, testFilter) => {
    return (await axios.put('api/tra/regression_filters/' + id + '/', testFilter, { headers: authHeader() }));
}

export const deleteTestFilter = async (id) => {
    return (await axios.delete('api/tra/regression_filters/' + id, { headers: authHeader() }));
}

export const getTestSets = async () => {
    return (await axios.get('api/tra/test_sets/', { headers: authHeader() }));
}

export const postTestSet = async (testSet) => {
    return (await axios.post('api/tra/test_sets/', testSet, { headers: authHeader() }));
}

export const getTestLineTypes = async () => {
    return (await axios.get('api/tra/testline_types/', { headers: authHeader() }));
}
