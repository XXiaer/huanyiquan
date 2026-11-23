"""Title matching and reciprocal rank fusion for campus listings."""
from decimal import Decimal
import re
import unicodedata

_FILLER = re.compile(r'^(?:我想找|我想买|我想要|我需要|帮我找|想找|想买|想要|有没有|求购|必须是|必须要|一定要)+')
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


def allows(price, trade_mode, budget, mode):
    priced = price is not None and price > 0
    trade_mode = trade_mode or (4 if priced else 2)
    can_sell = trade_mode in (1, 4)
    return ((mode != 1 or (can_sell and priced))
            and (mode != 2 or trade_mode in (2, 4))
            and (mode != 4 or trade_mode == 4)
            and (budget is None or (can_sell and priced and price <= budget)))


# Require evidence in the listing title for common product intents. Descriptions
# can mention compatibility or the item the seller wants in exchange.
_DAILY_GOODS = (
    '清洁|洗衣|消毒|纸巾|卫生纸|拖把|扫把|毛巾|牙刷|牙膏|香皂|洗手|洗发|沐浴|衣架|收纳|'
    '水杯|保温杯|杯碟|碗|拖鞋|脸盆|垃圾袋|湿巾|枕套|床单'
)
_LIVING_EXCLUSIONS = '住宅|客房|商铺|护栏|车位|展示|参考图|空间参考'
_PRODUCT_INTENTS = (
    (('平板电脑', '平板', 'ipad'), '平板电脑|平板|ipad|matepad|galaxytab',
     '支架|平板架|保护壳|保护套|保护膜|贴膜|钢化膜|配件|充电器|平板包|收纳包|(?<![带配含赠])键盘|触控笔'),
    (('机械键盘',), '机械键盘|机械轴键盘|热插拔键盘', '钢琴|电子琴|键帽|轴体|配件'),
    (('静音键盘', '宿舍安静打字'), '静音键盘|静音机械键盘|静音轴键盘', '钢琴|电子琴|键帽|配件'),
    (('键盘',), '键盘', '钢琴|电子琴|键帽|轴体|配件'),
    (('iphone', '手机'), 'iphone|手机', '手机壳|支架|保护壳|保护套|贴膜|钢化膜|配件|充电器'),
    (('笔记本电脑', '游戏本'), '笔记本电脑|游戏本|macbook|拯救者|天选|暗影精灵',
     '支架|保护套|收纳包|电脑包|配件|电源适配器|散热底座'),
    (('羽毛球拍',), '羽毛球拍|羽拍', '课程|资料|教学|拍套|手胶|拍线|配件'),
    (('宿舍照明', '自习照明', '台灯', '阅读灯', '桌面照明'), '台灯|阅读灯|桌灯|书桌灯',
     '灯罩|灯泡|底座|灯杆|配件'),
    (('小家电',), '电饭煲|电煮锅|小烤箱|微波炉|风扇|吹风机|空气炸锅|烧水壶|电水壶|加湿器|吸尘器',
     '说明书|配件|滤芯|插座|开关'),
    (('考研资料', '考研教材', '考研书'), '考研', '展示|参考图'),
    (('宿舍用品', '宿舍生活', '宿舍好物', '宿舍必备'),
     _DAILY_GOODS + '|台灯|阅读灯|桌灯|风扇|吹风机|电水壶|插线板|插排|排插|蚊帐|床帘|被套|枕头|床垫',
     _LIVING_EXCLUSIONS + '|灯罩|灯泡|灯杆|配件'),
    (('日用品', '生活用品'), _DAILY_GOODS, _LIVING_EXCLUSIONS),
)
_ACCESSORY = re.compile('支架|平板架|手机壳|保护壳|保护套|保护膜|贴膜|钢化膜|配件|充电器|平板包|电脑包|收纳包|键帽|轴体|触控笔|拍套|手胶|拍线|灯罩|灯泡|底座|滤芯')
_MATCHERS = [(aliases, re.compile(include), re.compile(exclude)) for aliases, include, exclude in _PRODUCT_INTENTS]


def product_intent(phrase):
    """Return the explicit product family, unless the user is looking for an accessory."""
    normalized = query_phrase(phrase).replace('寝室', '宿舍')
    if _ACCESSORY.search(normalized):
        return None
    # Prefer a specific noun in mixed queries (e.g. 平板电脑带键盘).
    for aliases, include, exclude in _MATCHERS:
        if any(alias in normalized for alias in aliases):
            return include, exclude
    return None


def product_matches(intent, title):
    return not intent or (bool(intent[0].search(title)) and not intent[1].search(title))

_MODEL = re.compile(r'(?<![a-z0-9])(?:[a-z]{1,6}[- ]?\d{3,5}[a-z]{0,3}|(?:iphone|ipad)\s*\d{1,2})(?![a-z0-9])', re.I)
_CAPACITY = re.compile(r'(\d+(?:\.\d+)?)\s*(tb|gb|t|g)(?![a-z0-9])', re.I)
_MINIMUM = re.compile(r'(运行内存|内存|硬盘|存储|ssd|ram)\s*(?:不低于|不少于|至少|>=|≥)\s*' + _CAPACITY.pattern, re.I)
_PURPOSES = {
    '宿舍安静打字': ('静音键盘', '机械键盘'),
    '图书馆自习照明': ('护眼台灯', '台灯'),
    '通勤听歌': ('蓝牙耳机', '无线耳机'),
}


def model_names(text):
    source = unicodedata.normalize('NFKC', text or '')
    return tuple(dict.fromkeys(normalize(match.group()) for match in _MODEL.finditer(source)))


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
    models = model_names(phrase)
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
