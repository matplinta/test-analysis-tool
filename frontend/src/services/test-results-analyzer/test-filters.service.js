import axios from "axios";
import API_URL from '../../server-settings';
import authHeader from "../auth-header";

export const getTestFilters = async () => {
    return (await axios.get(API_URL + 'api/tests_filters/', {headers: authHeader()}));
}