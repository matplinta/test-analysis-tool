import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { Column } from 'primereact/column';
import { TreeTable } from 'primereact/treetable';
import { ToggleButton } from 'primereact/togglebutton';

import { getFailMessageTypeGroups } from '../../services/test-results-analyzer/fail-message-type.service';

import "./FailMessageTypeGroupComponent.css";

let FailMessageTypeGroupComponent = () => {

    const [failMessageTypeGroups, setFailMessageTypeGroups] = useState();
    const [expandedKeys, setExpandedKeys] = useState({});
    const [selectedGroups, setSelectedGroups] = useState(null);

    const [isToggled, setIsToggled] = useState(false);

    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const handleFormClose = () => setShowForm(false);
    const handleFormShow = () => setShowForm(true);

    let { group } = useParams();

    let fetchFailMessageGroups = () => {
        getFailMessageTypeGroups(group).then(
            (response) => {

                let dataToParse = null;
                if (Array.isArray(response.data)) {
                    dataToParse = response.data;
                } else {
                    dataToParse = [response.data];
                }

                let parsedData = dataToParse.map(group => {
                    return {
                        "key": group.id.toString(),
                        "data": {
                            "id": group.id,
                            "group_name": group.name,
                            "group_author": group.author
                        },
                        "children": group.fail_message_types.map(type => {
                            return {
                                "key": group.id + "-" + type.id,
                                "data": {
                                    "id": type.id,
                                    "type_name": type.name,
                                    "regex": type.regex,
                                    "type_author": type.author,
                                    "description": type.description,
                                    "env_issue_type": type.env_issue_type
                                }
                            }
                        })
                    };
                })
                setFailMessageTypeGroups(parsedData);
                if (group !== undefined) {
                    handleExpandAll(parsedData);
                }
                setLoading(false);

            },
            (error) => {
                console.log(error);
                setLoading(false);
            }
        )
    }

    const handleExpandAll = (data = undefined) => {
        let dataToExpand = undefined;
        let _expandedKeys = {};
        if (data !== undefined) {
            dataToExpand = data;
        } else {
            dataToExpand = failMessageTypeGroups;
        }
        for (let node of dataToExpand) {
            _expandedKeys[node.key.toString()] = true;
        }
        setExpandedKeys(_expandedKeys);
    }

    const onToggle = (value) => {
        if (value === true) {
            setIsToggled(true);
            handleExpandAll();
        } else {
            setIsToggled(false);
            handleCollapseAll();
        }
    }

    const handleCollapseAll = () => {
        setExpandedKeys([]);
    }

    const handleFormCloseAndRefresh = () => {
        handleFormClose();
        fetchFailMessageGroups();
    }

    const rowClassName = (node) => {
        if (node.key in expandedKeys) {
            return { 'highlight-expanded p-highlight': (!node.key.includes('-')) };
        }
        else {
            return { 'p-highlight': (!node.key.includes('-')) };
        }
    }

    useEffect(() => {
        fetchFailMessageGroups(group);
    }, [])

    return (
        <>
            <ToggleButton checked={isToggled} onChange={(e) => onToggle(e.value)} onLabel="Collapse List" offLabel="Expand All"
                onIcon="pi pi-chevron-up" offIcon="pi pi-chevron-down" aria-label="Confirmation"
                className="p-button-info p-button-sm"
                style={{ marginLeft: '6px', marginTop: '3px', fontWeight: 'bold' }} />

            <TreeTable value={failMessageTypeGroups} scrollable size="small" loading={loading}
                scrollHeight="calc(100vh - 300px)" showGridlines className="tree-table-style"
                resizableColumns columnResizeMode="fit" rowClassName={rowClassName}
                expandedKeys={expandedKeys} onToggle={e => setExpandedKeys(e.value)}
                selectionKeys={selectedGroups} onSelectionChange={e => setSelectedGroups(e.value)}>

                <Column field="group_name" header="Group Name" expander sortable filter filterPlaceholder="Filter by name"></Column>
                <Column field="group_author" header="Group Author" sortable filter filterPlaceholder="Filter by author"></Column>
                <Column field="type_name" header="Regex Name" sortable filter filterPlaceholder="Filter by name"></Column>
                <Column field="regex" header="Regex" sortable filter filterPlaceholder="Filter by regex"></Column>
                <Column field="type_author" header="Regex Author" sortable filter filterPlaceholder="Filter by author"></Column>
                <Column field="env_issue_type" header="Env Issue Type" sortable filter filterPlaceholder="Filter by env issue type"></Column>
                <Column field="description" header="Description" sortable filter filterPlaceholder="Filter by description"></Column>

            </TreeTable>
        </>
    )
}

export default FailMessageTypeGroupComponent;