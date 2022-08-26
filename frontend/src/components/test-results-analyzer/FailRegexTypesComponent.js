// Description: File is responsible for managing fail message type regexes
// HISTORY
// --------------------------------------------------------------------------
//   Date                    Author                     Bug                 List of changes
//  --------------------------------------------------------------------------

import { useState, useEffect, useRef } from 'react';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { FiSettings } from 'react-icons/fi';
import { FaRegTrashAlt } from 'react-icons/fa';
import { confirmDialog } from 'primereact/confirmdialog';

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
        fetchTestSetFilters();
    }

    let fetchTestSetFilters = () => {
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
            <Button className="p-button-primary p-button-sm" style={{ padding: '8px', height: '35px' }} onClick={() => editFailMessage(rowData)} disabled={!rowData.author.includes(currentUser)}>
                <FiSettings size='20' />
            </Button>

        );
    }

    let removeButton = (rowData) => {
        return (
            <Button className="p-button-primary p-button-sm" style={{ padding: '8px', height: '35px' }} onClick={() => confirmRemove(rowData)} disabled={!rowData.author.includes(currentUser)}>
                <FaRegTrashAlt size='20' />
            </Button>

        );
    }


    useEffect(() => {
        fetchCurrentUser();
        fetchTestSetFilters();
    }, [])

    return (
        <>
            <Button style={{ marginLeft: '5px', marginTop: '5px', fontWeight: 'bold' }} className="p-button-primary p-button-color p-button-sm" onClick={handleFormShow}>Add Fail Message Regex</Button>
            <DataTable value={failRegexTypes} stripedRows responsiveLayout="scroll" showGridlines dataKey="id"
                size="small" className="table-style"
                filters={filters} filterDisplay="row" loading={loading}
                globalFilterFields={['name', 'regex', 'author', 'description']}
                emptyMessage="No fail message types found."
                scrollHeight="calc(100vh - 230px)"
                resizableColumns columnResizeMode="fit">
                < Column field="name" header="Name" sortable filter filterPlaceholder="Search by name" style={{ width: '20%' }} ></Column >
                <Column field="regex" header="Regex" sortable filter filterPlaceholder="Search by regex" style={{ width: '35%' }} ></Column>
                <Column field="env_issue_type" header="Env Issue Type" sortable filter filterPlaceholder="Search by env issue tye" style={{ width: '15%' }} ></Column>
                <Column field="author" header="Author" sortable filter filterPlaceholder="Search by author" style={{ width: '15%' }}  ></Column>
                <Column field="description" header="Description" sortable filter filterPlaceholder="Search by description" style={{ width: '15%' }} ></Column>
                <Column body={editButton} header="Edit" style={{ textAlign: "center", minWidth: "60px" }} />
                <Column body={removeButton} header="Remove" style={{ textAlign: "center", minWidth: "60px" }} />
            </DataTable >

            <FailMessageTypeAddModal failMessageToEdit={failMessageToEdit} showForm={showForm} handleFormClose={handleTestSetFormCloseAndRefresh} handleFormShow={handleFormShow} />
        </>
    )
}

export default FailRegexTypesComponent;