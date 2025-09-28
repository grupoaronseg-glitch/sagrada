import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, Settings, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { controlAPI, settingsAPI } from '@/services/api';

export const ControlPanel = ({
  isRunning,
  setIsRunning,
  isPaused,
  setIsPaused,
  globalInterval,
  setGlobalInterval,
  activeSites,
  isConnected
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    if (activeSites.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum site ativo para executar",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await controlAPI.start();
      setIsRunning(true);
      setIsPaused(false);
      toast({
        title: "Sistema iniciado",
        description: `Executando ${activeSites.length} sites automaticamente`,
      });
    } catch (error) {
      console.error('Error starting automation:', error);
      toast({
        title: "Erro",
        description: "Erro ao iniciar sistema",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    setIsLoading(true);
    try {
      const response = await controlAPI.pause();
      const newPausedState = response.data.status === "paused";
      setIsPaused(newPausedState);
      
      toast({
        title: newPausedState ? "Sistema pausado" : "Sistema retomado",
        description: newPausedState ? "Execução pausada temporariamente" : "Execução retomada",
      });
    } catch (error) {
      console.error('Error pausing automation:', error);
      toast({
        title: "Erro",
        description: "Erro ao pausar/retomar sistema",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      await controlAPI.stop();
      setIsRunning(false);
      setIsPaused(false);
      toast({
        title: "Sistema parado",
        description: "Todas as execuções foram interrompidas",
      });
    } catch (error) {
      console.error('Error stopping automation:', error);
      toast({
        title: "Erro",
        description: "Erro ao parar sistema",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGlobalIntervalChange = async (newInterval) => {
    try {
      await settingsAPI.update('global_interval', newInterval.toString());
      setGlobalInterval(newInterval);
      toast({
        title: "Configuração atualizada",
        description: `Intervalo global alterado para ${newInterval}s`,
      });
    } catch (error) {
      console.error('Error updating global interval:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configuração",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = () => {
    if (!isRunning) return "bg-muted text-muted-foreground";
    if (isPaused) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    return "bg-green-500/10 text-green-400 border-green-500/20";
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
          {!isConnected && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">
                ⚠️ Sem conexão com o servidor. Controles indisponíveis.
              </p>
            </div>
          )}

          {/* Status Display */}
          <div className="text-center p-6 rounded-lg cyber-border">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor()}`}>
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
              disabled={isLoading || !isConnected || (isRunning && !isPaused)}
              className="pulse-glow"
              variant={isRunning && !isPaused ? "secondary" : "default"}
              data-testid="start-automation-btn"
            >
              <Play className="mr-2 h-4 w-4" />
              {isLoading ? "..." : "Iniciar"}
            </Button>
            <Button
              onClick={handlePause}
              disabled={isLoading || !isConnected || !isRunning}
              variant="outline"
              data-testid="pause-automation-btn"
            >
              <Pause className="mr-2 h-4 w-4" />
              {isLoading ? "..." : isPaused ? "Retomar" : "Pausar"}
            </Button>
            <Button
              onClick={handleStop}
              disabled={isLoading || !isConnected || !isRunning}
              variant="destructive"
              data-testid="stop-automation-btn"
            >
              <Square className="mr-2 h-4 w-4" />
              {isLoading ? "..." : "Parar"}
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
              onChange={(e) => {
                const value = parseInt(e.target.value) || 10;
                setGlobalInterval(value);
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value) || 10;
                handleGlobalIntervalChange(value);
              }}
              className="cyber-border"
              disabled={!isConnected}
              data-testid="global-interval-input"
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
                <Badge variant="outline" className="text-xs">Carregamento Simples</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sistema Operacional:</span>
                <Badge variant="outline" className="text-xs">Linux</Badge>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Label>Ações Rápidas</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                disabled={!isConnected}
                onClick={() => {
                  // This will be handled by LogsPanel
                  toast({
                    title: "Funcionalidade",
                    description: "Use a aba 'Logs' para limpar os registros",
                  });
                }}
              >
                Limpar Logs
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                disabled={!isConnected}
                onClick={() => {
                  toast({
                    title: "Em breve",
                    description: "Funcionalidade em desenvolvimento",
                  });
                }}
              >
                Reset Contadores
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};