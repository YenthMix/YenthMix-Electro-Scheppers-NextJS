"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";

interface AnalyticsRecord {
  startDateTimeUtc: string;
  endDateTimeUtc: string;
  returningUsers: number;
  newUsers: number;
  sessions: number;
  messages: number;
  userMessages: number;
  botMessages: number;
  events: number;
  eventTypes: any;
  customEvents: any;
  llm: {
    calls: number;
    errors: number;
    inputTokens: number;
    outputTokens: number;
    latency: {
      mean: number;
      sd: number;
      min: number;
      max: number;
    };
    tokensPerSecond: {
      mean: number;
      sd: number;
      min: number;
      max: number;
    };
    cost: {
      sum: number;
      mean: number;
      sd: number;
      min: number;
      max: number;
    };
  };
}

interface MessagesPerSessionChartProps {
  analytics: AnalyticsRecord[];
  dateRange: string;
}

export default function MessagesPerSessionChart({ analytics, dateRange }: MessagesPerSessionChartProps) {
  // Generate all dates/times in the range
  const generateDateRange = () => {
    const days = parseInt(dateRange);
    const dates = [];
    const today = new Date();
    
    if (days === 1) {
      // For 24 hours, show 8 time slots (every 3 hours)
      for (let i = 0; i < 8; i++) {
        const time = new Date(today);
        time.setHours(i * 3, 0, 0, 0);
        dates.push(time);
      }
    } else {
      // For multiple days, show daily data
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date);
      }
    }
    
    return dates;
  };

  // Create a map of existing data by date/time
  const dataMap = new Map();
  analytics.forEach((record) => {
    const recordDate = new Date(record.startDateTimeUtc);
    let dateKey;
    
    if (parseInt(dateRange) === 1) {
      // For 24 hours, group by 3-hour intervals
      const hour = recordDate.getHours();
      const timeSlot = Math.floor(hour / 3) * 3;
      const timeSlotDate = new Date(recordDate);
      timeSlotDate.setHours(timeSlot, 0, 0, 0);
      dateKey = timeSlotDate.toISOString();
    } else {
      // For multiple days, group by date
      dateKey = recordDate.toISOString().split('T')[0];
    }
    
    const existing = dataMap.get(dateKey) || { messages: 0, sessions: 0, botMessages: 0, messagesPerSession: 0, botMessagesPerSession: 0 };
    const newMessages = existing.messages + (record.messages || 0);
    const newSessions = existing.sessions + (record.sessions || 0);
    const newBotMessages = existing.botMessages + (record.botMessages || 0);
    
    dataMap.set(dateKey, {
      messages: newMessages,
      sessions: newSessions,
      botMessages: newBotMessages,
      messagesPerSession: newSessions > 0 ? Number((newMessages / newSessions).toFixed(2)) : 0,
      botMessagesPerSession: newSessions > 0 ? Number((newBotMessages / newSessions).toFixed(2)) : 0
    });
  });

  // Transform analytics data for the chart with all dates/times
  const chartData = generateDateRange().map((date) => {
    let dateKey;
    let displayLabel;
    
    if (parseInt(dateRange) === 1) {
      // For 24 hours, show time slots
      dateKey = date.toISOString();
      displayLabel = date.toLocaleTimeString('nl-NL', { 
        hour: '2-digit',
        hour12: false 
      });
    } else {
      // For multiple days, show dates
      dateKey = date.toISOString().split('T')[0];
      displayLabel = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    const data = dataMap.get(dateKey) || { messages: 0, sessions: 0, botMessages: 0, messagesPerSession: 0, botMessagesPerSession: 0 };
    
    return {
      date: displayLabel,
      messagesPerSession: data.messagesPerSession,
      botMessagesPerSession: data.botMessagesPerSession
    };
  });

  return (
    <div className="stat-box-chart">
      <div className="box-header mb-4 pb-3 border-b border-gray-100">
        <div className="box-icon">💬</div>
        <div className="box-title">Messages per Session</div>
      </div>
      
      <div className="chart-container h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#374151" 
              fontSize={12}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#374151" 
              fontSize={12}
              tick={{ fill: '#6b7280' }}
            />
            <Tooltip
              contentStyle={{ 
                borderRadius: "12px", 
                backgroundColor: "#fff", 
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              }}
              cursor={{ stroke: "#6366f1", strokeWidth: 2, strokeDasharray: "5 5" }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              wrapperStyle={{
                paddingBottom: "10px"
              }}
            />
            <Line 
              type="monotone" 
              dataKey="messagesPerSession" 
              stroke="#8b5cf6" 
              strokeWidth={3} 
              dot={{ r: 4, fill: "#8b5cf6" }} 
              activeDot={{ r: 6, stroke: "#8b5cf6", strokeWidth: 2 }}
              name="Messages/Session"
            />
            <Line 
              type="monotone" 
              dataKey="botMessagesPerSession" 
              stroke="#06b6d4" 
              strokeWidth={3} 
              dot={{ r: 4, fill: "#06b6d4" }} 
              activeDot={{ r: 6, stroke: "#06b6d4", strokeWidth: 2 }}
              name="Bot Messages/Session"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
