import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, MousePointer, Globe, TrendingUp, Calendar } from "lucide-react";

export const StatsPanel = ({ sites, isConnected }) => {
  const [stats, setStats] = useState({
    totalSites: 0,
    activeSites: 0,
    totalClicks: 0,
    averageDuration: 0,
    averageInterval: 0,
    mostActivesite: null,
    recentActivity: []
  });

  useEffect(() => {
    if (!sites || sites.length === 0) {
      setStats({
        totalSites: 0,
        activeSites: 0,
        totalClicks: 0,
        averageDuration: 0,
        averageInterval: 0,
        mostActiveSite: null,
        recentActivity: []
      });
      return;
    }

    const totalSites = sites.length;
    const activeSites = sites.filter(site => site.is_active).length;
    const totalClicks = sites.reduce((sum, site) => sum + (site.clicks || 0), 0);
    
    const averageDuration = sites.length > 0 
      ? Math.round(sites.reduce((sum, site) => sum + site.duration, 0) / sites.length)
      : 0;
    
    const averageInterval = sites.length > 0
      ? Math.round(sites.reduce((sum, site) => sum + site.interval, 0) / sites.length) 
      : 0;

    // Find most active site (by clicks)
    const mostActiveSite = sites.reduce((max, site) => {
      return (site.clicks || 0) > (max?.clicks || 0) ? site : max;
    }, null);

    // Recent activity (sites with recent access)
    const recentActivity = sites
      .filter(site => site.last_access)
      .sort((a, b) => new Date(b.last_access) - new Date(a.last_access))
      .slice(0, 5);

    setStats({
      totalSites,
      activeSites,
      totalClicks,
      averageDuration,
      averageInterval,
      mostActiveSite,
      recentActivity
    });
  }, [sites]);

  const formatLastAccess = (date) => {
    if (!date) return "Nunca";
    const now = new Date();
    const accessDate = new Date(date);
    const diffMs = now - accessDate;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h atrás`;
    return `${Math.floor(diffMins / 1440)}d atrás`;
  };

  const getActivityLevel = (clicks) => {
    if (clicks === 0) return { level: "Nenhuma", color: "bg-gray-500/10 text-gray-400" };
    if (clicks < 10) return { level: "Baixa", color: "bg-blue-500/10 text-blue-400" };
    if (clicks < 50) return { level: "Média", color: "bg-yellow-500/10 text-yellow-400" };
    if (clicks < 100) return { level: "Alta", color: "bg-orange-500/10 text-orange-400" };
    return { level: "Muito Alta", color: "bg-red-500/10 text-red-400" };
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cyber-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sites Cadastrados</CardTitle>
            <Globe className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold terminal-glow">{stats.totalSites}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSites} ativos
            </p>
          </CardContent>
        </Card>

        <Card className="cyber-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Execuções</CardTitle>
            <MousePointer className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold terminal-glow">{stats.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              clicks registrados
            </p>
          </CardContent>
        </Card>

        <Card className="cyber-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold terminal-glow">{stats.averageDuration}s</div>
            <p className="text-xs text-muted-foreground">
              por execução
            </p>
          </CardContent>
        </Card>

        <Card className="cyber-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intervalo Médio</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold terminal-glow">{stats.averageInterval}s</div>
            <p className="text-xs text-muted-foreground">
              entre execuções
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Most Active Site */}
        <Card className="cyber-border">
          <CardHeader>
            <CardTitle className="terminal-glow flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Site Mais Ativo
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Site com maior número de execuções
            </p>
          </CardHeader>
          <CardContent>
            {stats.mostActiveSite ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{stats.mostActiveSite.name}</h3>
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {stats.mostActiveSite.url}
                    </p>
                  </div>
                  <Badge 
                    variant={stats.mostActiveSite.is_active ? "default" : "secondary"}
                    data-testid="most-active-site-status"
                  >
                    {stats.mostActiveSite.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-2xl font-bold terminal-glow">
                      {stats.mostActiveSite.clicks || 0}
                    </div>
                    <p className="text-muted-foreground">Execuções</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold terminal-glow">
                      {stats.mostActiveSite.duration}s
                    </div>
                    <p className="text-muted-foreground">Duração</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Nível de Atividade:</p>
                  {(() => {
                    const activity = getActivityLevel(stats.mostActiveSite.clicks || 0);
                    return (
                      <Badge className={activity.color}>
                        {activity.level}
                      </Badge>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum site com atividade</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="cyber-border">
          <CardHeader>
            <CardTitle className="terminal-glow flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Sites acessados recentemente
            </p>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.map((site) => (
                  <div key={site.id} className="flex items-center justify-between p-2 rounded cyber-border">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{site.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {site.clicks || 0} execuções
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={site.is_active ? "default" : "secondary"} 
                        className="text-xs mb-1"
                      >
                        {site.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {formatLastAccess(site.last_access)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma atividade recente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sites Overview */}
      <Card className="cyber-border">
        <CardHeader>
          <CardTitle className="terminal-glow">Visão Geral dos Sites</CardTitle>
          <p className="text-sm text-muted-foreground">
            Status e estatísticas de todos os sites cadastrados
          </p>
        </CardHeader>
        <CardContent>
          {!isConnected && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">
                ⚠️ Sem conexão com o servidor. Estatísticas podem estar desatualizadas.
              </p>
            </div>
          )}

          {sites.length > 0 ? (
            <div className="space-y-3">
              {sites.map((site) => {
                const activity = getActivityLevel(site.clicks || 0);
                return (
                  <div key={site.id} className="flex items-center justify-between p-3 rounded cyber-border hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{site.name}</h4>
                        <Badge variant={site.is_active ? "default" : "secondary"} className="text-xs">
                          {site.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                        {site.url}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{site.clicks || 0}</div>
                        <div className="text-muted-foreground text-xs">Clicks</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{site.duration}s</div>
                        <div className="text-muted-foreground text-xs">Duração</div>
                      </div>
                      <div className="text-center">
                        <Badge className={`text-xs ${activity.color}`}>
                          {activity.level}
                        </Badge>
                      </div>
                      <div className="text-center min-w-[80px]">
                        <div className="text-xs text-muted-foreground">
                          {formatLastAccess(site.last_access)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum site cadastrado</p>
              <p className="text-sm">Use a aba "Gerenciar Sites" para adicionar sites</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};