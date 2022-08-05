import axios from "axios";
import authHeader from "../auth-header";

export const getTestSetFilters = async (type) => {
    let url = "";
    if (type === 'all') {
        url = 'api/tra/test_set_filters/';
    } else if (type === 'owned') {
        url = 'api/tra/test_set_filters/owned/';
    } else if (type === 'subscribed') {
        url = 'api/tra/test_set_filters/subscribed/';
    }
    return (await axios.get(url, { headers: authHeader() }));
}

export const getTestSetFilter = async (id) => {
    return (await axios.get('api/tra/test_set_filters/' + id, { headers: authHeader() }));
}

export const postTestSetFilter = async (testFilter) => {
    return (await axios.post('api/tra/test_set_filters/', testFilter, { headers: authHeader() }));
}

export const postTestSetFilterSubscribe = async (testFilterId) => {
    return (await axios.post('api/tra/test_set_filters/' + testFilterId + "/subscribe/", testFilterId, { headers: authHeader() }));
}

export const postTestSetFilterUnsubscribe = async (testFilterId) => {
    return (await axios.post('api/tra/test_set_filters/' + testFilterId + "/unsubscribe/", testFilterId, { headers: authHeader() }));
}

export const putTestSetFilter = async (id, testFilter) => {
    return (await axios.put('api/tra/test_set_filters/' + id + '/', testFilter, { headers: authHeader() }));
}

export const deleteTestSetFilter = async (id) => {
    return (await axios.delete('api/tra/test_set_filters/' + id, { headers: authHeader() }));
}

export const getTestLineTypes = async () => {
    return (await axios.get('api/tra/testline_types/', { headers: authHeader() }));
}
