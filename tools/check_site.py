#!/usr/bin/env python3
"""Dependency-free checks for the actual static-site delivery."""
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import subprocess
import os

ROOT = Path(__file__).resolve().parents[1]
NODE = os.environ.get('STOPBULLYN_NODE', 'node')


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.paths = []
        self.keys = []
        self.images = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.append(attrs['id'])
        for key in ('src', 'href'):
            if attrs.get(key):
                self.paths.append(attrs[key])
        for key in ('data-i18n', 'data-i18n-alt', 'data-i18n-aria-label'):
            if attrs.get(key):
                self.keys.append(attrs[key])
        if tag == 'img':
            assert 'alt' in attrs, f'Missing alt: {attrs}'
            self.images += 1


page = Page()
page.feed((ROOT / 'index.html').read_text())
assert len(page.ids) == len(set(page.ids)), 'Duplicate HTML ids'
checked = 0
for path in page.paths:
    if path.startswith('#'):
        assert path[1:] in page.ids, f'Missing fragment: {path}'
    elif not re.match(r'^(https?:|mailto:|tel:|data:)', path):
        assert (ROOT / path).is_file(), f'Missing local resource: {path}'
    checked += 1
css = (ROOT / 'assets/styles.css').read_text()
for path in re.findall(r'url\([\'"]?([^\)\'\"]+)', css):
    assert (ROOT / 'assets' / path).is_file(), f'Missing CSS resource: {path}'
    checked += 1
script = """
const fs=require('node:fs'),vm=require('node:vm');
const c={window:{}};vm.createContext(c);
for(const name of ['catalog','i18n']) vm.runInContext(fs.readFileSync('assets/'+name+'.js','utf8'),c);
console.log(JSON.stringify(c.window));
"""
state = json.loads(subprocess.check_output([NODE, '-e', script], cwd=ROOT, text=True))
catalog = state['StopbullynCatalog']
translations = state['StopbullynI18n']
assert len(catalog) == 17, f'Expected 17 designs, got {len(catalog)}'
assert len({p['id'] for p in catalog}) == 17, 'Duplicate product ids'
assert set(translations['es']) == set(translations['en']), 'Translation key mismatch'
for key in page.keys:
    assert key in translations['es'] and key in translations['en'], f'Missing translation: {key}'
for product in catalog:
    assert product['side'] in ('left', 'right')
    assert product['category'] in ('training', 'padel', 'grappling')
    assert (ROOT / f"assets/images/original-{product['image']:02}.jpg").is_file()
    for lang in ('es', 'en'):
        assert product['name'][lang] and product['description'][lang]
for lang, entries in translations.items():
    assert all(isinstance(v, str) and v.strip() for v in entries.values()), f'Empty translation in {lang}'
for script_name in ('app', 'catalog', 'i18n'):
    subprocess.run([NODE, '--check', f'assets/{script_name}.js'], cwd=ROOT, check=True)
for icon in ('arrow-up-right','arrow-right','arrow-left','sun','moon-stars','list','x-lg','zoom-in','share','chevron-down'):
    assert (ROOT / f'assets/icons/{icon}.svg').is_file()
assert (ROOT / '.nojekyll').exists()
assert 'prefers-reduced-motion' in css
assert 'showModal()' in (ROOT / 'assets/app.js').read_text()
print(json.dumps({'result':'passed','html_ids':len(page.ids),'html_images_with_alt':page.images,'resource_and_fragment_checks':checked,'catalog_designs':len(catalog),'translation_keys_per_language':len(translations['es']),'languages':list(translations),'javascript_syntax_files':3},ensure_ascii=False))
