/**
 * @dailyuse/ui-react-shadcn
 *
 * shadcn/ui styled React components for DailyUse applications.
 * Built on top of Radix UI primitives.
 * 
 * 组件分类：
 * 1. ui/ - shadcn/ui 官方组件（不可修改）
 * 2. custom/ - 基于官方组件封装的业务组件
 */

// Utilities
export { cn } from './lib/utils';

// ============================================
// UI Components - Official shadcn/ui (DO NOT MODIFY)
// ============================================

// Accordion
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from './components/ui/accordion';

// Alert
export { Alert, AlertTitle, AlertDescription } from './components/ui/alert';

// Alert Dialog
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './components/ui/alert-dialog';

// Aspect Ratio
export { AspectRatio } from './components/ui/aspect-ratio';

// Avatar
export { Avatar, AvatarImage, AvatarFallback } from './components/ui/avatar';

// Badge
export { Badge, badgeVariants } from './components/ui/badge';

// Breadcrumb
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from './components/ui/breadcrumb';

// Button
export { Button, buttonVariants, type ButtonProps } from './components/ui/button';

// Button Group
export { ButtonGroup } from './components/ui/button-group';

// Calendar
export { Calendar } from './components/ui/calendar';

// Card
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './components/ui/card';

// Carousel
export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from './components/ui/carousel';

// Chart
export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
} from './components/ui/chart';

// Checkbox
export { Checkbox } from './components/ui/checkbox';

// Collapsible
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from './components/ui/collapsible';

// Command
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from './components/ui/command';

// Context Menu
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
} from './components/ui/context-menu';

// Dialog
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './components/ui/dialog';

// Drawer
export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from './components/ui/drawer';

// Dropdown Menu
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './components/ui/dropdown-menu';

// Empty
export { Empty } from './components/ui/empty';

// Field
export { Field } from './components/ui/field';

// Form
export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} from './components/ui/form';

// Hover Card
export { HoverCard, HoverCardTrigger, HoverCardContent } from './components/ui/hover-card';

// Input
export { Input } from './components/ui/input';
export type InputProps = React.ComponentProps<'input'>;

// Input Group
export { InputGroup } from './components/ui/input-group';

// Input OTP
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from './components/ui/input-otp';

// Item
export { Item } from './components/ui/item';

// Kbd
export { Kbd } from './components/ui/kbd';

// Label
export { Label } from './components/ui/label';

// Menubar
export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
} from './components/ui/menubar';

// Navigation Menu
export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
} from './components/ui/navigation-menu';

// Pagination
export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from './components/ui/pagination';

// Popover
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from './components/ui/popover';

// Progress
export { Progress } from './components/ui/progress';

// Radio Group
export { RadioGroup, RadioGroupItem } from './components/ui/radio-group';

// Resizable
export { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './components/ui/resizable';

// Scroll Area
export { ScrollArea, ScrollBar } from './components/ui/scroll-area';

// Select
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './components/ui/select';

// Separator
export { Separator } from './components/ui/separator';

// Sheet
export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from './components/ui/sheet';

// Sidebar
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from './components/ui/sidebar';

// Skeleton
export { Skeleton } from './components/ui/skeleton';

// Slider
export { Slider } from './components/ui/slider';

// Sonner (Toast)
export { Toaster } from './components/ui/sonner';

// Spinner
export { Spinner } from './components/ui/spinner';

// Switch
export { Switch } from './components/ui/switch';

// Table
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './components/ui/table';

// Tabs
export { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';

// Textarea
export { Textarea } from './components/ui/textarea';

// Toggle
export { Toggle, toggleVariants } from './components/ui/toggle';

// Toggle Group
export { ToggleGroup, ToggleGroupItem } from './components/ui/toggle-group';

// Tooltip
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from './components/ui/tooltip';

// ============================================
// Hooks
// ============================================
export { useIsMobile } from './hooks/use-mobile';

// ============================================
// Custom Components (Business-specific wrappers)
// ============================================
// 自定义组件将在此处导出
// export * from './components/custom';

