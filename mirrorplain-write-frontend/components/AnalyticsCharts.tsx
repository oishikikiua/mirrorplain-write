"use client";

import { useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AnalyticsData {
  totalWords: number;
  totalTime: number;
  entries: Array<{
    timestamp: number;
    words: number;
    duration: number;
  }>;
}

export function WeeklyHeatmap({ data }: { data: AnalyticsData }) {
  const weeklyData = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Group entries by day of week
    const grouped = daysOfWeek.map((day, index) => {
      const dayEntries = data.entries.filter(entry => {
        const date = new Date(entry.timestamp * 1000);
        const dayOfWeek = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
        return dayOfWeek === index;
      });
      
      const totalMinutes = dayEntries.reduce((sum, e) => sum + Math.floor(e.duration / 60), 0);
      const totalWords = dayEntries.reduce((sum, e) => sum + e.words, 0);
      
      return {
        day,
        minutes: totalMinutes,
        words: totalWords,
      };
    });
    
    return grouped;
  }, [data]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Weekly Activity</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={weeklyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="day" stroke="var(--color-text)" />
          <YAxis stroke="var(--color-text)" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--color-surface)', 
              border: '1px solid var(--color-border)',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar dataKey="words" fill="var(--color-primary)" name="Words" />
          <Bar dataKey="minutes" fill="var(--color-secondary)" name="Minutes" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyTrend({ data }: { data: AnalyticsData }) {
  const monthlyData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Group entries by day of month
    const grouped = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dayEntries = data.entries.filter(entry => {
        const date = new Date(entry.timestamp * 1000);
        return date.getDate() === day && 
               date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear;
      });
      
      const totalWords = dayEntries.reduce((sum, e) => sum + e.words, 0);
      const totalMinutes = dayEntries.reduce((sum, e) => sum + Math.floor(e.duration / 60), 0);
      
      return {
        day: day.toString(),
        words: totalWords,
        minutes: totalMinutes,
      };
    });
    
    return grouped;
  }, [data]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Monthly Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis 
            dataKey="day" 
            stroke="var(--color-text)"
            interval={2}
          />
          <YAxis stroke="var(--color-text)" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--color-surface)', 
              border: '1px solid var(--color-border)',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="words" 
            stroke="var(--color-primary)" 
            strokeWidth={2}
            name="Words"
            dot={{ fill: 'var(--color-primary)' }}
          />
          <Line 
            type="monotone" 
            dataKey="minutes" 
            stroke="var(--color-secondary)" 
            strokeWidth={2}
            name="Minutes"
            dot={{ fill: 'var(--color-secondary)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GoalProgress({ current, goal, label }: { current: number; goal: number; label: string }) {
  const percentage = goal > 0 ? Math.min(Math.round((current / goal) * 100), 100) : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-[var(--color-text-secondary)]">
          {current} / {goal} ({percentage}%)
        </span>
      </div>
      <div className="w-full h-3 bg-[var(--color-surface-hover)] rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

