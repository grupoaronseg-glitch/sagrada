import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, Settings, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface ControlPanelProps {
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  globalInterval: number;
  setGlobalInterval: (interval: number) => void;
  activeSites: Site[];
}

export const ControlPanel = ({
  isRunning,
  setIsRunning,
  isPaused,
  setIsPaused,
  globalInterval,
  setGlobalInterval,
  activeSites,
}: ControlPanelProps) => {
  const { toast } = useToast();

  const handleStart = () => {
    if (activeSites.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum site ativo para executar",
        variant: "destructive",
      });
      return;
    }
    setIsRunning(true);
    setIsPaused(false);
    toast({
      title: "Sistema iniciado",
      description: `Executando ${activeSites.length} sites automaticamente`,
    });
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    toast({
      title: isPaused ? "Sistema retomado" : "Sistema pausado",
      description: isPaused ? "Execução retomada" : "Execução pausada temporariamente",
    });
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    toast({
      title: "Sistema parado",
      description: "Todas as execuções foram interrompidas",
    });
  };

  const getStatusColor = () => {
    if (!isRunning) return "bg-muted text-muted-foreground";
    if (isPaused) return "bg-warning text-warning-foreground";
    return "bg-success text-success-foreground";
  };

  const getStatusText = () => {
    if (!isRunning) return "Sistema Inativo";
    if (isPaused) return "Sistema Pausado";
    return "Sistema Ativo";
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Control Panel */}
      <Card className="cyber-border">
        <CardHeader>
          <CardTitle className="terminal-glow">Painel de Controle</CardTitle>
          <p className="text-sm text-muted-foreground">
            Controle a execução do sistema de automação
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Display */}
          <div className="text-center p-6 rounded-lg cyber-border">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor()}`}>
              {isRunning && !isPaused && <CheckCircle className="h-4 w-4" />}
              {isPaused && <AlertTriangle className="h-4 w-4" />}
              <span className="font-semibold">{getStatusText()}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {activeSites.length} sites ativos configurados
            </p>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={handleStart}
              disabled={isRunning && !isPaused}
              className="pulse-glow"
              variant={isRunning && !isPaused ? "secondary" : "default"}
            >
              <Play className="mr-2 h-4 w-4" />
              Iniciar
            </Button>
            <Button
              onClick={handlePause}
              disabled={!isRunning}
              variant="outline"
            >
              <Pause className="mr-2 h-4 w-4" />
              {isPaused ? "Retomar" : "Pausar"}
            </Button>
            <Button
              onClick={handleStop}
              disabled={!isRunning}
              variant="destructive"
            >
              <Square className="mr-2 h-4 w-4" />
              Parar
            </Button>
          </div>

          {/* Active Sites Preview */}
          <div>
            <Label className="text-sm font-medium">Sites que serão executados:</Label>
            <div className="mt-2 space-y-2">
              {activeSites.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum site ativo</p>
              ) : (
                activeSites.map((site) => (
                  <div key={site.id} className="flex items-center justify-between p-2 rounded cyber-border">
                    <span className="text-sm">{site.name}</span>
                    <Badge variant="outline">{site.duration}s</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Panel */}
      <Card className="cyber-border">
        <CardHeader>
          <CardTitle className="terminal-glow">
            <Settings className="mr-2 h-5 w-5 inline" />
            Configurações Globais
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ajuste as configurações gerais do sistema
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Global Interval */}
          <div className="space-y-2">
            <Label htmlFor="globalInterval">Intervalo Global (segundos)</Label>
            <Input
              id="globalInterval"
              type="number"
              min="1"
              max="3600"
              value={globalInterval}
              onChange={(e) => setGlobalInterval(parseInt(e.target.value))}
              className="cyber-border"
            />
            <p className="text-xs text-muted-foreground">
              Tempo de espera entre cada ciclo de execução
            </p>
          </div>

          {/* System Info */}
          <div className="space-y-3">
            <Label>Informações do Sistema</Label>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Firefox Browser:</span>
                <Badge variant="outline" className="text-xs">Configurado</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Máx. Sites Simultâneos:</span>
                <Badge variant="outline" className="text-xs">10</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modo de Execução:</span>
                <Badge variant="outline" className="text-xs">Apenas Carregamento</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sistema Operacional:</span>
                <Badge variant="outline" className="text-xs">Kali Linux</Badge>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Label>Ações Rápidas</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" className="text-xs">
                Limpar Logs
              </Button>
              <Button size="sm" variant="outline" className="text-xs">
                Reset Contadores
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};