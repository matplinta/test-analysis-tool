import axios from "axios";
import authHeader from "../auth-header";

export const getUserMessages = async () => {
    return (await axios.get('api/tra/notifications/', { headers: authHeader() }));
}
export const setUserMessage = async (id, message) => {
    return (await axios.put('api/tra/notifications/' + id + '/', message, { headers: authHeader() }));
}
export const deleteUserMessage = async (id) => {
    return (await axios.delete('api/tra/notifications/' + id + '/', { headers: authHeader() }));
}
