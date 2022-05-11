import axios from "axios";

const login = (username, password) => {
    return axios.post("api-auth/login/", { username, password })
        .then(response => {
            if (response.data.key) {
                let valueToSave = response.data;
                valueToSave.username = username;
                localStorage.setItem("user", JSON.stringify(valueToSave));
            }
            return response.data;
        })
}

const logout = () => {
    localStorage.removeItem("user")
    document.cookie = "sessionid= ; expires = Thu, 01 Jan 1970 00:00:00 GMT"
}

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem("user"));
}

const checkUserLoggedIn = () => {
    let user = localStorage.getItem("user");
    return user ? true : false;
}

const AuthService = {
    login,
    logout,
    getCurrentUser,
    checkUserLoggedIn
}

export default AuthService;