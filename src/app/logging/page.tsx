'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import Sidebar from '../components/Sidebar';
import WebChat from '../components/WebChat';
import UserActivityChart from '../components/charts/UserActivityChart';
import MessagesPerSessionChart from '../components/charts/MessagesPerSessionChart';
import LLMActivityChart from '../components/charts/LLMActivityChart';
import OverviewChart from '../components/charts/OverviewChart';

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
  eventTypes: Record<string, any>;
  customEvents: Record<string, any>;
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

export default function LoggingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('7'); // Default to 7 days

  // Check if user is admin
  if (!isAuthenticated || user?.role !== 'admin') {
    router.push('/');
    return (
      <div className="dashboard-container">
        <Sidebar />
        <div className="dashboard-main-content">
          <div className="dashboard-header">
            <div className="header-content">
              <div className="welcome-section">
                <h1>Toegang Geweigerd</h1>
                <p>U heeft geen toestemming om deze pagina te bekijken</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fetchAnalytics = async (range?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const days = parseInt(range || dateRange);
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await fetch(`/api/analytics?startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.records || []);
      } else {
        setError(data.error || 'Failed to fetch analytics');
        setAnalytics([]); // Set empty array on error
      }
    } catch (err) {
      setError('Error fetching analytics data');
      setAnalytics([]); // Set empty array on error
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    fetchAnalytics(range);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('nl-NL');
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('nl-NL');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDuration = (ms: number) => {
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeSection="logging" />
      
      <div className="dashboard-main-content">
        <div className="dashboard-header">
          <div className="header-content">
            <div className="welcome-section">
              <h1>WebChat Logging</h1>
              <p>Bekijk en beheer webchat logs en conversaties</p>
            </div>
            <div className="header-controls">
              <select 
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="date-range-select"
                disabled={loading}
              >
                <option value="1">Last 24 hours</option>
                <option value="3">Last 3 days</option>
                <option value="7">Last 7 days</option>
                <option value="14">Last 14 days</option>
                <option value="30">Last 30 days</option>
              </select>
              <button 
                onClick={() => fetchAnalytics()}
                disabled={loading}
                className="refresh-button"
              >
                {loading ? 'Loading...' : '🔄 Refresh'}
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="logging-content">
            {error && (
              <div className="error-message">
                <p>❌ {error}</p>
              </div>
            )}
            
            {loading ? (
              <div className="loading-message">
                <p>Loading analytics data...</p>
              </div>
            ) : analytics.length === 0 ? (
              <div className="no-data-message">
                <p>No analytics data available for the selected period.</p>
              </div>
            ) : (
              <div className="analytics-dashboard">
                {/* Row 1: User Distribution and User Activity Trend */}
                {/* User Distribution Donut Chart */}
                <div className="stat-box-large">
                  <div className="box-header">
                    <div className="box-icon">👥</div>
                    <div className="box-title">User Distribution</div>
                  </div>
                  <div className="box-content">
                    <div className="donut-chart-container">
                      <div className="donut-chart">
                        <svg className="chart-donut" viewBox="0 0 100 100">
                          {(() => {
                            const totalNewUsers = analytics.reduce((sum, record) => sum + (record.newUsers || 0), 0);
                            const totalReturningUsers = analytics.reduce((sum, record) => sum + (record.returningUsers || 0), 0);
                            const totalUsers = totalNewUsers + totalReturningUsers;
                            
                            if (totalUsers === 0) {
                              return (
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="8"
                                  strokeDasharray="251.2 251.2"
                                  strokeDashoffset="0"
                                  transform="rotate(-90 50 50)"
                                />
                              );
                            }
                            
                            const newUsersPercentage = (totalNewUsers / totalUsers) * 251.2;
                            const returningUsersPercentage = (totalReturningUsers / totalUsers) * 251.2;
                            
                            return (
                              <>
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  fill="none"
                                  stroke="#f97316"
                                  strokeWidth="8"
                                  strokeDasharray={`${newUsersPercentage} 251.2`}
                                  strokeDashoffset="0"
                                  transform="rotate(-90 50 50)"
                                />
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  fill="none"
                                  stroke="#eab308"
                                  strokeWidth="8"
                                  strokeDasharray={`${returningUsersPercentage} 251.2`}
                                  strokeDashoffset={`-${newUsersPercentage}`}
                                  transform="rotate(-90 50 50)"
                                />
                              </>
                            );
                          })()}
                        </svg>
                        <div className="donut-center">
                          <div className="donut-total">
                            {formatNumber(analytics.reduce((sum, record) => sum + (record.newUsers || 0) + (record.returningUsers || 0), 0))}
                          </div>
                          <div className="donut-label">Total Users</div>
                        </div>
                      </div>
                      <div className="donut-legend">
                        <div className="legend-item">
                          <span className="legend-color" style={{backgroundColor: '#f97316'}}></span>
                          <span className="legend-label">New Users</span>
                          <span className="legend-value">
                            {formatNumber(analytics.reduce((sum, record) => sum + (record.newUsers || 0), 0))}
                          </span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-color" style={{backgroundColor: '#eab308'}}></span>
                          <span className="legend-label">Returning Users</span>
                          <span className="legend-value">
                            {formatNumber(analytics.reduce((sum, record) => sum + (record.returningUsers || 0), 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Activity Chart - Spans 3 columns */}
                <UserActivityChart analytics={analytics} dateRange={dateRange} />

                {/* Row 2: Overview, Message Activity, Sessions */}
                {/* Overview Chart */}
                <OverviewChart analytics={analytics} dateRange={dateRange} />

                {/* Medium Message Stats Box */}
                <div className="stat-box-medium">
                  <div className="box-header">
                    <div className="box-icon">💬</div>
                    <div className="box-title">Message Activity</div>
                  </div>
                  <div className="box-content">
                    <div className="stat-row">
                      <div className="stat-item">
                        <div className="stat-value">{formatNumber(analytics.reduce((sum, record) => sum + (record.messages || 0), 0))}</div>
                        <div className="stat-label">Total Messages</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">{formatNumber(analytics.reduce((sum, record) => sum + (record.userMessages || 0), 0))}</div>
                        <div className="stat-label">User Messages</div>
                      </div>
                    </div>
                    <div className="stat-row">
                      <div className="stat-item">
                        <div className="stat-value">{formatNumber(analytics.reduce((sum, record) => sum + (record.botMessages || 0), 0))}</div>
                        <div className="stat-label">Bot Messages</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">{formatNumber(analytics.reduce((sum, record) => sum + (record.sessions || 0), 0))}</div>
                        <div className="stat-label">Total Sessions</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 3: Messages/Sessions, Events, Messages per Session */}
                {/* Messages per Session Box */}
                <div className="stat-box-small">
                  <div className="box-header">
                    <div className="box-icon">📊</div>
                    <div className="box-title">Messages/Session</div>
                  </div>
                  <div className="box-content">
                    <div className="main-stat">
                      <div className="main-stat-value">
                        {(() => {
                          const totalMessages = analytics.reduce((sum, record) => sum + (record.messages || 0), 0);
                          const totalSessions = analytics.reduce((sum, record) => sum + (record.sessions || 0), 0);
                          return totalSessions > 0 ? (totalMessages / totalSessions).toFixed(1) : '0.0';
                        })()}
                      </div>
                      <div className="main-stat-label">Avg Messages per Session</div>
                    </div>
                  </div>
                </div>

                {/* Small Events Box */}
                <div className="stat-box-small">
                  <div className="box-header">
                    <div className="box-icon">📊</div>
                    <div className="box-title">Events</div>
                  </div>
                  <div className="box-content">
                    <div className="main-stat">
                      <div className="main-stat-value">{formatNumber(analytics.reduce((sum, record) => sum + (record.events || 0), 0))}</div>
                      <div className="main-stat-label">Total Events</div>
                    </div>
                  </div>
                </div>

                {/* Messages Per Session Chart */}
                <MessagesPerSessionChart analytics={analytics} dateRange={dateRange} />

                {/* Row 4: LLM Activity and Technical Metrics */}
                {/* LLM Activity Chart */}
                <LLMActivityChart analytics={analytics} dateRange={dateRange} />

                {/* Medium LLM Latency Box */}
                <div className="stat-box-medium">
                  <div className="box-header">
                    <div className="box-icon">⏱️</div>
                    <div className="box-title">LLM Latency</div>
                  </div>
                  <div className="box-content">
                    <div className="stat-row">
                      <div className="stat-item">
                        <div className="stat-value">{formatDuration(analytics.reduce((sum, record) => sum + (record.llm?.latency?.mean || 0), 0) / Math.max(analytics.length, 1))}</div>
                        <div className="stat-label">Avg Latency</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">{formatDuration(analytics.reduce((sum, record) => sum + (record.llm?.latency?.max || 0), 0) / Math.max(analytics.length, 1))}</div>
                        <div className="stat-label">Max Latency</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medium Token Usage Box */}
                <div className="stat-box-medium">
                  <div className="box-header">
                    <div className="box-icon">📥</div>
                    <div className="box-title">Token Usage</div>
                  </div>
                  <div className="box-content">
                    <div className="stat-row">
                      <div className="stat-item">
                        <div className="stat-value">{formatNumber(analytics.reduce((sum, record) => sum + (record.llm?.inputTokens || 0), 0))}</div>
                        <div className="stat-label">Input Tokens</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">{formatNumber(analytics.reduce((sum, record) => sum + (record.llm?.outputTokens || 0), 0))}</div>
                        <div className="stat-label">Output Tokens</div>
                      </div>
                    </div>
                    <div className="stat-row">
                      <div className="stat-item">
                        <div className="stat-value">{(analytics.reduce((sum, record) => sum + (record.llm?.tokensPerSecond?.mean || 0), 0) / Math.max(analytics.length, 1)).toFixed(2)}</div>
                        <div className="stat-label">Avg Tokens/sec</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">{formatCurrency(analytics.reduce((sum, record) => sum + (record.llm?.cost?.sum || 0), 0))}</div>
                        <div className="stat-label">Total Cost</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WebChat Bubble */}
      <div className="chat-window">
        <div className="chat-header" onClick={() => setShowChat(!showChat)}>
          <div className="chat-title">💬 Chat Support</div>
          <div className="chat-status">Online</div>
        </div>
        {showChat && <WebChat />}
      </div>
    </div>
  );
}
