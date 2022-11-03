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
import { Dialog } from 'primereact/dialog';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Calendar } from 'primereact/calendar';
import { ProgressSpinner } from 'primereact/progressspinner';
import { RiFileExcel2Line } from 'react-icons/ri';
import { FaChartBar } from 'react-icons/fa';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Tooltip } from 'primereact/tooltip';

import {
    getFilterFields, postFilterSetsDetail, getExcelFromSavedFilterSet, postToGetExcelFromTemporaryDefinedFilterSet
} from './../../services/test-results-analyzer/statistics.service';
import { useCurrentUser } from '../../services/CurrentUserContext';
import Notify, { AlertTypes, Errors, Infos, Successes } from '../../services/Notify.js';

import './ChartsComponent.css';
import FilterStesTableComponent from "./FilterSetsTableComponent";
import GenerateChartComponent from "./GenerateChartComponent";


let ChartsComponent = () => {

    const [filtersetName, setFiltersetName] = useState("");
    const [filterFields, setFilterFields] = useState(null);
    const [selectedFilterSet, setSelectedFilterSet] = useState(null);

    const [selectedFilterFields, setSelectedFilterFields] = useState([]);
    const [unselectedFilterFields, setUnselectedFilterFields] = useState([]);

    const [reloadTestSetFilters, setReloadTestSetFilters] = useState(false);

    const filterTemplate = {
        field: "",
        value: ""
    }

    const [filters, setFilters] = useState([filterTemplate]);

    const [displayAlert, setDisplayAlert] = useState(false)

    const [dates, setDates] = useState(null)

    const [blockedPanel, setBlockedPanel] = useState(false);

    let today = new Date();
    let year = today.getFullYear();
    let prevYear = year - 1;
    let minDate = new Date();
    minDate.setFullYear(prevYear);
    let maxDate = new Date();

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
    }

    const selectFilterSet = (filterSet) => {
        setSelectedFilterSet(filterSet)
        setFiltersetName(filterSet.name);
        setFilters(filterSet.filters);
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
                postFilterSetsDetail(filterSetToSendAll).then(
                    (success) => {
                        Notify.sendNotification(Successes.ADD_FILTER_SET, AlertTypes.success);
                        setReloadTestSetFilters(true);
                    }, (error) => {
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

    const getExcelFromSavedFilterSetAndSave = () => {
        getExcelFromSavedFilterSet(selectedFilterSet.id, dates).then(
            (response) => {
                saveExcel(response.data);
                setBlockedPanel(false);
                Notify.sendNotification(Successes.DOWNLOAD_EXCEL, AlertTypes.success);
            },
            (error) => {
                Notify.sendNotification(Error.DOWNLOAD_EXCEL, AlertTypes.error);
                setBlockedPanel(false);
            }
        )
    }

    const postExcelFromSavedFilterSetAndSave = () => {
        postToGetExcelFromTemporaryDefinedFilterSet(filters, dates).then(
            (response) => {
                saveExcel(response.data);
                setBlockedPanel(false);
                Notify.sendNotification(Successes.DOWNLOAD_EXCEL, AlertTypes.success);
            },
            (error) => {
                Notify.sendNotification(Error.DOWNLOAD_EXCEL, AlertTypes.error);
                setBlockedPanel(false);
            }
        )
    }

    const downloadFilterSetExcel = () => {
        setBlockedPanel(true);
        Notify.sendNotification(Infos.DOWNLOAD_EXCEL, AlertTypes.info);

        if (selectedFilterSet !== null)
            getExcelFromSavedFilterSetAndSave();
        else
            postExcelFromSavedFilterSetAndSave();
    }

    useEffect(() => {
        fetchCurrentUser();
        fetchFilterFields();
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
                                    Clear Filter Set
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
                                <span className="font-bold">Filters List</span>
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
                                                    cols={30} autoResize placeholder="Provide value" style={{ width: '100%' }} />
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
                                <Button icon="pi pi-plus" className="p-button-rounded p-button-primary" aria-label="Filter" onClick={addFilter}
                                    tooltip="Click to add new empty filter to filters list form" style={{ marginTop: '5px', marginBottom: '7px' }} />
                            </Col>
                        </Row>

                        <Divider style={{ height: '5px' }} />

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
                                    <span className='ml-2'>Generate Chart</span>
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
                    <FilterStesTableComponent selectedFilterSet={selectedFilterSet} selectFilterSet={selectFilterSet}
                        reloadTestSetFilters={reloadTestSetFilters} setReloadTestSetFilters={setReloadTestSetFilters} />
                </Card>
            </div >

            <div className="m-3">
                <Card>
                    <GenerateChartComponent />
                </Card>
            </div>

            <Dialog visible={blockedPanel} >
                <ProgressSpinner
                    style={{ width: '250px', height: '250px', position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                    strokeWidth="5" fill="#999999" />
            </Dialog>


            <Dialog header="Selected field has already been used!" visible={displayAlert} onHide={() => setDisplayAlert(false)}
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