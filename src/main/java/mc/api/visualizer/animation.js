let runs = [];

let animationFrame = null;
let startTime = null;
let isPlaying = false;
let currentIndex = 0;

const RUN_INTERVAL = 100;

// --------------------------------------------------
// DOM
// --------------------------------------------------

const chart = document.getElementById("chart");
const histogram = document.getElementById("histogram");

const playButton = document.getElementById("playButton");
const resetButton = document.getElementById("resetButton");
const timeline = document.getElementById("timeline");

const runNumber = document.getElementById("runNumber");
const currentTime = document.getElementById("currentTime");
const personalBest = document.getElementById("personalBest");

const phase = document.getElementById("phase");
const stageTitle = document.getElementById("stageTitle");

const distributionSummary =
    document.getElementById("distributionSummary");

const dataPreview =
    document.getElementById("dataPreview");


// --------------------------------------------------
// LOAD DATA
// --------------------------------------------------

async function loadRuns() {
    try {
        const response = await fetch("./runs.json");

        if (!response.ok) {
            throw new Error("Could not load runs.json");
        }

        runs = await response.json();

        if (!Array.isArray(runs) || runs.length === 0) {
            throw new Error("runs.json does not contain any runs.");
        }

        // Make sure the data looks valid.
        runs = runs.filter(run =>
            typeof run.run === "number" &&
            typeof run.time === "number"
        );

        if (runs.length === 0) {
            throw new Error("No valid runs were found in runs.json.");
        }

        // Configure timeline.
        timeline.max = runs.length - 1;
        timeline.value = 0;

        // Show JSON in the data section.
        dataPreview.textContent = JSON.stringify(runs, null, 2);

        // Draw initial state.
        drawChart([runs[0]]);
        drawHistogram(runs);

        updateStats(0);

        phase.textContent = "READY";
        stageTitle.textContent = "Run progression";

    } catch (error) {
        console.error(error);

        phase.textContent = "ERROR";
        stageTitle.textContent = "Could not load runs";

        runNumber.textContent = "—";
        currentTime.textContent = "—";
        personalBest.textContent = "—";
    }
}


// --------------------------------------------------
// ANIMATION
// --------------------------------------------------

function animate(timestamp) {
    if (!isPlaying) {
        return;
    }

    if (startTime === null) {
        startTime = timestamp;
    }

    const elapsed = timestamp - startTime;

    const visibleRuns = Math.min(
        runs.length,
        Math.floor(elapsed / RUN_INTERVAL) + 1
    );

    currentIndex = visibleRuns - 1;

    drawChart(runs.slice(0, visibleRuns));
    updateStats(currentIndex);

    timeline.value = currentIndex;

    if (visibleRuns < runs.length) {
        animationFrame = requestAnimationFrame(animate);
    } else {
        finishAnimation();
    }
}


// --------------------------------------------------
// START
// --------------------------------------------------

function startAnimation() {
    if (runs.length === 0) {
        return;
    }

    // If already at the end, start again from the beginning.
    if (currentIndex >= runs.length - 1) {
        currentIndex = 0;
        drawChart([runs[0]]);
        updateStats(0);
        timeline.value = 0;
    }

    isPlaying = true;
    startTime = null;

    playButton.textContent = "❚❚ Pause";
    phase.textContent = "RUNNING";
    stageTitle.textContent = "Run progression";

    animationFrame = requestAnimationFrame(animate);
}


// --------------------------------------------------
// PAUSE
// --------------------------------------------------

function pauseAnimation() {
    isPlaying = false;

    if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }

    playButton.textContent = "▶ Play";
    phase.textContent = "PAUSED";
}


// --------------------------------------------------
// FINISH
// --------------------------------------------------

function finishAnimation() {
    isPlaying = false;

    if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }

    currentIndex = runs.length - 1;

    playButton.textContent = "↻ Replay";
    phase.textContent = "COMPLETE";
    stageTitle.textContent = "All runs completed";

    drawChart(runs);
    updateStats(currentIndex);
    timeline.value = currentIndex;
}


// --------------------------------------------------
// RESET
// --------------------------------------------------

function resetAnimation() {
    pauseAnimation();

    currentIndex = 0;
    startTime = null;

    timeline.value = 0;

    drawChart([runs[0]]);
    updateStats(0);

    phase.textContent = "READY";
    stageTitle.textContent = "Run progression";

    playButton.textContent = "▶ Play";
}


// --------------------------------------------------
// PLAY BUTTON
// --------------------------------------------------

playButton.addEventListener("click", () => {
    if (isPlaying) {
        pauseAnimation();
    } else {
        startAnimation();
    }
});


// --------------------------------------------------
// RESET BUTTON
// --------------------------------------------------

resetButton.addEventListener("click", () => {
    resetAnimation();
});


// --------------------------------------------------
// TIMELINE
// --------------------------------------------------

timeline.addEventListener("input", () => {
    pauseAnimation();

    const index = Number(timeline.value);

    currentIndex = index;

    drawChart(runs.slice(0, index + 1));
    updateStats(index);

    if (index === 0) {
        phase.textContent = "READY";
        stageTitle.textContent = "Run progression";
    } else if (index === runs.length - 1) {
        phase.textContent = "COMPLETE";
        stageTitle.textContent = "All runs completed";
        playButton.textContent = "↻ Replay";
    } else {
        phase.textContent = "SCRUBBING";
        stageTitle.textContent = "Run progression";
    }
});


// --------------------------------------------------
// UPDATE HEADER STATS
// --------------------------------------------------

function updateStats(index) {
    if (!runs[index]) {
        return;
    }

    const run = runs[index];

    const times = runs
        .slice(0, index + 1)
        .map(item => item.time);

    const pb = Math.min(...times);

    runNumber.textContent = run.run;
    currentTime.textContent = formatTime(run.time);
    personalBest.textContent = formatTime(pb);

    updatePhase(index);
}


// --------------------------------------------------
// PHASE LABEL
// --------------------------------------------------

function updatePhase(index) {
    if (index === 0) {
        phase.textContent = "READY";
        return;
    }

    if (index === runs.length - 1 && !isPlaying) {
        phase.textContent = "COMPLETE";
        return;
    }

    const run = runs[index];

    const previousRuns = runs.slice(0, index);

    const previousBest = Math.min(
        ...previousRuns.map(item => item.time)
    );

    if (run.time < previousBest) {
        phase.textContent = "NEW PB";
    } else {
        phase.textContent = "RUNNING";
    }
}


// --------------------------------------------------
// FORMAT TIME
// --------------------------------------------------

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) {
        return "—";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds - minutes * 60;

    return `${minutes}:${remainingSeconds
        .toFixed(1)
        .padStart(4, "0")}`;
}


// --------------------------------------------------
// MAIN CHART
// --------------------------------------------------

function drawChart(visibleRuns) {
    if (!visibleRuns || visibleRuns.length === 0) {
        return;
    }

    const width = 1600;
    const height = 760;

    const margin = {
        top: 55,
        right: 80,
        bottom: 90,
        left: 110
    };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const allTimes = runs.map(run => run.time);

    const minTime = Math.min(...allTimes);
    const maxTime = Math.max(...allTimes);

    const padding = Math.max(
        5,
        (maxTime - minTime) * 0.18
    );

    const yMin = minTime - padding;
    const yMax = maxTime + padding;

    const x = index => {
        if (runs.length === 1) {
            return margin.left + chartWidth / 2;
        }

        return (
            margin.left +
            (index / (runs.length - 1)) * chartWidth
        );
    };

    const y = time => {
        return (
            margin.top +
            ((time - yMax) / (yMin - yMax)) *
                chartHeight
        );
    };

    // Clear chart.
    chart.innerHTML = "";

    // ------------------------------------------------
    // DEFINITIONS
    // ------------------------------------------------

    const defs = svgElement("defs");

    const gradient = svgElement("linearGradient");

    gradient.setAttribute("id", "chartGradient");
    gradient.setAttribute("x1", "0");
    gradient.setAttribute("x2", "0");
    gradient.setAttribute("y1", "0");
    gradient.setAttribute("y2", "1");

    const stop1 = svgElement("stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "#ffffff");
    stop1.setAttribute("stop-opacity", "0.12");

    const stop2 = svgElement("stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", "#ffffff");
    stop2.setAttribute("stop-opacity", "0");

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);

    defs.appendChild(gradient);
    chart.appendChild(defs);


    // ------------------------------------------------
    // BACKGROUND GRID
    // ------------------------------------------------

    const gridSteps = 6;

    for (let i = 0; i <= gridSteps; i++) {
        const value =
            yMin +
            (i / gridSteps) * (yMax - yMin);

        const yPosition = y(value);

        const line = svgElement("line");

        line.setAttribute("x1", margin.left);
        line.setAttribute("x2", width - margin.right);
        line.setAttribute("y1", yPosition);
        line.setAttribute("y2", yPosition);
        line.setAttribute("class", "grid");

        chart.appendChild(line);

        const label = svgElement("text");

        label.setAttribute("x", margin.left - 18);
        label.setAttribute("y", yPosition + 8);
        label.setAttribute("text-anchor", "end");
        label.setAttribute("class", "axis");

        label.textContent = formatTime(value);

        chart.appendChild(label);
    }


    // ------------------------------------------------
    // X AXIS
    // ------------------------------------------------

    const xAxisY = height - margin.bottom;

    const xAxis = svgElement("line");

    xAxis.setAttribute("x1", margin.left);
    xAxis.setAttribute("x2", width - margin.right);
    xAxis.setAttribute("y1", xAxisY);
    xAxis.setAttribute("y2", xAxisY);
    xAxis.setAttribute("class", "grid");

    chart.appendChild(xAxis);


    // ------------------------------------------------
    // X LABELS
    // ------------------------------------------------

    const labelCount = Math.min(10, runs.length);

    for (let i = 0; i < labelCount; i++) {
        const index = Math.round(
            (i / Math.max(1, labelCount - 1)) *
            (runs.length - 1)
        );

        const xPosition = x(index);

        const label = svgElement("text");

        label.setAttribute("x", xPosition);
        label.setAttribute("y", xAxisY + 40);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("class", "axis");

        label.textContent = `Run ${runs[index].run}`;

        chart.appendChild(label);
    }


    // ------------------------------------------------
    // AXIS TITLES
    // ------------------------------------------------

    const yTitle = svgElement("text");

    yTitle.setAttribute("x", 30);
    yTitle.setAttribute("y", margin.top);
    yTitle.setAttribute("class", "axis-title");

    yTitle.textContent = "TIME";

    chart.appendChild(yTitle);


    const xTitle = svgElement("text");

    xTitle.setAttribute("x", width - margin.right);
    xTitle.setAttribute("y", height - 20);
    xTitle.setAttribute("text-anchor", "end");
    xTitle.setAttribute("class", "axis-title");

    xTitle.textContent = "RUN";

    chart.appendChild(xTitle);


    // ------------------------------------------------
    // PERSONAL BEST
    // ------------------------------------------------

    let bestSoFar = Infinity;
    let pbPoints = [];

    visibleRuns.forEach((run, index) => {
        bestSoFar = Math.min(bestSoFar, run.time);

        pbPoints.push({
            x: x(index),
            y: y(bestSoFar)
        });
    });

    if (pbPoints.length > 0) {
        const pbPath = createPath(pbPoints);

        pbPath.setAttribute("class", "pb-line");

        chart.appendChild(pbPath);

        const finalPB = pbPoints[pbPoints.length - 1];

        const pbDot = svgElement("circle");

        pbDot.setAttribute("cx", finalPB.x);
        pbDot.setAttribute("cy", finalPB.y);
        pbDot.setAttribute("r", 8);
        pbDot.setAttribute("class", "pb-dot");

        chart.appendChild(pbDot);

        const pbLabel = svgElement("text");

        pbLabel.setAttribute(
            "x",
            finalPB.x - 12
        );

        pbLabel.setAttribute(
            "y",
            finalPB.y - 18
        );

        pbLabel.setAttribute(
            "text-anchor",
            "end"
        );

        pbLabel.setAttribute(
            "class",
            "pb-badge"
        );

        pbLabel.textContent = "PB";

        chart.appendChild(pbLabel);
    }


    // ------------------------------------------------
    // RUN LINE
    // ------------------------------------------------

    const points = visibleRuns.map((run, index) => ({
        x: x(index),
        y: y(run.time)
    }));

    if (points.length > 1) {
        const path = createPath(points);

        path.setAttribute("class", "run-line");

        chart.appendChild(path);
    }


    // ------------------------------------------------
    // CURRENT GUIDE
    // ------------------------------------------------

    const currentPoint = points[points.length - 1];

    const guide = svgElement("line");

    guide.setAttribute(
        "x1",
        currentPoint.x
    );

    guide.setAttribute(
        "x2",
        currentPoint.x
    );

    guide.setAttribute(
        "y1",
        currentPoint.y
    );

    guide.setAttribute(
        "y2",
        xAxisY
    );

    guide.setAttribute(
        "class",
        "guide"
    );

    chart.appendChild(guide);


    // ------------------------------------------------
    // POINTS
    // ------------------------------------------------

    visibleRuns.forEach((run, index) => {
        const point = points[index];

        const circle = svgElement("circle");

        circle.setAttribute("cx", point.x);
        circle.setAttribute("cy", point.y);

        const isCurrent =
            index === visibleRuns.length - 1;

        circle.setAttribute(
            "r",
            isCurrent ? 10 : 6
        );

        circle.setAttribute(
            "class",
            isCurrent
                ? "current-dot"
                : "dot"
        );

        chart.appendChild(circle);
    });


    // ------------------------------------------------
    // CURRENT LABEL
    // ------------------------------------------------

    const currentRun =
        visibleRuns[visibleRuns.length - 1];

    const currentLabel =
        svgElement("text");

    currentLabel.setAttribute(
        "x",
        currentPoint.x
    );

    currentLabel.setAttribute(
        "y",
        currentPoint.y - 24
    );

    currentLabel.setAttribute(
        "text-anchor",
        "middle"
    );

    currentLabel.setAttribute(
        "class",
        "point-label"
    );

    currentLabel.textContent =
        formatTime(currentRun.time);

    chart.appendChild(currentLabel);


    // ------------------------------------------------
    // RUN NUMBER BELOW CURRENT POINT
    // ------------------------------------------------

    const runLabel = svgElement("text");

    runLabel.setAttribute(
        "x",
        currentPoint.x
    );

    runLabel.setAttribute(
        "y",
        currentPoint.y + 42
    );

    runLabel.setAttribute(
        "text-anchor",
        "middle"
    );

    runLabel.setAttribute(
        "class",
        "axis"
    );

    runLabel.textContent =
        `Run ${currentRun.run}`;

    chart.appendChild(runLabel);
}


// --------------------------------------------------
// CREATE SVG PATH
// --------------------------------------------------

function createPath(points) {
    const path = svgElement("path");

    if (points.length === 0) {
        return path;
    }

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
        const previous = points[i - 1];
        const current = points[i];

        const controlX =
            (previous.x + current.x) / 2;

        d += `
            C ${controlX} ${previous.y},
              ${controlX} ${current.y},
              ${current.x} ${current.y}
        `;
    }

    path.setAttribute("d", d);

    return path;
}


// --------------------------------------------------
// HISTOGRAM
// --------------------------------------------------

function drawHistogram(data) {
    if (!data || data.length === 0) {
        return;
    }

    const width = 1600;
    const height = 500;

    const margin = {
        top: 35,
        right: 60,
        bottom: 70,
        left: 80
    };

    const chartWidth =
        width - margin.left - margin.right;

    const chartHeight =
        height - margin.top - margin.bottom;

    histogram.innerHTML = "";

    const times = data.map(run => run.time);

    const min = Math.min(...times);
    const max = Math.max(...times);

    const range = Math.max(1, max - min);

    // About 8 bins works nicely for small datasets,
    // while larger datasets get more detail.
    const binCount = Math.min(
        12,
        Math.max(5, Math.ceil(Math.sqrt(data.length)))
    );

    const binSize = range / binCount;

    const bins = Array.from(
        { length: binCount },
        (_, index) => ({
            min: min + index * binSize,
            max: min + (index + 1) * binSize,
            count: 0
        })
    );

    times.forEach(time => {
        let index = Math.floor(
            (time - min) / binSize
        );

        if (index >= binCount) {
            index = binCount - 1;
        }

        bins[index].count++;
    });

    const maxCount = Math.max(
        ...bins.map(bin => bin.count),
        1
    );

    const barGap = 8;

    const barWidth =
        chartWidth / binCount - barGap;

    // ------------------------------------------------
    // GRID
    // ------------------------------------------------

    const gridSteps = Math.max(
        1,
        Math.min(5, maxCount)
    );

    for (let i = 0; i <= gridSteps; i++) {
        const count =
            (i / gridSteps) * maxCount;

        const y =
            margin.top +
            chartHeight -
            (count / maxCount) *
                chartHeight;

        const line = svgElement("line");

        line.setAttribute(
            "x1",
            margin.left
        );

        line.setAttribute(
            "x2",
            width - margin.right
        );

        line.setAttribute("y1", y);
        line.setAttribute("y2", y);

        line.setAttribute("class", "grid");

        histogram.appendChild(line);

        const label = svgElement("text");

        label.setAttribute(
            "x",
            margin.left - 14
        );

        label.setAttribute(
            "y",
            y + 6
        );

        label.setAttribute(
            "text-anchor",
            "end"
        );

        label.setAttribute(
            "class",
            "axis"
        );

        label.textContent =
            Math.round(count);

        histogram.appendChild(label);
    }


    // ------------------------------------------------
    // BARS
    // ------------------------------------------------

    bins.forEach((bin, index) => {
        const barHeight =
            (bin.count / maxCount) *
            chartHeight;

        const x =
            margin.left +
            index *
                (chartWidth / binCount) +
            barGap / 2;

        const y =
            margin.top +
            chartHeight -
            barHeight;

        const rect =
            svgElement("rect");

        rect.setAttribute("x", x);
        rect.setAttribute("y", y);

        rect.setAttribute(
            "width",
            Math.max(0, barWidth)
        );

        rect.setAttribute(
            "height",
            barHeight
        );

        rect.setAttribute(
            "class",
            "hist-bar"
        );

        histogram.appendChild(rect);


        // X label
        const label =
            svgElement("text");

        label.setAttribute(
            "x",
            x + barWidth / 2
        );

        label.setAttribute(
            "y",
            height - margin.bottom + 35
        );

        label.setAttribute(
            "text-anchor",
            "middle"
        );

        label.setAttribute(
            "class",
            "axis"
        );

        label.textContent =
            formatTime(bin.min);

        histogram.appendChild(label);


        // Count
        if (bin.count > 0) {
            const countLabel =
                svgElement("text");

            countLabel.setAttribute(
                "x",
                x + barWidth / 2
            );

            countLabel.setAttribute(
                "y",
                y - 10
            );

            countLabel.setAttribute(
                "text-anchor",
                "middle"
            );

            countLabel.setAttribute(
                "class",
                "axis"
            );

            countLabel.textContent =
                bin.count;

            histogram.appendChild(
                countLabel
            );
        }
    });


    // ------------------------------------------------
    // AXIS TITLES
    // ------------------------------------------------

    const xTitle = svgElement("text");

    xTitle.setAttribute(
        "x",
        width - margin.right
    );

    xTitle.setAttribute(
        "y",
        height - 10
    );

    xTitle.setAttribute(
        "text-anchor",
        "end"
    );

    xTitle.setAttribute(
        "class",
        "axis-title"
    );

    xTitle.textContent = "TIME";

    histogram.appendChild(xTitle);


    const yTitle = svgElement("text");

    yTitle.setAttribute(
        "x",
        25
    );

    yTitle.setAttribute(
        "y",
        margin.top
    );

    yTitle.setAttribute(
        "class",
        "axis-title"
    );

    yTitle.textContent = "RUNS";

    histogram.appendChild(yTitle);


    // ------------------------------------------------
    // SUMMARY
    // ------------------------------------------------

    const best = Math.min(...times);
    const worst = Math.max(...times);

    const average =
        times.reduce(
            (sum, value) => sum + value,
            0
        ) / times.length;

    distributionSummary.textContent =
        `${data.length} runs · avg ${formatTime(average)} · best ${formatTime(best)} · worst ${formatTime(worst)}`;
}


// --------------------------------------------------
// SVG HELPER
// --------------------------------------------------

function svgElement(name) {
    return document.createElementNS(
        "http://www.w3.org/2000/svg",
        name
    );
}


// --------------------------------------------------
// START
// --------------------------------------------------

loadRuns().catch(error => {
    console.error(
        "Speedrun Visualizer error:",
        error
    );
});
