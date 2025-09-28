import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Activity, Globe, Play, Pause, Square, Settings, FileText, Download, Wifi, WifiOff } from "lucide-react";
import { SiteManager } from "./SiteManager";
import { ControlPanel } from "./ControlPanel";
import { LogsPanel } from "./LogsPanel";
import { StatsPanel } from "./StatsPanel";
import { sitesAPI, controlAPI, websocketService } from '../services/api';
import { useToast } from "./ui/use-toast";

const Dashboard = ({ isConnected }) => {
  const [sites, setSites] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [globalInterval, setGlobalInterval] = useState(10);
  const [activeTab, setActiveTab] = useState("sites");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load sites
        const sitesResponse = await sitesAPI.getAll();
        setSites(sitesResponse.data || []);
        
        // Load system status
        const statusResponse = await controlAPI.getStatus();
        const status = statusResponse.data;
        setIsRunning(status.is_running || false);
        setIsPaused(status.is_paused || false);
        setGlobalInterval(status.global_interval || 10);
        
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do sistema",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Set up WebSocket listeners for real-time updates
  useEffect(() => {
    const handleLog = (data) => {
      // Log events will be handled by LogsPanel
      console.log('New log:', data.data);
    };

    const handleStatus = (data) => {
      const status = data.data;
      setIsRunning(status.is_running || false);
      setIsPaused(status.is_paused || false);
    };

    const handleSiteCreated = (data) => {
      setSites(prevSites => [data.data.site, ...prevSites]);
    };

    const handleSiteUpdated = (data) => {
      setSites(prevSites => prevSites.map(site => 
        site.id === data.data.site.id ? { ...site, ...data.data.site } : site
      ));
    };

    const handleSiteDeleted = (data) => {
      setSites(prevSites => prevSites.filter(site => site.id !== data.data.site_id));
    };

    const handleSiteToggled = (data) => {
      setSites(prevSites => prevSites.map(site => 
        site.id === data.data.site_id 
          ? { ...site, is_active: data.data.is_active }
          : site
      ));
    };

    // Add event listeners
    websocketService.on('log', handleLog);
    websocketService.on('status', handleStatus);
    websocketService.on('site_created', handleSiteCreated);
    websocketService.on('site_updated', handleSiteUpdated);
    websocketService.on('site_deleted', handleSiteDeleted);
    websocketService.on('site_toggled', handleSiteToggled);

    // Cleanup
    return () => {
      websocketService.off('log', handleLog);
      websocketService.off('status', handleStatus);
      websocketService.off('site_created', handleSiteCreated);
      websocketService.off('site_updated', handleSiteUpdated);
      websocketService.off('site_deleted', handleSiteDeleted);
      websocketService.off('site_toggled', handleSiteToggled);
    };
  }, []);

  const activeSites = sites.filter(site => site.is_active);
  const totalClicks = sites.reduce((sum, site) => sum + (site.clicks || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold terminal-glow">
              AutoClick Dashboard
            </h1>
            <p className="text-muted-foreground">
              Sistema automatizado de navegação - Controle completo
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <Badge variant={isRunning && !isPaused ? "default" : "secondary"} className="pulse-glow">
              <Activity className="mr-1 h-3 w-3" />
              {isPaused ? "Pausado" : isRunning ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="cyber-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sites Ativos</CardTitle>
              <Globe className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold terminal-glow">{activeSites.length}</div>
              <p className="text-xs text-muted-foreground">
                de {sites.length} sites cadastrados
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clicks</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold terminal-glow">{totalClicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                sessões executadas
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Intervalo Global</CardTitle>
              <Settings className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold terminal-glow">{globalInterval}s</div>
              <p className="text-xs text-muted-foreground">
                entre execuções
              </p>
            </CardContent>
          </Card>

          <Card className="cyber-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold terminal-glow">
                {isPaused ? "Pausado" : isRunning ? "Rodando" : "Parado"}
              </div>
              <p className="text-xs text-muted-foreground">
                sistema {isRunning ? "operacional" : "aguardando"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 rounded-lg bg-muted p-1">
          {[
            { id: "sites", label: "Gerenciar Sites", icon: Globe },
            { id: "control", label: "Controle", icon: Play },
            { id: "logs", label: "Logs", icon: FileText },
            { id: "stats", label: "Estatísticas", icon: Activity },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              className="flex-1"
              onClick={() => setActiveTab(tab.id)}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "sites" && (
            <SiteManager 
              sites={sites} 
              setSites={setSites} 
              isConnected={isConnected}
            />
          )}
          {activeTab === "control" && (
            <ControlPanel
              isRunning={isRunning}
              setIsRunning={setIsRunning}
              isPaused={isPaused}
              setIsPaused={setIsPaused}
              globalInterval={globalInterval}
              setGlobalInterval={setGlobalInterval}
              activeSites={activeSites}
              isConnected={isConnected}
            />
          )}
          {activeTab === "logs" && (
            <LogsPanel isConnected={isConnected} />
          )}
          {activeTab === "stats" && (
            <StatsPanel sites={sites} isConnected={isConnected} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;