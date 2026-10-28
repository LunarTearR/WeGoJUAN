/* @ds-bundle: {"format":4,"namespace":"WeGoJUAN","components":[{"name":"Button"},{"name":"Icon"},{"name":"StatusIcon"},{"name":"TextField"},{"name":"Checkbox"},{"name":"StatusPicker"},{"name":"Pill"},{"name":"Initials"},{"name":"MemberChip"},{"name":"MonthNav"},{"name":"MonthGrid"},{"name":"DayCell"},{"name":"CalendarLegend"},{"name":"TripCard"},{"name":"SuggestionCard"},{"name":"ConfirmedDates"},{"name":"InviteLinkBox"},{"name":"Banner"},{"name":"EmptyState"},{"name":"AppBar"},{"name":"BottomNav"},{"name":"Sheet"},{"name":"AppShell"},{"name":"SideNav"},{"name":"PageLayout"}]} */
/* WeGoJUAN design system: hand-written React components (no build step). Reads window.React,
   styles come from bundle.css + tokens.css. Thai is the UI language; labels default to the app's terms. */
(function () {
  'use strict';
  var React = window.React;
  var h = React.createElement;
  var Fragment = React.Fragment;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(' ');
  }
  function rest(props, keys) {
    var out = {};
    for (var k in props) if (Object.prototype.hasOwnProperty.call(props, k) && keys.indexOf(k) < 0) out[k] = props[k];
    return out;
  }

  var STATUS_LABEL = { free: 'ว่าง', busy: 'ไม่ว่าง', unknown: 'ยังไม่ระบุ' };
  var WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  var WEEKDAYS_LONG = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์'];

  /* Layout classes, measured on the AppShell's own width so a device frame and the real viewport behave alike.
     Keep these numbers in step with the layout tokens (bp-medium, bp-expanded) and the @container rules in bundle.css. */
  var BP_MEDIUM = 600, BP_EXPANDED = 1024;
  var LayoutContext = React.createContext('compact');
  function layoutFor(width, split) {
    if (split) return 'split';
    return width >= BP_EXPANDED ? 'expanded' : width >= BP_MEDIUM ? 'medium' : 'compact';
  }
  function useLayout() { return React.useContext(LayoutContext); }
  // Dual-screen devices (Surface Duo, foldables spanned): two side-by-side viewport segments
  function useViewportSegments() {
    var q = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(horizontal-viewport-segments: 2)') : null;
    var st = React.useState(!!(q && q.matches)), split = st[0], setSplit = st[1];
    React.useEffect(function () {
      if (!q) return undefined;
      var on = function () { setSplit(q.matches); };
      if (q.addEventListener) q.addEventListener('change', on);
      return function () { if (q.removeEventListener) q.removeEventListener('change', on); };
    }, []);
    return split;
  }

  // Two visible letters, never half a Thai vowel: "ploy" -> "Pl", "ปลาย" -> "ปล"
  function initialsOf(name) {
    var s = String(name || '').trim();
    var parts;
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      parts = Array.from(new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(s), function (x) { return x.segment; });
    } else {
      parts = Array.from(s);
    }
    var two = parts.slice(0, 2).join('');
    return two.charAt(0).toUpperCase() + two.slice(1);
  }

  /* ---------------- Icon ---------------- */
  var ICONS = {
    'chevron-left': [['path', { d: 'M15 5.5 8.5 12l6.5 6.5' }]],
    'chevron-right': [['path', { d: 'M9 5.5 15.5 12 9 18.5' }]],
    plus: [['path', { d: 'M12 5v14M5 12h14' }]],
    check: [['path', { d: 'M5 12.5 9.5 17 19 7.5' }]],
    close: [['path', { d: 'M6.5 6.5l11 11M17.5 6.5l-11 11' }]],
    copy: [['rect', { x: 9, y: 9, width: 11, height: 11, rx: 3 }], ['path', { d: 'M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9' }]],
    calendar: [['rect', { x: 3.5, y: 5, width: 17, height: 15.5, rx: 3.5 }], ['path', { d: 'M3.5 10h17M8 3v4M16 3v4' }]],
    trip: [['rect', { x: 3.5, y: 7.5, width: 17, height: 12.5, rx: 3 }], ['path', { d: 'M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M8.5 7.5V20M15.5 7.5V20' }]],
    share: [['path', { d: 'M12 15V4M8 8l4-4 4 4M5 13v4.5A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5V13' }]],
    refresh: [['path', { d: 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4' }]],
    more: [['circle', { cx: 6, cy: 12, r: 1.6, className: 'wg-fill' }], ['circle', { cx: 12, cy: 12, r: 1.6, className: 'wg-fill' }], ['circle', { cx: 18, cy: 12, r: 1.6, className: 'wg-fill' }]],
    users: [['circle', { cx: 9, cy: 8, r: 3.5 }], ['path', { d: 'M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.2a6.5 6.5 0 0 1 3.5 5.8' }]],
    flag: [['path', { d: 'M5.5 21V4M5.5 4.5h11l-2.2 4 2.2 4h-11' }]],
    lock: [['rect', { x: 5, y: 10.5, width: 14, height: 10, rx: 2.5 }], ['path', { d: 'M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5' }]],
    sparkle: [['path', { d: 'M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z' }], ['path', { d: 'M18.5 16.5v4M16.5 18.5h4' }]],
    edit: [['path', { d: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z' }], ['path', { d: 'M13.5 6.5l4 4' }]],
    trash: [['path', { d: 'M4.5 7h15M9.5 7V5h5v2M6.5 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5L17.5 7M10 11v6M14 11v6' }]],
    exit: [['path', { d: 'M10 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H10M15 8l4 4-4 4M19 12H9.5' }]]
  };
  function Icon(props) {
    var size = props.size || 24;
    var parts = ICONS[props.name] || [];
    return h('svg', {
      className: cx('wg-icon', props.className), width: size, height: size, viewBox: '0 0 24 24',
      role: props.title ? 'img' : undefined, 'aria-label': props.title, 'aria-hidden': props.title ? undefined : true, focusable: 'false'
    }, parts.map(function (p, i) { return h(p[0], Object.assign({ key: i }, p[1])); }));
  }

  /* ---------------- StatusIcon: lucide-react icons in a round badge ----------------
     Geometry copied from lucide-react 1.56.0 (ISC licence, https://lucide.dev) so previews match the app,
     where the same icons come from `import { Calendar, CalendarClock, Ticket, Check, X, MoreHorizontal } from 'lucide-react'`. */
  var LUCIDE = {"calendar": [["path", {"d": "M8 2v3"}], ["path", {"d": "M16 2v3"}], ["rect", {"x": 3.0, "y": 3.0, "width": 18.0, "height": 18.0, "rx": 2.0}], ["path", {"d": "M3 9h18"}]], "calendar-clock": [["path", {"d": "M16 14v2.2l1.6 1"}], ["path", {"d": "M16 2v3"}], ["path", {"d": "M21 7.338V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h2.338"}], ["path", {"d": "M3 9h5.859"}], ["path", {"d": "M8 2v3"}], ["circle", {"cx": 16.0, "cy": 16.0, "r": 6.0}]], "ticket": [["path", {"d": "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"}], ["path", {"d": "M13 5v2"}], ["path", {"d": "M13 17v2"}], ["path", {"d": "M13 11v2"}]], "check": [["path", {"d": "M20 6 9 17l-5-5"}]], "x": [["path", {"d": "M18 6 6 18"}], ["path", {"d": "m6 6 12 12"}]], "ellipsis": [["circle", {"cx": 12.0, "cy": 12.0, "r": 1.0}], ["circle", {"cx": 19.0, "cy": 12.0, "r": 1.0}], ["circle", {"cx": 5.0, "cy": 12.0, "r": 1.0}]]};
  // kind → [lucide icon, Thai label]. Trip status: finding / confirmed (+ calendar for empty states). Member availability: free / busy / unknown.
  var STATUS_KINDS = {
    finding: ['calendar-clock', 'กำลังหาวัน'],
    calendar: ['calendar', 'ปฏิทิน'],
    confirmed: ['ticket', 'ยืนยันแล้ว'],
    free: ['check', 'ว่าง'],
    busy: ['x', 'ไม่ว่าง'],
    unknown: ['ellipsis', 'ยังไม่ระบุ']
  };
  function LucideIcon(props) {
    var parts = LUCIDE[props.name] || [];
    return h('svg', { width: props.size, height: props.size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: props.strokeWidth || 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: 'false' },
      parts.map(function (p, i) { return h(p[0], Object.assign({ key: i }, p[1])); }));
  }
  function StatusIcon(props) {
    var kind = STATUS_KINDS[props.kind] ? props.kind : 'unknown';
    var size = props.size || 32;
    // the icon keeps a ~2px optical stroke from 16px badges up to 88px heroes
    var icon = size <= 20 ? Math.round(size * 0.62) : size <= 32 ? Math.round(size * 0.56) : size <= 48 ? Math.round(size * 0.52) : Math.round(size * 0.5);
    var stroke = size <= 20 ? 3 : size <= 32 ? 2.5 : size <= 48 ? 2.25 : 2;
    var label = props.title === undefined ? null : (props.title || STATUS_KINDS[kind][1]);
    return h('span', {
      className: cx('wg-status', 'wg-status--' + kind, props.stamp && 'wg-status--stamp', props.className),
      style: { width: size, height: size }, role: label ? 'img' : undefined, 'aria-label': label || undefined, 'aria-hidden': label ? undefined : true
    }, h(LucideIcon, { name: STATUS_KINDS[kind][0], size: icon, strokeWidth: stroke }));
  }

  /* ---------------- Button ---------------- */
  function Button(props) {
    var variant = props.variant || 'primary';
    var size = props.size || 'md';
    var other = rest(props, ['variant', 'size', 'block', 'icon', 'iconEnd', 'loading', 'done', 'className', 'children', 'href', 'type']);
    var iconSize = size === 'sm' ? 18 : 20;
    var content = props.loading
      ? h('span', { className: 'wg-btn__dots', 'aria-hidden': true }, h('i'), h('i'), h('i'))
      : [props.icon ? h(Icon, { key: 'i', name: props.icon, size: iconSize }) : null,
         props.children != null ? h('span', { key: 'l' }, props.children) : null,
         props.iconEnd ? h(Icon, { key: 'ie', name: props.iconEnd, size: iconSize }) : null];
    var className = cx('wg-btn', 'wg-btn--' + variant, size === 'sm' && 'wg-btn--sm', props.block && 'wg-btn--block',
      props.done && 'wg-btn--done', size === 'sm' ? 'small' : 'body-strong', props.className);
    if (props.href) return h('a', Object.assign({ href: props.href, className: className }, other), content);
    return h('button', Object.assign({ type: props.type || 'button', className: className, 'aria-busy': props.loading || undefined }, other), content);
  }

  function IconButton(props) {
    var other = rest(props, ['icon', 'label', 'plain', 'size', 'className']);
    return h('button', Object.assign({ type: 'button', className: cx('wg-iconbtn', props.plain && 'wg-iconbtn--plain', props.size === 'sm' && 'wg-iconbtn--sm', props.className), 'aria-label': props.label }, other),
      h(Icon, { name: props.icon, size: props.size === 'sm' ? 18 : 22 }));
  }

  /* ---------------- Forms ---------------- */
  var fieldSeq = 0;
  function TextField(props) {
    var idRef = React.useRef(null);
    if (!idRef.current) idRef.current = props.id || 'wg-field-' + (++fieldSeq);
    var id = idRef.current;
    var other = rest(props, ['label', 'hint', 'error', 'className', 'id']);
    var describedBy = props.error ? id + '-err' : (props.hint ? id + '-hint' : undefined);
    return h('div', { className: cx('wg-field', props.className) },
      h('label', { className: 'wg-field__label small', htmlFor: id, style: { fontWeight: 500 } }, props.label),
      h('input', Object.assign({ id: id, className: 'wg-field__input body', 'aria-invalid': props.error ? true : undefined, 'aria-describedby': describedBy }, other)),
      props.error ? h('p', { id: id + '-err', className: 'wg-field__error small' }, props.error)
        : props.hint ? h('p', { id: id + '-hint', className: 'wg-field__hint small' }, props.hint) : null);
  }

  function Checkbox(props) {
    var other = rest(props, ['label', 'description', 'className']);
    return h('label', { className: cx('wg-check', props.className) },
      h('span', { className: 'wg-check__box' }, h('input', Object.assign({ type: 'checkbox' }, other)), h(Icon, { name: 'check' })),
      h('span', { className: 'wg-check__text' },
        h('span', { className: 'body', style: { display: 'block' } }, props.label),
        props.description ? h('span', { className: 'wg-check__desc small', style: { display: 'block' } }, props.description) : null));
  }

  function StatusPicker(props) {
    var value = props.value === undefined ? null : props.value;
    var opts = [{ s: 'free', kind: 'free' }, { s: 'busy', kind: 'busy' }];
    if (props.allowUnknown !== false) opts.push({ s: null, kind: 'unknown' });
    var labels = Object.assign({ free: 'ว่าง', busy: 'ไม่ว่าง', unknown: 'ไม่ระบุ' }, props.labels || {});
    return h('div', { className: cx('wg-seg', props.className), role: 'radiogroup', 'aria-label': props.label || 'สถานะของฉัน', style: { '--seg-count': opts.length } },
      opts.map(function (o) {
        var key = o.s || 'unknown';
        var on = value === o.s;
        return h('button', {
          key: key, type: 'button', role: 'radio', 'aria-checked': on, disabled: props.disabled,
          className: cx('wg-seg__opt', 'wg-seg__opt--' + key),
          onClick: function () { if (props.onChange) props.onChange(o.s); }
        }, h(StatusIcon, { kind: o.kind, size: 28 }), h('span', { className: 'small', style: { fontWeight: 600 } }, labels[key]));
      }));
  }

  /* ---------------- Status bits ---------------- */
  function Pill(props) {
    var tone = props.tone || (props.status ? 'outline' : 'orange');
    return h('span', { className: cx('wg-pill', 'wg-pill--' + tone, props.status && 'wg-pill--status', 'caption', props.className) },
      props.icon ? h(Icon, { name: props.icon, size: 14 }) : null,
      props.status ? h(StatusIcon, { kind: props.status, size: 18 }) : null,
      props.children);
  }

  function Initials(props) {
    var text = initialsOf(props.name);
    if (props.size === 'md' || props.size === 'lg') {
      return h('span', { className: cx('wg-avatar', props.size === 'lg' && 'wg-avatar--lg', 'caption', props.className), title: props.name, 'aria-hidden': props.decorative ? true : undefined, style: { fontWeight: 600 } }, text);
    }
    var status = props.status || 'free';
    return h('span', {
      className: cx('wg-initials', 'wg-initials--' + status, 'micro', props.className), role: 'img',
      'aria-label': props.label || (props.name + ' ' + (STATUS_LABEL[status] || ''))
    }, text);
  }

  function MemberChip(props) {
    return h('span', { className: cx('wg-member', props.isMe && 'wg-member--me', props.className) },
      h(Initials, { name: props.name, size: 'md', decorative: true }),
      h('span', { className: 'wg-member__name small', style: { fontWeight: 500 } }, props.name, props.isMe ? h('span', { className: 'wg-member__me' }, ' (คุณ)') : null),
      props.isOrganizer ? h(Pill, { tone: 'solid', icon: 'flag' }, 'ผู้จัด') : null,
      props.isGuest ? h(Pill, { tone: 'neutral' }, 'แขก') : null,
      props.onRemove ? h(IconButton, { icon: 'close', plain: true, size: 'sm', label: 'นำ ' + props.name + ' ออก', onClick: props.onRemove, disabled: props.removing }) : null);
  }

  /* ---------------- Calendar ---------------- */
  function MonthNav(props) {
    var title = props.title || new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' }).format(new Date(props.year, props.month - 1, 1));
    return h('div', { className: cx('wg-monthnav', props.className) },
      h(IconButton, { icon: 'chevron-left', label: 'เดือนก่อนหน้า', onClick: props.onPrev, disabled: !props.onPrev }),
      h('h2', { className: 'wg-monthnav__title heading', 'aria-live': 'polite' }, title),
      h(IconButton, { icon: 'chevron-right', label: 'เดือนถัดไป', onClick: props.onNext, disabled: !props.onNext }));
  }

  function pad2(n) { return String(n).padStart(2, '0'); }
  function MonthGrid(props) {
    var year = props.year, month = props.month;
    var lead = new Date(year, month - 1, 1).getDay();
    var days = new Date(year, month, 0).getDate();
    var renderDay = props.renderDay || function (iso, n) { return h(DayCell, { day: n }); };
    var cells = [];
    for (var b = 0; b < lead; b++) cells.push(h('div', { key: 'b' + b }));
    for (var i = 1; i <= days; i++) {
      var iso = year + '-' + pad2(month) + '-' + pad2(i);
      cells.push(h('div', { key: iso }, renderDay(iso, i)));
    }
    return h('div', { className: cx('wg-month', props.className) }, h('div', { className: 'wg-month__grid' },
      WEEKDAYS.map(function (w, i) {
        return h('div', { key: w, className: 'wg-month__wd caption', 'aria-hidden': true },
          h('span', { className: 'wg-month__wd-short' }, w), h('span', { className: 'wg-month__wd-long' }, WEEKDAYS_LONG[i]));
      }),
      cells));
  }

  function DayCell(props) {
    var status = props.status || null;
    var key = status || 'unknown';
    var variant = props.variant || 'personal';
    var prev = React.useRef(key);
    var changed = prev.current !== key;
    React.useEffect(function () { prev.current = key; });
    var layout = useLayout();

    if (props.outside) {
      return h('div', { className: cx('wg-day', 'wg-day--' + variant, 'wg-day--outside', props.className), 'aria-hidden': true },
        h('span', { className: 'wg-day__n day-number' }, props.day));
    }
    var friends = (props.friends || []).filter(function (f) { return f.status === 'free' || f.status === 'busy'; });
    var max = props.maxFriends || (layout === 'expanded' ? 8 : layout === 'medium' ? 6 : 4);
    var shown = friends.length > max ? friends.slice(0, max - 1) : friends;
    var extra = friends.length - shown.length;
    var hasReason = props.hasReason || !!props.reason;
    var label = props.label || (props.dateLabel || String(props.day)) + ' ของฉัน ' + STATUS_LABEL[key] +
      (props.confirmed ? ' (วันที่ยืนยัน)' : '') + (props.reason ? ' (' + props.reason + ')' : hasReason ? ' มีเหตุผล' : '');
    return h('button', {
      type: 'button', onClick: props.onClick, 'aria-pressed': !!props.selected, 'aria-label': label,
      className: cx('wg-day', 'wg-day--' + variant, 'wg-day--' + key, props.selected && 'is-selected', props.confirmed && 'is-confirmed', props.today && 'is-today', props.className)
    },
      h('span', { key: 'bg-' + key, className: cx('wg-day__bg', changed && 'wg-pop') }),
      h('span', { className: 'wg-day__n day-number' }, props.day),
      variant === 'trip' && friends.length
        ? h('span', { className: 'wg-day__friends' },
            shown.map(function (f) { return h(Initials, { key: f.name, name: f.name, status: f.status }); }),
            extra > 0 ? h('span', { className: 'wg-initials wg-initials--more micro', 'aria-label': 'และอีก ' + extra + ' คน' }, '+' + extra) : null)
        : null,
      hasReason ? h('span', { className: 'wg-day__reason', 'aria-hidden': true }) : null,
      props.reason ? h('span', { className: 'wg-day__reason-text caption', 'aria-hidden': true }, props.reason) : null,
      props.confirmed ? h('span', { className: 'wg-day__flag', 'aria-hidden': true }) : null);
  }

  function CalendarLegend(props) {
    var item = function (k, swatch, text) {
      return h('span', { key: k, className: 'wg-legend__item' }, swatch, text);
    };
    var items = [
      item('f', h('span', { className: 'wg-legend__swatch wg-legend__swatch--free' }), props.trip ? 'ฉันว่าง' : 'ว่าง'),
      item('b', h('span', { className: 'wg-legend__swatch wg-legend__swatch--busy' }), props.trip ? 'ฉันไม่ว่าง' : 'ไม่ว่าง'),
      item('u', h('span', { className: 'wg-legend__swatch wg-legend__swatch--unknown' }), 'ยังไม่ระบุ')
    ];
    if (props.trip) {
      items.push(item('ff', h(Initials, { name: 'เพื่อน', status: 'free', label: 'ป้ายเพื่อนว่าง' }), 'เพื่อนว่าง'));
      items.push(item('fb', h(Initials, { name: 'เพื่อน', status: 'busy', label: 'ป้ายเพื่อนไม่ว่าง' }), 'เพื่อนไม่ว่าง'));
    }
    if (props.confirmed) items.push(item('c', h('span', { className: 'wg-legend__swatch wg-legend__swatch--confirmed' }), 'วันที่ยืนยัน'));
    if (props.reason) items.push(item('r', h('span', { className: 'wg-legend__dot' }), 'มีเหตุผล'));
    return h('div', { className: cx('wg-legend', 'caption', props.className) }, items);
  }

  /* ---------------- Trip ---------------- */
  function AvatarStack(props) {
    var names = props.names || [];
    var max = props.max || 4;
    var shown = names.length > max ? names.slice(0, max - 1) : names;
    var extra = names.length - shown.length;
    return h('span', { className: 'wg-avatars', 'aria-label': 'สมาชิก ' + names.length + ' คน', role: 'img' },
      shown.map(function (n) { return h(Initials, { key: n, name: n, size: 'md', decorative: true }); }),
      extra > 0 ? h('span', { className: 'wg-avatar caption', 'aria-hidden': true, style: { background: 'var(--peach-50)', color: 'var(--ink-muted)', fontWeight: 600 } }, '+' + extra) : null);
  }

  function TripCard(props) {
    var confirmed = !!props.confirmedLabel;
    var Tag = props.href ? 'a' : 'button';
    var extra = props.href ? { href: props.href } : { type: 'button', onClick: props.onClick };
    return h(Tag, Object.assign({ className: cx('wg-card', 'wg-trip', props.className) }, extra),
      h(StatusIcon, { kind: confirmed ? 'confirmed' : 'finding', size: 44 }),
      h('span', { className: 'wg-trip__body' },
        h('span', { className: 'wg-trip__title heading', style: { display: 'block' } }, props.title),
        h('span', { className: 'wg-trip__meta small', style: { display: 'block' } }, 'เลือกได้ ' + props.rangeLabel + ' · ไป ' + props.durationDays + ' วัน'),
        h('span', { className: 'wg-trip__foot' },
          confirmed ? h(Pill, { tone: 'solid', icon: 'flag' }, 'ยืนยันแล้ว · ' + props.confirmedLabel) : h(Pill, { tone: 'neutral' }, 'กำลังหาวัน'),
          props.members && props.members.length ? h(AvatarStack, { names: props.members, max: 3 }) : null)),
      h(Icon, { name: 'chevron-right', size: 20, className: 'wg-trip__chev' }));
  }

  function SuggestionCard(props) {
    var a = props.available || [], b = props.busy || [], u = props.unknown || [];
    var total = a.length + b.length + u.length;
    var best = props.rank === 1;
    var icons = a.map(function (n) { return { n: n, m: 'free' }; }).concat(b.map(function (n) { return { n: n, m: 'busy' }; }), u.map(function (n) { return { n: n, m: 'unknown' }; }));
    return h('article', { className: cx('wg-card', 'wg-sugg', best && 'wg-sugg--best', props.className), 'aria-label': 'ช่วง ' + props.rangeLabel },
      h('div', { className: 'wg-sugg__head' },
        h('div', null,
          best ? h(Pill, { tone: 'solid', icon: 'sparkle' }, 'ลงตัวที่สุด') : h('span', { className: 'wg-sugg__rank caption', style: { fontWeight: 600 } }, 'อันดับ ' + props.rank),
          h('p', { className: 'wg-sugg__range heading' }, props.rangeLabel),
          props.durationDays ? h('span', { className: 'small wg-muted' }, props.durationDays + ' วัน') : null),
        h('div', { className: 'wg-sugg__stat' }, h('span', { className: 'stat' }, a.length + '/' + total), h('small', { className: 'caption' }, 'ว่าง'))),
      h('div', { className: 'wg-sugg__icons', role: 'list' },
        icons.map(function (f) { return h('span', { key: f.m + f.n, role: 'listitem', title: f.n + ' ' + STATUS_LABEL[f.m] }, h(StatusIcon, { kind: f.m, size: 28, title: f.n + ' ' + STATUS_LABEL[f.m] })); })),
      b.length === 0 && u.length === 0
        ? h('p', { className: 'wg-sugg__line wg-sugg__line--all body-strong' }, 'ว่างครบทุกคน! ไปกันเลย')
        : h('div', { className: 'wg-sugg__people' },
            h('p', { className: 'wg-sugg__counts small' },
              h('b', { className: 'is-free' }, 'ว่าง ' + a.length), ' · ', h('b', { className: 'is-busy' }, 'ติด ' + b.length), ' · ยังไม่ระบุ ' + u.length),
            b.length ? h('p', { className: 'wg-sugg__line wg-sugg__line--busy small' }, 'ติด: ' + b.join(', ')) : null,
            u.length ? h('p', { className: 'wg-sugg__line wg-sugg__line--unknown small' }, 'ยังไม่ระบุ: ' + u.join(', ')) : null),
      props.isConfirmed ? h('div', { className: 'wg-sugg__actions' }, h(Pill, { tone: 'solid', icon: 'flag' }, 'ยืนยันแล้ว'))
        : props.canConfirm ? h('div', { className: 'wg-sugg__actions' }, h(Button, { variant: best ? 'primary' : 'secondary', size: 'sm', icon: 'flag', onClick: props.onConfirm, loading: props.confirming }, 'เลือกช่วงนี้')) : null);
  }

  function ConfirmedDates(props) {
    if (!props.confirmedLabel) {
      return h('div', { className: cx('wg-finding', props.className) },
        h(StatusIcon, { kind: 'finding', size: 40 }),
        h('div', { className: 'wg-finding__body' },
          h('p', { className: 'body-strong' }, 'กำลังหาวัน'),
          h('p', { className: 'wg-finding__hint small' }, props.hint || 'ช่วยกันระบุวันว่าง แล้วผู้จัดจะเลือกช่วงที่ลงตัวที่สุด')));
    }
    var busy = props.busyNames || [];
    return h('section', { className: cx('wg-confirmed', props.className), 'aria-label': 'วันที่ยืนยัน' },
      h(StatusIcon, { kind: 'confirmed', size: 56, stamp: true }),
      h('div', { className: 'wg-confirmed__body' },
        h('p', { className: 'wg-confirmed__eyebrow small', style: { fontWeight: 600 } }, 'ยืนยันแล้ว!'),
        h('p', { className: 'wg-confirmed__dates title' }, props.confirmedLabel),
        h('p', { className: 'wg-confirmed__note small' }, props.note || 'จดไว้เลย ห้ามเทนะ'),
        busy.length ? h('p', { className: 'wg-confirmed__warn small' }, 'ไม่ว่างในวันที่ยืนยัน: ' + busy.join(', ')) : null,
        props.isOrganizer ? h(Button, { variant: 'ghost', size: 'sm', onClick: props.onClear, loading: props.clearing }, 'ยกเลิกวันที่ยืนยัน') : null));
  }

  function InviteLinkBox(props) {
    var st = React.useState(false), copied = st[0], setCopied = st[1];
    React.useEffect(function () {
      if (!copied) return undefined;
      var t = setTimeout(function () { setCopied(false); }, 2400);
      return function () { clearTimeout(t); };
    }, [copied]);
    function copy() {
      var done = function () { setCopied(true); if (props.onCopy) props.onCopy(); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(props.url).then(done, done); else done();
    }
    var isCopied = copied || props.copied;
    return h('section', { className: cx('wg-card', 'wg-invite', props.className), 'aria-label': 'ลิงก์เชิญ' },
      h('div', { className: 'wg-invite__head' },
        h('span', { className: 'wg-invite__icon' }, h(Icon, { name: 'users', size: 22 })),
        h('div', null,
          h('h3', { className: 'wg-invite__title heading' }, 'ชวนเพื่อนเข้าทริป'),
          h('p', { className: 'wg-invite__hint small' }, 'ใครได้ลิงก์นี้ก็เข้าทริปได้ทันที'))),
      h('div', { className: 'wg-invite__row' },
        h('input', { className: 'wg-field__input small', readOnly: true, value: props.url, 'aria-label': 'ลิงก์เชิญ', onFocus: function (e) { e.target.select(); } }),
        h(Button, { size: 'sm', icon: isCopied ? 'check' : 'copy', done: isCopied, onClick: copy, 'aria-live': 'polite' }, isCopied ? 'คัดลอกแล้ว!' : 'คัดลอก')),
      (props.onShare || props.canReplace) ? h('div', { className: 'wg-invite__more' },
        props.onShare ? h(Button, { variant: 'ghost', size: 'sm', icon: 'share', onClick: props.onShare }, 'แชร์เข้ากลุ่มแชต') : null,
        props.canReplace ? h(Button, { variant: 'ghost', size: 'sm', icon: 'refresh', onClick: props.onReplace, loading: props.replacing }, 'สร้างลิงก์ใหม่') : null) : null);
  }

  /* ---------------- Feedback ---------------- */
  var BANNER_ICON = { info: 'confirmed', honey: 'finding', success: 'free', danger: 'busy' };
  function Banner(props) {
    var tone = props.tone || 'info';
    var icon = props.icon === undefined ? BANNER_ICON[tone] : props.icon;
    return h('div', { className: cx('wg-banner', 'wg-banner--' + tone, props.className), role: tone === 'danger' ? 'alert' : 'status' },
      icon ? h(StatusIcon, { kind: icon, size: 32 }) : null,
      h('div', { className: 'wg-banner__body' },
        props.title ? h('p', { className: 'wg-banner__title body-strong' }, props.title) : null,
        props.children ? h('div', { className: 'wg-banner__text small' }, props.children) : null,
        props.actions ? h('div', { className: 'wg-banner__actions' }, props.actions) : null),
      props.onDismiss ? h(IconButton, { icon: 'close', plain: true, size: 'sm', label: 'ปิด', onClick: props.onDismiss, className: 'wg-banner__close' }) : null);
  }

  function EmptyState(props) {
    return h('div', { className: cx('wg-empty', props.className) },
      h(StatusIcon, { kind: props.icon || 'calendar', size: props.size || 72 }),
      h('h2', { className: 'wg-empty__title heading' }, props.title),
      props.children ? h('p', { className: 'wg-empty__text small' }, props.children) : null,
      props.action ? h('div', { className: 'wg-empty__action' }, props.action) : null);
  }

  /* ---------------- Navigation ---------------- */
  function Wordmark(props) {
    return h(props.href ? 'a' : 'span', { className: 'wg-wordmark', href: props.href, 'aria-label': 'WeGoJUAN' }, 'WeGo', h('span', null, 'JUAN'));
  }
  function AppBar(props) {
    return h('header', { className: cx('wg-appbar', props.onBack && 'wg-appbar--back', !props.title && 'wg-appbar--home', props.className) },
      props.onBack ? h(IconButton, { icon: 'chevron-left', plain: true, label: props.backLabel || 'กลับ', onClick: props.onBack }) : null,
      h('div', { className: 'wg-appbar__main' },
        props.title
          ? [h('h1', { key: 't', className: 'wg-appbar__title heading' }, props.title), props.subtitle ? h('p', { key: 's', className: 'wg-appbar__sub caption' }, props.subtitle) : null]
          : h(Wordmark, { href: props.homeHref })),
      props.actions ? h('div', { className: 'wg-appbar__actions' }, props.actions) : null);
  }

  function BottomNav(props) {
    var items = props.items || [
      { key: 'trips', label: 'ทริปของฉัน', icon: 'trip' },
      { key: 'calendar', label: 'ปฏิทินของฉัน', icon: 'calendar' }
    ];
    function item(it) {
      var Tag = it.href ? 'a' : 'button';
      var active = it.key === props.active;
      return h(Tag, Object.assign({ key: it.key, className: 'wg-bottomnav__item', 'aria-current': active ? 'page' : undefined, onClick: it.onClick }, it.href ? { href: it.href } : { type: 'button' }),
        h('span', { className: 'wg-bottomnav__icon' }, h(Icon, { name: it.icon, size: 22 })),
        h('span', { className: 'wg-bottomnav__label caption' }, it.label));
    }
    return h('nav', { className: cx('wg-bottomnav', props.static && 'wg-bottomnav--static', props.className), 'aria-label': 'เมนูหลัก' },
      item(items[0]),
      h('button', { type: 'button', className: 'wg-fab', 'aria-label': props.createLabel || 'สร้างทริป', onClick: props.onCreate }, h(Icon, { name: 'plus', size: 28 })),
      item(items[1]));
  }

  function Sheet(props) {
    React.useEffect(function () {
      if (!props.open || !props.onClose) return undefined;
      var onKey = function (e) { if (e.key === 'Escape') props.onClose(); };
      window.addEventListener('keydown', onKey);
      return function () { window.removeEventListener('keydown', onKey); };
    }, [props.open, props.onClose]);
    var layout = useLayout();
    if (!props.open) return null;
    var placement = props.placement || 'center';
    // A side panel (a calendar day) stays open beside the calendar on PC and on the second screen of a dual-screen device
    var docked = placement === 'side' && (layout === 'expanded' || layout === 'split');
    return h(Fragment, null,
      docked ? null : h('div', { className: cx('wg-sheet-scrim', 'wg-sheet-scrim--' + placement, props.inline && 'wg-sheet-scrim--inline'), onClick: props.onClose }),
      h('div', { className: cx('wg-sheet', 'wg-sheet--' + placement, docked && 'wg-sheet--docked', props.inline && 'wg-sheet--inline', props.className), role: 'dialog', 'aria-modal': !docked, 'aria-label': props.title },
        h('div', { className: 'wg-sheet__handle', 'aria-hidden': true }),
        h('div', { className: 'wg-sheet__head' },
          props.icon ? h(StatusIcon, { kind: props.icon, size: 32 }) : null,
          h('h2', { className: 'wg-sheet__title title' }, props.title),
          props.onClose ? h(IconButton, { icon: 'close', plain: true, label: 'ปิด', onClick: props.onClose }) : null),
        h('div', { className: 'wg-sheet__body' }, props.children),
        props.footer ? h('div', { className: 'wg-sheet__foot' }, props.footer) : null));
  }

  /* ---------------- Layout across devices ---------------- */
  var NAV_ITEMS = [
    { key: 'trips', label: 'ทริปของฉัน', short: 'ทริป', icon: 'trip' },
    { key: 'calendar', label: 'ปฏิทินของฉัน', short: 'ปฏิทิน', icon: 'calendar' }
  ];
  function SideNav(props) {
    var items = props.items || NAV_ITEMS;
    var createLabel = props.createLabel || 'สร้างทริป';
    return h('nav', { className: cx('wg-sidenav', props.className), 'aria-label': 'เมนูหลัก' },
      h('div', { className: 'wg-sidenav__brand' },
        h('span', { className: 'wg-sidenav__mark' }, h(StatusIcon, { kind: 'confirmed', size: 40, title: 'WeGoJUAN' })),
        h('span', { className: 'wg-sidenav__word' }, h(Wordmark, { href: props.homeHref }))),
      h('div', { className: 'wg-sidenav__create' },
        h('button', { type: 'button', className: 'wg-fab wg-sidenav__fab', 'aria-label': createLabel, onClick: props.onCreate }, h(Icon, { name: 'plus', size: 28 })),
        h(Button, { block: true, icon: 'plus', className: 'wg-sidenav__btn', onClick: props.onCreate }, createLabel)),
      h('ul', { className: 'wg-sidenav__items' }, items.map(function (it) {
        var Tag = it.href ? 'a' : 'button';
        return h('li', { key: it.key }, h(Tag, Object.assign({
          className: 'wg-sidenav__item', 'aria-current': it.key === props.active ? 'page' : undefined, onClick: it.onClick
        }, it.href ? { href: it.href } : { type: 'button' }),
          h('span', { className: 'wg-sidenav__icon' }, h(Icon, { name: it.icon, size: 22 })),
          h('span', { className: 'wg-sidenav__label caption' }, h('span', { className: 'wg-sidenav__short' }, it.short || it.label), h('span', { className: 'wg-sidenav__long' }, it.label))));
      })),
      props.trips && props.trips.length ? h('div', { className: 'wg-sidenav__trips' },
        h('p', { className: 'wg-sidenav__heading caption' }, props.tripsHeading || 'ทริปล่าสุด'),
        h('ul', null, props.trips.map(function (t) {
          var Tag = t.href ? 'a' : 'button';
          return h('li', { key: t.key || t.title }, h(Tag, Object.assign({
            className: 'wg-sidenav__trip small', 'aria-current': t.active ? 'page' : undefined, onClick: t.onClick
          }, t.href ? { href: t.href } : { type: 'button' }),
            h(StatusIcon, { kind: t.status || 'finding', size: 24 }), h('span', null, t.title)));
        }))) : null,
      props.user ? h('div', { className: 'wg-sidenav__user' },
        h(Initials, { name: props.user, size: 'md', decorative: true }),
        h('span', { className: 'wg-sidenav__username small' }, props.user)) : null);
  }

  function AppShell(props) {
    var ref = React.useRef(null);
    var autoSplit = useViewportSegments();
    var split = props.split === undefined || props.split === 'auto' ? autoSplit : !!props.split;
    var st = React.useState(function () { return layoutFor(typeof window !== 'undefined' ? window.innerWidth : 0, split); });
    var layout = st[0], setLayout = st[1];
    var useIso = React.useLayoutEffect || React.useEffect;
    useIso(function () {
      var el = ref.current;
      if (!el) return undefined;
      var measure = function () { setLayout(layoutFor(el.offsetWidth, split)); }; // layout width, unaffected by transforms
      measure();
      if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', measure); return function () { window.removeEventListener('resize', measure); }; }
      var ro = new ResizeObserver(measure);
      ro.observe(el);
      return function () { ro.disconnect(); };
    }, [split]);
    var showBottomNav = props.bottomNav !== false;
    return h(LayoutContext.Provider, { value: layout },
      h('div', { ref: ref, className: cx('wg-app', 'wg-app--' + layout, split && 'wg-app--split', props.contained && 'wg-app--contained', props.className), style: props.style, 'data-layout': layout },
        h('div', { className: 'wg-app__frame' },
          h(SideNav, { active: props.active, items: props.items, onCreate: props.onCreate, createLabel: props.createLabel, trips: props.trips, tripsHeading: props.tripsHeading, user: props.user, homeHref: props.homeHref }),
          h('main', { className: cx('wg-app__main', showBottomNav && 'wg-app__main--nav') }, props.children)),
        showBottomNav ? h(BottomNav, { active: props.active, items: props.items, onCreate: props.onCreate, createLabel: props.createLabel }) : null));
  }

  function PageLayout(props) {
    return h('div', { className: cx('wg-page', props.aside && 'wg-page--aside', props.className) },
      props.header ? h('div', { className: 'wg-page__header' }, props.header) : null,
      h('div', { className: 'wg-page__main' }, props.children),
      props.aside ? h('aside', { className: 'wg-page__aside', 'aria-label': props.asideLabel }, props.aside) : null);
  }

  var api = {
    Button: Button, IconButton: IconButton, Icon: Icon, StatusIcon: StatusIcon, TextField: TextField, Checkbox: Checkbox,
    StatusPicker: StatusPicker, Pill: Pill, Initials: Initials, AvatarStack: AvatarStack, MemberChip: MemberChip,
    MonthNav: MonthNav, MonthGrid: MonthGrid, DayCell: DayCell, CalendarLegend: CalendarLegend,
    TripCard: TripCard, SuggestionCard: SuggestionCard, ConfirmedDates: ConfirmedDates, InviteLinkBox: InviteLinkBox,
    Banner: Banner, EmptyState: EmptyState, Wordmark: Wordmark, AppBar: AppBar, BottomNav: BottomNav, Sheet: Sheet,
    AppShell: AppShell, SideNav: SideNav, PageLayout: PageLayout, useLayout: useLayout, LayoutContext: LayoutContext,
    initialsOf: initialsOf, STATUS_LABEL: STATUS_LABEL
  };
  window.WeGoJUAN = Object.assign(window.WeGoJUAN || {}, api);
})();
