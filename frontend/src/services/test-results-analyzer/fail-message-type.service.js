import axios from "axios";
import authHeader from "../auth-header";

export const getFailMessageTypes = async () => {
    return (await axios.get('api/fail_message_types/', { headers: authHeader() }));
}

export const postFailMessageType = async (failMessageType) => {
    return (await axios.post('api/fail_message_types/', failMessageType, { headers: authHeader() }));
}

export const getEnvIssueTypes = async () => {
    return (await axios.get('api/env_issue_types/', { headers: authHeader() }));
}

export const getFailMessageTypeGroups = async () => {
    return (await axios.get('api/fail_message_type_groups/', { headers: authHeader() }));
}