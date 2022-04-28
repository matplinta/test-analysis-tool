import axios from "axios";
import authHeader from "./auth-header";

export const getTest = () => {
    return axios.get('test/', { headers: authHeader() });
}