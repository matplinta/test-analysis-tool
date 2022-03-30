import axios from "axios";

const API_URL = "http://localhost:8000/";

const login = (username, password) => {
    return axios.post(API_URL + "login/", {username, password})
        .then(response => {
            if(response.data.key) {
                let valueToSave = response.data;
                valueToSave.username = username;
                localStorage.setItem("user", JSON.stringify(valueToSave));
            }
            return response.data;
    })
}

const logout = () => {
    localStorage.removeItem("user")
}

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem("user"));
}

const isUserLoggedIn = () => {
    let user = localStorage.getItem("user");
    return user ? true : false; 
}

const AuthService = {
    login,
    logout,
    getCurrentUser,
    isUserLoggedIn
}

export default AuthService;