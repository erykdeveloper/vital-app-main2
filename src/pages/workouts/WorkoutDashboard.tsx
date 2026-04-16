import { useState, useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { fetchCardioWorkouts, fetchStrengthWorkouts } from '@/lib/workoutApi';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { WeekCard } from '@/components/workouts/dashboard/WeekCard';
import { MonthCard } from '@/components/workouts/dashboard/MonthCard';
import { YearCard } from '@/components/workouts/dashboard/YearCard';
import { MonthSummary } from '@/components/workouts/dashboard/MonthSummary';
import {
  MONTH_NAMES,
  getWeeksOfMonth,
  getMonthsOfYear,
  getYearlyStats,
  getDailyChartData,
  getMonthlyChartData,
  getMonthSummary,
  type Workout,
} from '@/lib/workoutDashboardUtils';

type ViewMode = 'semanal' | 'mensal' | 'anual';

export default function WorkoutDashboard() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('semanal');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Fetch all workouts (no date filter to support all views)
  const { data: workouts, isLoading } = useQuery({
    queryKey: ['workouts-dashboard-all', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return fetchStrengthWorkouts() as Promise<Workout[]>;
    },
    enabled: !!user
  });

  const { data: cardioWorkouts } = useQuery({
    queryKey: ['cardio-dashboard-all', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return fetchCardioWorkouts();
    },
    enabled: !!user
  });

  // Combine all workouts
  const allWorkouts = useMemo(() => {
    return [
      ...(workouts || []).map(w => ({
        id: w.id,
        date: w.date,
        objective: w.objective,
        duration_min: w.duration_min || 0,
        calories: w.calories || 0,
      })),
      ...(cardioWorkouts || []).map(c => ({
        id: c.id,
        date: c.date,
        objective: undefined,
        duration_min: Number(c.duration_min) || 0,
        calories: c.calories || 0,
      })),
    ];
  }, [workouts, cardioWorkouts]);

  // Navigation handlers
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    const now = new Date();
    const isCurrentMonth = currentMonth === now.getMonth() && currentYear === now.getFullYear();
    if (isCurrentMonth) return; // Don't go to future

    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToPreviousYear = () => {
    setCurrentYear(currentYear - 1);
  };

  const goToNextYear = () => {
    const now = new Date();
    if (currentYear >= now.getFullYear()) return;
    setCurrentYear(currentYear + 1);
  };

  // Computed data based on view mode
  const weeks = useMemo(() => 
    getWeeksOfMonth(currentYear, currentMonth, allWorkouts), 
    [currentYear, currentMonth, allWorkouts]
  );

  const months = useMemo(() => 
    getMonthsOfYear(currentYear, allWorkouts), 
    [currentYear, allWorkouts]
  );

  const years = useMemo(() => 
    getYearlyStats(allWorkouts), 
    [allWorkouts]
  );

  const monthSummary = useMemo(() => 
    getMonthSummary(currentYear, currentMonth, allWorkouts),
    [currentYear, currentMonth, allWorkouts]
  );

  const dailyChartData = useMemo(() => 
    getDailyChartData(currentYear, currentMonth, allWorkouts),
    [currentYear, currentMonth, allWorkouts]
  );

  const monthlyChartData = useMemo(() => 
    getMonthlyChartData(currentYear, allWorkouts),
    [currentYear, allWorkouts]
  );

  // Check if can navigate forward
  const now = new Date();
  const canGoNextMonth = !(currentMonth === now.getMonth() && currentYear === now.getFullYear());
  const canGoNextYear = currentYear < now.getFullYear();

  // Header title based on view mode
  const getHeaderTitle = () => {
    switch (viewMode) {
      case 'semanal':
        return `Desempenho - ${MONTH_NAMES[currentMonth]} ${currentYear}`;
      case 'mensal':
        return `Desempenho - ${currentYear}`;
      case 'anual':
        return 'Desempenho - Histórico';
    }
  };

  const getSubtitle = () => {
    switch (viewMode) {
      case 'semanal':
        return 'Resumo do mês atual';
      case 'mensal':
        return 'Resumo anual';
      case 'anual':
        return 'Histórico completo';
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/workouts" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{getHeaderTitle()}</h1>
            <p className="text-muted-foreground text-sm">{getSubtitle()}</p>
          </div>
        </div>
        
        {/* Navigation arrows - only for semanal and mensal views */}
        {viewMode !== 'anual' && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={viewMode === 'semanal' ? goToPreviousMonth : goToPreviousYear}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={viewMode === 'semanal' ? goToNextMonth : goToNextYear}
              disabled={viewMode === 'semanal' ? !canGoNextMonth : !canGoNextYear}
              className="h-8 w-8"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'semanal' ? 'default' : 'outline'}
          onClick={() => setViewMode('semanal')}
          size="sm"
          className={viewMode === 'semanal' 
            ? 'bg-accent text-accent-foreground hover:bg-accent/90' 
            : 'border-border hover:bg-card'}
        >
          Semanal
        </Button>
        <Button
          variant={viewMode === 'mensal' ? 'default' : 'outline'}
          onClick={() => setViewMode('mensal')}
          size="sm"
          className={viewMode === 'mensal' 
            ? 'bg-accent text-accent-foreground hover:bg-accent/90' 
            : 'border-border hover:bg-card'}
        >
          Mensal
        </Button>
        <Button
          variant={viewMode === 'anual' ? 'default' : 'outline'}
          onClick={() => setViewMode('anual')}
          size="sm"
          className={viewMode === 'anual' 
            ? 'bg-accent text-accent-foreground hover:bg-accent/90' 
            : 'border-border hover:bg-card'}
        >
          Anual
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card rounded-xl p-4 min-w-[160px] animate-pulse">
                <div className="h-4 bg-muted rounded w-2/3 mx-auto mb-2" />
                <div className="h-3 bg-muted rounded w-1/2 mx-auto mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Cards based on view mode */}
          {viewMode === 'semanal' && (
            <>
              <div className="overflow-x-auto -mx-4 px-4">
                <div className="flex gap-3 pb-2">
                  {weeks.map((week) => (
                    <WeekCard key={week.weekNumber} week={week} />
                  ))}
                </div>
              </div>

              {/* Month Summary */}
              <MonthSummary
                month={currentMonth}
                year={currentYear}
                {...monthSummary}
              />

              {/* Daily Chart */}
              <div className="bg-card rounded-xl p-4 border border-border">
                <h3 className="font-semibold mb-4 text-foreground">Treinos por Dia da Semana</h3>
                {dailyChartData.some(d => d.count > 0) ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyChartData}>
                        <XAxis 
                          dataKey="day" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="hsl(var(--accent))" 
                          radius={[4, 4, 0, 0]}
                          name="Treinos"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    Nenhum treino neste mês
                  </div>
                )}
              </div>
            </>
          )}

          {viewMode === 'mensal' && (
            <>
              <div className="overflow-x-auto -mx-4 px-4">
                <div className="flex gap-3 pb-2">
                  {months.map((month) => (
                    <MonthCard key={month.month} month={month} />
                  ))}
                </div>
              </div>

              {/* Monthly Chart */}
              <div className="bg-card rounded-xl p-4 border border-border">
                <h3 className="font-semibold mb-4 text-foreground">Treinos por Mês</h3>
                {monthlyChartData.some(d => d.count > 0) ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyChartData}>
                        <XAxis 
                          dataKey="month" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="hsl(var(--accent))" 
                          radius={[4, 4, 0, 0]}
                          name="Treinos"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    Nenhum treino em {currentYear}
                  </div>
                )}
              </div>
            </>
          )}

          {viewMode === 'anual' && (
            <>
              {years.length > 0 ? (
                <div className="overflow-x-auto -mx-4 px-4">
                  <div className="flex gap-3 pb-2">
                    {years.map((year) => (
                      <YearCard 
                        key={year.year} 
                        year={year} 
                        isCurrentYear={year.year === now.getFullYear()}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-xl p-8 border border-border text-center">
                  <p className="text-muted-foreground">Nenhum treino registrado ainda</p>
                </div>
              )}
            </>
          )}

          {/* View History Button */}
          <Link to="/workouts/history">
            <Button 
              variant="outline" 
              className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            >
              <History className="w-4 h-4 mr-2" />
              Ver Histórico Completo
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}
