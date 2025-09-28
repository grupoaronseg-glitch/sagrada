import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Trash2, RefreshCw, Filter, Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface LogEntry {
  id: string;
  timestamp: Date;
  level: "info" | "warning" | "error" | "success";
  action: string;
  site: string;
  message: string;
  duration?: number;
}

export const LogsPanel = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  // Mock data generation
  useEffect(() => {
    const generateMockLogs = () => {
      const actions = [
        "Site aberto",
        "Site carregado com sucesso",
        "Site fechado",
        "Timeout detectado",
        "Erro de carregamento",
        "Navegação iniciada",
        "Aguardando próximo ciclo",
      ];
      
      const sites = ["Example Site", "Google", "GitHub", "YouTube", "Stack Overflow"];
      const levels: LogEntry["level"][] = ["info", "warning", "error", "success"];

      const mockLogs: LogEntry[] = Array.from({ length: 50 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(Date.now() - Math.random() * 3600000),
        level: levels[Math.floor(Math.random() * levels.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        site: sites[Math.floor(Math.random() * sites.length)],
        message: `${actions[Math.floor(Math.random() * actions.length)]} para ${sites[Math.floor(Math.random() * sites.length)]}`,
        duration: Math.random() > 0.5 ? Math.floor(Math.random() * 10) + 1 : undefined,
      })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setLogs(mockLogs);
    };

    generateMockLogs();
    
    // Auto-refresh logs every 5 seconds if enabled
    const interval = autoRefresh ? setInterval(generateMockLogs, 5000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Filter logs based on level and search query
  useEffect(() => {
    let filtered = logs;

    if (levelFilter !== "all") {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [logs, levelFilter, searchQuery]);

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "info": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "success": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "warning": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "error": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getLevelIcon = (level: LogEntry["level"]) => {
    switch (level) {
      case "info": return "ℹ";
      case "success": return "✓";
      case "warning": return "⚠";
      case "error": return "✗";
      default: return "•";
    }
  };

  const exportLogs = (format: "txt" | "csv" | "json") => {
    let data: string;
    const filename = `autoclick-logs-${new Date().toISOString().split('T')[0]}`;

    switch (format) {
      case "txt":
        data = filteredLogs.map(log => 
          `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()} - ${log.site}: ${log.message}`
        ).join('\n');
        break;
      case "csv":
        data = [
          "Timestamp,Level,Site,Action,Message,Duration",
          ...filteredLogs.map(log => 
            `"${log.timestamp.toISOString()}","${log.level}","${log.site}","${log.action}","${log.message}","${log.duration || ''}"`
          )
        ].join('\n');
        break;
      case "json":
        data = JSON.stringify(filteredLogs, null, 2);
        break;
    }

    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Logs exportados",
      description: `Arquivo ${filename}.${format} foi baixado com sucesso`,
    });
  };

  const clearLogs = () => {
    setLogs([]);
    toast({
      title: "Logs limpos",
      description: "Todos os logs foram removidos",
    });
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }).format(date);
  };

  return (
    <Card className="cyber-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="terminal-glow flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Logs do Sistema
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Monitore todas as ações e eventos em tempo real
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "pulse-glow" : ""}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[140px] cyber-border">
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
            <Select onValueChange={(value) => exportLogs(value as any)}>
              <SelectTrigger className="w-[120px] cyber-border">
                <Download className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="txt">TXT</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="destructive" onClick={clearLogs}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {["info", "success", "warning", "error"].map((level) => {
            const count = logs.filter(log => log.level === level).length;
            return (
              <div key={level} className="text-center p-2 rounded cyber-border">
                <div className="text-2xl font-bold terminal-glow">{count}</div>
                <div className="text-xs text-muted-foreground capitalize">{level}</div>
              </div>
            );
          })}
        </div>

        {/* Logs Display */}
        <ScrollArea className="h-[400px] rounded cyber-border">
          <div className="space-y-2 p-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum log encontrado
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded border cyber-border hover:bg-muted/50 transition-colors"
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${getLevelColor(log.level)}`}>
                    <span className="text-sm font-mono">
                      {getLevelIcon(log.level)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{log.action}</span>
                      <Badge variant="outline" className="text-xs">
                        {log.site}
                      </Badge>
                      {log.duration && (
                        <Badge variant="secondary" className="text-xs">
                          {log.duration}s
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