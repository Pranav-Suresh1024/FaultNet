import { metric } from './results.js';

export function renderCharts(document, view) {
  const make = (name, attributes, text) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const canvas = (height, label) => make('svg', { viewBox: '0 0 620 ' + height, role: 'img', 'aria-label': label });
  const empty = (id, text) => {
    const node = document.createElement('p'); node.className = 'empty-chart'; node.textContent = text;
    document.getElementById(id).replaceChildren(node);
  };
  const chart = view.chart;
  const median = canvas(210, 'Median full-response time in milliseconds. ' + chart.map(item =>
    item.phase + ': ' + (item.medianMs === null ? 'no successful probes' : metric(item.medianMs) + ' ms')).join('. '));
  const maximum = Math.max(1, ...chart.map(item => item.medianMs ?? 0));
  chart.forEach((item, index) => {
    const y = 16 + index * 65, width = (item.medianMs ?? 0) / maximum * 420;
    median.append(make('text', { x: 0, y: y + 16 }, item.phase[0].toUpperCase() + item.phase.slice(1)),
      make('text', { x: 0, y: y + 35, class: 'sample-label' }, item.successes + '/' + item.eligible + ' successful'));
    if (item.medianMs === null) median.append(make('text', { x: 105, y: y + 16 }, 'No successful probes'));
    else median.append(make('rect', { x: 105, y, width: 420, height: 20, rx: 3, class: 'chart-track' }),
      make('rect', { x: 105, y, width, height: 20, rx: 3, class: 'chart-' + item.phase }),
      make('text', { x: 105 + width + 10, y: y + 16 }, metric(item.medianMs)));
  });
  document.getElementById('latency-chart').replaceChildren(median);

  if (!view.probes.length) empty('probe-chart', 'No attempts in this phase yet.');
  else {
    const plot = canvas(230, view.phase + ' attempt durations in milliseconds. Circles: successful; crosses: failed; squares: cancelled. Exact values are in the probe table.');
    const peak = Math.max(1, ...view.probes.map(item => item.elapsedMs ?? 0));
    plot.append(make('line', { x1: 50, y1: 20, x2: 50, y2: 175, class: 'chart-axis' }),
      make('line', { x1: 50, y1: 175, x2: 585, y2: 175, class: 'chart-axis' }),
      make('text', { x: 0, y: 28, class: 'sample-label' }, metric(peak)),
      make('text', { x: 25, y: 179, class: 'sample-label' }, '0'),
      make('text', { x: 50, y: 215 }, 'Attempt number · elapsed ms; see table for exact outcomes'));
    view.probes.forEach((item, index) => {
      const x = 65 + index / Math.max(1, view.probes.length - 1) * 505;
      const y = 175 - (item.elapsedMs ?? 0) / peak * 145;
      const label = 'Attempt ' + (index + 1) + ': ' + item.outcome + ', ' + metric(item.elapsedMs) + ' ms, ' + item.bytesReceived + ' bytes';
      let mark;
      if (item.elapsedMs === null) mark = make('text', { x: x - 5, y: 175, class: 'sample-label' }, '—');
      else if (item.outcome === 'cancelled') mark = make('rect', { x: x - 4, y: y - 4, width: 8, height: 8, class: 'outcome-cancelled' });
      else if (item.successful) mark = make('circle', { cx: x, cy: y, r: 4, class: 'outcome-successful' });
      else mark = make('path', { d: 'M' + (x - 4) + ' ' + (y - 4) + 'l8 8m0 -8l-8 8', class: 'failed-marker' });
      mark.append(make('title', {}, label)); plot.append(mark);
      if (view.probes.length <= 20 || index % 10 === 0 || index === view.probes.length - 1) plot.append(make('text', { x: x - 4, y: 194, class: 'sample-label' }, String(index + 1)));
    });
    document.getElementById('probe-chart').replaceChildren(plot);
  }

  if (!view.histogram.length) empty('distribution-chart', 'No successful timing samples in this phase.');
  else {
    const histogram = canvas(240, view.phase + ' successful response-time distribution. ' + view.histogram.map(bin =>
      metric(bin.lowMs) + ' to ' + metric(bin.highMs) + ' ms: ' + bin.count + ' samples').join('. '));
    const peak = Math.max(...view.histogram.map(bin => bin.count)), width = 560 / view.histogram.length;
    view.histogram.forEach((bin, index) => {
      const x = 30 + index * width, height = bin.count / peak * 125;
      histogram.append(make('rect', { x: x + 5, y: 150 - height, width: width - 10, height, class: 'chart-' + view.phase }),
        make('text', { x: x + width / 2, y: 140 - height, 'text-anchor': 'middle' }, String(bin.count)),
        make('text', { x: x + width / 2, y: 174, 'text-anchor': 'middle', class: 'sample-label' }, metric(bin.lowMs)),
        make('text', { x: x + width / 2, y: 192, 'text-anchor': 'middle', class: 'sample-label' }, '– ' + metric(bin.highMs)));
    });
    histogram.append(make('text', { x: 30, y: 223 }, 'Response-time bins · ms · counts; final bin includes its upper edge'));
    document.getElementById('distribution-chart').replaceChildren(histogram);
  }
  const outcomes = Object.entries(view.outcomes);
  const outcomePlot = canvas(150, view.phase + ' outcomes: ' + outcomes.map(([name, count]) => name + ' ' + count).join(', '));
  const peak = Math.max(1, ...outcomes.map(([, count]) => count));
  outcomes.forEach(([name, count], index) => {
    const y = 12 + index * 43, width = count / peak * 400;
    outcomePlot.append(make('text', { x: 0, y: y + 17 }, name),
      make('rect', { x: 100, y, width: 400, height: 22, class: 'chart-track' }),
      make('rect', { x: 100, y, width, height: 22, class: 'outcome-' + name }),
      make('text', { x: 110 + width, y: y + 17 }, String(count)));
  });
  document.getElementById('outcome-chart').replaceChildren(outcomePlot);
}
