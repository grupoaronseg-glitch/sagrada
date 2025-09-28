import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Globe, Play, Pause, Square, Settings, FileText, Download } from "lucide-react";
import { SiteManager } from "./SiteManager";
import { ControlPanel } from "./ControlPanel";
import { LogsPanel } from "./LogsPanel";
import { StatsPanel } from "./StatsPanel";

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

const Dashboard = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [globalInterval, setGlobalInterval] = useState(10);
  const [activeTab, setActiveTab] = useState<"sites" | "control" | "logs" | "stats">("sites");

  // Mock data for demo
  useEffect(() => {
    setSites([
      {
        id: "1",
        url: "https://example.com",
        name: "Example Site",
        duration: 5,
        interval: 10,
        isActive: true,
        clicks: 142,
        lastAccess: new Date(),
      },
      {
        id: "2", 
        url: "https://google.com",
        name: "Google",
        duration: 3,
        interval: 15,
        isActive: false,
        clicks: 89,
        lastAccess: new Date(Date.now() - 300000),
      },
    ]);
  }, []);

  const activeSites = sites.filter(site => site.isActive);
  const totalClicks = sites.reduce((sum, site) => sum + site.clicks, 0);

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
              Sistema automatizado de navegação - Tema Red & Black
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isRunning ? "default" : "secondary"} className="pulse-glow">
              <Activity className="mr-1 h-3 w-3" />
              {isRunning ? "Ativo" : "Inativo"}
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
              onClick={() => setActiveTab(tab.id as any)}
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "sites" && (
            <SiteManager sites={sites} setSites={setSites} />
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
            />
          )}
          {activeTab === "logs" && <LogsPanel />}
          {activeTab === "stats" && <StatsPanel sites={sites} />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;