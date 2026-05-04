// Mock data — used for charts/lists so the app feels alive even before real data exists
export const mockChild = {
  name: "Emma",
  age: 10,
  grade: "5",
  avatarColor: "#7C3AED",
  device: "Chrome Browser",
};

export const weeklyScreenTime = [
  { day: "Mon", minutes: 165 },
  { day: "Tue", minutes: 198 },
  { day: "Wed", minutes: 142 },
  { day: "Thu", minutes: 220 },
  { day: "Fri", minutes: 175 },
  { day: "Sat", minutes: 210 },
  { day: "Sun", minutes: 142 },
];

export const categoryData = [
  { name: "Education", value: 52, color: "#10B981" },
  { name: "Gaming", value: 22, color: "#3B82F6" },
  { name: "Video", value: 14, color: "#F59E0B" },
  { name: "Search", value: 8, color: "#7C3AED" },
  { name: "Blocked", value: 4, color: "#EF4444" },
];

export const safetyTrend = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  score: 85 + Math.round(Math.sin(i / 3) * 6) + (i > 22 ? 4 : 0),
}));

export const hourlyActivity = [
  { hour: "6AM", min: 0 }, { hour: "7AM", min: 5 }, { hour: "8AM", min: 12 },
  { hour: "9AM", min: 38 }, { hour: "10AM", min: 28 }, { hour: "11AM", min: 18 },
  { hour: "12PM", min: 8 }, { hour: "1PM", min: 14 }, { hour: "2PM", min: 22 },
  { hour: "3PM", min: 32 }, { hour: "4PM", min: 25 }, { hour: "5PM", min: 12 },
  { hour: "6PM", min: 18 }, { hour: "7PM", min: 22 }, { hour: "8PM", min: 14 },
  { hour: "9PM", min: 4 }, { hour: "10PM", min: 0 },
];

export type Status = "safe" | "warning" | "blocked";
export interface Activity {
  domain: string; title: string; category: string; status: Status; time: string; duration: string;
}
export const recentActivity: Activity[] = [
  { domain: "khanacademy.org", title: "Khan Academy — Math practice", category: "Education", status: "safe", time: "09:02", duration: "38m" },
  { domain: "youtube.com", title: "YouTube Kids", category: "Video", status: "warning", time: "09:44", duration: "12m" },
  { domain: "nationalgeographic.com", title: "National Geographic Kids", category: "Education", status: "safe", time: "10:10", duration: "21m" },
  { domain: "free-prizes-win.xyz", title: "Suspicious prize site", category: "Scam", status: "blocked", time: "10:35", duration: "0s" },
  { domain: "coolmathgames.com", title: "Cool Math Games", category: "Gaming", status: "safe", time: "11:00", duration: "45m" },
  { domain: "google.com", title: "Google Search", category: "Search", status: "safe", time: "11:52", duration: "6m" },
  { domain: "adult-content.net", title: "Adult content (blocked)", category: "Adult", status: "blocked", time: "12:05", duration: "0s" },
  { domain: "britannica.com", title: "Encyclopedia Britannica", category: "Education", status: "safe", time: "13:20", duration: "17m" },
  { domain: "roblox.com", title: "Roblox", category: "Gaming", status: "safe", time: "14:00", duration: "32m" },
  { domain: "wikipedia.org", title: "Wikipedia", category: "Education", status: "safe", time: "15:10", duration: "24m" },
];

export const blockedSites = [
  { domain: "adult-content.net", reason: "Adult content", attempts: 6, last: "12:05", risk: "high" },
  { domain: "free-prizes-win.xyz", reason: "Scam / phishing", attempts: 4, last: "10:35", risk: "high" },
  { domain: "gore-videos.com", reason: "Violent content", attempts: 3, last: "08:30", risk: "high" },
  { domain: "casino-bonus.io", reason: "Gambling", attempts: 2, last: "Yesterday", risk: "medium" },
  { domain: "hateforum.example", reason: "Hate speech", attempts: 5, last: "Yesterday", risk: "high" },
  { domain: "tiktok.com", reason: "Restricted by parent", attempts: 8, last: "Today", risk: "low" },
];

export const alerts = [
  { id: 1, type: "blocked", title: "Blocked adult content", site: "adult-content.net", time: "12:05", severity: "high" },
  { id: 2, type: "blocked", title: "Scam website blocked", site: "free-prizes-win.xyz", time: "10:35", severity: "high" },
  { id: 3, type: "warning", title: "YouTube accessed (restricted mode on)", site: "youtube.com", time: "09:44", severity: "medium" },
  { id: 4, type: "blocked", title: "Violent content blocked", site: "gore-videos.com", time: "08:30", severity: "high" },
  { id: 5, type: "info", title: "Daily screen time at 60%", site: "System", time: "15:00", severity: "low" },
  { id: 6, type: "warning", title: "New device detected", site: "iPad", time: "14:22", severity: "medium" },
];

export const suggestedPrompts = [
  "How much time did Emma spend online today?",
  "What websites were blocked today?",
  "Show me this week's safety report",
  "Is Emma's screen time within limits?",
  "What did Emma search for today?",
  "Generate a weekly activity summary",
  "Which sites are safe for homework?",
  "Set focus mode for homework time",
];

export const childPrompts = [
  "How much time do I have left? ⏰",
  "Tell me a fun fact! 🌍",
  "What's a safe website for homework? 📚",
  "Can you help me with math? ➕",
  "Tell me a joke! 😄",
];
