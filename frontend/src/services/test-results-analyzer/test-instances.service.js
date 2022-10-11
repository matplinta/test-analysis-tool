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