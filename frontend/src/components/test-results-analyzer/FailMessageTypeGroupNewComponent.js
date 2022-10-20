// Description: File is responsible for managing fail message group objects
// HISTORY
// --------------------------------------------------------------------------
//   Date                    Author                     Bug                 List of changes
//  --------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { FaEdit, FaRegTrashAlt } from 'react-icons/fa';
import { MdAddCircle } from 'react-icons/md';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { DataTable } from 'primereact/datatable';
import { AiOutlineLink } from 'react-icons/ai';
import { MdContentCopy } from 'react-icons/md';

import { useCurrentUser } from '../../services/CurrentUserContext';
import { getFailMessageTypeGroups, deleteFailMessageTypeRegexGroup } from '../../services/test-results-analyzer/fail-message-type.service';

import "./FailMessageTypeGroupComponent.css";
import FailMessageGroupAddModal from './FailMessageGroupAddModal';
import Notify, { AlertTypes, Errors, Successes } from '../../services/Notify';

let FailMessageTypeGroupComponent = () => {

    const [failMessageTypeGroups, setFailMessageTypeGroups] = useState();
    const [selectedFailMessageTypeGroup, setSelectedFailMessageTypeGroup] = useState(null);
    const [selectedRegexList, setSelectedRegexList] = useState([]);

    const [failMessageGroupToEdit, setFailMessageGroupToEdit] = useState(null);
    const [failMessageGroupToCopy, setFailMessageGroupToCopy] = useState(null);

    const [lastRemovedFailMessageGroupId, setLastRemovedFailMessageGroupId] = useState(null);

    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const handleFormClose = () => setShowForm(false);
    const handleFormShow = () => setShowForm(true);

    const { currentUser, fetchCurrentUser } = useCurrentUser();

    let { group } = useParams();

    const navigate = useNavigate();

    let fetchFailMessageGroups = () => {
        getFailMessageTypeGroups(group).then(
            (response) => {
                let responseData;
                // create one element array if data requested for single 
                Array.isArray(response.data) ? responseData = response.data : responseData = [response.data];
                setFailMessageTypeGroups(responseData);

                // for singe regex group in url
                if (!Array.isArray(response.data)) {
                    setSelectedFailMessageTypeGroup(responseData[0]);
                    setSelectedRegexList(responseData[0].fail_message_types);
                }
                // for edit regex group
                else if (responseData.length > 0 && failMessageGroupToEdit !== null && lastRemovedFailMessageGroupId === null) {
                    let selectedGroup = responseData.filter(group => group.id === failMessageGroupToEdit.id)[0];
                    setSelectedFailMessageTypeGroup(selectedGroup);
                    setSelectedRegexList(selectedGroup.fail_message_types);
                }
                // for new regex group
                else if (responseData.length > 0 && lastRemovedFailMessageGroupId === null) {
                    let selectedGroup = responseData[responseData.length - 1];
                    setSelectedFailMessageTypeGroup(selectedGroup);
                    setSelectedRegexList(selectedGroup.fail_message_types);
                }

                else {
                    setLastRemovedFailMessageGroupId(null);
                    setSelectedFailMessageTypeGroup(null);
                    setSelectedRegexList([]);
                }
                setLoading(false);
            },
            (error) => {
                setLoading(false);
                Notify.sendNotification(Errors.FETCH_FAIL_MESSAGE_GROUPS_LIST, AlertTypes.error);
            }
        )
    }

    const handleFormCloseAndRefresh = () => {
        handleFormClose();
        setFailMessageGroupToEdit(null);
        setFailMessageGroupToCopy(null);
        fetchFailMessageGroups();
        navigate('../../fail-regex-groups');
    }

    let editFailMessageGroup = (rowData) => {
        setFailMessageGroupToEdit(rowData);
        handleFormShow();
    }

    let copyFailMessageGroup = (rowData) => {
        handleFormShow();
        setFailMessageGroupToCopy(rowData);
    }

    const confirmRemove = (rowData) => {
        confirmDialog({
            message: '\nAre you sure you want to remove Fail Message Regex Group?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => removeFailMessageGroup(rowData.id)
        });
    };

    let removeFailMessageGroup = (id) => {
        deleteFailMessageTypeRegexGroup(id).then(
            (result) => {
                Notify.sendNotification(Successes.REMOVE_FAIL_MESSAGE_REGEX_GROUP, AlertTypes.success);
                setLastRemovedFailMessageGroupId(id);
                fetchFailMessageGroups();
                setSelectedFailMessageTypeGroup(null);
                setSelectedRegexList([]);
            },
            (error) => {
                Notify.sendNotification(Errors.REMOVE_FAIL_MESSAGE_REGEX_GROUP, AlertTypes.error);
            }
        )
    }

    let selectFailMessageTypeGroup = (failMessageTypeGroup) => {
        setSelectedFailMessageTypeGroup(failMessageTypeGroup);
        setSelectedRegexList(failMessageTypeGroup.fail_message_types);
    }

    let goToDetalsView = () => {
        navigate({ pathname: "../fail-regex-groups-detailed" });
    }

    let editButton = (rowData) => {
        return (
            <Button className="p-button-warning p-button-sm" style={{ padding: '8px', height: '35px' }} onClick={() => editFailMessageGroup(rowData)}
                disabled={!rowData.author.includes(currentUser)}>
                <FaEdit size='20' />
            </Button>

        );
    }

    let copyButton = (rowData) => {
        return (
            <Button className="p-button-info p-button-sm" style={{ padding: '8px', height: '35px' }} onClick={() => copyFailMessageGroup(rowData)}>
                <MdContentCopy size='20' />
            </Button>

        );
    }

    let removeButton = (rowData) => {
        return (
            <Button className="p-button-danger p-button-sm" style={{ padding: '8px', height: '35px' }} onClick={() => confirmRemove(rowData)}
                disabled={!rowData.author.includes(currentUser)}>
                <FaRegTrashAlt size='20' />
            </Button>
        );
    }

    useEffect(() => {
        fetchCurrentUser();
        fetchFailMessageGroups(group);
    }, [group])

    return (
        <>
            <div>
                {group === undefined ?
                    <Button style={{ marginLeft: '5px', marginTop: '5px', fontWeight: 'bold' }} className="p-button-success p-button-sm" onClick={handleFormShow}>
                        <MdAddCircle size='20' />
                        <span style={{ marginLeft: '5px' }}>Add Regex Group</span>
                    </Button>
                    : null}
                <Button style={{ marginLeft: '5px', marginTop: '5px', fontWeight: 'bold' }} className="p-button-info p-button-sm" onClick={goToDetalsView}>
                    <AiOutlineLink size='20' />
                    <span style={{ marginLeft: '5px' }}>Go to details view</span>
                </Button>
            </div>
            <div style={{ display: 'flex', marginTop: '5px', marginLeft: '3px', marginRight: '3px' }}>
                <Card style={{ width: '40%' }}>
                    <span style={{ fontWeight: 'bold', margin: '5px' }}>Select Regex Group to see details:</span>
                    <DataTable value={failMessageTypeGroups} stripedRows responsiveLayout="scroll" showGridlines dataKey="id"
                        size="small" className="fail-message-table"
                        filterDisplay="row" loading={loading}
                        globalFilterFields={['name', 'regex', 'author', 'description']}
                        emptyMessage="No rergex groups found."
                        scrollHeight="calc(100vh - 200px)"
                        resizableColumns columnResizeMode="fit"
                        selectionMode="single" selection={selectedFailMessageTypeGroup}
                        onSelectionChange={e => selectFailMessageTypeGroup(e.value)}>

                        <Column field="name" header="Name" sortable filter style={{ width: '70%' }} showFilterMenuOptions={false} showClearButton={false}></Column >
                        <Column field="author" header="Author" sortable filter style={{ width: '30%' }} showFilterMenuOptions={false} showClearButton={false}></Column>
                        <Column body={copyButton} header="Copy" style={{ textAlign: "center", minWidth: "60px" }} />
                        {group === undefined ? <Column body={editButton} header="Edit" style={{ textAlign: "center", minWidth: "60px" }} /> : null}
                        {group === undefined ? <Column body={removeButton} header="Remove" style={{ textAlign: "center", minWidth: "60px" }} /> : null}
                    </DataTable >

                </Card>
                <Divider layout="vertical"></Divider>
                <Card style={{ width: '60%' }}>
                    <DataTable value={selectedRegexList} stripedRows responsiveLayout="scroll" showGridlines dataKey="id"
                        size="small" className="fail-message-table"
                        filterDisplay="row" loading={loading}
                        globalFilterFields={['name', 'regex', 'author', 'description']}
                        emptyMessage="Any regex selected."
                        scrollHeight="calc(100vh - 180px)"
                        resizableColumns columnResizeMode="fit">

                        <Column field="name" header="Name" sortable filter showFilterMenuOptions={false} showClearButton={false} ></Column>
                        <Column field="regex" header="Regex" sortable filter showFilterMenuOptions={false} showClearButton={false} ></Column>
                        <Column field="author" header="Author" sortable filter showFilterMenuOptions={false} showClearButton={false} ></Column>
                        <Column field="env_issue_type" header="Env Issue Type" sortable filter showFilterMenuOptions={false} showClearButton={false} ></Column>
                        <Column field="description" header="Description" sortable filter showFilterMenuOptions={false} showClearButton={false} ></Column>

                    </DataTable >
                </Card>
            </div >

            <FailMessageGroupAddModal failMessageGroupToEdit={failMessageGroupToEdit} failMessageGroupToCopy={failMessageGroupToCopy}
                showForm={showForm} handleFormClose={handleFormCloseAndRefresh} />

            <ConfirmDialog />
        </>
    )
}

export default FailMessageTypeGroupComponent;