import type * as React from 'react';

/** A Mark's value on one day. `null` = Unknown (no Mark). */
export type Status = 'free' | 'busy';
export type IconName = 'trip' | 'calendar' | 'plus' | 'users' | 'copy' | 'share' | 'refresh' | 'flag' | 'sparkle' | 'lock' | 'edit' | 'trash' | 'exit' | 'check' | 'close' | 'more' | 'chevron-left' | 'chevron-right';
/** StatusIcon kinds. Trip status: finding (CalendarClock, sand) · confirmed (Ticket, orange) · calendar (Calendar, sand: empty states).
 *  Member availability: free (Check, free-soft) · busy (X, mist) · unknown (MoreHorizontal, dashed white). Icons from lucide-react. */
export type StatusKind = 'finding' | 'confirmed' | 'calendar' | 'free' | 'busy' | 'unknown';
/** compact < 600 · medium 600–1023 · expanded ≥ 1024 · split = two screens (Surface Duo), measured on the AppShell's width */
export type Layout = 'compact' | 'medium' | 'expanded' | 'split';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary: one per screen. secondary: everything else. ghost: inline links. danger: destructive text button. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** md = 48px (default), sm = 36px */
  size?: 'md' | 'sm';
  /** Full width: sticky bottom CTAs on phones */
  block?: boolean;
  icon?: IconName;
  iconEnd?: IconName;
  /** Shows bouncing dots instead of the label */
  loading?: boolean;
  /** Teal success state with a pop, e.g. "คัดลอกแล้ว!" */
  done?: boolean;
  /** Renders an <a> instead of a <button> */
  href?: string;
}
export declare function Button(props: ButtonProps): React.ReactElement;

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** Accessible name (Thai), e.g. "เดือนก่อนหน้า" */
  label: string;
  plain?: boolean;
  size?: 'md' | 'sm';
}
export declare function IconButton(props: IconButtonProps): React.ReactElement;

export interface IconProps { name: IconName; size?: number; title?: string; className?: string }
export declare function Icon(props: IconProps): React.ReactElement;

export interface StatusIconProps {
  kind: StatusKind;
  /** Circle diameter in px (default 32); the icon and its stroke scale with it */
  size?: number;
  /** Pass a label when the icon stands alone ("Nat ว่าง"); omit to hide it from screen readers. Empty string = default Thai label. */
  title?: string;
  /** One stamp-in animation (the moment dates are confirmed) */
  stamp?: boolean;
  className?: string;
}
export declare function StatusIcon(props: StatusIconProps): React.ReactElement;

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
}
export declare function TextField(props: TextFieldProps): React.ReactElement;

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  description?: React.ReactNode;
}
export declare function Checkbox(props: CheckboxProps): React.ReactElement;

export interface StatusPickerProps {
  value: Status | null;
  onChange?: (status: Status | null) => void;
  /** Show the "ไม่ระบุ" option that clears the Mark (default true) */
  allowUnknown?: boolean;
  labels?: Partial<Record<'free' | 'busy' | 'unknown', string>>;
  /** Accessible name of the radio group (default "สถานะของฉัน") */
  label?: string;
  disabled?: boolean;
  className?: string;
}
export declare function StatusPicker(props: StatusPickerProps): React.ReactElement;

export interface PillProps {
  /** Defaults to 'outline' when status is set, else 'orange' */
  tone?: 'solid' | 'orange' | 'neutral' | 'outline' | 'free' | 'busy' | 'honey';
  icon?: IconName;
  /** An 18px StatusIcon at the start, e.g. a friend's availability */
  status?: StatusKind;
  children?: React.ReactNode;
  className?: string;
}
export declare function Pill(props: PillProps): React.ReactElement;

export interface InitialsProps {
  name: string;
  /** Cell badge colour/shape (xs). Ignored for avatars. */
  status?: Status;
  /** Omit for the 14px cell badge; md = 32px avatar, lg = 40px avatar */
  size?: 'md' | 'lg';
  label?: string;
  decorative?: boolean;
  className?: string;
}
export declare function Initials(props: InitialsProps): React.ReactElement;
export declare function AvatarStack(props: { names: string[]; max?: number }): React.ReactElement;

export interface MemberChipProps {
  name: string;
  isOrganizer?: boolean;
  isGuest?: boolean;
  isMe?: boolean;
  /** Organizer only, never on themselves. Confirm in a Sheet first. */
  onRemove?: () => void;
  removing?: boolean;
  className?: string;
}
export declare function MemberChip(props: MemberChipProps): React.ReactElement;

export interface MonthNavProps {
  year: number;
  /** 1–12 */
  month: number;
  /** Omit to disable (e.g. at the edge of the Date Range) */
  onPrev?: () => void;
  onNext?: () => void;
  title?: string;
}
export declare function MonthNav(props: MonthNavProps): React.ReactElement;

export interface MonthGridProps {
  year: number;
  /** 1–12 */
  month: number;
  /** isoDate = "YYYY-MM-DD" */
  renderDay?: (isoDate: string, dayOfMonth: number) => React.ReactNode;
  className?: string;
}
export declare function MonthGrid(props: MonthGridProps): React.ReactElement;

export interface DayCellProps {
  day: number;
  /** My Mark; null/undefined = Unknown */
  status?: Status | null;
  variant?: 'personal' | 'trip';
  /** Trip only: friends' Marks for this day (Unknown friends are skipped) */
  friends?: { name: string; status: Status | null }[];
  /** Max badges before "+N" (default from the layout: 4 compact/split, 6 medium, 8 expanded) */
  maxFriends?: number;
  selected?: boolean;
  today?: boolean;
  /** Inside the trip's Confirmed Dates */
  confirmed?: boolean;
  /** A private Reason exists (personal calendar): a dot */
  hasReason?: boolean;
  /** Personal calendar only: the private Reason, shown as text when the grid is 680px or wider (a dot below that). Never pass it to a trip cell. */
  reason?: string;
  /** Outside the month or the Date Range: not tappable */
  outside?: boolean;
  onClick?: () => void;
  /** Full aria-label override */
  label?: string;
  /** Spoken date used in the default aria-label, e.g. "ศ. 5 ธ.ค." */
  dateLabel?: string;
  className?: string;
}
export declare function DayCell(props: DayCellProps): React.ReactElement;

export interface CalendarLegendProps { trip?: boolean; confirmed?: boolean; reason?: boolean; className?: string }
export declare function CalendarLegend(props: CalendarLegendProps): React.ReactElement;

export interface TripCardProps {
  title: string;
  /** The Date Range, e.g. "1–20 ธ.ค." */
  rangeLabel: string;
  durationDays: number;
  /** Confirmed Dates label; omit while Finding Dates */
  confirmedLabel?: string;
  members?: string[];
  href?: string;
  onClick?: () => void;
  className?: string;
}
export declare function TripCard(props: TripCardProps): React.ReactElement;

export interface SuggestionCardProps {
  /** 1-based; rank 1 is the "ลงตัวที่สุด" card */
  rank: number;
  rangeLabel: string;
  durationDays?: number;
  available: string[];
  busy: string[];
  unknown: string[];
  /** Organizer can pick this Window */
  canConfirm?: boolean;
  onConfirm?: () => void;
  confirming?: boolean;
  isConfirmed?: boolean;
  className?: string;
}
export declare function SuggestionCard(props: SuggestionCardProps): React.ReactElement;

export interface ConfirmedDatesProps {
  /** Omit while Finding Dates */
  confirmedLabel?: string;
  busyNames?: string[];
  isOrganizer?: boolean;
  onClear?: () => void;
  clearing?: boolean;
  note?: string;
  hint?: string;
  className?: string;
}
export declare function ConfirmedDates(props: ConfirmedDatesProps): React.ReactElement;

export interface InviteLinkBoxProps {
  url: string;
  /** Show when navigator.share exists */
  onShare?: () => void;
  canReplace?: boolean;
  onReplace?: () => void;
  replacing?: boolean;
  onCopy?: () => void;
  copied?: boolean;
  className?: string;
}
export declare function InviteLinkBox(props: InviteLinkBoxProps): React.ReactElement;

export interface BannerProps {
  tone?: 'info' | 'honey' | 'success' | 'danger';
  /** Override the tone's default icon (info → confirmed, honey → finding, success → free, danger → busy); null hides it */
  icon?: StatusKind | null;
  title?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}
export declare function Banner(props: BannerProps): React.ReactElement;

export interface EmptyStateProps { title: string; children?: React.ReactNode; action?: React.ReactNode; /** default 'calendar' */ icon?: StatusKind; size?: number; className?: string }
export declare function EmptyState(props: EmptyStateProps): React.ReactElement;

export declare function Wordmark(props: { href?: string }): React.ReactElement;

export interface AppBarProps {
  /** Omit on tab screens to show the wordmark */
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  actions?: React.ReactNode;
  homeHref?: string;
  className?: string;
}
export declare function AppBar(props: AppBarProps): React.ReactElement;

export interface BottomNavItem { key: string; label: string; /** Rail label (tablet), e.g. "ทริป" */ short?: string; icon: IconName; href?: string; onClick?: () => void }
export interface BottomNavProps {
  active?: string;
  /** Exactly two: left and right of the create button */
  items?: [BottomNavItem, BottomNavItem];
  onCreate?: () => void;
  createLabel?: string;
  /** Render in flow instead of fixed to the viewport */
  static?: boolean;
  className?: string;
}
export declare function BottomNav(props: BottomNavProps): React.ReactElement;

export interface SheetProps {
  open: boolean;
  title: string;
  onClose?: () => void;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** A StatusIcon in the header (not on destructive confirmations) */
  icon?: StatusKind;
  /** center (default): confirmations — bottom sheet on phones, centred dialog from tablet up.
   *  side: a calendar day — bottom sheet on phones, floating panel on tablets, non-modal drawer on PC, the right screen on a Duo. */
  placement?: 'center' | 'side';
  /** Position inside the nearest positioned container instead of the viewport */
  inline?: boolean;
  className?: string;
}
export declare function Sheet(props: SheetProps): React.ReactElement | null;

export interface RecentTrip { key?: string; title: string; status?: 'finding' | 'confirmed'; href?: string; onClick?: () => void; active?: boolean }

export interface AppShellProps {
  children?: React.ReactNode;
  active?: string;
  onCreate?: () => void;
  /** Display name for the avatar in the rail/sidebar */
  user?: string;
  /** Sidebar's recent trips (expanded only), three at most */
  trips?: RecentTrip[];
  tripsHeading?: string;
  items?: [BottomNavItem, BottomNavItem];
  createLabel?: string;
  /** false: no BottomNav on compact (inside a trip, sticky-footer screens) */
  bottomNav?: boolean;
  /** 'auto' (default) follows (horizontal-viewport-segments: 2); true/false forces it */
  split?: boolean | 'auto';
  /** Lay out inside a fixed-size, position:relative box instead of the viewport (mockups) */
  contained?: boolean;
  homeHref?: string;
  /** e.g. { '--wg-safe-top': '59px' } to mock safe areas, { '--wg-hinge': '34px' } for split */
  style?: React.CSSProperties & Record<string, string | number>;
  className?: string;
}
export declare function AppShell(props: AppShellProps): React.ReactElement;

export interface SideNavProps {
  active?: string;
  onCreate?: () => void;
  items?: [BottomNavItem, BottomNavItem];
  trips?: RecentTrip[];
  tripsHeading?: string;
  user?: string;
  createLabel?: string;
  homeHref?: string;
  className?: string;
}
export declare function SideNav(props: SideNavProps): React.ReactElement;

export interface PageLayoutProps {
  /** An AppBar, or a title block on tab pages */
  header?: React.ReactNode;
  /** The main column */
  children?: React.ReactNode;
  /** Beside main on expanded, on the right screen in split, below main otherwise */
  aside?: React.ReactNode;
  asideLabel?: string;
  className?: string;
}
export declare function PageLayout(props: PageLayoutProps): React.ReactElement;

/** The current layout from the nearest AppShell ('compact' outside one) */
export declare function useLayout(): Layout;
export declare const LayoutContext: React.Context<Layout>;

export declare function initialsOf(name: string): string;
export declare const STATUS_LABEL: Record<'free' | 'busy' | 'unknown', string>;

declare global {
  interface Window {
    WeGoJUAN: {
      Button: typeof Button; IconButton: typeof IconButton; Icon: typeof Icon; StatusIcon: typeof StatusIcon;
      TextField: typeof TextField; Checkbox: typeof Checkbox; StatusPicker: typeof StatusPicker;
      Pill: typeof Pill; Initials: typeof Initials; AvatarStack: typeof AvatarStack; MemberChip: typeof MemberChip;
      MonthNav: typeof MonthNav; MonthGrid: typeof MonthGrid; DayCell: typeof DayCell; CalendarLegend: typeof CalendarLegend;
      TripCard: typeof TripCard; SuggestionCard: typeof SuggestionCard; ConfirmedDates: typeof ConfirmedDates; InviteLinkBox: typeof InviteLinkBox;
      Banner: typeof Banner; EmptyState: typeof EmptyState; Wordmark: typeof Wordmark; AppBar: typeof AppBar; BottomNav: typeof BottomNav; Sheet: typeof Sheet;
      AppShell: typeof AppShell; SideNav: typeof SideNav; PageLayout: typeof PageLayout; useLayout: typeof useLayout; LayoutContext: typeof LayoutContext;
      initialsOf: typeof initialsOf; STATUS_LABEL: typeof STATUS_LABEL;
    };
  }
}
