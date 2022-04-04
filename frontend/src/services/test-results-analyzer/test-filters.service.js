import axios from "axios";
import API_URL from '../../server-settings';
import authHeader from "../auth-header";

export const getTestFilters = async () => {
    return (await axios.get(API_URL + 'api/tests_filters/', {headers: authHeader()}));
}

export const getTestSets = async () => {
    return (await axios.get(API_URL + 'api/test_sets/', {headers: authHeader()}));
}

export const getTestLineTypes = async () => {
    return (await axios.get(API_URL + 'api/testline_types/', {headers: authHeader()}));
}

export const deleteTestFilter = async (id) => {
    return (await axios.delete(API_URL + 'api/tests_filters/' + id, {headers: authHeader()}));
}