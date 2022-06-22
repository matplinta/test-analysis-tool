import React from "react";

import getCurrentUser from './/auth.service';

export const CurrentUserContext = React.createContext();

export const CurrentUSerProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = React.useState(null)

    const fetchCurrentUser = async () => {
        let response = getCurrentUser();
        setCurrentUser(response);
    }

    return (
        <CurrentUserContext.Provider value={{ currentUser, fetchCurrentUser }} >
            {children}
        </CurrentUserContext.Provider>
    )
}

export const useCurrentUser = () => React.useContext(CurrentUserContext);