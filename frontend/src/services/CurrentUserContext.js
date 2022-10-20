import React from "react";

export const CurrentUserContext = React.createContext();

const getLocalStorageItemName = () => {
    if (window.location.origin === "http://localhost:3000" || window.location.origin === "http://127.0.0.1:3000") {
        return "user_dev";
    } else {
        return "user_prod";
    }
}

export const CurrentUserProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = React.useState(null)

    const fetchCurrentUser = () => {
        let response = JSON.parse(localStorage.getItem(getLocalStorageItemName()));
        setCurrentUser(response.username);
    }

    return (
        <CurrentUserContext.Provider value={{ currentUser, fetchCurrentUser }} >
            {children}
        </CurrentUserContext.Provider>
    )
}

export const useCurrentUser = () => React.useContext(CurrentUserContext);