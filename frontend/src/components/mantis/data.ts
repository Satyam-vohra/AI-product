import {
  Activity,
  AlertTriangle,
  BarChart3,
  BatteryCharging,
  Bell,
  BookOpen,
  Bot,
  Building2,
  CheckCircle2,
  CircuitBoard,
  Cpu,
  Gauge,
  Monitor,
  PackageCheck,
  Search,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  User,
  Wrench,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ProductPart = {
  id: string;
  name: string;
  icon: LucideIcon;
  health: number;
  risk: "Low" | "Medium" | "High";
  details: string;
  failures: string[];
  action: string;
};

export const productParts: ProductPart[] = [
  {
    id: "battery",
    name: "Battery",
    icon: BatteryCharging,
    health: 78,
    risk: "Medium",
    details: "48V lithium module with a 12-cell balancing board and thermal cutoff.",
    failures: ["Voltage sag under load", "BMS calibration drift", "Thermal cutoff trips"],
    action: "Run cell variance check, inspect pack temperature, then load test at 60%.",
  },
  {
    id: "motor",
    name: "Motor",
    icon: Cpu,
    health: 91,
    risk: "Low",
    details: "Brushless drive motor with hall sensor feedback and sealed bearings.",
    failures: ["Bearing noise", "Hall sensor mismatch", "Overcurrent during startup"],
    action: "Compare phase resistance, review startup current, then inspect shaft play.",
  },
  {
    id: "compressor",
    name: "Compressor",
    icon: Gauge,
    health: 62,
    risk: "High",
    details: "Two-stage compressor with pressure sensor, relief valve, and oil separator.",
    failures: ["Low output pressure", "High vibration", "Oil carryover"],
    action: "Check inlet restriction, pressure delta, vibration trend, and relief valve state.",
  },
  {
    id: "fuse",
    name: "Fuse",
    icon: CircuitBoard,
    health: 84,
    risk: "Medium",
    details: "Fast-acting protection fuse on the primary control board.",
    failures: ["Intermittent open circuit", "Undersized replacement", "Heat discoloration"],
    action: "Isolate load branches, verify fuse rating, and inspect nearby terminals.",
  },
  {
    id: "pump",
    name: "Pump",
    icon: Wrench,
    health: 73,
    risk: "Medium",
    details: "Variable-speed coolant pump with ceramic impeller and flow feedback.",
    failures: ["Air lock", "Flow sensor mismatch", "Impeller wear"],
    action: "Prime loop, compare commanded RPM to flow, then inspect inlet filter.",
  },
  {
    id: "display",
    name: "Display",
    icon: Monitor,
    health: 95,
    risk: "Low",
    details: "Touch display module with CAN status overlay and service menu.",
    failures: ["Backlight dimming", "Touch dead zone", "Firmware mismatch"],
    action: "Run panel self-test, confirm firmware bundle, and verify CAN heartbeat.",
  },
  {
    id: "valve",
    name: "Valve",
    icon: SlidersHorizontal,
    health: 58,
    risk: "High",
    details: "Solenoid valve controlling thermal bypass and compressor pressure routing.",
    failures: ["Stiction", "Coil resistance drift", "Seal leakage"],
    action: "Pulse valve, measure coil resistance, then perform pressure decay test.",
  },
];

export const products = [
  {
    name: "AeroCool X200 Compressor",
    category: "Industrial HVAC",
    status: "Live",
    health: 82,
    price: "$8,400",
    image: "linear-gradient(135deg, #1f2937, #06b6d4 45%, #f59e0b)",
    summary: "Predictive maintenance kit for compressor arrays and pressure loops.",
  },
  {
    name: "VoltEdge Battery B45",
    category: "Energy Storage",
    status: "Certified",
    health: 91,
    price: "$2,180",
    image: "linear-gradient(135deg, #0f172a, #22c55e 48%, #a3e635)",
    summary: "Smart battery module with BMS telemetry and guided repair playbooks.",
  },
  {
    name: "HydroPulse Pump HP-900",
    category: "Fluid Systems",
    status: "Beta",
    health: 74,
    price: "$5,950",
    image: "linear-gradient(135deg, #111827, #3b82f6 45%, #14b8a6)",
    summary: "High-flow diagnostics for coolant loops, valves, filters, and seals.",
  },
];

export const sessions = [
  ["ACX-2041", "AeroCool X200", "Compressor pressure drop", "High", "Open", "2m ago"],
  ["VEB-1120", "VoltEdge B45", "Battery voltage sag", "Medium", "Triaged", "18m ago"],
  ["HPP-8127", "HydroPulse HP-900", "Pump flow mismatch", "Medium", "Resolved", "1h ago"],
  ["DSP-4210", "Display D12", "Touch response drift", "Low", "Resolved", "3h ago"],
];

export const analytics = [
  { day: "Mon", resolved: 32, escalated: 7, accuracy: 91 },
  { day: "Tue", resolved: 48, escalated: 5, accuracy: 93 },
  { day: "Wed", resolved: 42, escalated: 8, accuracy: 92 },
  { day: "Thu", resolved: 57, escalated: 4, accuracy: 95 },
  { day: "Fri", resolved: 61, escalated: 6, accuracy: 96 },
  { day: "Sat", resolved: 36, escalated: 3, accuracy: 94 },
  { day: "Sun", resolved: 44, escalated: 4, accuracy: 97 },
];

export const knowledgeItems = [
  { title: "Compressor pressure loss diagnostics", type: "PDF", owner: "Field Ops", confidence: "98%" },
  { title: "Battery BMS reset procedure", type: "Runbook", owner: "Safety", confidence: "94%" },
  { title: "Valve coil resistance matrix", type: "Table", owner: "Engineering", confidence: "91%" },
  { title: "Pump priming and air lock checklist", type: "Video", owner: "Support", confidence: "89%" },
];

export const notifications = [
  { icon: AlertTriangle, title: "Compressor X200 pressure anomaly", meta: "High priority", tone: "text-red-400" },
  { icon: CheckCircle2, title: "Battery B45 session resolved", meta: "AI confidence 96%", tone: "text-emerald-400" },
  { icon: Bell, title: "New manual indexed", meta: "Valve service pack v4", tone: "text-sky-400" },
];

export const dashboardCards = [
  { label: "Open AI Sessions", value: "28", change: "+12%", icon: Bot },
  { label: "Products Monitored", value: "156", change: "+8", icon: ShoppingBag },
  { label: "Manuals Indexed", value: "12.8k", change: "+420", icon: BookOpen },
  { label: "Resolution Rate", value: "94.7%", change: "+3.1%", icon: Activity },
];

export const adminCards = [
  { label: "Tenants", value: "84", icon: Building2 },
  { label: "Active Users", value: "12,420", icon: User },
  { label: "Model Accuracy", value: "96.2%", icon: BarChart3 },
  { label: "Safety Holds", value: "17", icon: AlertTriangle },
];

export const flowSteps = ["Intake", "Telemetry", "Likely cause", "Safety gate", "Repair plan"];

export const searchResults = [
  { icon: Search, title: "Find pressure loss in AeroCool X200", tag: "Smart Search" },
  { icon: PackageCheck, title: "Compare B45 battery warranty cohorts", tag: "Marketplace" },
  { icon: Settings, title: "Invite service engineers", tag: "Settings" },
  { icon: Zap, title: "Start compressor troubleshooting", tag: "AI Chat" },
];
