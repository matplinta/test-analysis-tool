import { useState, useEffect } from 'react';

import { Card } from 'primereact/card';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Checkbox } from 'primereact/checkbox';
import { MultiStateCheckbox } from 'primereact/multistatecheckbox';
import { Tree } from 'primereact/tree';

import TestRunTableComponent from './TestRunTableComponent';

import { getTestFilters } from '../../services/test-results-analyzer/test-filters.service';

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

    const [filterUrl, setFilterUrl] = useState(null);


    const expandAll = (nodesList, setExpanded) => {
        console.log("Expand all")
        let _expandedKeys = {};
        for (let node of nodesList) {
            expandNode(node, _expandedKeys);
        }
        console.log(_expandedKeys)
        setExpanded(_expandedKeys);
    }

    const expandNode = (node, _expandedKeys) => {
        console.log("tuuuuu")
        console.log(node)
        console.log(_expandedKeys)
        if (node.children && node.children.length) {
            _expandedKeys[node.key] = true;

            for (let child of node.children) {
                expandNode(child, _expandedKeys);
            }
        }
    }

    let fetchTestFilters = () => {
        getTestFilters().then(
            (response) => {
                if (regressionFiltersNodes.length === 0) {
                    let filters = {
                        key: 'regression_filters',
                        label: 'Regression filters',
                        data: 'Regression Filters',
                        children: []
                    }

                    const filterChildren = response.data.results.map((item, index) => {
                        return { key: item.id + index, label: item.name, data: item.id, children: [] }
                    })
                    filters.children = filterChildren;

                    let nodesTmp = [...regressionFiltersNodes];

                    nodesTmp.push(filters);
                    expandAll(nodesTmp, setExpandedFilterKeys);
                    setRegressionFiltersNodes(nodesTmp)
                }

            },
            (error) => {
                console.log(error);
            }
        )
    }

    const fetchStatuses = () => {
        if (statusFilterNodes.length === 0) {
            let statusFilters = {
                key: 'status_filters',
                label: 'Status filters',
                data: 'Status Filters',
                children: [{
                    key: 'not_analyzed',
                    label: 'Not analyzed',
                    data: 'Not analyzed',
                }, {
                    key: 'env_issue',
                    label: 'Environment issue',
                    data: 'Environment issue',
                }]
            }
            let nodesTmp = [...statusFilterNodes];
            nodesTmp.push(statusFilters);
            expandAll(nodesTmp, setExpandedStatusKeys)
            setStatusFiltersNode(nodesTmp);
        }
    }

    const fetchAnalyzers = () => {
        if (analyzerFilterNodes.length === 0) {
            let analyzerFilters = {
                key: 'analized_by',
                label: 'Analized By',
                data: 'Analized By',
                children: [{
                    key: 'tester1',
                    label: 'tester 1',
                    data: 'tester 1',
                }, {
                    key: 'env_issue',
                    label: 'automat',
                    data: 'automat',
                }]
            }
            let nodesTmp = [...analyzerFilterNodes];
            nodesTmp.push(analyzerFilters);
            expandAll(nodesTmp, setExpandedAnalyzerKeys)
            setAnalyzerFilterNodes(nodesTmp);
        }
    }

    const fetchFBs = () => {
        if (fbFilterNodes.length === 0) {
            let fbFilters = {
                key: 'feature_build',
                label: 'Feature build',
                data: 'Feature build',
                children: [{
                    key: 'FB2208',
                    label: 'FB2208',
                    data: 'FB2208',
                }, {
                    key: 'FB2207',
                    label: 'FB2207',
                    data: 'FB2207',
                }]
            }
            let nodesTmp = [...fbFilterNodes];
            nodesTmp.push(fbFilters);
            expandAll(nodesTmp, setExpandedFbKeys)
            setFbFilterNodes(nodesTmp);
        }
    }

    const searchTestRuns = () => {
        console.log(selectedFilterKeys)
        let filterUrl = "?";
        for (let key in selectedFilterKeys) {
            if (key !== "regression_filters") {
                filterUrl += "regression_filters" + "=" + key + "&";
            }
        }
        console.log(filterUrl)
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
        fetchTestFilters();
        fetchStatuses();
        fetchAnalyzers();
        fetchFBs();
    }, [])

    return (

        <div className="wrapper">
            <aside>
                {testFiltersCheckboxList}
                {statusCheckboxList}
                {analyzerCheckboxList}
                {fbCheckboxList}
                <br />
                <Button onClick={searchTestRuns}>Search</Button>
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