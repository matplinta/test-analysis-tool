import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Tree } from 'primereact/tree';
import { Button } from 'primereact/button';
import { Link, useLocation } from 'react-router-dom';

import TestRunTableComponent from './TestRunTableComponent';

import { getTestRunsByTestInstanceFilters } from '../../services/test-results-analyzer/test-runs.service';
import Notify, { AlertTypes, Errors } from '../../services/Notify.js';

import './TestRunsByTestInstance.css'

let TestRunsByTestInstance = () => {

    const [execTriggerFiltersNodes, setExecTriggerFiltersNodes] = useState([]);
    const [expandedExecTriggerKeys, setExpandedExecTriggerKeys] = useState({});
    const [selectedExecTriggerKeys, setSelectedExecTriggerKeys] = useState(null);

    const [testLineTypeFiltersNodes, setTestLineTypeFiltersNodes] = useState([]);
    const [expandedTestLineTypeKeys, setExpandedTestLineTypeKeys] = useState({});
    const [selectedTestLineTypeKeys, setSelectedTestLineTypeKeys] = useState(null);

    const [statusFilterNodes, setStatusFiltersNode] = useState([]);
    const [expandedStatusKeys, setExpandedStatusKeys] = useState({});
    const [selectedStatusKeys, setSelectedStatusKeys] = useState(null);

    const [analyzerFilterNodes, setAnalyzerFilterNodes] = useState([]);
    const [expandedAnalyzerKeys, setExpandedAnalyzerKeys] = useState({});
    const [selectedAnalyzerKeys, setSelectedAnalyzerKeys] = useState(null);

    const [fbFilterNodes, setFbFilterNodes] = useState([]);
    const [expandedFbKeys, setExpandedFbKeys] = useState({});
    const [selectedFbKeys, setSelectedFbKeys] = useState(null);

    const [apiFilterUrl, setApiFilterUrl] = useState(null);

    const [searchParams] = useSearchParams();
    const [searchParamsEntry] = useState(Object.fromEntries([...searchParams]));
    const [testInstanceId, setTestInstanceId] = useState(null);

    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState(null);

    const [loading, setLoading] = useState(false);

    const [showFilters, setShowFilters] = useState(true);

    const navigate = useNavigate();

    const expandAll = (nodesList, setExpanded) => {
        let _expandedKeys = {};
        for (let node of nodesList) {
            expandNode(node, _expandedKeys);
        }
        setExpanded(_expandedKeys);
    }

    const expandNode = (node, _expandedKeys) => {
        if (node.children && node.children.length) {
            _expandedKeys[node.key] = true;

            for (let child of node.children) {
                expandNode(child, _expandedKeys);
            }
        }
    }

    const selectCheckboxesUsingUrlParams = (nodes, paramsEntry, setSelectedNodesKeys) => {
        let selectedFilters = {}
        let filterName = nodes[0].key;
        let filterValues = paramsEntry[filterName].split(',');
        for (let value of filterValues) {
            selectedFilters[value] = { "checked": true, "parialChecked": false }
        }
        if (nodes[0].children.length === filterValues.length) {
            selectedFilters[filterName] = { "checked": true, "parialChecked": true }
        } else {
            selectedFilters[filterName] = { "checked": false, "parialChecked": true }
        }
        setSelectedNodesKeys(selectedFilters)
    }

    const fetchExecTrigger = (data) => {
        if (execTriggerFiltersNodes.length === 0) {
            let filters = {
                key: 'exec_trigger',
                label: 'Execution Trigger',
                data: 'Execution Trigger',
                children: []
            }

            const filterChildren = data.map((item, index) => {
                return { key: item, label: item, data: item, children: [] }
            })
            filters.children = filterChildren;

            let nodesTmp = [...execTriggerFiltersNodes];
            nodesTmp.push(filters);
            expandAll(nodesTmp, setExpandedExecTriggerKeys)

            if (Object.keys(searchParamsEntry).length !== 0 && searchParamsEntry[filters.key] !== undefined) {
                selectCheckboxesUsingUrlParams(nodesTmp, searchParamsEntry, setSelectedExecTriggerKeys);
            }

            setExecTriggerFiltersNodes(nodesTmp);
        }
    }

    const fetchTestLineType = (data) => {
        if (testLineTypeFiltersNodes.length === 0) {
            let filters = {
                key: 'testline_type',
                label: 'Testline Type',
                data: 'Testline Type',
                children: []
            }

            const filterChildren = data.map((item, index) => {
                return { key: item.pk, label: item.pk, data: item.pk, children: [] }
            })
            filters.children = filterChildren;

            let nodesTmp = [...testLineTypeFiltersNodes];
            nodesTmp.push(filters);
            expandAll(nodesTmp, setExpandedTestLineTypeKeys)

            if (Object.keys(searchParamsEntry).length !== 0 && searchParamsEntry[filters.key] !== undefined) {
                selectCheckboxesUsingUrlParams(nodesTmp, searchParamsEntry, setSelectedTestLineTypeKeys);
            }

            setTestLineTypeFiltersNodes(nodesTmp);
        }
    }

    const fetchStatuses = (data) => {
        if (statusFilterNodes.length === 0) {
            let filters = {
                key: 'result',
                label: 'Result',
                data: 'Result',
                children: []
            }

            const filterChildren = data.map((item, index) => {
                return { key: item.pk, label: item.pk, data: item.pk, children: [] }
            })
            filters.children = filterChildren;

            let nodesTmp = [...statusFilterNodes];
            nodesTmp.push(filters);
            expandAll(nodesTmp, setExpandedStatusKeys)

            if (Object.keys(searchParamsEntry).length !== 0 && searchParamsEntry[filters.key] !== undefined) {
                selectCheckboxesUsingUrlParams(nodesTmp, searchParamsEntry, setSelectedStatusKeys);
            }

            setStatusFiltersNode(nodesTmp);
        }
    }

    const fetchAnalyzers = (data) => {
        if (analyzerFilterNodes.length === 0) {
            let filters = {
                key: 'analyzed_by',
                label: 'Analyzed By',
                data: 'Analyzed By',
                children: []
            }

            const filterChildren = data.map((item, index) => {
                return { key: item.fields.username, label: item.fields.username, data: item.fields.username, children: [] }
            })
            filters.children = filterChildren;

            let nodesTmp = [...analyzerFilterNodes];
            nodesTmp.push(filters);
            expandAll(nodesTmp, setExpandedAnalyzerKeys)

            if (Object.keys(searchParamsEntry).length !== 0 && searchParamsEntry[filters.key] !== undefined) {
                selectCheckboxesUsingUrlParams(nodesTmp, searchParamsEntry, setSelectedAnalyzerKeys);
            }
            setAnalyzerFilterNodes(nodesTmp);
        }
    }

    const fetchFBs = (data) => {
        if (fbFilterNodes.length === 0) {
            let filters = {
                key: 'fb',
                label: 'Feature build',
                data: 'Feature build',
                children: []
            }

            const filterChildren = data.map((item, index) => {
                return { key: item.pk, label: item.pk, data: item.pk, children: [] }
            })
            filters.children = filterChildren;

            let nodesTmp = [...fbFilterNodes];
            nodesTmp.push(filters);
            expandAll(nodesTmp, setExpandedFbKeys)

            if (Object.keys(searchParamsEntry).length !== 0 && searchParamsEntry[filters.key] !== undefined) {
                selectCheckboxesUsingUrlParams(nodesTmp, searchParamsEntry, setSelectedFbKeys);
            }
            setFbFilterNodes(nodesTmp);
        }
    }

    let fetchTestRunsFilters = (testInstanceId) => {
        setLoading(true);
        getTestRunsByTestInstanceFilters(testInstanceId).then(
            (response) => {
                const data = response.data;
                fetchExecTrigger(data['exec_trigger']);
                fetchTestLineType(data['testline_type']);
                fetchStatuses(data['result']);
                fetchAnalyzers(data['analyzed_by']);
                fetchFBs(data['fb']);
                setLoading(false);
            },
            (error) => {
                Notify.sendNotification(Errors.GET_TEST_RUNS_FILTERS, AlertTypes.error);
                setLoading(false);
            }
        )
    }

    const defineApiUrlFromSelectedFilter = (selectedKeys, filterName) => {
        let filterUrl = ""
        for (let key in selectedKeys) {
            if (key !== filterName) {
                filterUrl += filterName + "=" + key + "&";
            }
        }
        return filterUrl;
    }

    const defineWebUrlFromSelectedFilter = (selectedKeys, filterName) => {
        let filterList = []
        for (let key in selectedKeys) {
            if (key !== filterName) {
                filterList.push(key);
            }
        }
        if (filterList.length === 0) return "";
        else return (filterName + "=" + filterList.toString() + "&");
    }

    const defineApiUrl = (sortFieldValue = null, sortOrderValue = null) => {
        let filterUrl = "test_instance=" + testInstanceId + "&";
        filterUrl += defineApiUrlFromSelectedFilter(selectedExecTriggerKeys, "exec_trigger");
        filterUrl += defineApiUrlFromSelectedFilter(selectedTestLineTypeKeys, "testline_type");
        filterUrl += defineApiUrlFromSelectedFilter(selectedStatusKeys, "result");
        filterUrl += defineApiUrlFromSelectedFilter(selectedAnalyzerKeys, "analyzed_by");
        filterUrl += defineApiUrlFromSelectedFilter(selectedFbKeys, "fb");

        if (sortOrderValue === 1) filterUrl += "ordering=" + sortFieldValue;
        else if (sortOrderValue === -1) filterUrl += "ordering=-" + sortFieldValue;

        return filterUrl;
    }

    const defineWebUrl = (sortFieldValue = null, sortOrderValue = null) => {
        let filterUrl = "test_instance=" + testInstanceId + "&";
        filterUrl += defineWebUrlFromSelectedFilter(selectedTestLineTypeKeys, "testline_type");
        filterUrl += defineWebUrlFromSelectedFilter(selectedStatusKeys, "result");
        filterUrl += defineWebUrlFromSelectedFilter(selectedAnalyzerKeys, "analyzed_by");
        filterUrl += defineWebUrlFromSelectedFilter(selectedFbKeys, "fb");

        if (sortOrderValue === 1) filterUrl += "ordering=" + sortFieldValue;
        else if (sortOrderValue === -1) filterUrl += "ordering=-" + sortFieldValue;

        return filterUrl;
    }

    const searchTestRuns = () => {
        let apiUrl = defineApiUrl().slice(0, -1);
        setApiFilterUrl(apiUrl);

        let webUrl = defineWebUrl().slice(0, -1);
        navigate({
            pathname: "",
            search: webUrl
        });
        setSortField(null);
        setSortOrder(null);
        window.scrollTo(0, 0);
    }

    const nodeTemplate = (node, options) => {
        return (
            <>
                <span className="p-treenode-label might-overflow">
                    {node.label}
                </span>
            </>
        )
    }

    const execTriggerCheckboxList = (
        <div>
            <Tree nodeTemplate={nodeTemplate} value={execTriggerFiltersNodes} expandedKeys={expandedExecTriggerKeys} selectionMode="checkbox"
                selectionKeys={selectedExecTriggerKeys} onSelectionChange={e => setSelectedExecTriggerKeys(e.value)}
                onToggle={e => setExpandedExecTriggerKeys(e.value)} loading={loading} className="regression-filters-tree" />
        </div>
    )

    const testLineTypeCheckboxList = (
        <div>
            <Tree nodeTemplate={nodeTemplate} value={testLineTypeFiltersNodes} expandedKeys={expandedTestLineTypeKeys}
                selectionMode="checkbox" selectionKeys={selectedTestLineTypeKeys}
                onSelectionChange={e => setSelectedTestLineTypeKeys(e.value)} onToggle={e => setExpandedTestLineTypeKeys(e.value)}
                loading={loading} className="regression-filters-tree" />
        </div>
    )

    const statusCheckboxList = (
        <div>
            <Tree nodeTemplate={nodeTemplate} value={statusFilterNodes} expandedKeys={expandedStatusKeys}
                selectionMode="checkbox" selectionKeys={selectedStatusKeys}
                onSelectionChange={e => setSelectedStatusKeys(e.value)} onToggle={e => setExpandedStatusKeys(e.value)}
                loading={loading} className="regression-filters-tree" />
        </div>
    )

    const analyzerCheckboxList = (
        <div>
            <Tree nodeTemplate={nodeTemplate} value={analyzerFilterNodes} expandedKeys={expandedAnalyzerKeys}
                selectionMode="checkbox" selectionKeys={selectedAnalyzerKeys}
                onSelectionChange={e => setSelectedAnalyzerKeys(e.value)} onToggle={e => setExpandedAnalyzerKeys(e.value)}
                loading={loading} className="regression-filters-tree" />
        </div>
    )

    const fbCheckboxList = (
        <div>
            <Tree value={fbFilterNodes} expandedKeys={expandedFbKeys} selectionMode="checkbox" selectionKeys={selectedFbKeys}
                onSelectionChange={e => setSelectedFbKeys(e.value)} onToggle={e => setExpandedFbKeys(e.value)}
                loading={loading} className="regression-filters-tree" />
        </div>
    )

    const convertUrl = (paramsEntry) => {
        let serverUrl = "";
        for (let key in paramsEntry) {
            if (paramsEntry[key].indexOf(',')) {
                let valueArray = paramsEntry[key].split(',');
                for (let value of valueArray) {
                    serverUrl += key + "=" + value + "&";
                }
            } else {
                serverUrl += key + "=" + paramsEntry[key] + "&"
            }
            if (key === "ordering") {
                paramsEntry[key].indexOf('-') === 0 ? setSortOrder(-1) : setSortOrder(1);
                setSortField(paramsEntry[key].replace('-', ''));
            }
        }

        return serverUrl.slice(0, -1);
    }

    const onSortColumn = (e) => {
        let sortFieldValue = e.sortField.replaceAll('.', '__');
        let orderFieldValue = e.sortOrder;

        setSortField(sortFieldValue);
        setSortOrder(orderFieldValue);

        let webUrl = defineWebUrl(sortFieldValue, orderFieldValue);
        navigate({
            pathname: "",
            search: webUrl
        });

        let apiUrl = defineApiUrl(sortFieldValue, orderFieldValue);
        setApiFilterUrl(apiUrl);
    }

    useEffect(() => {
        if (Object.hasOwn(searchParamsEntry, 'test_instance')){
            setTestInstanceId(searchParamsEntry.test_instance)
        } else {
            navigate('/not-found')
        }
    }, [])

    useEffect(() => {
        if (testInstanceId !== null) {
            let url = convertUrl(searchParamsEntry)
            setApiFilterUrl(url);
            fetchTestRunsFilters(testInstanceId);
        }
    }, [testInstanceId])

    return (

        <div className="p-grid" style={{ width: '100%', padding: '5px' }}>
            {showFilters ?
                <div className="p-col-fixed" style={{ width: '16%' }}>
                    <Button label="Hide" onClick={() => setShowFilters(false)} icon="pi pi-angle-double-left" className="p-button-text p-button-sm p-button-plain" />
                    <Button onClick={searchTestRuns} className="p-button-info" style={{ marginTop: '5px', width: "100%", display: 'inline', fontWeight: 'bold' }}>Search</Button>
                    {testLineTypeCheckboxList}
                    {execTriggerCheckboxList}
                    {statusCheckboxList}
                    {fbCheckboxList}
                    {analyzerFilterNodes && analyzerFilterNodes.length !== 0 && Object.hasOwn(analyzerFilterNodes[0], 'children') && 
                     analyzerFilterNodes[0].children.length !== 0  ? analyzerCheckboxList : null}
                    <Button onClick={searchTestRuns} className="p-button-info" style={{ marginTop: '5px', width: "100%", display: 'inline', fontWeight: 'bold' }}>Search</Button>
                </div>
                :
                <div className="p-col-fixed" style={{ width: '55px' }}>
                    <Button onClick={() => setShowFilters(true)} icon="pi pi-angle-double-right" className="p-button-text p-button-sm p-button-plain" />
                </div>}

            {
                showFilters ?
                    <div className="p-col" style={{ width: '84%' }}>
                        <TestRunTableComponent filterUrl={apiFilterUrl} onSortColumn={onSortColumn} sortField={sortField} sortOrder={sortOrder}></TestRunTableComponent>
                    </div>
                    :
                    <div className="p-col" style={{ width: `calc(100 % - 55px)` }}>
                        <TestRunTableComponent filterUrl={apiFilterUrl} onSortColumn={onSortColumn} sortField={sortField} sortOrder={sortOrder}></TestRunTableComponent>
                    </div>
            }
        </div >
    )
}

export default TestRunsByTestInstance;