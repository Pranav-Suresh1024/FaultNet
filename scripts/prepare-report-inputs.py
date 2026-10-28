"""Project local synthetic records into a shareable numerical analysis dataset."""
from pathlib import Path
from datetime import datetime
import json

root=Path(__file__).resolve().parents[1]
raw=json.loads((root/'.codex/final-report/evaluation.json').read_text())
out={k:raw[k] for k in ['sourceCommit','environment','runtime','protocol','restored']}
out['runs']=[]
for trial in raw['runs']:
    r=trial['record']
    assert r['state']=='completed' and r['persistence']['state']=='saved'
    phases={p:[o for o in r['observations'] if o['phase']==p] for p in ['baseline','faulty','recovery']}
    assert len(phases['baseline'])==len(phases['faulty'])==5 and len(phases['recovery'])==3
    assert all(o['successful'] for p in ['baseline','recovery'] for o in phases[p])
    out['runs'].append({'id':r['id'],'scenario':trial['scenario'],'fault':r['settings']['fault'],
        **{p+'Ms':[o['elapsedMs'] for o in phases[p]] for p in phases},
        'faultySuccess':[o['successful'] for o in phases['faulty']],
        'recoveryConfirmed':r['recovery']['observed'],'confirmationMs':r['recovery']['durationMs']})
out['overhead']=[{'directMs':[o['elapsedMs'] for o in b['direct']],
                  'proxiedMs':[o['elapsedMs'] for o in b['proxied']]} for b in raw['overhead']]
out['live']=[{'scenario':t['scenario'],'config':t['config'],
    'observations':[{k:o[k] for k in ['elapsedMs','outcome','status','bytes']} for o in t['observations']]} for t in raw['live']]
out['recordQuality']={'accepted':len(raw['runs']),'rejected':len(raw.get('rejectedRuns',[])),
    'rejections':[{'id':t['record']['id'],'scenario':t['scenario'],'reason':t['reason'],
    'utcVsElapsedDifferenceMs':abs((datetime.fromisoformat(t['record']['recovery']['confirmedAt'].replace('Z','+00:00'))-
    datetime.fromisoformat(t['record']['recovery']['removedAt'].replace('Z','+00:00'))).total_seconds()*1000-
    t['record']['recovery']['durationMs'])} for t in raw.get('rejectedRuns',[])]}
assert len(out['runs'])==100 and len(out['overhead'])==10 and len(out['live'])==8
# Only these numerical columns and synthetic configuration values are exported;
# session capabilities, HTTP content, timestamps and persisted record objects are excluded.
encoded=json.dumps(out,indent=2,allow_nan=False)
assert not any(k in encoded for k in ['startedAt','removedAt','confirmedAt','token','headers','observationsByPhase'])
destination=root/'docs/reports/evidence/analysis-inputs.json'
destination.write_text(encoded,encoding='utf-8')
print(destination, len(encoded), 'bytes; 100 trials, 1,300 phase durations, 100 overhead and 80 live samples')
