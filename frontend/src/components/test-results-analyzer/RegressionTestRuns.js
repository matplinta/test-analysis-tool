import { useState, useEffect } from 'react';

import { Card } from 'primereact/card';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Checkbox } from 'primereact/checkbox';
import { MultiStateCheckbox } from 'primereact/multistatecheckbox';
import { Tree } from 'primereact/tree';

import TestRunTableComponent from './TestRunTableComponent';

import { getTestRunsFilters } from '../../services/test-results-analyzer/test-runs.service';

import './RegressionTestRuns.css'
import { Button } from 'primereact/button';

let RegressionTestRuns = () => {

    const [testRunsFilters, setTestRunsFilters] = useState({});

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

    const [filterUrl, setFilterUrl] = useState("");


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
            setRegressionFiltersNodes(nodesTmp)
        }
    }

    const fetchStatuses = (data) => {
        if (statusFilterNodes.length === 0) {
            let statusFilters = {
                key: 'result',
                label: 'Result filters',
                data: 'Result Filters',
                children: []
            }

            const filterChildren = data.map((item, index) => {
                return { key: item.pk, label: item.pk, data: item.pk, children: [] }
            })
            statusFilters.children = filterChildren;

            let nodesTmp = [...statusFilterNodes];
            nodesTmp.push(statusFilters);
            expandAll(nodesTmp, setExpandedStatusKeys)
            setStatusFiltersNode(nodesTmp);
        }
    }

    const fetchAnalyzers = (data) => {
        if (analyzerFilterNodes.length === 0) {
            let analyzerFilters = {
                key: 'analyzed_by',
                label: 'Analyzed By',
                data: 'Analyzed By',
                children: []
            }

            const filterChildren = data.map((item, index) => {
                return { key: item.fields.username, label: item.fields.username, data: item.fields.username, children: [] }
            })
            analyzerFilters.children = filterChildren;

            let nodesTmp = [...analyzerFilterNodes];
            nodesTmp.push(analyzerFilters);
            expandAll(nodesTmp, setExpandedAnalyzerKeys)
            setAnalyzerFilterNodes(nodesTmp);
        }
    }

    const fetchFBs = (data) => {
        if (fbFilterNodes.length === 0) {
            let fbFilters = {
                key: 'fb',
                label: 'Feature build',
                data: 'Feature build',
                children: []
            }

            const filterChildren = data.map((item, index) => {
                return { key: item.pk, label: item.pk, data: item.pk, children: [] }
            })
            fbFilters.children = filterChildren;

            let nodesTmp = [...fbFilterNodes];
            nodesTmp.push(fbFilters);
            expandAll(nodesTmp, setExpandedFbKeys)
            setFbFilterNodes(nodesTmp);
        }
    }

    let fetchTestRunsFilters = () => {
        getTestRunsFilters().then(
            (response) => {
                const data = response.data;
                setTestRunsFilters(data);
                fetchTestFilters(data['regfilters']);
                fetchStatuses(data['result']);
                fetchAnalyzers(data['analyzed_by']);
                fetchFBs(data['fb']);
            },
            (error) => {
                console.log(error);
            }
        )
    }

    const defineUrlFromSelectedFilter = (selectedKeys, filterName) => {
        let filterUrl = ""
        for (let key in selectedKeys) {
            if (key !== filterName) {
                filterUrl += filterName + "=" + key + "&";
            }
        }
        return filterUrl;
    }

    const searchTestRuns = () => {
        let filterUrl = "";
        filterUrl += defineUrlFromSelectedFilter(selectedFilterKeys, "reg_filters");
        filterUrl += defineUrlFromSelectedFilter(selectedStatusKeys, "result");
        filterUrl += defineUrlFromSelectedFilter(selectedAnalyzerKeys, "analyzed_by");
        filterUrl += defineUrlFromSelectedFilter(selectedFbKeys, "fb");
        filterUrl.slice(0, -1);
        setFilterUrl(filterUrl);
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

    useEffect(() => {
        fetchTestRunsFilters();
    }, [])

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
                    <TestRunTableComponent filterUrl={filterUrl}></TestRunTableComponent>
                </Card>

            </main>
        </div >
    )
}

export default RegressionTestRuns;