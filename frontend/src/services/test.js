import axios from "axios";
import API_URL from '../server-settings';
import authHeader from "./auth-header";

export const getTest = () => {
    return axios.get(API_URL + 'test/', {headers: authHeader()});
}