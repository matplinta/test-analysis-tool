import React from "react";
import { getUserMessages, setUserMessage } from '../services/test-results-analyzer/user.service';
import Notify, { AlertTypes, Successes, Infos, Errors, Warnings } from '../services/Notify.js';


export const UserMessagesContext = React.createContext();

export const UserMessagesProvider = ({ children }) => {
    const [messages, setMessages] = React.useState(null)

    const fetchUserMessages = () => {
        getUserMessages().then(
            (response) => {
                setMessages(response.data);

            },
            (error) => {
                Notify.sendNotification(Errors.FETCH_USER_MESSAGES, AlertTypes.error);
            }
        )
    }

    const updateUserMessages = (data) => {
        setUserMessage(data.id, data).then(
            (response) => {
                fetchUserMessages()

            },
            (error) => {
                Notify.sendNotification(Errors.UPDATE_USER_MESSAGE, AlertTypes.error);
            }
        )
    }

    return (
        <UserMessagesContext.Provider value={{ messages, fetchUserMessages, updateUserMessages}} >
            {children}
        </UserMessagesContext.Provider>
    )
}

export const useUserMessages = () => React.useContext(UserMessagesContext);