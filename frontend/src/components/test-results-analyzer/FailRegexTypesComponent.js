// Description: File is responsible for managing fail message type regexes
// HISTORY
// --------------------------------------------------------------------------
//   Date                    Author                     Bug                 List of changes
//  --------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { FilterMatchMode } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { FaRegTrashAlt, FaEdit } from 'react-icons/fa';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { MdAddCircle } from 'react-icons/md';

import FailMessageTypeAddModal from './FailMessageTypeAddModal';

import { getFailMessageTypes, deleteFailMessageTypeRegex } from '../../services/test-results-analyzer/fail-message-type.service';
import { useCurrentUser } from '../../services/CurrentUserContext';
import Notify, { AlertTypes, Successes, Errors } from '../../services/Notify';


const FailRegexTypesComponent = () => {

    const [failRegexTypes, setFailRegexTypes] = useState();

    const [filters, setFilters] = useState({
        'name': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'regex': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'author': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'env_issue_type': { value: null, matchMode: FilterMatchMode.CONTAINS },
        'description': { value: null, matchMode: FilterMatchMode.CONTAINS }
    })

    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);

    const handleFormClose = () => setShowForm(false);

    const handleFormShow = () => setShowForm(true);

    const [failMessageToEdit, setFailMessageToEdit] = useState(null);

    const { currentUser, fetchCurrentUser } = useCurrentUser();

    const handleTestSetFormCloseAndRefresh = () => {
        handleFormClose();
        fetchFailMessageTypes();
    }

    let fetchFailMessageTypes = () => {
        getFailMessageTypes().then(
            (response) => {
                setFailRegexTypes(response.data);
                setLoading(false);
            },
            (error) => {
                setLoading(false);
            }
        )
    }

    let editFailMessage = (failMessage) => {
        setFailMessageToEdit(failMessage);
        handleFormShow();
    }

    const confirmRemove = (rawData) => {
        confirmDialog({
            message: '\nAre you sure you want to remove Fail Message Regex?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => removeFailMessage(rawData.id)
        });
    };

    let removeFailMessage = (id) => {
        deleteFailMessageTypeRegex(id).then(
            (response) => {
                Notify.sendNotification(Successes.REMOVE_FAIL_MESSAGE_REGEX, AlertTypes.success);
                let failMessageRegexList = [...failRegexTypes].filter(failRegex => failRegex.id !== id);
                setFailRegexTypes(failMessageRegexList)
            },
            (error) => {
                Notify.sendNotification(Errors.REMOVE_FAIL_MESSAGE_REGEX, AlertTypes.error);
            }
        )
    }

    let editButton = (rowData) => {
        return (
            <Button className="p-button-warning p-button-sm" style={{ padding: '8px', height: '35px' }} onClick={() => editFailMessage(rowData)} disabled={!rowData.author.includes(currentUser)}>
                <FaEdit size='20' />
            </Button>

        );
    }

    let removeButton = (rowData) => {
        return (
            <Button className="p-button-danger p-button-sm" style={{ padding: '8px', height: '35px' }} onClick={() => confirmRemove(rowData)} disabled={!rowData.author.includes(currentUser)}>
                <FaRegTrashAlt size='20' />
            </Button>
        );
    }


    useEffect(() => {
        fetchCurrentUser();
        fetchFailMessageTypes();
    }, [])

    return (
        <>
            <Button style={{ marginLeft: '5px', marginTop: '5px', fontWeight: 'bold' }} className="p-button-success p-button-sm" onClick={handleFormShow}>
                <MdAddCircle size='20' />
                <span style={{ marginLeft: '5px' }}>Add Fail Message Regex</span>
            </Button>
            <DataTable value={failRegexTypes} stripedRows responsiveLayout="scroll" showGridlines dataKey="id"
                size="small" className="table-style"
                filters={filters} filterDisplay="row" loading={loading}
                globalFilterFields={['name', 'regex', 'author', 'description']}
                emptyMessage="No fail message types found."
                scrollHeight="calc(100vh - 150px)"
                resizableColumns columnResizeMode="fit">
                <Column field="name" header="Name" sortable filter showFilterMenuOptions={false} showClearButton={false} style={{ width: '20%' }} ></Column >
                <Column field="regex" header="Regex" sortable filter showFilterMenuOptions={false} showClearButton={false} style={{ width: '35%' }} ></Column>
                <Column field="env_issue_type" header="Env Issue Type" sortable filter showFilterMenuOptions={false} showClearButton={false} style={{ width: '15%' }} ></Column>
                <Column field="author" header="Author" sortable filter showFilterMenuOptions={false} showClearButton={false} style={{ width: '15%' }}  ></Column>
                <Column field="description" header="Description" sortable filter showFilterMenuOptions={false} showClearButton={false} style={{ width: '15%' }} ></Column>
                <Column body={editButton} header="Edit" style={{ textAlign: "center", minWidth: "60px" }} />
                <Column body={removeButton} header="Remove" style={{ textAlign: "center", minWidth: "60px" }} />
            </DataTable >

            <FailMessageTypeAddModal failMessageToEdit={failMessageToEdit} showForm={showForm} handleFormClose={handleTestSetFormCloseAndRefresh} handleFormShow={handleFormShow} />

            <ConfirmDialog />
        </>
    )
}

export default FailRegexTypesComponent;