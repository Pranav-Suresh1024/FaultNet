"""Check final-report structure, values and evidence without modifying the documents."""
from pathlib import Path
import json, re, hashlib, zipfile
from docx import Document
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1]
folder=ROOT/'docs/reports'
s=json.loads((folder/'evidence/summary.json').read_text())
p=json.loads((folder/'evidence/packet-summary.json').read_text())
doc=Document(folder/'FaultNet-final-report.docx')
pdf=PdfReader(folder/'FaultNet-final-report.pdf')
text='\n'.join(page.extract_text() for page in pdf.pages)
body='\n'.join(x.text for x in doc.paragraphs)
headings=[x.text for x in doc.paragraphs if x.style.name.startswith('Heading')]
assert [int(re.match(r'^(\d+)\. ',h).group(1)) for h in headings if re.match(r'^\d+\. ',h)]==list(range(1,13))
assert len(doc.tables)==16 and len(doc.inline_shapes)==12
assert all(len(page.extract_text().strip())>50 for page in pdf.pages)
assert not re.search(r'AI agents?|yet to be implemented|out of scope|2026|placeholder',body,re.I)
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
with zipfile.ZipFile(folder/'FaultNet-final-report.docx') as z:
    xml=z.read('word/document.xml').decode()
    assert 'TOC ' in xml and 'PAGEREF' in xml and 'https://github.com/Pranav-Suresh1024/FaultNet' in text
    assert '<w:ins ' not in xml and '<w:del ' not in xml
    assert not any('/comments' in name for name in z.namelist())
source=ROOT/'.codex/final-report/user-source.docx'
if source.exists():assert source.read_bytes()==(folder/'FaultNet-partial-report.docx').read_bytes(), 'User source changed'
print(json.dumps({'pages':len(pdf.pages),'tables':len(doc.tables),'embeddedFiguresExcludingLogo':len(doc.inline_shapes)-1,
    'headings':len(headings),'wordCount':len(text.split()),'validatedRuns':100,'rejectedRuns':1,'testsPassed':61,
    'docxSha256':hashlib.sha256((folder/'FaultNet-final-report.docx').read_bytes()).hexdigest(),
    'pdfSha256':hashlib.sha256((folder/'FaultNet-final-report.pdf').read_bytes()).hexdigest()},indent=2))
