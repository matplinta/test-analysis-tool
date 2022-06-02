import axios from "axios";
import authHeader from "../auth-header";

export const getTestFilters = async (type) => {
    let url = "";
    if (type === 'all') {
        url = 'api/regression_filters/';
    } else if (type === 'owned') {
        url = 'api/regression_filters/owned/';
    } else if (type === 'subscribed') {
        url = 'api/regression_filters/subscribed/';
    }
    return (await axios.get(url, { headers: authHeader() }));
}

export const postTestFilter = async (testFilter) => {
    return (await axios.post('api/regression_filters/', testFilter, { headers: authHeader() }));
}

export const deleteTestFilter = async (id) => {
    return (await axios.delete('api/regression_filters/' + id, { headers: authHeader() }));
}

export const getTestSets = async () => {
    return (await axios.get('api/test_sets/', { headers: authHeader() }));
}

export const postTestSet = async (testSet) => {
    return (await axios.post('api/test_sets/', testSet, { headers: authHeader() }));
}

export const getTestLineTypes = async () => {
    return (await axios.get('api/testline_types/', { headers: authHeader() }));
}
