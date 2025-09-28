import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Trash2, RefreshCw, Filter, Search, FileText, Wifi, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { logsAPI, websocketService } from '@/services/api';

export const LogsPanel = ({ isConnected }) => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [levelFilter, setLevelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load logs from API
  const loadLogs = async () => {
    if (!isConnected) return;
    
    try {
      setIsLoading(true);
      const response = await logsAPI.getAll({ limit: 200 });
      setLogs(response.data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadLogs();
  }, [isConnected]);

  // Set up WebSocket listener for real-time logs
  useEffect(() => {
    const handleLog = (data) => {
      const logEntry = data.data;
      setLogs(prevLogs => [logEntry, ...prevLogs.slice(0, 199)]); // Keep last 200 logs
    };

    websocketService.on('log', handleLog);

    return () => {
      websocketService.off('log', handleLog);
    };
  }, []);

  // Auto-refresh logs periodically when connected
  useEffect(() => {
    if (!autoRefresh || !isConnected) return;

    const interval = setInterval(() => {
      loadLogs();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, isConnected]);

  // Filter logs based on level and search query
  useEffect(() => {
    let filtered = logs;

    if (levelFilter !== "all") {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(query) ||
        (log.site_name && log.site_name.toLowerCase().includes(query)) ||
        log.action.toLowerCase().includes(query)
      );
    }

    setFilteredLogs(filtered);
  }, [logs, levelFilter, searchQuery]);

  const getLevelColor = (level) => {
    switch (level) {
      case "info": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "success": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "warning": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "error": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case "info": return "ℹ";
      case "success": return "✓";
      case "warning": return "⚠";
      case "error": return "✗";
      default: return "•";
    }
  };

  const exportLogs = async (format) => {
    if (!isConnected) {
      toast({
        title: "Erro",
        description: "Sem conexão com o servidor",
        variant: "destructive",
      });
      return;
    }

    try {
      const params = {};
      if (levelFilter !== "all") params.level = levelFilter;

      const response = await logsAPI.export(format, params);
      
      // Create download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `autoclick-logs-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Logs exportados",
        description: `Arquivo baixado em formato ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar logs",
        variant: "destructive",
      });
    }
  };

  const clearLogs = async () => {
    if (!isConnected) {
      toast({
        title: "Erro",
        description: "Sem conexão com o servidor",
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm("Tem certeza que deseja limpar todos os logs?")) {
      return;
    }

    try {
      await logsAPI.clear();
      setLogs([]);
      toast({
        title: "Logs limpos",
        description: "Todos os logs foram removidos",
      });
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast({
        title: "Erro",
        description: "Erro ao limpar logs",
        variant: "destructive",
      });
    }
  };

  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }).format(date);
  };

  const getLogCounts = () => {
    const counts = { info: 0, success: 0, warning: 0, error: 0 };
    logs.forEach(log => {
      if (counts.hasOwnProperty(log.level)) {
        counts[log.level]++;
      }
    });
    return counts;
  };

  const logCounts = getLogCounts();

  return (
    <Card className="cyber-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="terminal-glow flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Logs do Sistema
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Monitore todas as ações e eventos {isConnected ? "em tempo real" : "(offline)"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh && isConnected ? "pulse-glow" : ""}
              disabled={!isConnected}
              data-testid="auto-refresh-toggle"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh && isConnected ? 'animate-spin' : ''}`} />
              Auto-refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={loadLogs}
              disabled={!isConnected || isLoading}
              data-testid="manual-refresh-btn"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">
              ⚠️ Sem conexão com o servidor. Logs podem estar desatualizados.
            </p>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar nos logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 cyber-border"
                data-testid="logs-search-input"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[140px] cyber-border" data-testid="logs-level-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="warning">Avisos</SelectItem>
                <SelectItem value="error">Erros</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => exportLogs(value)}>
              <SelectTrigger className="w-[120px] cyber-border" data-testid="logs-export-select">
                <Download className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="txt">TXT</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={clearLogs}
              disabled={!isConnected}
              data-testid="clear-logs-btn"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(logCounts).map(([level, count]) => (
            <div key={level} className="text-center p-2 rounded cyber-border">
              <div className="text-2xl font-bold terminal-glow">{count}</div>
              <div className="text-xs text-muted-foreground capitalize">{level}</div>
            </div>
          ))}
        </div>

        {/* Logs Display */}
        <ScrollArea className="h-[400px] rounded cyber-border">
          <div className="space-y-2 p-4">
            {isLoading && logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                Carregando logs...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {logs.length === 0 ? "Nenhum log disponível" : "Nenhum log encontrado com os filtros aplicados"}
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded border cyber-border hover:bg-muted/50 transition-colors"
                  data-testid={`log-entry-${log.id}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${getLevelColor(log.level)}`}>
                    <span className="text-sm font-mono">
                      {getLevelIcon(log.level)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{log.action}</span>
                      {log.site_name && (
                        <Badge variant="outline" className="text-xs">
                          {log.site_name}
                        </Badge>
                      )}
                      {log.duration && (
                        <Badge variant="secondary" className="text-xs">
                          {log.duration.toFixed(2)}s
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {log.message}
                    </p>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};