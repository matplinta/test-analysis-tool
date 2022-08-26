import axios from "axios";
import authHeader from "../auth-header";

export const getFailMessageTypes = async () => {
    return (await axios.get('api/tra/fail_message_types/', { headers: authHeader() }));
}

export const postFailMessageType = async (failMessageType) => {
    return (await axios.post('api/tra/fail_message_types/', failMessageType, { headers: authHeader() }));
}

export const putFailMessageType = async (id, failMessageType) => {
    return (await axios.put('api/tra/fail_message_types/' + id + '/', failMessageType, { headers: authHeader() }));
}

export const getEnvIssueTypes = async () => {
    return (await axios.get('api/tra/env_issue_types/', { headers: authHeader() }));
}

export const getFailMessageTypeGroups = async (group) => {
    if (group === undefined)
        return (await axios.get('api/tra/fail_message_type_groups/', { headers: authHeader() }));
    else
        return (await axios.get('api/tra/fail_message_type_groups/' + group, { headers: authHeader() }));
}

export const postFailMessageTypeGroup = async (failMessageTypeGroup) => {
    return (await axios.post('api/tra/fail_message_type_groups/', failMessageTypeGroup, { headers: authHeader() }));
}

export const deleteFailMessageTypeRegex = async (id) => {
    return (await axios.delete('api/tra/fail_message_types/' + id, { headers: authHeader() }));
}