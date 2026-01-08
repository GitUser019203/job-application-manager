import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Application } from './types';

interface AnalyticsProps {
    applications: Application[];
}

const Analytics: React.FC<AnalyticsProps> = ({ applications }) => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const heatmapContainerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{
        date: string;
        count: number;
        x: number;
        y: number;
    } | null>(null);

    useEffect(() => {
        if (!tooltip) return;
        const handleOutsideClick = () => setTooltip(null);
        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, [tooltip]);

    const getLocalKey = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const stats = useMemo(() => {
        // ... (rest of stats logic stays same, or we could filter by year? 
        // Typically these aggregate stats are overall, but the heatmap is year-specific)
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const oneWeekAgo = today - 7 * 24 * 60 * 60 * 1000;
        const oneMonthAgo = today - 30 * 24 * 60 * 60 * 1000;
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const staleApps = applications.filter(app => new Date(app.submissionDate) < threeMonthsAgo);
        const ghostedCount = staleApps.filter(app => app.status === 'Submitted').length;

        const statusCounts = applications.reduce((acc, app) => {
            let s = app.status as string;
            if (s === 'Submitted') {
                const isStale = new Date(app.submissionDate) < threeMonthsAgo;
                s = isStale ? 'Submitted for more than 3 months' : 'Submitted for less than 3 months';
            }
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total: applications.length,
            today: applications.filter(app => new Date(app.submissionDate).getTime() >= today).length,
            thisWeek: applications.filter(app => new Date(app.submissionDate).getTime() >= oneWeekAgo).length,
            thisMonth: applications.filter(app => new Date(app.submissionDate).getTime() >= oneMonthAgo).length,
            byStatus: statusCounts,
            staleNoInterview: {
                count: ghostedCount,
                percentage: applications.length > 0 ? (ghostedCount / applications.length) * 100 : 0
            }
        };
    }, [applications]);

    // Heatmap Data Preparation
    const heatmapData = useMemo(() => {
        const data: Record<string, number> = {};
        applications.forEach(app => {
            const date = getLocalKey(new Date(app.submissionDate));
            data[date] = (data[date] || 0) + 1;
        });
        return data;
    }, [applications]);

    // Generate days for the selected year
    const days = useMemo(() => {
        const result = [];
        const startDate = new Date(selectedYear, 0, 1);
        // Adjust to nearest Sunday BEFORE Jan 1st
        startDate.setDate(startDate.getDate() - startDate.getDay());

        const endDate = new Date(selectedYear, 11, 31);
        // Adjust to nearest Saturday AFTER Dec 31st
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

        const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;

        for (let i = 0; i < totalDays; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const dateStr = getLocalKey(d);
            result.push({
                date: dateStr,
                count: heatmapData[dateStr] || 0,
                dayOfWeek: d.getDay(),
                month: d.getMonth(),
                dayOfMonth: d.getDate(),
                isCurrentYear: d.getFullYear() === selectedYear
            });
        }
        return result;
    }, [heatmapData, selectedYear]);

    const getColor = (count: number) => {
        if (count === 0) return 'bg-slate-100';
        if (count === 1) return 'bg-indigo-200';
        if (count === 2) return 'bg-indigo-300';
        if (count === 3) return 'bg-indigo-300'; // Adjusted for better visual flow
        if (count >= 4) return 'bg-indigo-500';
        return 'bg-slate-100';
    };

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Group days into weeks for column-based display
    const weeks = useMemo(() => {
        const w = [];
        for (let i = 0; i < days.length; i += 7) {
            w.push(days.slice(i, i + 7));
        }
        return w;
    }, [days]);

    const availableYears = useMemo(() => {
        const years = new Set<number>();
        years.add(new Date().getFullYear());
        applications.forEach(app => {
            const year = new Date(app.submissionDate).getFullYear();
            if (!isNaN(year)) years.add(year);
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [applications]);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 pl-10">Analytics</h2>
                    <p className="text-slate-500">Visualize your application journey and consistency</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Total</div>
                    <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Today</div>
                    <div className="text-3xl font-bold text-indigo-600">{stats.today}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Last 7 Days</div>
                    <div className="text-3xl font-bold text-blue-600">{stats.thisWeek}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Last 30 Days</div>
                    <div className="text-3xl font-bold text-teal-600">{stats.thisMonth}</div>
                </div>
            </div>

            {/* Calendar Heatmap */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 overflow-hidden relative" ref={heatmapContainerRef}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-800">Application Intensity</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedYear(prev => prev - 1)}
                            className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-600"
                        >
                            ←
                        </button>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                        >
                            {availableYears.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => setSelectedYear(prev => prev + 1)}
                            className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-600"
                        >
                            →
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto pb-4">
                    <div className="inline-flex flex-col min-w-max">
                        {/* Month Labels */}
                        <div className="flex mb-2 text-[10px] text-slate-400 h-4">
                            <div className="w-8"></div>
                            {weeks.map((week, i) => {
                                const firstDay = week[0];
                                const showMonth = firstDay.dayOfMonth <= 7 && firstDay.isCurrentYear;
                                return (
                                    <div key={i} className="w-3 mx-[1px]">
                                        {showMonth && months[firstDay.month]}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex">
                            {/* Weekday Labels */}
                            <div className="flex flex-col pr-2 text-[10px] text-slate-400 space-y-[4.5px] pt-[2px]">
                                <div className="h-3"></div>
                                <div className="h-3">Mon</div>
                                <div className="h-3"></div>
                                <div className="h-3">Wed</div>
                                <div className="h-3"></div>
                                <div className="h-3">Fri</div>
                                <div className="h-3"></div>
                            </div>

                            {/* Grid */}
                            <div className="flex gap-[2px]">
                                {weeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className="flex flex-col gap-[2px]">
                                        {week.map((day, dayIndex) => (
                                            <div
                                                key={dayIndex}
                                                onMouseEnter={(e) => {
                                                    if (!day.isCurrentYear) return;
                                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                    const containerRect = heatmapContainerRef.current?.getBoundingClientRect();
                                                    if (containerRect) {
                                                        setTooltip({
                                                            date: day.date,
                                                            count: day.count,
                                                            x: rect.left - containerRect.left + rect.width / 2,
                                                            y: rect.top - containerRect.top
                                                        });
                                                    }
                                                }}
                                                onMouseLeave={() => setTooltip(null)}
                                                onClick={(e) => {
                                                    if (!day.isCurrentYear) return;
                                                    e.stopPropagation();
                                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                    const containerRect = heatmapContainerRef.current?.getBoundingClientRect();
                                                    if (containerRect) {
                                                        if (tooltip?.date === day.date) {
                                                            setTooltip(null);
                                                        } else {
                                                            setTooltip({
                                                                date: day.date,
                                                                count: day.count,
                                                                x: rect.left - containerRect.left + rect.width / 2,
                                                                y: rect.top - containerRect.top
                                                            });
                                                        }
                                                    }
                                                }}
                                                aria-label={`${formatDate(day.date)}: ${day.count} applications`}
                                                className={`w-3 h-3 rounded-[2px] transition-colors ${day.isCurrentYear
                                                    ? `${getColor(day.count)} cursor-pointer hover:ring-1 hover:ring-indigo-400`
                                                    : 'bg-transparent pointer-events-none'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-500">
                    <span>Less</span>
                    <div className="flex gap-[2px]">
                        <div className="w-3 h-3 rounded-[2px] bg-slate-100" />
                        <div className="w-3 h-3 rounded-[2px] bg-indigo-200" />
                        <div className="w-3 h-3 rounded-[2px] bg-indigo-300" />
                        <div className="w-3 h-3 rounded-[2px] bg-indigo-400" />
                        <div className="w-3 h-3 rounded-[2px] bg-indigo-600" />
                    </div>
                    <span>More</span>
                </div>

                {/* Heatmap Tooltip - Now Absolute within the relative card container */}
                {tooltip && (
                    <div
                        className="absolute z-[100] px-3 py-2 bg-slate-800 text-white text-[11px] rounded-lg shadow-xl pointer-events-none -translate-x-1/2 -translate-y-full mb-2 flex flex-col items-center animate-in fade-in zoom-in duration-200"
                        style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
                    >
                        <div className="font-bold whitespace-nowrap">{formatDate(tooltip.date)}</div>
                        <div className="text-slate-300">{tooltip.count} {tooltip.count === 1 ? 'application' : 'applications'}</div>
                        {/* Small arrow */}
                        <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                    </div>
                )}
            </div>

            {/* Secondary Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Status Distribution</h3>
                    <div className="space-y-4">
                        {['Submitted for less than 3 months', 'Submitted for more than 3 months', 'Interviewing', 'Offer Received', 'Rejected']
                            .filter(status => stats.byStatus[status] !== undefined)
                            .map((status) => {
                                const count = stats.byStatus[status];
                                const percentage = (count / stats.total) * 100;
                                const color =
                                    status === 'Submitted for less than 3 months' ? 'bg-blue-500' :
                                        status === 'Submitted for more than 3 months' ? 'bg-slate-400' :
                                            status === 'Interviewing' ? 'bg-yellow-500' :
                                                status === 'Offer Received' ? 'bg-green-500' :
                                                    status === 'Rejected' ? 'bg-red-500' : 'bg-slate-400';

                                return (
                                    <div key={status}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-slate-700 capitalize">{status}</span>
                                            <span className="text-slate-500">{count} ({percentage.toFixed(0)}%)</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div
                                                className={`${color} h-2 rounded-full transition-all duration-1000`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                    </div>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Engagement Overview</h3>
                    <div className="flex flex-col justify-center h-full">
                        <div className="text-center">
                            <div className="text-5xl font-bold text-indigo-600 mb-2">
                                {stats.total > 0 ? (stats.thisMonth / 30).toFixed(1) : 0}
                            </div>
                            <p className="text-slate-500 text-sm">Applications per day (last 30 days)</p>
                        </div>
                        <div className="mt-8 border-t border-slate-100 pt-8 grid grid-cols-2 text-center">
                            <div>
                                <div className="text-2xl font-bold text-slate-800">
                                    {(() => {
                                        let streak = 0;
                                        const now = new Date();
                                        const today = getLocalKey(now);
                                        const yesterdayDate = new Date(now);
                                        yesterdayDate.setDate(now.getDate() - 1);
                                        const yesterday = getLocalKey(yesterdayDate);

                                        // Check if applied today or yesterday to continue streak
                                        if (heatmapData[today] || heatmapData[yesterday]) {
                                            let current = heatmapData[today] ? new Date(now) : yesterdayDate;
                                            while (heatmapData[getLocalKey(current)]) {
                                                streak++;
                                                current.setDate(current.getDate() - 1);
                                            }
                                        }
                                        return streak;
                                    })()}
                                </div>
                                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Day Streak</p>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-800">{stats.byStatus['Offer Received'] || 0}</div>
                                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Success Count</p>
                            </div>
                        </div>
                        <div className="mt-6 text-center">
                            <div className="text-xl font-bold text-slate-800">{Math.round((stats.byStatus['Interviewing'] || 0) / stats.total * 100 || 0)}%</div>
                            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Response Rate</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
