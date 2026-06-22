import { Icon as IconifyIcon, type IconProps } from "@iconify/react";
import { forwardRef } from "react";

type Props = Omit<IconProps, "icon"> & { className?: string; size?: number | string };

const make = (name: string) => {
  const Comp = forwardRef<SVGSVGElement, Props>(({ className, size, width, height, ...rest }, ref) => (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <IconifyIcon
      ref={ref as any}
      icon={name}
      className={className}
      width={width ?? size ?? "1em"}
      height={height ?? size ?? "1em"}
      {...rest}
    />
  ));
  Comp.displayName = name;
  return Comp;
};

const s = (n: string) => `solar:${n}-bold-duotone`;

export const AlertTriangle = make(s("danger-triangle"));
export const ArrowLeft = make(s("arrow-left"));
export const ArrowRight = make(s("arrow-right"));
export const ArrowUpRight = make(s("arrow-right-up"));
export const BarChart3 = make(s("chart-2"));
export const Bell = make(s("bell"));
export const Calendar = make(s("calendar"));
export const Check = make(s("check-circle"));
export const CheckCircle2 = make(s("check-circle"));
export const ChevronDown = make(s("alt-arrow-down"));
export const ChevronLeft = make(s("alt-arrow-left"));
export const ChevronRight = make(s("alt-arrow-right"));
export const ChevronUp = make(s("alt-arrow-up"));
export const Circle = make(s("record-circle"));
export const Copy = make(s("copy"));
export const Crown = make(s("crown"));
export const Download = make(s("download"));
export const ExternalLink = make(s("square-arrow-right-up"));
export const Globe = make(s("global"));
export const GripVertical = make(s("hamburger-menu"));
export const History = make(s("history"));
export const ImageIcon = make(s("gallery"));
export const LayoutDashboard = make(s("widget-2"));
export const Link2 = make(s("link"));
export const Loader2 = make(s("refresh"));
export const LogOut = make(s("logout-2"));
export const Minus = make(s("minus-circle"));
export const MoreHorizontal = make(s("menu-dots"));
export const Package = make(s("box"));
export const PanelLeft = make(s("sidebar-minimalistic"));
export const Plus = make(s("add-circle"));
export const Power = make(s("power"));
export const Receipt = make(s("bill-list"));
export const RefreshCw = make(s("refresh"));
export const Search = make(s("magnifer"));
export const Settings = make(s("settings"));
export const ShoppingBag = make(s("bag-4"));
export const ShoppingCart = make(s("cart-large"));
export const Shuffle = make(s("shuffle"));
export const Sparkles = make(s("stars"));
export const Store = make(s("shop"));
export const Tag = make(s("tag"));
export const Target = make(s("target"));
export const Trash2 = make(s("trash-bin-trash"));
export const TrendingUp = make(s("graph-up"));
export const Wand2 = make(s("magic-stick-3"));
export const X = make(s("close-circle"));
export const Zap = make(s("bolt"));
export const Activity = make(s("pulse-2"));
export const Shield = make(s("shield-check"));
export const Key = make(s("key"));
export const Lock = make(s("lock"));
export const FileText = make(s("document-text"));
export const Mail = make(s("letter"));
export const Cookie = make(s("cup-hot"));
export const Users = make(s("users-group-rounded"));
export const Scale = make(s("scale"));
export const Server = make(s("server"));
export const UserCheck = make(s("user-check"));