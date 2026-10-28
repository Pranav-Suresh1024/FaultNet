"""Check final-report structure, values and evidence without modifying the documents."""
from pathlib import Path
import json, re, hashlib, zipfile
from docx import Document
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1]
folder=ROOT/'docs/reports'
s=json.loads((folder/'evidence/summary.json').read_text())
p=json.loads((folder/'evidence/packet-summary.json').read_text())
doc=Document(folder/'FaultNet-final-report-revised.docx')
pdf=PdfReader(folder/'FaultNet-final-report-revised.pdf')
text='\n'.join(page.extract_text() for page in pdf.pages)
body='\n'.join(x.text for x in doc.paragraphs)
headings=[x.text for x in doc.paragraphs if x.style.name.startswith('Heading')]
literature=json.loads((folder/'scholarly-references.json').read_text(encoding='utf-8'))
referenceEvidence=json.loads((folder/'evidence/reference-verification.json').read_text(encoding='utf-8'))
refIndex=next(i for i,p in enumerate(doc.paragraphs) if p.style.name.startswith('Heading') and p.text=='References')
references='\n'.join(p.text for p in doc.paragraphs[refIndex+1:])
mainBody='\n'.join(p.text for p in doc.paragraphs[:refIndex])
assert len(literature['papers'])==len(referenceEvidence)==6
assert set(re.findall(r'\[(\d+)\]',references))==set(map(str,range(1,7)))
assert set(re.findall(r'\[(\d+)\]',mainBody))==set(map(str,range(1,7)))
assert 'github.com' not in references and 'Repository evidence:' not in references
assert not any(x in body for x in ['RFC 9110','RFC 2453','RFC 2328','Toxiproxy official','Node.js. Performance measurement','Wireshark. User Guide'])
for ref,proof in zip(literature['papers'],referenceEvidence):
    assert proof['doi'].casefold()==ref['doi'].casefold() and proof['httpStatus']==200
    assert proof['pdfPages']==ref['verifiedPdfPages'] and proof['pdfWords']>1500
    assert ref['doi'] in references and ref['title'] in references
links={rel.target_ref for rel in doc.part.rels.values() if rel.reltype.endswith('/hyperlink')}
assert all('https://doi.org/'+ref['doi'] in links and ref['fullTextUrl'] not in links for ref in literature['papers'])
assert len(links)==8, 'Six publication DOIs, repository and pinned evidence are expected'
assert 'Free full text:' not in body and 'Additional author copy:' not in body
pdfLinks={a.get_object()['/A']['/URI'] for page in pdf.pages for a in page.get('/Annots',[]) if a.get_object().get('/A',{}).get('/URI')}
assert links==pdfLinks, 'All external document links must survive PDF export'
assert [int(re.match(r'^(\d+)\. ',h).group(1)) for h in headings if re.match(r'^\d+\. ',h)]==list(range(1,13))
assert len(headings)==31
assert next(p for p in doc.paragraphs if p.text.startswith('The matched streams distinguish')).style.name=='Normal'
assert len(doc.tables)==16 and len(doc.inline_shapes)==14
assert len(pdf.pages)==27
assert 'Live proxy cockpit showing applied settings' in body and '29.9 ms displayed median' in body
tableText='\n'.join(c.text for t in doc.tables for row in t.rows for c in row.cells)
assert 'Completed with HTTP 200' in tableText and 'Median attempt duration ms' in tableText
assert 'Successful median ms' in tableText and 'Mean per-request goodput KiB/s' in tableText
assert len(doc.tables[12].rows)==11, 'Recovery table must cover all ten conditions'
for expected in ['14.61','95% percentile','seed 308','Capture-drop statistics are unknown','9.0.1','Paired added response time minus the configured delay']:
    assert expected in body,expected
provenance=json.loads((folder/'evidence/provenance.json').read_text())
assert provenance['evidenceCommit'] in body and provenance['evidenceUrl'] in links
assert 'A separate confirmation batch' in body and '50 baseline, 50 faulty and 30 recovery' in body
assert not any(x in body for x in ['Appendix A','npm start','python scripts/','Regenerate the document'])
readme=(ROOT/'README.md').read_text(encoding='utf-8')
assert all(x in readme for x in ['Report and evaluation reproduction','npm start','python scripts/build-final-report.py','python scripts/analyze-report.py','node scripts/evaluate-report.mjs'])
confirmation=json.loads((folder/'evidence/followup-verification.json').read_text())
assert confirmation['tests']['passed']==61 and confirmation['tests']['failed']==0
assert confirmation['workbench']['acceptedRuns']==10 and confirmation['workbench']['rejectedRuns']==0
assert confirmation['live']['attempts']==80 and confirmation['live']['resetBytes']==65536
assert all(text.count('9.4.'+str(i))>=2 for i in range(1,8)), 'Each performance subsection must appear in contents and body'
assert all(len(page.extract_text().strip())>50 for page in pdf.pages)
assert not re.search(r'AI agents?|yet to be implemented|out of scope|placeholder',body,re.I)
introIndex=next(i for i,p in enumerate(doc.paragraphs) if p.style.name.startswith('Heading') and p.text=='1. Introduction')
assert '2026' not in '\n'.join(p.text for p in doc.paragraphs[introIndex:]), 'Student front-matter dates are retained; experiment narrative dates remain excluded'
assert not re.search(r'Error!|Reference source not found|TOC will populate',text,re.I)
for expected in ['Pranav Suresh','24BCE2086','Soham','24BAI0142','55,392','61 tests','2.38','1,300']:
    # Word can insert a discretionary space in wrapped numbers.
    assert expected.replace(',','') in text.replace(',',''),expected
for name,v in s['scenarios'].items():
    assert v['runs']==10 and v['attempts']==50
    assert 0<=v['successes']<=50
    if v['medianMs'] is None:assert v['successes']==0 and v['goodputKiBps'] is None
    else:
        assert v['minMs']<=v['medianMs']<=v['p95Ms']<=v['maxMs']
        assert f'{v["medianMs"]:,.2f}' in text
assert s['totals']=={'workbenchRuns':100,'workbenchAttempts':1300,'overheadRequests':100,'liveRequests':80}
assert s['recordQuality']['rejected']==1 and s['restored']['status']==200 and s['restored']['bytes']==65536
assert p['packetCount']==55392 and p['controlPackets']==0
for match in p['matches']:
    assert match['matched']==5 and len({x['stream'] for x in match['streams']})==5
    for stream in match['streams']:
        assert stream['getFrame']<stream['firstDataFrame']<=stream['responseFrame']
        assert 0<=stream['firstDataMs']<=stream['httpMs']+.01
with zipfile.ZipFile(folder/'FaultNet-final-report-revised.docx') as z:
    xml=z.read('word/document.xml').decode()
    assert 'TOC ' in xml and 'PAGEREF' in xml and 'https://github.com/Pranav-Suresh1024/FaultNet' in text
    assert '<w:ins ' not in xml and '<w:del ' not in xml
    assert not any('/comments' in name for name in z.namelist())
    assert '1-3' in xml, 'Contents must include performance subsections'
    screenshot=(folder/'evidence/screenshots/live-cockpit.png').read_bytes()
    assert hashlib.sha256(screenshot).hexdigest()==provenance['cockpitScreenshot']['sha256']
    assert any(z.read(name)==screenshot for name in z.namelist() if name.startswith('word/media/'))
    assert 'l="63400" t="15621"' in xml, 'The readable monitor detail must retain its native Word crop'
    assert [int(n) for n in re.findall(r'^Figure (\d+)\.',body,re.M)]==list(range(1,14))
source=ROOT/'.codex/final-report/user-source.docx'
if source.exists():assert source.read_bytes()==(folder/'FaultNet-partial-report.docx').read_bytes(), 'User source changed'
print(json.dumps({'pages':len(pdf.pages),'tables':len(doc.tables),'embeddedFiguresExcludingLogo':len(doc.inline_shapes)-1,
    'headings':len(headings),'wordCount':len(text.split()),'validatedRuns':100,'rejectedRuns':1,'testsPassed':61,
    'docxSha256':hashlib.sha256((folder/'FaultNet-final-report-revised.docx').read_bytes()).hexdigest(),
    'pdfSha256':hashlib.sha256((folder/'FaultNet-final-report-revised.pdf').read_bytes()).hexdigest()},indent=2))
