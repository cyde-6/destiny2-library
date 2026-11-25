"""Build the static library from bilingual Bungie Manifest tables."""

import argparse
import gc
import gzip
import io
import json
import os
import re
import shutil
import time
from collections import defaultdict
from datetime import datetime, timezone
from http.client import HTTPException
from pathlib import Path
from tempfile import NamedTemporaryFile, TemporaryDirectory
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlsplit
from urllib.request import HTTPRedirectHandler, ProxyHandler, Request, build_opener, getproxies_environment

PROJECT_DIR = Path(__file__).resolve().parents[1]
BUCKET_COUNT = 32
BUNGIE = 'https://www.bungie.net'
TABLES = tuple(f'Destiny{name}Definition' for name in (
    'InventoryItem', 'Lore', 'PresentationNode', 'Record', 'DamageType', 'Collectible', 'BreakerType',
))
LANGUAGES = ('en', 'zh-chs')
CATEGORIES = ('weapon', 'armor', 'ship', 'sparrow', 'skimmer', 'ghost')


def now():
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


def norm(value):
    return re.sub(r'\s+', ' ', (value or '').strip()).lower()


def official_url(url):
    parsed = urlsplit(url)
    return parsed.scheme == 'https' and parsed.netloc.lower() in {'www.bungie.net', 'bungie.net'}


class OfficialRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not official_url(newurl):
            raise URLError('Untrusted Bungie redirect')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class DownloadError(RuntimeError):
    pass


def download(url, destination=None, *, proxy='', key=''):
    if not official_url(url):
        raise DownloadError('非官方 Bungie 地址')
    headers = {'User-Agent': 'destiny2-library/1.0',
               'Accept-Encoding': 'gzip'}
    if key:
        headers['X-API-Key'] = key
    routes = (proxy, '') if proxy else ('',)
    if destination is not None:
        destination.parent.mkdir(parents=True, exist_ok=True)
    reason = '连接失败'
    for delay in (1, 2, 4, 0):
        pause = delay
        for route in routes:
            try:
                handler = ProxyHandler({'https': route} if route else {})
                opener = build_opener(handler, OfficialRedirect())
                with opener.open(Request(url, headers=headers), timeout=30) as response:
                    compressed = 'gzip' in response.headers.get('Content-Encoding', '').lower()
                    if destination is None:
                        payload = response.read()
                        return gzip.decompress(payload) if compressed or payload.startswith(b'\x1f\x8b') else payload
                    with NamedTemporaryFile(dir=destination.parent, suffix='.part', delete=False) as target:
                        partial = Path(target.name)
                        try:
                            with io.BufferedReader(response) as stream:
                                if compressed or stream.peek(2).startswith(b'\x1f\x8b'):
                                    with gzip.GzipFile(fileobj=stream) as decoded:
                                        shutil.copyfileobj(decoded, target, 256 * 1024)
                                else:
                                    shutil.copyfileobj(stream, target, 256 * 1024)
                                if target.tell() == 0 or response.length not in (None, 0):
                                    raise OSError('Incomplete download')
                            target.close()
                            read_table(partial)
                            os.replace(partial, destination)
                        finally:
                            target.close()
                            partial.unlink(missing_ok=True)
                return None
            except HTTPError as exc:
                with exc:
                    reason = f'HTTP {exc.code}'
                    if exc.code == 429 and delay:
                        retry_after = exc.headers.get('Retry-After', '')
                        if retry_after.isascii() and retry_after.isdigit() and len(retry_after) < 10:
                            pause = max(pause, min(int(retry_after), 60))
                        break
            except (OSError, EOFError, HTTPException, ValueError) as exc:
                reason = type(exc).__name__
        if pause:
            time.sleep(pause)
    raise DownloadError(f'Bungie 请求失败（{reason}）')


def read_table(path):
    with path.open(encoding='utf-8-sig') as stream:
        table = json.load(stream)
    if not isinstance(table, dict) or not table:
        raise ValueError(f'清单分表无内容：{path}')
    return table


def load_table(version_dir, lang, name):
    return read_table(version_dir / lang / f'{name}.json')


def text(value):
    return value.strip() if isinstance(value, str) else ''


def display(entry, attribute):
    return text((entry.get('displayProperties') or {}).get(attribute))


def localized(chinese, english):
    return chinese or english, english or chinese


def category_of(item):
    cats = set(item.get('itemCategoryHashes') or [])
    kind = item.get('itemType')
    bucket = (item.get('inventory') or {}).get('bucketTypeHash') or 0
    if (item.get('redacted') or item.get('blacklisted') or not display(item, 'name')
            or bucket == 2422292810 or cats.intersection({51, 3109687656, 1742617626,
                                                         3124752623, 56, 59, 610365472, 4104513227})
            or item.get('plug') is not None or kind == 19 or item.get('itemSubType') in (21, 22)):
        return ''
    if 1 in cats or kind == 3:
        return 'weapon'
    if 20 in cats or kind == 2:
        return 'armor'
    if (39 in cats or kind == 24) and 1449602859 not in cats:
        return 'ghost'
    if (42 in cats or kind == 21) and 177260082 not in cats:
        return 'ship'
    if 43 in cats or kind == 22:
        sockets = (item.get('sockets') or {}).get('socketEntries') or ()
        is_skimmer = (
            norm(item.get('itemTypeDisplayName')) == 'skimmer'
            or any(
                s.get('singleInitialItemHash') == 3910216754 or s.get('socketTypeHash') == 3393998496
                for s in sockets
            )
        )
        return 'skimmer' if is_skimmer else 'sparrow'
    return ''


def definition(tables, lang, table, key):
    return tables[lang][f'Destiny{table}Definition'].get(str(key), {})


def item_fields(item_hash, item, category, tables):
    inventory = item.get('inventory') or {}
    bucket_hash = inventory.get('bucketTypeHash') or 0
    class_type = item.get('classType', 3)
    lore_hash = item.get('loreHash') or 0
    name_en, flavor_en = display(item, 'name'), text(item.get('flavorText'))
    dedup_key = f'{category}|{bucket_hash}|{class_type}|{norm(name_en)}|{norm(flavor_en)}|{lore_hash}'
    collectible = item.get('collectibleHash')
    quality = item.get('quality') or {}
    watermark = text(item.get('iconWatermark'))
    watermarks = item.get('iconWatermarks') or []
    screenshot = text(item.get('screenshot'))
    collectible_en = definition(tables, 'en', 'Collectible', collectible)
    rank = (bool(collectible_en), len(quality.get('versions') or []), bool(watermark),
            (item.get('currentVersion', quality.get('currentVersion', 0)) or 0,
             watermarks.index(watermark) + 1 if watermark and watermark in watermarks else 0),
            bool(lore_hash), bool(screenshot), item_hash)
    damage_hash = item.get('defaultDamageTypeHash') or next(iter(item.get('damageTypeHashes') or []), 0)
    damage_en = definition(tables, 'en', 'DamageType', damage_hash)
    damage_zh = definition(tables, 'zh-chs', 'DamageType', damage_hash)
    damage_names = localized(display(damage_zh, 'name'), display(damage_en, 'name'))
    breaker = item.get('breakerTypeHash')
    breaker_names = localized(*(display(definition(tables, lang, 'BreakerType', breaker), 'name')
                                for lang in ('zh-chs', 'en')))
    source_en = text(collectible_en.get('sourceString'))
    source_zh = text(definition(tables, 'zh-chs', 'Collectible', collectible).get('sourceString'))
    fields = dict(item_hash=item_hash, dedup_key=dedup_key, category=category,
                  tier_type=inventory.get('tierType') or 0, tier_name_en=text(inventory.get('tierTypeName')),
                  name_en=name_en, flavor_en=flavor_en, type_name_en=text(item.get('itemTypeDisplayName')),
                  icon_path=display(item, 'icon'), watermark_path=watermark, screenshot_path=screenshot,
                  bucket_hash=bucket_hash, weapon_sub_type=(item.get('itemSubType') or 0) if category == 'weapon' else 0,
                  damage_type=item.get('defaultDamageType') or damage_en.get('enumValue') or 0,
                  damage_name_zh=damage_names[0], damage_name_en=damage_names[1],
                  damage_icon_path=display(damage_en, 'icon') or display(damage_zh, 'icon'),
                  ammo_type=(item.get('equippingBlock') or {}).get('ammoType') or 0,
                  class_type=class_type, lore_hash=lore_hash, source_zh=source_zh or source_en,
                  source_en=source_en or source_zh, breaker_name_zh=breaker_names[0], breaker_name_en=breaker_names[1])
    return rank, fields


def build_items(version_dir, tables):
    raw_en = load_table(version_dir, 'en', TABLES[0])
    candidates = {}
    for item_hash, item in raw_en.items():
        category = category_of(item)
        if category:
            candidates[item_hash] = item_fields(int(item_hash), item, category, tables)
    del raw_en
    gc.collect()
    raw_zh = load_table(version_dir, 'zh-chs', TABLES[0])
    groups = {}
    for item_hash, (rank, fields) in candidates.items():
        item = raw_zh.get(item_hash, {})
        if item.get('redacted') or item.get('blacklisted'):
            continue
        fields.update(name_zh=display(item, 'name') or fields['name_en'],
                      type_name_zh=text(item.get('itemTypeDisplayName')) or fields['type_name_en'],
                      flavor_zh=text(item.get('flavorText')) or fields['flavor_en'],
                      tier_name_zh=text((item.get('inventory') or {}).get('tierTypeName')) or fields['tier_name_en'])
        groups.setdefault(fields['dedup_key'], []).append((rank, fields))
    del raw_zh, candidates
    gc.collect()
    winners = []
    for versions in groups.values():
        versions.sort(key=lambda entry: entry[0], reverse=True)
        winner = versions[0][1]
        variants = [{key: entry[key] for key in ('item_hash', 'icon_path', 'watermark_path')}
                    for _, entry in versions]
        winner.update(reissue_count=len(variants), variants=variants)
        winners.append(winner)
    return winners


def bilingual_display(chinese, english, field):
    return localized(display(chinese, field), display(english, field))


def build_lore(tables, referenced):
    table = 'DestinyLoreDefinition'
    lore = {}
    for key in tables['en'][table].keys() | tables['zh-chs'][table].keys():
        english = definition(tables, 'en', 'Lore', key)
        chinese = definition(tables, 'zh-chs', 'Lore', key)
        if english.get('redacted') or chinese.get('redacted'):
            continue
        titles = bilingual_display(chinese, english, 'name')
        bodies = bilingual_display(chinese, english, 'description')
        subtitles = localized(text(chinese.get('subtitle')), text(english.get('subtitle')))
        if any(titles + bodies):
            lore[int(key)] = (int(key), *titles, *subtitles, *bodies)
    books, chapters, mounted, seen_books = [], [], set(), set()

    def node_pair(key):
        return tuple(definition(tables, lang, 'PresentationNode', key) for lang in ('zh-chs', 'en'))

    def children(nodes, kind):
        return next((values for node in reversed(nodes)
                     if (values := (node.get('children') or {}).get(kind))), [])

    for section_entry in children(node_pair(4077680549), 'presentationNodes'):
        section = node_pair(section_entry['presentationNodeHash'])
        section_names = bilingual_display(*section, 'name')
        for book_entry in children(section, 'presentationNodes'):
            book_hash = int(book_entry['presentationNodeHash'])
            if book_hash in seen_books:
                continue
            seen_books.add(book_hash)
            book = node_pair(book_hash)
            book_names = bilingual_display(*book, 'name')
            descriptions = bilingual_display(*book, 'description')
            book_chapters = []
            for index, record_entry in enumerate(children(book, 'records')):
                record_hash = int(record_entry['recordHash'])
                records = tuple(definition(tables, lang, 'Record', record_hash) for lang in ('zh-chs', 'en'))
                lore_hash = records[1].get('loreHash') or records[0].get('loreHash') or 0
                if lore_hash not in lore:
                    continue
                mounted.add(lore_hash)
                names = tuple(display(rec, 'name') or lore[lore_hash][lang_index + 1]
                              for lang_index, rec in enumerate(records))
                book_chapters.append((book_hash, index, record_hash, lore_hash, *names))
            if book_chapters or any(descriptions):
                books.append((book_hash, *section_names, *book_names, *descriptions,
                              display(book[0], 'icon') or display(book[1], 'icon'), len(book_chapters), len(books)))
                chapters.extend(book_chapters)
    if not books or not chapters:
        raise ValueError('No official lore books or chapters found under Manifest node 4077680549')
    orphaned = sorted(lore.keys() - mounted - referenced)
    if orphaned:
        archive_id = 999000001
        while archive_id in seen_books:
            archive_id += 1
        books.append((archive_id, '历史与散轶档案', 'Archived Lore', '历史与散轶档案（退环境/独立传说）',
                      'Archived & Unbound Lore', '', '', '', len(orphaned), len(books)))
        chapters.extend((archive_id, index, 0, key, lore[key][1], lore[key][2])
                        for index, key in enumerate(orphaned))
    return lore, books, chapters




def discover_proxy():
    proxies = getproxies_environment()
    proxy = (proxies.get('https') or proxies.get('http') or '').strip()
    if not proxy and os.name == 'nt':
        import winreg

        try:
            settings = r'Software\Microsoft\Windows\CurrentVersion\Internet Settings'
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, settings) as key:
                if winreg.QueryValueEx(key, 'ProxyEnable')[0]:
                    proxy = winreg.QueryValueEx(key, 'ProxyServer')[0].strip()
        except OSError:
            pass
        if '=' in proxy:
            servers = dict(part.split('=', 1) for part in proxy.split(';') if '=' in part)
            proxy = servers.get('https') or servers.get('http') or ''
    if proxy and '://' not in proxy:
        return 'http://' + proxy
    return proxy


def manifest_response(proxy):
    payload = json.loads(download(BUNGIE + '/Platform/Destiny2/Manifest/', proxy=proxy,
                                  key=os.getenv('BUNGIE_API_KEY', '').strip()))
    error_code = payload.get('ErrorCode')
    if error_code != 1:
        raise DownloadError(f"Bungie Manifest ErrorCode={error_code}, Message={payload.get('Message', '')}")
    response = payload.get('Response') or {}
    version = response.get('version')
    if not isinstance(version, str) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]{0,159}', version) or version.endswith('.'):
        raise ValueError('Bungie returned an invalid Manifest version')
    return version, response.get('jsonWorldComponentContentPaths') or {}


def cache_manifest(cache_dir, version, paths, proxy):
    directory = cache_dir / version
    components = [(lang, table, paths.get(lang, {}).get(table)) for lang in LANGUAGES for table in TABLES]
    if any(not isinstance(path, str) or not path or not official_url(urljoin(BUNGIE, path))
           for _, _, path in components):
        raise ValueError('Manifest has missing tables or non-Bungie URLs')
    for lang, table, path in components:
        destination = directory / lang / f'{table}.json'
        try:
            read_table(destination)
            continue
        except FileNotFoundError:
            pass
        except ValueError:
            print(f'Invalid cached table {lang}/{table}', flush=True)
        print(f'Downloading {lang}/{table}', flush=True)
        download(urljoin(BUNGIE, path), destination, proxy=proxy)
    return directory


DETAIL_FIELDS = ('screenshot_path', 'source_zh', 'source_en', 'breaker_name_zh', 'breaker_name_en', 'variants')
LORE_FIELDS = ('lore_hash', 'title_zh', 'title_en', 'subtitle_zh', 'subtitle_en', 'body_zh', 'body_en')
BOOK_FIELDS = ('book_hash', 'section_name_zh', 'section_name_en', 'book_name_zh', 'book_name_en',
               'desc_zh', 'desc_en', 'icon_path', 'chapter_count', 'sort_order')


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')


def write_data(data_dir, version, items, lore, books, chapters):
    (data_dir / 'items').mkdir(parents=True)
    (data_dir / 'books').mkdir()
    counts = dict.fromkeys(CATEGORIES, 0)
    counts.update(lore_books=len(books), lore_chapters=len(chapters), with_lore=0)
    item_index, book_index, item_text, chapter_text = [], [], [], []
    buckets = [{} for _ in range(BUCKET_COUNT)]

    for item in sorted(items, key=lambda row: (-row['tier_type'], row['name_zh'], row['item_hash'])):
        item_hash = item['item_hash']
        entry = lore.get(item['lore_hash'])
        summary = {key: value for key, value in item.items() if key not in DETAIL_FIELDS}
        summary.update(has_lore=entry is not None, variant_hashes=[variant['item_hash'] for variant in item['variants']])
        item_index.append(summary)
        detail = {key: item[key] for key in DETAIL_FIELDS}
        detail['lore'] = dict(zip(LORE_FIELDS, entry)) if entry else None
        buckets[item_hash % BUCKET_COUNT][str(item_hash)] = detail
        counts[item['category']] += 1
        if entry:
            item_text.append((item_hash, *entry[-2:]))
            counts['with_lore'] += 1

    book_chapters = defaultdict(list)
    for book_hash, index, _, lore_hash, title_zh, title_en in chapters:
        entry = lore[lore_hash]
        book_chapters[book_hash].append(dict(chapter_index=index, lore_hash=lore_hash, title_zh=title_zh,
                                              title_en=title_en, **dict(zip(LORE_FIELDS[3:], entry[3:]))))
        chapter_text.append((book_hash, index, lore_hash, *entry[-2:]))
    for row in books:
        book = dict(zip(BOOK_FIELDS, row))
        book_hash = book['book_hash']
        entries = book_chapters[book_hash]
        write_json(data_dir / 'books' / f'{book_hash}.json', {**book, 'chapters': entries})
        book_index.append({**book, 'chapters': [{key: chapter[key] for key in
                          ('chapter_index', 'lore_hash', 'title_zh', 'title_en')} for chapter in entries]})
    for index, bucket in enumerate(buckets):
        write_json(data_dir / 'items' / f'{index:02}.json', bucket)

    meta = dict(manifest_version=version, updated_at=now(), counts=counts, shards={'item_buckets': BUCKET_COUNT})
    write_json(data_dir / 'meta.json', meta)
    write_json(data_dir / 'index.json', dict(items=item_index, books=book_index))
    write_json(data_dir / 'lore_fulltext.json', dict(items=item_text, chapters=chapter_text))
    return meta


def build(version_dir, version, out):
    tables = {lang: {name: load_table(version_dir, lang, name) for name in TABLES[1:]} for lang in LANGUAGES}
    items = build_items(version_dir, tables)
    if not items:
        raise ValueError('No eligible items found in the Manifest')
    lore, books, chapters = build_lore(tables, {item['lore_hash'] for item in items})
    out.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(prefix='.build-', dir=out) as directory:
        staging = Path(directory)
        meta = write_data(staging / 'data', version, items, lore, books, chapters)
        for source in (PROJECT_DIR / 'web').iterdir():
            if source.is_file():
                shutil.copy2(source, staging / source.name)
        for source in staging.iterdir():
            if source.is_file():
                source.replace(out / source.name)
        old_data = out / 'data'
        backup = staging / 'previous-data'
        if old_data.exists():
            old_data.rename(backup)
        try:
            (staging / 'data').rename(old_data)
        except OSError:
            if backup.exists():
                backup.rename(old_data)
            raise
    return meta


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, default=Path('dist'))
    parser.add_argument('--cache-dir', type=Path, default=Path('.cache/raw_manifest'))
    parser.add_argument('--raw-dir', type=Path, help='Use a downloaded Manifest version directory')
    parser.add_argument('--check-only', action='store_true', help='Compare the online and built Manifest versions')
    args = parser.parse_args()
    try:
        if args.check_only or args.raw_dir is None:
            proxy = discover_proxy()
            version, paths = manifest_response(proxy)
            if args.check_only:
                try:
                    saved = json.loads((args.out / 'data/meta.json').read_text(encoding='utf-8'))
                except (FileNotFoundError, json.JSONDecodeError):
                    saved = {}
                print(json.dumps(dict(version=version, changed=saved.get('manifest_version') != version)))
                return
            version_dir = cache_manifest(args.cache_dir, version, paths, proxy)
        else:
            version_dir = args.raw_dir.resolve()
            version = version_dir.name
        print(json.dumps(build(version_dir, version, args.out.resolve()), ensure_ascii=False))
    except (OSError, ValueError, DownloadError) as exc:
        parser.exit(1, f'{parser.prog}: {exc}\n')


if __name__ == '__main__':
    main()
