"""Title matching and reciprocal rank fusion for campus listings."""
from decimal import Decimal
import re
import unicodedata

_FILLER = re.compile(r'^(?:我想找|我想买|我想要|我需要|帮我找|想找|想买|想要|有没有|求购)+')
_SUFFIX = re.compile(r'(?:有没有|有吗|吗|呢|谢谢)$')
_WORDS = re.compile(r'[a-z]+|[0-9]+|[\u3400-\u9fff]+')


def normalize(value):
    return ''.join(_WORDS.findall(unicodedata.normalize('NFKC', value or '').casefold()))


def query_phrase(query):
    return normalize(_SUFFIX.sub('', _FILLER.sub('', (query or '').strip().rstrip('？?。！!'))))


def lexical_tier(phrase, heading):
    if len(phrase) < 2 or not heading:
        return 0
    # Keep model boundaries: "iPhone 13" must not match "iPhone 130".
    for occurrence in re.finditer(re.escape(phrase), heading):
        end = occurrence.end()
        if phrase[-1].isdigit() and end < len(heading) and heading[end].isdigit():
            continue
        return 3 if phrase == heading else 2
    return 0


def fuse(semantic, lexical):
    """Fuse independent ranks, with direct title matches ahead of semantic neighbors."""
    scores = {index: 1 / (20 + rank) for rank, index in enumerate(semantic, 1)}
    tiers = dict(lexical)
    for rank, (index, _) in enumerate(lexical, 1):
        scores[index] = scores.get(index, 0) + 1 / (20 + rank)
    return sorted(scores, key=lambda index: (-tiers.get(index, 0), -scores[index], index))



_PRICE = re.compile(
    r'(?:(?:预算|不超过|最多)\s*[¥￥]?\s*(\d{1,6}(?:\.\d{1,2})?)\s*(?:元|块钱|块)?(?:以内|以下|之内)?'
    r'|[¥￥]?\s*(\d{1,6}(?:\.\d{1,2})?)\s*(?:元|块钱|块)\s*(?:以内|以下|之内)'
    r'|(?<![a-zA-Z0-9.])(\d{1,6}(?:\.\d{1,2})?)\s*(?:以内|以下|之内))'
)
_SWAP = re.compile(r'只看换物|只想换|只换不卖|以物换物')
_SALE = re.compile(r'只看出售|只看标价|只买不换')


def parse_intent(query):
    """Extract explicit constraints while leaving model names intact."""
    query = unicodedata.normalize('NFKC', query)
    limits = [int(Decimal(next(group for group in match.groups() if group)) * 100)
              for match in _PRICE.finditer(query)]
    swap, sale = bool(_SWAP.search(query)), bool(_SALE.search(query))
    mode = None if swap == sale else (2 if swap else 1)
    phrase = _SALE.sub('', _SWAP.sub('', _PRICE.sub(' ', query)))
    phrase = _FILLER.sub('', phrase.strip(' ,，、;；'))
    if limits:
        phrase = phrase.strip().removeprefix('的').strip()
    phrase = _SUFFIX.sub('', phrase.rstrip('？?。！!')).strip(' ,，、;；')
    return phrase, min(limits) if limits else None, mode


def allows(price, trade_mode, is_demo, budget, mode):
    priced = price is not None and price > 0
    can_sell = trade_mode == 1 or (is_demo and trade_mode == 4)
    can_swap = trade_mode == 2 or (is_demo and trade_mode == 4)
    return ((mode != 1 or (can_sell and priced))
            and (mode != 2 or can_swap)
            and (budget is None or (can_sell and priced and price <= budget)))

_MODEL = re.compile(r'(?<![a-z0-9])(?:[a-z]{1,6}[- ]?\d{3,5}[a-z]{0,3}|(?:iphone|ipad)\s*\d{1,2})(?![a-z0-9])', re.I)
_CAPACITY = re.compile(r'(\d+(?:\.\d+)?)\s*(tb|gb|t|g)(?![a-z0-9])', re.I)
_MINIMUM = re.compile(r'(运行内存|内存|硬盘|存储|ssd|ram)\s*(?:不低于|不少于|至少|>=|≥)\s*' + _CAPACITY.pattern, re.I)
_PURPOSES = {
    '宿舍安静打字': ('静音键盘', '机械键盘'),
    '图书馆自习照明': ('护眼台灯', '台灯'),
    '通勤听歌': ('蓝牙耳机', '无线耳机'),
}


def capacity_gb(number, unit):
    return int(Decimal(number) * (1024 if unit.lower().startswith('t') else 1))


def understand(query):
    phrase, budget, mode = parse_intent(query)
    minimum = _MINIMUM.search(phrase)
    capacity = None
    if minimum:
        field, number, unit = minimum.groups()
        amount = capacity_gb(number, unit)
        storage = field.lower() in ('硬盘', '存储', 'ssd') or (field == '内存' and amount >= 256)
        capacity = ('storage' if storage else 'memory', amount)
        phrase = _MINIMUM.sub(' ', phrase).strip(' ，,、')
    models = tuple(dict.fromkeys(normalize(m.group()) for m in _MODEL.finditer(phrase)))
    expansions = ()
    for purpose, choices in _PURPOSES.items():
        if purpose in normalize(phrase):
            expansions = choices
            break
    return phrase, budget, mode, models, capacity, expansions


def product_specs(title, description):
    text = unicodedata.normalize('NFKC', ' '.join((title or '', description or '')))
    specs = {}
    for match in _CAPACITY.finditer(text):
        amount = capacity_gb(*match.groups())
        before = text[max(0, match.start() - 8):match.start()].lower()
        after = text[match.end():match.end() + 6].lower()
        if re.search(r'(?:支持|最高|可扩展|可升级)\s*$', before):
            continue
        field = None
        if re.search(r'(?:硬盘|存储|ssd)\s*[:：]?\s*$', before) or re.match(r'\s*(?:ssd|硬盘|存储)', after):
            field = 'storage'
        elif re.search(r'(?:内存|ram)\s*[:：]?\s*$', before) or re.match(r'\s*(?:ram|运行内存)', after):
            field = 'memory'
        if field:
            specs[field] = max(specs.get(field, 0), amount)
    return specs
