import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Clock, MousePointer, Globe, Activity, Calendar } from "lucide-react";

interface Site {
  id: string;
  url: string;
  name: string;
  duration: number;
  interval: number;
  isActive: boolean;
  clicks: number;
  lastAccess?: Date;
}

interface StatsPanelProps {
  sites: Site[];
}

export const StatsPanel = ({ sites }: StatsPanelProps) => {
  // Calculate statistics
  const totalClicks = sites.reduce((sum, site) => sum + site.clicks, 0);
  const activeSites = sites.filter(site => site.isActive).length;
  const averageClicks = sites.length > 0 ? Math.round(totalClicks / sites.length) : 0;
  const totalDuration = sites.reduce((sum, site) => sum + site.duration, 0);

  // Prepare chart data
  const siteClicksData = sites.map(site => ({
    name: site.name,
    clicks: site.clicks,
    duration: site.duration,
    isActive: site.isActive,
  }));

  const pieData = [
    { name: "Sites Ativos", value: activeSites, color: "hsl(var(--primary))" },
    { name: "Sites Inativos", value: sites.length - activeSites, color: "hsl(var(--muted))" },
  ];

  // Mock time series data for activity
  const activityData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    clicks: Math.floor(Math.random() * 50) + 10,
  }));

  const performanceData = sites.map(site => ({
    name: site.name,
    efficiency: (site.clicks / Math.max(site.duration, 1)) * 10,
    uptime: site.isActive ? 100 : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cyber-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold terminal-glow">
              {totalClicks > 0 ? Math.round((totalClicks / (totalDuration * sites.length)) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              clicks por segundo configurado
            </p>
          </CardContent>
        </Card>

        <Card className="cyber-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Total Ativo</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold terminal-glow">
              {Math.round(totalDuration * totalClicks / 60)}m
            </div>
            <p className="text-xs text-muted-foreground">
              estimativa baseada em clicks
            </p>
          </CardContent>
        </Card>

        <Card className="cyber-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold terminal-glow">{averageClicks}</div>
            <p className="text-xs text-muted-foreground">
              por site configurado
            </p>
          </CardContent>
        </Card>

        <Card className="cyber-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Atividade</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold terminal-glow">
              {sites.length > 0 ? Math.round((activeSites / sites.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              sites ativos de {sites.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Clicks by Site */}
        <Card className="cyber-border">
          <CardHeader>
            <CardTitle className="terminal-glow">Clicks por Site</CardTitle>
            <p className="text-sm text-muted-foreground">
              Desempenho individual de cada site
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={siteClicksData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar 
                  dataKey="clicks" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Site Status Distribution */}
        <Card className="cyber-border">
          <CardHeader>
            <CardTitle className="terminal-glow">Distribuição de Status</CardTitle>
            <p className="text-sm text-muted-foreground">
              Proporção de sites ativos vs inativos
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card className="cyber-border">
          <CardHeader>
            <CardTitle className="terminal-glow">Atividade por Hora</CardTitle>
            <p className="text-sm text-muted-foreground">
              Padrão de atividade nas últimas 24 horas
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="cyber-border">
          <CardHeader>
            <CardTitle className="terminal-glow">Métricas de Performance</CardTitle>
            <p className="text-sm text-muted-foreground">
              Eficiência e uptime por site
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {sites.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum site configurado
              </p>
            ) : (
              sites.map((site) => {
                const efficiency = (site.clicks / Math.max(site.duration, 1)) * 10;
                return (
                  <div key={site.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{site.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={site.isActive ? "default" : "secondary"}>
                          {site.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {site.clicks} clicks
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Eficiência</span>
                        <span>{Math.round(efficiency)}%</span>
                      </div>
                      <Progress value={Math.min(efficiency, 100)} className="h-2" />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Site Details Table */}
      <Card className="cyber-border">
        <CardHeader>
          <CardTitle className="terminal-glow">Detalhes dos Sites</CardTitle>
          <p className="text-sm text-muted-foreground">
            Informações completas sobre cada site configurado
          </p>
        </CardHeader>
        <CardContent>
          {sites.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum site configurado
            </p>
          ) : (
            <div className="space-y-4">
              {sites.map((site) => {
                const efficiency = (site.clicks / Math.max(site.duration, 1)) * 10;
                return (
                  <div key={site.id} className="flex items-center justify-between p-4 rounded cyber-border">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{site.name}</span>
                        <span className="text-sm text-muted-foreground">{site.url}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium terminal-glow">{site.clicks}</div>
                        <div className="text-xs text-muted-foreground">Clicks</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium terminal-glow">{site.duration}s</div>
                        <div className="text-xs text-muted-foreground">Duração</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium terminal-glow">{site.interval}s</div>
                        <div className="text-xs text-muted-foreground">Intervalo</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium terminal-glow">{Math.round(efficiency)}%</div>
                        <div className="text-xs text-muted-foreground">Eficiência</div>
                      </div>
                      <Badge variant={site.isActive ? "default" : "secondary"}>
                        {site.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};