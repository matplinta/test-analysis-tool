import axios from "axios";
import authHeader from "./auth-header";
import Notify, { AlertTypes, Successes, Errors, Infos } from './Notify';

const getLocalStorageItemName = () => {
    if (window.location.origin === "http://localhost:3000" || window.location.origin === "http://127.0.0.1:3000") {
        return "user_dev";
    } else {
        return "user_prod";
    }
}

const login = async (username, password) => {
    const response = await axios.post("api-auth/login/", { username, password });
    if (response.data.key) {
        let valueToSave = response.data;
        valueToSave.username = username;

        localStorage.setItem(getLocalStorageItemName(), JSON.stringify(valueToSave));

    }
    return response.data;
}

const logout = async () => {
    await axios.post("api-auth/logout/", {}, { headers: authHeader() }).then(
        (response) => {
            Notify.sendNotification(Successes.LOGOUT, AlertTypes.success);
        },
        (error) => {
            // Notify.sendNotification(Errors.LOGOUT, AlertTypes.error);
        }
    )
    localStorage.removeItem(getLocalStorageItemName());
}

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem(getLocalStorageItemName()));
}

const checkUserLoggedIn = () => {
    let user = localStorage.getItem(getLocalStorageItemName());
    return user ? true : false;
}

const getUsers = async () => {
    return (await axios.get('api/users/', { headers: authHeader() }));
}

const AuthService = {
    login,
    logout,
    getCurrentUser,
    checkUserLoggedIn,
    getUsers
}

export default AuthService;