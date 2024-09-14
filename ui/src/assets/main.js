/**
 * @param {string} id
 */
function $(id) {
  return document.getElementById(id);
}

const lc = LightweightCharts;

/**
 * Renders a lighweight chart in the given element
 * @param {HTMLElement | null} elem
 * @param {Array | null} data
 */
function renderStockIn(elem, data) {
  if (!data || !elem) {
    return;
  }

  data.sort((a, b) => a.time - b.time);
  data.forEach((e) => (e.time /= 1000));

  const chart = lc.createChart(elem, {
    layout: {
      background: { type: "solid", color: "#2A303C" },
      textColor: "#A6ADBA",
    },
    grid: {
      vertLines: { color: "#3D4451" },
      horzLines: { color: "#3D4451" },
    },
    timeScale: {
      timeVisible: true,
      secondsVisible: false,
      borderColor: "#3D4451",
    },
    rightPriceScale: {
      borderColor: "#3D4451",
    },
    crosshair: {
      mode: lc.CrosshairMode.Magnet,
      vertLine: {
        width: 1,
        color: "#6366F1",
        style: lc.LineStyle.Dashed,
      },
      horzLine: {
        width: 1,
        color: "#6366F1",
        style: lc.LineStyle.Dashed,
      },
    },
  });
  const series = chart.addAreaSeries({
    topColor: "rgba(99, 102, 241, 0.56)",
    bottomColor: "rgba(99, 102, 241, 0.04)",
    lineColor: "#818CF8",
    lineWidth: 2,
  });
  series.setData(data);

  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      chart.applyOptions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    }
  });

  resizeObserver.observe(elem);

  chart.timeScale().fitContent();
}

/**
 * @param {Object} elem
 */
function setDateToToday(elem) {
  let today = new Date().toISOString().split("T")[0];
  elem.value = today;
}
