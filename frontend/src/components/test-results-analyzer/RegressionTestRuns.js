import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Tree } from 'primereact/tree';

import TestRunTableComponent from './TestRunTableComponent';

import { getTestRunsFilters } from '../../services/test-results-analyzer/test-runs.service';
import Notify, { AlertTypes, Successes, Errors } from '../../services/Notify.js';

import './RegressionTestRuns.css'
import { Button } from 'primereact/button';

let RegressionTestRuns = () => {

    const [regressionFiltersNodes, setRegressionFiltersNodes] = useState([]);
    const [expandedFilterKeys, setExpandedFilterKeys] = useState({});
    const [selectedFilterKeys, setSelectedFilterKeys] = useState(null);

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

    const [orderBy, setOrderBy] = useState(null);

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

    let fetchTestFilters = (data) => {
        if (regressionFiltersNodes.length === 0) {
            let filters = {
                key: 'reg_filters',
                label: 'Regression filters',
                data: 'Regression Filters',
                children: []
            }

            const filterChildren = data.map((item, index) => {
                return { key: item.pk, label: item.fields.name, data: item.model, children: [] }
            })
            filters.children = filterChildren;

            let nodesTmp = [...regressionFiltersNodes];

            nodesTmp.push(filters);
            expandAll(nodesTmp, setExpandedFilterKeys);

            if (Object.keys(searchParamsEntry).length !== 0 && searchParamsEntry[filters.key] !== undefined) {
                selectCheckboxesUsingUrlParams(nodesTmp, searchParamsEntry, setSelectedFilterKeys);
            }

            setRegressionFiltersNodes(nodesTmp)
        }
    }

    const fetchStatuses = (data) => {
        if (statusFilterNodes.length === 0) {
            let filters = {
                key: 'result',
                label: 'Result filters',
                data: 'Result Filters',
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

    let fetchTestRunsFilters = () => {
        getTestRunsFilters().then(
            (response) => {
                const data = response.data;
                fetchTestFilters(data['regfilters']);
                fetchStatuses(data['result']);
                fetchAnalyzers(data['analyzed_by']);
                fetchFBs(data['fb']);
            },
            (error) => {
                console.log(error);
                Notify.sendNotification(Errors.GET_TEST_RUNS, AlertTypes.error);
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

    const defineApiUrl = () => {
        let filterUrl = "";
        filterUrl += defineApiUrlFromSelectedFilter(selectedFilterKeys, "reg_filters");
        filterUrl += defineApiUrlFromSelectedFilter(selectedStatusKeys, "result");
        filterUrl += defineApiUrlFromSelectedFilter(selectedAnalyzerKeys, "analyzed_by");
        filterUrl += defineApiUrlFromSelectedFilter(selectedFbKeys, "fb");
        return filterUrl;
    }

    const defineWebUrl = () => {
        let filter = "";
        filter += defineWebUrlFromSelectedFilter(selectedFilterKeys, "reg_filters");
        filter += defineWebUrlFromSelectedFilter(selectedStatusKeys, "result");
        filter += defineWebUrlFromSelectedFilter(selectedAnalyzerKeys, "analyzed_by");
        filter += defineWebUrlFromSelectedFilter(selectedFbKeys, "fb");
        return filter;
    }

    const searchTestRuns = () => {
        console.log("search")
        let apiUrl = defineApiUrl().slice(0, -1);
        setApiFilterUrl(apiUrl);

        let webUrl = defineWebUrl().slice(0, -1);
        navigate({
            pathname: "",
            search: webUrl
        });
    }

    const testFiltersCheckboxList = (
        <div>
            <Tree value={regressionFiltersNodes} expandedKeys={expandedFilterKeys} selectionMode="checkbox" selectionKeys={selectedFilterKeys} onSelectionChange={e => setSelectedFilterKeys(e.value)} onToggle={e => setExpandedFilterKeys(e.value)} />
        </div>
    )

    const statusCheckboxList = (
        <div>
            <Tree value={statusFilterNodes} expandedKeys={expandedStatusKeys} selectionMode="checkbox" selectionKeys={selectedStatusKeys} onSelectionChange={e => setSelectedStatusKeys(e.value)} onToggle={e => setExpandedStatusKeys(e.value)} />
        </div>
    )

    const analyzerCheckboxList = (
        <div>
            <Tree value={analyzerFilterNodes} expandedKeys={expandedAnalyzerKeys} selectionMode="checkbox" selectionKeys={selectedAnalyzerKeys} onSelectionChange={e => setSelectedAnalyzerKeys(e.value)} onToggle={e => setExpandedAnalyzerKeys(e.value)} />
        </div>
    )

    const fbCheckboxList = (
        <div>
            <Tree value={fbFilterNodes} expandedKeys={expandedFbKeys} selectionMode="checkbox" selectionKeys={selectedFbKeys} onSelectionChange={e => setSelectedFbKeys(e.value)} onToggle={e => setExpandedFbKeys(e.value)} />
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
        }
        return serverUrl.slice(0, -1);
    }

    const onSort = (e) => {
        let orderColumn = e.sortField.replaceAll('.', '__');
        setOrderBy(orderColumn);
        searchTestRuns();
    }

    useEffect(() => {
        fetchTestRunsFilters();
        if (Object.keys(searchParamsEntry).length !== 0) {
            let url = convertUrl(searchParamsEntry)
            setApiFilterUrl(url);
        } else {
            setApiFilterUrl("");
        }
    }, [orderBy])

    return (

        <div className="wrapper">
            <aside>
                {testFiltersCheckboxList}
                {statusCheckboxList}
                {analyzerCheckboxList}
                {fbCheckboxList}
                <Button onClick={searchTestRuns} style={{ marginTop: '5px', width: "100%", display: 'inline', fontWeight: 'bold' }}>Search</Button>

            </aside>
            <main>
                <Card>
                    <TestRunTableComponent filterUrl={apiFilterUrl} onSort={onSort}></TestRunTableComponent>
                </Card>

            </main>
        </div >
    )
}

export default RegressionTestRuns;