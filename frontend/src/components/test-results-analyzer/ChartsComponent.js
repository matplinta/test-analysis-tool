// Description: File is responsible for managing form for creating filter sets and displaying charts
// HISTORY
// --------------------------------------------------------------------------
//   Date                    Author                     Bug                 List of changes
//  --------------------------------------------------------------------------


import { useEffect, useState, useRef } from "react"
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
import { Dialog } from 'primereact/dialog';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Calendar } from 'primereact/calendar';
import { ProgressSpinner } from 'primereact/progressspinner';
import { RiFileExcel2Line } from 'react-icons/ri';
import { FaChartBar } from 'react-icons/fa';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { MultiSelect } from 'primereact/multiselect';
import { Tooltip } from 'primereact/tooltip';
import { InputNumber } from 'primereact/inputnumber';

import FilterStesTableComponent from "./FilterSetsTableComponent";
import GenerateChartComponent from "./GenerateChartComponent";

import {
    getFilterFields, postFilterSetsDetail, getExcelFromSavedFilterSet, postToGetExcelFromTemporaryDefinedFilterSet,
    getChartFromSavedFilterSet, postToGetChartFromTemporaryDefinedFilterSet
} from './../../services/test-results-analyzer/statistics.service';
import { getFailMessageTypeGroups } from '../../services/test-results-analyzer/fail-message-type.service';
import { useCurrentUser } from '../../services/CurrentUserContext';
import Notify, { AlertTypes, Errors, Infos, Successes } from '../../services/Notify.js';

import './ChartsComponent.css';

let ChartsComponent = () => {

    const [filtersetName, setFiltersetName] = useState("");
    const [filterFields, setFilterFields] = useState([]);
    const [selectedFilterSet, setSelectedFilterSet] = useState(null);

    const [selectedFilterFields, setSelectedFilterFields] = useState([]);
    const [unselectedFilterFields, setUnselectedFilterFields] = useState([]);

    const [limit, setLimit] = useState(1000);

    const [reloadTestSetFilters, setReloadTestSetFilters] = useState(false);

    const filterTemplate = {
        field: "",
        value: ""
    }

    const [filters, setFilters] = useState([filterTemplate]);

    const [displayAlertFieldAlreadyUsed, setDisplayAlertFieldAlreadyUsed] = useState(false)

    const [dates, setDates] = useState(null);

    const [blockedPanel, setBlockedPanel] = useState(false);

    const [chartVisible, setChartVisible] = useState(false);

    let [chartDataTemplate, setChartDataTemplate] = useState({
        "labels": [],
        "datasets": [{
            "label": "",
            "data": []
        }]
    })

    const [selectedFailMessageTypeGroups, setSelectedFailMessageTypeGroups] = useState([]);
    const [failMessageTypeGroupsList, setFailMessageTypeGroupsList] = useState([]);

    let today = new Date();
    let year = today.getFullYear();
    let prevYear = year - 1;
    let minDate = new Date();
    minDate.setFullYear(prevYear);
    let maxDate = new Date();

    const addFilter = () => {
        setFilters([...filters, filterTemplate])
    }

    const fetchFilterFields = () => {
        getFilterFields().then(
            (results) => {
                let filterFields = results.data.filter(field => field.name !== "fail_message_type_groups" && field.name !== "limit");
                setFilterFields(filterFields.map(item => item.name));
                setUnselectedFilterFields(results.data);
            }, (error) => {

            })
    }

    const onFilterChange = (item, index, e) => {
        if (selectedFilterFields.filter(selectedFilter => selectedFilter.field === e.value).length > 0) {
            setDisplayAlertFieldAlreadyUsed(true)
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
        setFilters(tmp);
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
    }

    const selectFilterSet = (filterSet) => {
        setFiltersetName(filterSet.name);

        let filterSetCopy = Object.assign({}, filterSet);

        let limitObject = filterSetCopy.filters.filter(item => item.field === "limit");
        if (limitObject.length > 0) {
            setLimit(limitObject[0].value);
        } else {
            setLimit(1000);
        }

        let failMessagesGroups = filterSetCopy.filters.filter(item => item.field === "fail_message_type_groups");
        if (failMessagesGroups.length > 0) {
            let failMessagesGroupsIdsArray = failMessagesGroups[0].value.split(',')
            failMessagesGroupsIdsArray = failMessagesGroupsIdsArray.map(item => parseInt(item));
            setSelectedFailMessageTypeGroups(failMessagesGroupsIdsArray);
        } else {
            setSelectedFailMessageTypeGroups([]);
        }

        filterSetCopy.filters = filterSetCopy.filters.filter(item => item.field !== "limit" && item.field !== "fail_message_type_groups")
        setSelectedFilterSet(filterSetCopy);

        setFilters(filterSetCopy.filters);
    }

    const prepareFiltersListToAdd = (filtersToCompare) => {
        let filtersList = [];
        for (let filterItem of filtersToCompare) {
            let filterSetTmp = {};
            if (filterItem.field !== "" && filterItem.value !== "") {
                filterSetTmp.value = filterItem.value;
                filterSetTmp.field = filterItem.field;
                filtersList.push(filterSetTmp);
            }
        }
        return filtersList;
    }

    const prepareFiltersListWithLimitAndGroups = () => {
        let filtersListWithLimitAndGroups = [...filters];
        filtersListWithLimitAndGroups.push({ "field": "limit", "value": limit });
        if (selectedFailMessageTypeGroups !== null && selectedFailMessageTypeGroups !== []) {
            filtersListWithLimitAndGroups.push(
                { "field": "fail_message_type_groups", "value": selectedFailMessageTypeGroups.join(',') }
            )
        }
        return filtersListWithLimitAndGroups;
    }

    const saveFilterSet = () => {
        if (filtersetName !== "") {
            let filtersList = prepareFiltersListToAdd(filters);
            if (filtersList.length === filters.length) {
                let filterSetToSendAll = { "name": filtersetName, "filters": prepareFiltersListWithLimitAndGroups() }
                postFilterSetsDetail(filterSetToSendAll).then(
                    (success) => {
                        Notify.sendNotification(Successes.ADD_FILTER_SET, AlertTypes.success);
                        setReloadTestSetFilters(true);
                    }, (error) => {
                        Notify.sendNotification(Errors.ADD_FILTER_SET, AlertTypes.error);
                    })
            } else {
                Notify.sendNotification(Errors.EMPTY_FIELDS_FILTERS_LIST, AlertTypes.error);
            }
        } else {
            Notify.sendNotification(Errors.EMPTY_FIELDS_FILTERSET_NAME, AlertTypes.error);
        }

    }

    const clearFilterSet = () => {
        setSelectedFilterSet(null);
        setFiltersetName("");
        setFilters([filterTemplate]);
        setSelectedFilterFields([]);
        setUnselectedFilterFields(filterFields);
        setLimit(1000);
        setSelectedFailMessageTypeGroups([]);
    }

    const saveExcel = (data) => {
        let date = new Date();
        let dateFormated = date.toLocaleDateString() + '-' + date.toLocaleTimeString().replaceAll(':', '/').replaceAll(' ', '/');
        const outputFilename = `report_${dateFormated}.xls`;
        const url = URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', outputFilename);
        document.body.appendChild(link);
        link.click();
    }

    const postExcelFromSavedFilterSetAndSave = (filtersList, datesRange) => {
        postToGetExcelFromTemporaryDefinedFilterSet(filtersList, getFullDateRange(datesRange)).then(
            (response) => {
                saveExcel(response.data);
                setBlockedPanel(false);
                Notify.sendNotification(Successes.DOWNLOAD_EXCEL, AlertTypes.success);
            },
            (error) => {
                Notify.sendNotification(Errors.DOWNLOAD_EXCEL, AlertTypes.error);
                setBlockedPanel(false);
            }
        )
    }

    const downloadFilterSetExcel = () => {
        setBlockedPanel(true);
        Notify.sendNotification(Infos.DOWNLOAD_EXCEL, AlertTypes.info, 12000);
        let newFiltersList = prepareFiltersListWithLimitAndGroups();
        postExcelFromSavedFilterSetAndSave(newFiltersList, dates);
    }

    const getFullDateRange = (datesRange) => {
        if (datesRange === null) {
            return null;
        } else if (datesRange[0] !== null && datesRange[1] === null) {
            return [datesRange[0], new Date()];
        } else {
            return datesRange;
        }
    }

    const fetchChartFromTemporaryFilterSet = (filtersList, datesRange) => {
        postToGetChartFromTemporaryDefinedFilterSet(filtersList, getFullDateRange(datesRange)).then(
            (results) => {
                setChartDataTemplate({
                    "labels": results.data.labels,
                    "datasets": [{
                        "label": results.data.info,
                        "data": results.data.Occurrences
                    }]
                })
                console.log({
                    "labels": results.data.labels,
                    "datasets": [{
                        "label": results.data.info,
                        "data": results.data.Occurrences
                    }]
                })
                setBlockedPanel(false);
                setChartVisible(true);
                Notify.sendNotification(Successes.DOWNLOAD_CHART, AlertTypes.success);
            }, (error) => {
                setBlockedPanel(false);
                Notify.sendNotification(Errors.DOWNLOAD_CHART, AlertTypes.error);
            })
    }

    const generateChart = () => {
        setBlockedPanel(true);
        Notify.sendNotification(Infos.DOWNLOAD_CHART, AlertTypes.info, 12000);
        let newFiltersList = prepareFiltersListWithLimitAndGroups();
        fetchChartFromTemporaryFilterSet(newFiltersList, dates);
    }

    let handleFailMessageTypeGroupsChange = (e) => {
        setSelectedFailMessageTypeGroups(e.target.value)
    }

    let fetchFailMessageTypeGroups = () => {
        getFailMessageTypeGroups().then(
            (response) => {
                if (response.data.length > 0) {
                    const failMessageTypeGroupsValue = response.data.map(item => {
                        return {
                            name: " Group: " + item.name + " (Author: " + item.author + ")", id: item.id
                        }
                    })
                    setFailMessageTypeGroupsList(failMessageTypeGroupsValue);
                }
            },
            (error) => {
                Notify.sendNotification(Errors.FETCH_FAIL_MESSAGE_GROUPS_LIST, AlertTypes.error);
            })
    }

    useEffect(() => {
        fetchFilterFields();
        fetchFailMessageTypeGroups();
    }, [])

    return (
        <>
            <div className="m-3 flex">
                <Card style={{ width: '55%' }}>
                    <Container className="pl-2">
                        <Row>
                            <Col>
                                <Button className="p-button-success font-bold mr-1" type="submit" onClick={saveFilterSet}>
                                    Save Filter Set
                                </Button>
                                <Button className="p-button-secondary font-bold mr-1" type="submit" onClick={clearFilterSet}
                                    tooltip="Clear form to create new Filter Set" >
                                    Clear Filter Set To Create New
                                </Button>
                            </Col>
                        </Row>

                        <Row>
                            <Col>
                                <label htmlFor="name" className="block font-bold">
                                    <span>Filterset Name</span>
                                    <Tooltip target=".filter-set-name-info-icon" />
                                    <i className="filter-set-name-info-icon pi pi-info-circle ml-1"
                                        data-pr-tooltip="Fill if you want to save Filter Set defined below"
                                        data-pr-position="right" style={{ fontSize: '1.1rem', cursor: 'pointer' }} />
                                </label>
                                <InputText id="name" value={filtersetName} onChange={setFiltersetNameOnFiltersList} style={{ width: "99%" }} className="block mb-2 mt-1" />
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <span className="font-bold">Filters List (fields from Reporing Portal)</span>
                            </Col>
                        </Row>

                        <ScrollPanel style={{ width: '99%', height: '300px' }} className="custombar">
                            <div className="mt-1 ml-0">
                                {filters.map((item, index) => {
                                    return (
                                        <Row key={index} id={index} className="mb-2 ml-0">
                                            <Col xl={3} className="pr-0">
                                                <Dropdown value={item.field} options={filterFields} onChange={(e) => onFilterChange(item, index, e)}
                                                    placeholder="Select filter" style={{ width: '100%' }} />
                                            </Col>
                                            <Col xl={8} className="pr-0 m-0">
                                                <InputTextarea value={item.value} onChange={(e) => onFilterValueChange(item, index, e)} rows={1}
                                                    autoResize={true}
                                                    cols={30} placeholder="Provide value" style={{ width: '100%', height: '50px' }} />
                                            </Col>
                                            <Col xl={1} className="m-0">
                                                <Button className="p-button-primary yellow-200 p-button-sm" onClick={() => removeFilter(item, index)}
                                                    style={{ padding: '5px', height: '47px' }} >
                                                    <VscClose size='40' />
                                                </Button>
                                            </Col>
                                        </Row>
                                    );
                                })}

                            </div>
                        </ScrollPanel>

                        <Row>
                            <Col>
                                {filterFields !== null &&
                                    <Button icon="pi pi-plus" className="p-button-rounded p-button-primary" aria-label="Filter" onClick={addFilter}
                                        tooltip="Click to add new empty filter to filters list form" style={{ marginTop: '5px', marginBottom: '7px' }}
                                        disabled={filters.length >= filterFields.length} />
                                }
                            </Col>
                        </Row>

                        <Row>
                            <label htmlFor="fail_message_group" className="font-bold">
                                <span>Fail message Groups</span>
                                <Tooltip target=".fail-message-group-info-icon" />
                                <i className="fail-message-group-info-icon pi pi-info-circle ml-1"
                                    data-pr-tooltip="wypelnic opis"
                                    data-pr-position="right" style={{ fontSize: '1.1rem', cursor: 'pointer' }} />
                            </label>
                            <MultiSelect value={selectedFailMessageTypeGroups} options={failMessageTypeGroupsList} onChange={handleFailMessageTypeGroupsChange}
                                optionLabel="name" optionValue="id" filter showClear id="fail_message_group" className="ml-2 mb-2 mt-1 mr-2"
                                style={{ maxWidth: '96%' }} />
                        </Row>

                        <Row>
                            <label htmlFor="limit" className="font-bold">
                                <span>Limit</span>
                                <Tooltip target=".limit-info-icon" />
                                <i className="limit-info-icon pi pi-info-circle ml-1"
                                    data-pr-tooltip="dodac opis limit"
                                    data-pr-position="right" style={{ fontSize: '1.1rem', cursor: 'pointer' }} />
                            </label>
                            <InputNumber id="limit" value={limit} onValueChange={(e) => setLimit(e.value)} mode="decimal" useGrouping={false} className="mb-2 mt-1" style={{ marginLeft: '0', maxWidth: '30%' }} />
                        </Row>

                        <Divider style={{ height: '10px', color: 'black' }} />

                        <Row>
                            <Col>
                                <label htmlFor="range" className="block font-bold">Select Time Range
                                    <Tooltip target=".filter-set-name-info-icon" />
                                    <i className="filter-set-name-info-icon pi pi-info-circle ml-1"
                                        data-pr-tooltip="Select dates to generate chart or excel from time period"
                                        data-pr-position="right" style={{ fontSize: '1.1rem', cursor: 'pointer' }} />
                                </label>
                                <Calendar id="range" value={dates} onChange={(e) => setDates(e.value)} selectionMode="range" readOnlyInput
                                    dateFormat="dd-mm-yy" showIcon showButtonBar className="mb-3 mt-1 calendar-style" style={{ width: '260px' }}
                                    minDate={minDate} maxDate={maxDate} />
                            </Col>
                        </Row>

                        <Row>
                            <Col>
                                <Button className="p-button-primary font-bold mr-1" type="submit" onClick={generateChart} >
                                    <FaChartBar size='26' />
                                    <span className='ml-2'>Generate Failed Runs Chart</span>
                                </Button>
                                <Button className="font-bold mr-1" style={{ backgroundColor: '#217346', borderColor: '#217346' }}
                                    onClick={downloadFilterSetExcel} >
                                    <RiFileExcel2Line size='20' />
                                    <span className='ml-2'>Download Excel</span>
                                </Button>
                            </Col>
                        </Row>
                    </Container>
                </Card>

                <Divider layout="vertical"></Divider>

                <Card style={{ width: '45%' }}>
                    <Container className="pl-2">
                        <Row>
                            <Col>
                                <FilterStesTableComponent selectedFilterSet={selectedFilterSet} selectFilterSet={selectFilterSet}
                                    reloadTestSetFilters={reloadTestSetFilters} setReloadTestSetFilters={setReloadTestSetFilters}
                                    clearForm={clearFilterSet} />
                            </Col>
                        </Row>
                    </Container>
                </Card>
            </div >

            <Dialog visible={chartVisible} style={{ width: '99%' }} onHide={() => setChartVisible(false)}>
                <div className="m-3">
                    <Card>
                        <GenerateChartComponent chartDataTemplate={chartDataTemplate} />
                    </Card>
                </div>
            </Dialog>

            <Dialog visible={blockedPanel} >
                <ProgressSpinner
                    style={{ width: '250px', height: '250px', position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                    strokeWidth="5" fill="#999999" />
            </Dialog>

            <Dialog header="Selected field has already been used!" visible={displayAlertFieldAlreadyUsed} onHide={() => setDisplayAlertFieldAlreadyUsed(false)}
                dismissableMask={true} style={{ width: '30vw' }}>
                <br />
                <p>Filter field value can be selected only once in this form. Please add value to selected before if you want
                    to define next value for this filter or select another filter field.</p>
            </Dialog>

            <ConfirmDialog />
        </>
    )
}

export default ChartsComponent;