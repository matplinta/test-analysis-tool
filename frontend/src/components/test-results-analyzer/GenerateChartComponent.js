import { useState, useEffect } from 'react';
import { Chart } from 'primereact/chart';

import { getChartFromSavedFilterSet, postToGetChartFromTemporaryDefinedFilterSet }
    from './../../services/test-results-analyzer/statistics.service';

let GenerateChartComponent = ({ selectedFilterSet, filters, datesPeriod, setBlockedPanel, setChartLoaded }) => {

    const [chartData, setChartData] = useState(null);

    const [loading, setLoading] = useState(false);

    let [dataTemplate, setDataTemplate] = useState({
        "labels": [],
        "datasets": [{
            "label": "",
            "data": []
        }]
    })

    const fetchChartFromSavedFilterSet = (filterSetId, dates) => {
        setBlockedPanel(true);
        getChartFromSavedFilterSet(filterSetId, dates).then(
            (results) => {
                setChartData(results.data);
                setDataTemplate({
                    "labels": results.data.labels,
                    "datasets": [{
                        "label": results.data.info,
                        "data": results.data.Occurrences
                    }]
                })
                setBlockedPanel(false);
                setChartLoaded(true);
            }, (error) => {
                setBlockedPanel(false);
            })
    }

    const fetchChartFromTemporaryFilterSet = (filtersList, dates) => {
        setBlockedPanel(true);
        postToGetChartFromTemporaryDefinedFilterSet(filtersList, dates).then(
            (results) => {
                setChartData(results.data);

                setDataTemplate({
                    "labels": results.data.labels,
                    "datasets": [{
                        "label": results.data.info,
                        "data": results.data.occurrences
                    }]
                })
                setBlockedPanel(false);
            }, (error) => {
                setBlockedPanel(false);
            })
    }

    let horizontalOptions = {
        indexAxis: 'y',
        maintainAspectRatio: false,
        aspectRatio: 0.4,
        plugins: {
            legend: {
                labels: {
                    color: '#202020'
                }
            },
            title: {
                display: true,
                text: 'Failed test runs from RP by error type',
                size: 20,
                padding: {
                    top: 10,
                    bottom: 30
                },
                font: {
                    weight: 'bold',
                    size: 30
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let value = context.formattedValue || '';
                        return "Occurrences: " + value;
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Occurrences",
                    font: {
                        weight: 'bold',
                        size: 16
                    },
                    padding: {
                        top: 20
                    },
                },
                beginAtZero: true,
                ticks: {
                    color: '#495057'
                },
                grid: {
                    offset: true,
                    color: '#ebedef'
                }
            },
            y: {
                ticks: {
                    color: '#495057'
                },
                grid: {
                    offset: true,
                    color: '#ebedef'
                }
            }
        },
        elements: {
            bar: {
                borderWidth: 2,
                backgroundColor: '#ccebff',
                borderColor: '#008ae6'
            }
        },
        responsive: true,
    };

    useEffect(() => {
        if (selectedFilterSet !== null) {
            fetchChartFromSavedFilterSet(selectedFilterSet.id, datesPeriod);
        }
        else {
            fetchChartFromTemporaryFilterSet(filters, datesPeriod);
        }
    }, [])

    return (
        <>
            <Chart type="bar" data={dataTemplate} options={horizontalOptions} className="ml-3 mr-3 mt-2 mb-6" />
        </>
    )
}

export default GenerateChartComponent;