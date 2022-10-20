// Description: File is responsible for managing form for creating filter sets and displaying charts
// HISTORY
// --------------------------------------------------------------------------
//   Date                    Author                     Bug                 List of changes
//  --------------------------------------------------------------------------


import { useEffect, useState } from "react"
import { Divider } from 'primereact/divider';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { VscClose } from 'react-icons/vsc';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { ScrollPanel } from 'primereact/scrollpanel';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { FaRegTrashAlt } from 'react-icons/fa';

import { getFilterFields, postFilterSetsDetail, getFilterSetsDetail, deleteFilterSetsDetail } from './../../services/test-results-analyzer/statistics.service';
import { useCurrentUser } from '../../services/CurrentUserContext';
import Notify, { AlertTypes, Errors } from '../../services/Notify.js';

import './ChartsComponent.css';
import { Successes } from '../../services/Notify';


let ChartsComponent = () => {

    const [filtersetName, setFiltersetName] = useState("");
    const [filterFields, setFilterFields] = useState(null);
    const [filterSets, setFilterSets] = useState(null);
    const [selectedFilterSet, setSelectedFilterSet] = useState(null);

    const [selectedFilterFields, setSelectedFilterFields] = useState([]);
    const [unselectedFilterFields, setUnselectedFilterFields] = useState([]);

    const [loading, setLoading] = useState(true);

    const filterTemplate = {
        field: "",
        value: ""
    }

    const [filters, setFilters] = useState([filterTemplate]);

    const [displayAlert, setDisplayAlert] = useState(false)

    const { currentUser, fetchCurrentUser } = useCurrentUser();

    const addFilter = () => {
        setFilters([...filters, filterTemplate])
    }

    const fetchFilterFields = () => {
        getFilterFields().then(
            (results) => {
                setFilterFields(results.data.map(item => item.name));
                setUnselectedFilterFields(results.data);
            }, (error) => {

            })
    }

    const fetchFilterSets = () => {
        getFilterSetsDetail().then(
            (results) => {
                setFilterSets(results.data.results)
                setLoading(false);
            }, (error) => {
                setLoading(false);
            })
    }

    const onFilterChange = (item, index, e) => {
        if (selectedFilterFields.filter(selectedFilter => selectedFilter.field === e.value).length > 0) {
            setDisplayAlert(true)
        } else {
            let tmp = [...filters]
            tmp[index].field = e.value;
            setFilters(tmp)
            let unselectedfilterFieldsList = [...unselectedFilterFields].filter(item => item.id !== e.value.id);
            let selectedfilterFieldsList = [...selectedFilterFields];
            selectedfilterFieldsList.push(item);

            setUnselectedFilterFields(unselectedfilterFieldsList)
            setSelectedFilterFields(selectedfilterFieldsList);
        }

    }

    const onFilterValueChange = (item, index, e) => {
        let tmp = [...filters]
        tmp[index].value = e.target.value;
        setFilters(tmp)
    }

    const removeFilter = (item, index) => {
        let tmp = [...filters];
        tmp.splice(index, 1);
        setFilters(tmp);

        if (item.field.id !== undefined) {
            let selectedfilterFieldsList = [...selectedFilterFields].filter(selectedFilter => selectedFilter.field.id !== item.field.id);
            let unselectedfilterFieldsList = [...unselectedFilterFields]
            unselectedfilterFieldsList.push(item);
            setUnselectedFilterFields(unselectedfilterFieldsList)
            setSelectedFilterFields(selectedfilterFieldsList);
        }

    }

    const setFiltersetNameOnFiltersList = (e) => {
        setFiltersetName(e.target.value)
        // let tmp = [...filters];
        // tmp = tmp.map(filter => {
        //     return {
        //         // filter_set: e.target.value,
        //         field: filter.field,
        //         value: filter.value
        //     }
        // })
        // setFilters(tmp);
    }

    const selectFilterSet = (filterSet) => {
        setSelectedFilterSet(filterSet)
        setFiltersetName(filterSet.name);
        setFilters(filterSet.filters);
        // setFilters(filterSet.filters);

    }

    const preapreFiltersListToAdd = () => {
        let filtersList = [];
        for (let filter of filters) {
            if (filter.field !== "" && filter.value !== "") {
                let filterSetTmp = {};
                filterSetTmp.value = filter.value;
                filterSetTmp.field = filter.field;
                filtersList.push(filterSetTmp);
            }
        }
        return filtersList;
    }

    const saveFilterSet = () => {
        if (filtersetName !== "") {
            let filtersList = preapreFiltersListToAdd();
            if (filtersList.length === filters.length) {
                let filterSetToSendAll = { "name": filtersetName, "filters": filtersList }
                console.log(filterSetToSendAll)
                postFilterSetsDetail(filterSetToSendAll).then(
                    (success) => {
                        console.log("success", success)
                        Notify.sendNotification(Successes.ADD_FILTER_SET, AlertTypes.success);
                        fetchFilterSets();
                    }, (error) => {
                        console.log("error", error)
                        Notify.sendNotification(Errors.ADD_FILTER_SET, AlertTypes.error);
                    })
            } else {
                Notify.sendNotification(Errors.EMPTY_FIELDS, AlertTypes.error);
            }
        } else {
            Notify.sendNotification(Errors.EMPTY_FIELDS, AlertTypes.error);
        }

    }

    const generateChart = () => {

    }

    const clearFilterSet = () => {
        setSelectedFilterSet(null);
        setFiltersetName("");
        setFilters([filterTemplate]);
        setSelectedFilterFields([]);
        setUnselectedFilterFields(filterFields);
    }

    const genereteNewFilterSet = () => {

    }

    let removeTestSet = (id) => {
        deleteFilterSetsDetail(id).then(
            (response) => {
                Notify.sendNotification(Successes.REMOVE_FAIL_MESSAGE_REGEX, AlertTypes.success);
                fetchFilterSets();
            },
            (error) => {
                Notify.sendNotification(Errors.REMOVE_FAIL_MESSAGE_REGEX, AlertTypes.error);
            }
        )
    }

    const confirmRemove = (rawData) => {
        confirmDialog({
            message: '\nAre you sure you want to remove Filter Set?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => removeTestSet(rawData.id)
        });
    };

    let removeButton = (rowData) => {
        return (
            <Button className="p-button-danger p-button-sm" style={{ padding: '8px', height: '35px' }} onClick={() => confirmRemove(rowData)} disabled={!rowData.author.includes(currentUser)}>
                <FaRegTrashAlt size='20' />
            </Button>
        );
    }

    useEffect(() => {
        fetchCurrentUser();
        fetchFilterFields();
        fetchFilterSets();
    }, [])

    return (
        <>
            <div style={{ display: 'flex', marginTop: '5px', marginLeft: '3px', marginRight: '3px' }}>
                <Card style={{ width: '50%' }}>
                    <Container style={{ padding: '2px' }}>

                        <Row style={{ paddingLeft: '8px' }}>
                            <Col style={{ padding: '2px' }}>
                                <label htmlFor="name" className="block">Filterset Name</label>
                                <InputText id="name" value={filtersetName} onChange={setFiltersetNameOnFiltersList} style={{ width: "99%", marginBottom: '5px' }} className="block" />
                            </Col>
                        </Row>

                        Filters
                        <ScrollPanel style={{ width: '100%', height: '400px' }} className="custombar">
                            <div style={{ padding: '3px', lineHeight: '1.5' }}>
                                {filters.map((item, index) => {
                                    return (
                                        <Row key={index} id={index} style={{ paddingLeft: '8px' }}>
                                            <Col xl={5} style={{ padding: '2px' }}>
                                                <Dropdown value={item.field} options={filterFields} onChange={(e) => onFilterChange(item, index, e)} placeholder="Select filter" style={{ width: '100%' }} />
                                            </Col>
                                            <Col xl={6} style={{ padding: '2px' }}>
                                                <InputTextarea value={item.value} onChange={(e) => onFilterValueChange(item, index, e)} rows={1} cols={30} autoResize placeholder="Provide value" style={{ width: '100%' }} />
                                            </Col>
                                            <Col xl={'auto'} style={{ padding: '2px' }}>
                                                <Button className="p-button-primary p-button-sm" onClick={() => removeFilter(item, index)} style={{ padding: '5px', height: '47px', marginBottom: '3px' }} >
                                                    <VscClose size='30' />
                                                </Button>
                                            </Col>
                                        </Row>
                                    );
                                })}
                            </div>
                        </ScrollPanel>

                        <Row style={{ paddingLeft: '8px' }}>
                            <Col style={{ padding: '2px' }}>
                                <Button icon="pi pi-plus" className="p-button-rounded" aria-label="Filter" onClick={addFilter} style={{ marginTop: '5px', marginBottom: '7px' }} />
                            </Col>
                        </Row>

                        <Row style={{ paddingLeft: '8px' }}>
                            <Col style={{ padding: '2px' }}>
                                <Button className="p-button-primary " type="submit" onClick={saveFilterSet}>Save Filter Set</Button>
                                <Button className="p-button-primary " type="submit" onClick={generateChart}>Generate Chart</Button>
                                <Button className="p-button-primary " type="submit" onClick={clearFilterSet}>Clear Filter Set</Button>
                            </Col>
                        </Row>
                    </Container>

                </Card>
                <Divider layout="vertical"></Divider>
                <Card style={{ width: '50%' }}>
                    <DataTable value={filterSets} stripedRows responsiveLayout="scroll" showGridlines dataKey="id"
                        size="small" className="fail-message-table"
                        filterDisplay="row" loading={loading}
                        globalFilterFields={['name', 'regex', 'author', 'description']}
                        emptyMessage="No filter sets found."
                        scrollHeight="50vh"
                        resizableColumns columnResizeMode="fit"
                        selectionMode="single" selection={selectedFilterSet} onSelectionChange={e => selectFilterSet(e.value)}>

                        <Column field="name" header="Name" sortable filter filterPlaceholder="Search by name" style={{ width: '70%' }} ></Column >
                        <Column field="author" header="Author" sortable filter filterPlaceholder="Search by author" style={{ width: '30%' }} ></Column>
                        <Column body={removeButton} header="Remove" style={{ textAlign: "center", minWidth: "60px" }} />

                    </DataTable >
                </Card>
            </div >

            <Dialog header="Selected field has already been used!" visible={displayAlert} onHide={() => setDisplayAlert(false)} dismissableMask={true} style={{ width: '30vw' }}>
                <br />
                <p>Filter field value can be selected only once in this form. Please add value to selected before if you want to define next value for this filter or select another filter field.</p>
            </Dialog>

            <ConfirmDialog />
        </>
    )
}

export default ChartsComponent;