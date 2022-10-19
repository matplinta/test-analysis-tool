import { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Link } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useUserMessages } from '../../services/UserMessagesContext';
import { deleteUserMessage } from '../../services/test-results-analyzer/user.service';
import Notify, { AlertTypes, Errors, Successes } from '../../services/Notify';
import './MessagesComponent.css';

const MessagesComponent = () => {

    // const [messages, setMessages] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const { messages, fetchUserMessages, updateUserMessages } = useUserMessages();

    let markAsReadMessage = (selMsg) => {
        if (selMsg !== null && selMsg.read === false) {
            selMsg.read = true
            updateUserMessages(selMsg)
        }
    } 

    const deleteMessageAndRefresh = (id) => {
        deleteUserMessage(id).then(
            (response) => {
                fetchUserMessages();
            },
            (error) => {
                Notify.sendNotification(Errors.DELETE_USER_MESSAGE, AlertTypes.error);
            }
        )
    }

    
    useEffect(() => {
        fetchUserMessages();
    }, [])

    useEffect(() => {
        markAsReadMessage(selectedMessage);
    }, [selectedMessage])

    const rowClass = (data) => {
        return {
            'row-unread': data.read === false
        }
    }

    let deleteButton = (rowData) => {
        return (
            <Button icon="pi pi-times" className="p-button-danger p-button-rounded" onClick={() => deleteMessageAndRefresh(rowData.id)} >
            </Button>
        )
    }

    let readIcon = (rowData) => {
        if (rowData.read === true) {
            return (
                <i className="pi pi-check mx-3"></i>
            )
        }
        else {
            return (
                <i className="pi pi-circle-fill mx-3" style={{ color: 'var(--blue-500)', fontSize: '1.2rem' }}></i>
            );
        }
    }

    let dateBodyTemplate = (rowData) => {
        return <span>{rowData.date.replace('T', ' ').replace('Z', '')}</span>
    }

    return (
        <>
            <div className="datatable-msgs m-5">
            <div className="card">
                <DataTable value={messages} rowClassName={rowClass} responsiveLayout="scroll" selectionMode="single" selection={selectedMessage} onSelectionChange={e => setSelectedMessage(e.value)}>
                    <Column body={readIcon} header="Read"></Column>
                    <Column body={dateBodyTemplate} header="Date"></Column>
                    <Column field="message" header="Message" style={{width: '80%'}}></Column>
                    <Column body={deleteButton} header="Delete"></Column>
                </DataTable>
            </div>
        </div>
        </>
    )
}

export default MessagesComponent;