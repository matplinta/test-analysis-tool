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
import { confirmDialog } from 'primereact/confirmdialog';
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
                setFailMessageTypeGroups(response.data);
                if (response.data.length > 0 && failMessageGroupToEdit !== null) {
                    let selectedGroup = response.data.filter(group => group.id === failMessageGroupToEdit.id)[0];
                    setSelectedFailMessageTypeGroup(selectedGroup);
                    setSelectedRegexList(selectedGroup.fail_message_types);
                }
                if (response.data.length > 0 && failMessageGroupToCopy !== null) {
                    let selectedGroup = response.data.filter(group => group.id === failMessageGroupToCopy.id)[0];
                    setSelectedFailMessageTypeGroup(selectedGroup);
                    setSelectedRegexList(selectedGroup.fail_message_types);
                }
                setLoading(false);
            },
            (error) => {
                console.log(error);
                setLoading(false);
            }
        )
    }

    const handleFormCloseAndRefresh = () => {
        handleFormClose();
        fetchFailMessageGroups();
        setFailMessageGroupToEdit(null);
        setFailMessageGroupToCopy(null);
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
    }, [])

    return (
        <>
            <Button style={{ marginLeft: '5px', marginTop: '5px', fontWeight: 'bold' }} className="p-button-success p-button-sm" onClick={handleFormShow}>
                <MdAddCircle size='20' />
                <span style={{ marginLeft: '5px' }}>Add Regex Group</span>
            </Button>
            <Button style={{ marginLeft: '5px', marginTop: '5px', fontWeight: 'bold' }} className="p-button-info p-button-sm" onClick={goToDetalsView}>
                <AiOutlineLink size='20' />
                <span style={{ marginLeft: '5px' }}>Go to details view</span>
            </Button>

            <div style={{ display: 'flex', marginTop: '5px', marginLeft: '3px', marginRight: '3px' }}>
                <Card style={{ width: '35%' }}>
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

                        <Column field="name" header="Name" sortable filter filterPlaceholder="Search by name" style={{ width: '70%' }} ></Column >
                        <Column field="author" header="Author" sortable filter filterPlaceholder="Search by author" style={{ width: '30%' }} ></Column>
                        <Column body={copyButton} header="Copy" style={{ textAlign: "center", minWidth: "60px" }} />
                        <Column body={editButton} header="Edit" style={{ textAlign: "center", minWidth: "60px" }} />
                        <Column body={removeButton} header="Remove" style={{ textAlign: "center", minWidth: "60px" }} />
                    </DataTable >

                </Card>
                <Divider layout="vertical"></Divider>
                <Card style={{ width: '65%' }}>
                    <DataTable value={selectedRegexList} stripedRows responsiveLayout="scroll" showGridlines dataKey="id"
                        size="small" className="fail-message-table"
                        filterDisplay="row" loading={loading}
                        globalFilterFields={['name', 'regex', 'author', 'description']}
                        emptyMessage="Any regex selected."
                        scrollHeight="calc(100vh - 180px)"
                        resizableColumns columnResizeMode="fit">

                        <Column field="name" header="Name" sortable filter filterPlaceholder="Search by name" ></Column >
                        <Column field="regex" header="Regex" sortable filter filterPlaceholder="Search by name" ></Column >
                        <Column field="author" header="Author" sortable filter filterPlaceholder="Search by author" ></Column>
                        <Column field="env_issue_type" header="Env Issue Type" sortable filter filterPlaceholder="Search by author" ></Column>
                        <Column field="description" header="Description" sortable filter filterPlaceholder="Search by author" ></Column>

                    </DataTable >
                </Card>
            </div >

            <FailMessageGroupAddModal failMessageGroupToEdit={failMessageGroupToEdit} failMessageGroupToCopy={failMessageGroupToCopy}
                showForm={showForm} handleFormClose={handleFormCloseAndRefresh} />
        </>
    )
}

export default FailMessageTypeGroupComponent;