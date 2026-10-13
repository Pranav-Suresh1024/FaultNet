import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('visual workbench preserves its control contract, unique IDs and working section anchors', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ['overview','settings','fields','scenario','mode','fault','delay','rate','count','interval','timeout',
    'reuse','start','stop','summary-phase','metric-availability','metric-latency','metric-throughput','metric-recovery',
    'latency-chart','probe-chart','distribution-chart','outcome-chart','phases','probes','statistics','history','compare',
    'json','csv','refresh','status','message','selection-error','record-errors','budget-note']) assert.ok(ids.includes(id), id);
  for (const [id, min, max, value] of [['delay',0,2000,500],['rate',8,1024,32],['count',1,20,10],['interval',100,2000,250],['timeout',500,5000,3000]]) {
    const tag = html.match(new RegExp('<input[^>]*id="'+id+'"[^>]*>'))?.[0];
    for (const attribute of [`min="${min}"`,`max="${max}"`,`value="${value}"`,'step="1"','required']) assert.ok(tag?.includes(attribute), id+' '+attribute);
  }
  for (const [id, values] of [['summary-phase',['auto','baseline','faulty','recovery']],['mode',['comparison','baseline']],['fault',['delay','bandwidth','interruption']]]) {
    const select = html.match(new RegExp('<select id="'+id+'">(.*?)</select>'))?.[1];
    assert.deepEqual([...select.matchAll(/value="([^"]*)"/g)].map(match => match[1]), values, id);
  }
  for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]), match[1]);
  assert.match(html, /class="chart-stage"/);
  const navigation = html.match(/<nav>([\s\S]*?)<\/nav>/)?.[1];
  assert.deepEqual([...navigation.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map(match => [match[1], match[2]]),
    [['#overview','Workbench'],['/','Live proxy cockpit']]);
});
