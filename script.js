let chartInstance;
const runSimulation = function () {
    var tts_time = parseFloat(document.getElementById('tts_time').value);
    var min_concurrent = parseInt(document.getElementById('min_concurrent').value);
    var max_concurrent = parseInt(document.getElementById('max_concurrent').value);
    var concurrency_limit = parseInt(document.getElementById('concurrency_limit').value);
    var turns_per_minute = parseInt(document.getElementById('turns_per_minute').value);
    var steps = parseInt(document.getElementById('steps').value);

    var avgMaxs = [];
    var avgCounts = [];
    var concurrentSteps = [];

    for (var total_concurrent_calls = min_concurrent; total_concurrent_calls <= max_concurrent; total_concurrent_calls += 10) {
        var fires = [];

        for (var i = 0; i < steps; i++) {
            fires[i] = [];
            for (var j = 0; j < total_concurrent_calls; j++) {
                fires[i][j] = [];
                var random_60_sec_offset = (Math.random() * 60);
                var turn_interval_per_min = (60 / turns_per_minute);
                for (var k = 0; k < turns_per_minute; k++) {
                    var fire = (Math.random() * turn_interval_per_min) + (k * turn_interval_per_min) + random_60_sec_offset;
                    fires[i][j].push({ index: j + '_' + k, start: parseFloat(fire.toFixed(2)), end: parseFloat((fire + tts_time).toFixed(2)) });
                }
            }
        }

        var step_counts = [];
        var step_maxs = [];
        for (var i = 0; i < fires.length; i++) {
            var concurrent_steps = {};
            for (var j = 0; j < fires[i].length; j++) {
                for (var k = 0; k < fires[i][j].length; k++) {
                    var current = fires[i][j][k];
                    for (var jj = j; jj < fires[i].length; jj++) {
                        for (var kk = 0; kk < fires[i][jj].length; kk++) {
                            if (jj != j) {
                                var compare = fires[i][jj][kk];
                                if ((current.start >= compare.start && current.start <= compare.end) || (compare.end <= current.end && compare.end >= current.start)) {
                                    if (!concurrent_steps['' + compare.start]) {
                                        concurrent_steps['' + compare.start] = {};
                                        concurrent_steps['' + compare.start].count = 0;
                                        concurrent_steps['' + compare.start].items = [];
                                        concurrent_steps['' + compare.start].items.push(current);
                                    }
                                    concurrent_steps['' + compare.start].count++;
                                    concurrent_steps['' + compare.start].items.push(compare);
                                }
                            }
                        }
                    }
                }
            }

            var keys = Object.keys(concurrent_steps);
            var counts = [];

            for (var d = 0; d < keys.length; d++) {
                var count = concurrent_steps[keys[d]].count;
                counts.push(parseInt(count));
            }

            counts.sort(function (a, b) {
                return a - b;
            });
            counts.reverse();
            var countRate = counts.filter(num => num > concurrency_limit).length;
            var max = Math.max(...counts);
            step_counts.push(countRate);
            step_maxs.push(max);
        }

        const maxSum = step_maxs.reduce((acc, num) => acc + num, 0);
        var maxAvg = maxSum / step_maxs.length;
        const countSum = step_counts.reduce((acc, num) => acc + num, 0);
        var countAvg = countSum / step_counts.length;

        avgMaxs.push(maxAvg);
        avgCounts.push(countAvg);
        concurrentSteps.push(total_concurrent_calls);
    }

    plotResults(concurrentSteps, avgMaxs, avgCounts);
}

function plotResults(concurrentSteps, avgMaxs, avgCounts) {
    var ctx = document.getElementById('resultsChart').getContext('2d');
    // Destroy the existing chart instance before creating a new one
    if (chartInstance) {
        chartInstance.destroy();
    }
    chartInstance = new Chart(ctx, {
        type: 'line',
        interaction: {
        mode: 'index',
        intersect: false,
        },
        stacked: false,
        data: {
            labels: concurrentSteps,
            datasets: [
                {
                    label: 'Avg Max Concurrent Requests',
                    data: avgMaxs,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: false,
                    yAxisID: 'y-axis-1'
                },
                {
                    label: 'Avg # Rate Limit Hits',
                    data: avgCounts,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    fill: false,
                    yAxisID: 'y-axis-2'
                }
            ]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Concurrent Calls'
                    }
                },
                'y-axis-1': {
                    id: 'y-axis-1',
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Avg Max Concurrent Requests'
                    },
                    beginAtZero: true
                },
                'y-axis-2':{
                    id: 'y-axis-2',
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Avg # Rate Limit Hits'
                    },
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false, // removes gridlines from second axis
                    }
                }
            }
        }
    });
}