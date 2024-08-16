export enum Category {
  BUSINESS = 'business',
  ENTERTAINMENT = 'entertainment',
  ENVIRONMENT = 'environment',
  FOOD = 'food',
  HEALTH = 'health',
  POLITICS = 'politics',
  SCIENCE = 'science',
  SPORTS = 'sports',
  TECHNOLOGY = 'technology',
  TOP = 'top',
  TOURISM = 'tourism',
  WORLD = 'world',
}

export enum Country {
  af = 'afghanistan',
  al = 'albania',
  dz = 'algeria',
  ao = 'angola',
  ar = 'argentina',
  au = 'australia',
  at = 'austria',
  az = 'azerbaijan',
  bh = 'bahrain',
  bd = 'bangladesh',
  bb = 'barbados',
  by = 'belarus',
  be = 'belgium',
  bm = 'bermuda',
  bt = 'bhutan',
  bo = 'bolivia',
  ba = 'bosnia and herzegovina',
  br = 'brazil',
  bn = 'brunei',
  bg = 'bulgaria',
  bf = 'burkina fasco',
  kh = 'cambodia',
  cm = 'cameroon',
  ca = 'canada',
  cv = 'cape verde',
  ky = 'cayman islands',
  cl = 'chile',
  cn = 'china',
  co = 'colombia',
  km = 'comoros',
  cr = 'costa rica',
  ci = "côte d'ivoire",
  hr = 'croatia',
  cu = 'cuba',
  cy = 'cyprus',
  cz = 'czech republic',
  dk = 'denmark',
  dj = 'djibouti',
  dm = 'dominica',
  do = 'dominican republic',
  cd = 'dr congo',
  ec = 'ecuador',
  eg = 'egypt',
  sv = 'el salvador',
  ee = 'estonia',
  et = 'ethiopia',
  fj = 'fiji',
  fi = 'finland',
  fr = 'france',
  pf = 'french polynesia',
  ga = 'gabon',
  ge = 'georgia',
  de = 'germany',
  gh = 'ghana',
  gr = 'greece',
  gt = 'guatemala',
  gn = 'guinea',
  ht = 'haiti',
  hn = 'honduras',
  hk = 'hong kong',
  hu = 'hungary',
  is = 'iceland',
  in = 'india',
  id = 'indonesia',
  iq = 'iraq',
  ie = 'ireland',
  il = 'israel',
  it = 'italy',
  jm = 'jamaica',
  jp = 'japan',
  jo = 'jordan',
  kz = 'kazakhstan',
  ke = 'kenya',
  kw = 'kuwait',
  kg = 'kyrgyzstan',
  lv = 'latvia',
  lb = 'lebanon',
  ly = 'libya',
  lt = 'lithuania',
  lu = 'luxembourg',
  mo = 'macau',
  mk = 'macedonia',
  mg = 'madagascar',
  mw = 'malawi',
  my = 'malaysia',
  mv = 'maldives',
  ml = 'mali',
  mt = 'malta',
  mr = 'mauritania',
  mx = 'mexico',
  md = 'moldova',
  mn = 'mongolia',
  me = 'montenegro',
  ma = 'morocco',
  mz = 'mozambique',
  mm = 'myanmar',
  na = 'namibia',
  np = 'nepal',
  nl = 'netherland',
  nz = 'new zealand',
  ne = 'niger',
  ng = 'nigeria',
  kp = 'north korea',
  no = 'norway',
  om = 'oman',
  pk = 'pakistan',
  pa = 'panama',
  py = 'paraguay',
  pe = 'peru',
  ph = 'philippines',
  pl = 'poland',
  pt = 'portugal',
  pr = 'puerto rico',
  ro = 'romania',
  ru = 'russia',
  rw = 'rwanda',
  ws = 'samoa',
  sm = 'san marino',
  sa = 'saudi arabia',
  sn = 'senegal',
  rs = 'serbia',
  sg = 'singapore',
  sk = 'slovakia',
  si = 'slovenia',
  sb = 'solomon islands',
  so = 'somalia',
  za = 'south africa',
  kr = 'south korea',
  es = 'spain',
  lk = 'sri lanka',
  sd = 'sudan',
  se = 'sweden',
  ch = 'switzerland',
  sy = 'syria',
  tw = 'taiwan',
  tj = 'tajikistan',
  tz = 'tanzania',
  th = 'thailand',
  to = 'tonga',
  tn = 'tunisia',
  tr = 'turkey',
  tm = 'turkmenistan',
  ug = 'uganda',
  ua = 'ukraine',
  ae = 'united arab emirates',
  gb = 'united kingdom',
  us = 'united states of america',
  uy = 'uruguay',
  uz = 'uzbekistan',
  ve = 'venezuela',
  vi = 'vietnam',
  ye = 'yemen',
  zm = 'zambia',
  zw = 'zimbabwe',
}

export interface NewsResponse {
  statusCode: number;
  data: object[];
}

export interface FilterForSearchQuery {
  createdAt?: object;
  title?: {
    $regex: string;
    $options: string;
  };
  category?: object;
  orderBy?: 'asc' | 'desc';
  start_date?: Date;
  end_date?: Date;
}
