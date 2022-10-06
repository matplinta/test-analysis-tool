import axios from "axios";
import authHeader from "../auth-header";


export const getTestInstances = async () => {
    return (await axios.get('/api/tra/test_instances/', { headers: authHeader() }));
}

export const getTestInstancesByQuery = async (filter, page, pageSize) => {
    return (await axios.get('/api/tra/test_instances/by_query/?page=' + page + "&page_size=" + pageSize, { headers: authHeader() }));
}