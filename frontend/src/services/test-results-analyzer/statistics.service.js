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
    return (await axios.post('api/tra/stats/filtersets_detailed/', filtersets, { headers: authHeader() }));
}

export const getFilterSetsDetail = async () => {
    return (await axios.get('api/tra/stats/filtersets_detailed', { headers: authHeader() }));
}

export const getMyFilterSetsDetail = async () => {
    return (await axios.get('api/tra/stats/filtersets_detailed/my/', { headers: authHeader() }));
}

export const getUserSummary = async () => {
    return (await axios.get('api/tra/summary/', { headers: authHeader() }));
}

export const deleteFilterSetsDetail = async (id) => {
    return (await axios.delete('api/tra/stats/filtersets_detailed/' + id, { headers: authHeader() }));
}

const formatDate = (date) => {
    let year = date.getFullYear();
    let month = date.getMonth();
    month = month < 9 ? `0${month + 1}` : month + 1;
    let day = date.getDate();
    day = day < 10 ? `0${day}` : day;
    return `${year}-${month}-${day}`;
}

export const getExcelFromSavedFilterSet = async (filterSetId, dates) => {
    let headers = Object.assign({}, authHeader(), { 'Content-Type': 'blob' })
    let dateFilter = null;
    dates !== null ? dateFilter = `&date_start=${formatDate(dates[0])}&date_end=${formatDate(dates[1])}` : dateFilter = "";
    return (await axios.get('api/tra/stats/get_excel' + '?filterset=' + filterSetId + dateFilter, { headers: headers }));
}

export const postToGetExcelFromTemporaryDefinedFilterSet = async (filterSet, dates) => {
    let dateFilter = null;
    dates !== null ? dateFilter = `?date_start=${formatDate(dates[0])}&date_end=${formatDate(dates[1])}` : dateFilter = "";
    return (await axios.post('api/tra/stats/get_excel' + dateFilter, filterSet, { headers: authHeader(), responseType: 'blob' }));
}

export const getChartFromSavedFilterSet = async (filterSetId, dates) => {
    console.log(dates)
    let dateFilter = null;
    dates !== null ? dateFilter = `&date_start=${formatDate(dates[0])}&date_end=${formatDate(dates[1])}` : dateFilter = "";
    return (await axios.get('api/tra/stats/fail_barchart' + '?filterset=' + filterSetId + dateFilter, { headers: authHeader() }));
}

export const postToGetChartFromTemporaryDefinedFilterSet = async (filterSet, dates) => {
    let dateFilter = null;
    dates !== null ? dateFilter = `?date_start=${formatDate(dates[0])}&date_end=${formatDate(dates[1])}` : dateFilter = "";
    return (await axios.post('api/tra/stats/fail_barchart' + dateFilter, filterSet, { headers: authHeader() }));
}