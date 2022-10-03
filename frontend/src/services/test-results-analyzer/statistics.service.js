// Description: File is responsible creating services to interact with backend API
// HISTORY
// --------------------------------------------------------------------------
//   Date                    Author                     Bug                 List of changes
//  --------------------------------------------------------------------------

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

export const postFilterSetsDetail = async (filtersets) => {
    return (await axios.post('/api/tra/stats/filtersets_detailed/', filtersets, { headers: authHeader() }));
}

export const getFilterSetsDetail = async () => {
    return (await axios.get('api/tra/stats/filtersets_detailed', { headers: authHeader() }));
}
export const getUserSummary = async () => {
    return (await axios.get('api/tra/summary/', { headers: authHeader() }));
}