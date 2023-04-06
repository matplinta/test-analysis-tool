// Description: File is responsible for chart generation based on filters list
// HISTORY
// --------------------------------------------------------------------------
//   Date                    Author                     Bug                 List of changes
//  --------------------------------------------------------------------------


import { Chart } from 'primereact/chart';

let GenerateChartComponent = ({ chartDataTemplate }) => {

    let horizontalOptions = {
        indexAxis: 'y',
        maintainAspectRatio: true,
        aspectRatio: 2,
        plugins: {
            legend: {
                labels: {
                    color: '#202020'
                }
            },
            title: {
                display: true,
                text: 'Test runs from RP by error type',
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

    return (
        <>
            <Chart type="bar" data={chartDataTemplate} options={horizontalOptions} className="ml-3 mr-3 mt-2 mb-6" />
        </>
    )
}

export default GenerateChartComponent;