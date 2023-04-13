// Description: File is responsible for sending requests for backend relate to test instances objects
// HISTORY
// --------------------------------------------------------------------------
//   Date                    Author                     Bug                 List of changes
//  --------------------------------------------------------------------------

import axios from "axios";
import authHeader from "../auth-header";


export const getTestInstances = async () => {
    return (await axios.get('/api/tra/test_instances/', { headers: authHeader() }));
}

export const triggerSyncTestInstancesSuspendData = async () => {
    return (await axios.get('/api/tra/celery/sync_suspension_status_of_test_instances_by_all_testset_filters/', { headers: authHeader() }));
}

export const getTestInstancesByQuery = async (lazyParams) => {

    let page = "page=" + lazyParams.page;

    let page_size = "&page_size=" + lazyParams.rows;

    let filterParams = "";
    for (const [key, value] of Object.entries(lazyParams.filters)) {
        if (value.value !== null && value.value !== "" && value.value !== undefined) {
            filterParams += "&" + key + "=" + value.value;
        }
    }
    let sortParams = "";
    if (lazyParams.sortField !== null && lazyParams.sortOrder !== null) {
        sortParams = sortParams += "&ordering=" + (lazyParams.sortOrder === -1 ? "-" : "") + lazyParams.sortField;
    }

    return (await axios.get('/api/tra/test_instances/by_query/?' + page + page_size + sortParams + filterParams, { headers: authHeader() }));
}


export const postSetSuspensionStatusOnTestInstances = async (testInstances, suspendStatus) => {
    return (await axios.post('api/tra/test_instances/set_suspension_status/', {rp_ids: testInstances, suspend: suspendStatus}, { headers: authHeader() }));
}

export const postSyncSuspensionStatusFromRP = async (testInstances) => {
    return (await axios.post('api/tra/test_instances/sync_suspension_status_by_ti_ids/', {rp_ids: testInstances}, { headers: authHeader() }));
}