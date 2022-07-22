import axios from "axios";
import authHeader from "../auth-header";

export const getFilterFields = async () => {
    return (await axios.get('api/tra/stats/filter_fields', { headers: authHeader() }));
}

export const getFilterSets = async () => {
    return (await axios.get('api/tra/stats/filtersets', { headers: authHeader() }));
}

export const postFilters = async (filters) => {
    return (await axios.post('api/tra/stats/filters/', filters, { headers: authHeader() }));
}