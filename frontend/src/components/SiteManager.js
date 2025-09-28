import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Trash2, Edit, Plus, ExternalLink, Clock, MousePointer, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sitesAPI } from '@/services/api';

export const SiteManager = ({ sites, setSites, isConnected }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    duration: 5,
    interval: 10,
  });
  const { toast } = useToast();

  const openDialog = (site = null) => {
    if (site) {
      setEditingSite(site);
      setFormData({
        name: site.name,
        url: site.url,
        duration: site.duration,
        interval: site.interval,
      });
    } else {
      setEditingSite(null);
      setFormData({
        name: "",
        url: "",
        duration: 5,
        interval: 10,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.url) {
      toast({
        title: "Erro",
        description: "Nome e URL são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (editingSite) {
        const response = await sitesAPI.update(editingSite.id, formData);
        setSites(prevSites => prevSites.map(site => 
          site.id === editingSite.id ? response.data : site
        ));
        toast({
          title: "Site atualizado",
          description: `${formData.name} foi atualizado com sucesso`,
        });
      } else {
        const response = await sitesAPI.create(formData);
        setSites(prevSites => [response.data, ...prevSites]);
        toast({
          title: "Site adicionado",
          description: `${formData.name} foi adicionado com sucesso`,
        });
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving site:', error);
      const errorMessage = error.response?.data?.detail || "Erro ao salvar site";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSite = async (site) => {
    if (!window.confirm(`Tem certeza que deseja remover o site "${site.name}"?`)) {
      return;
    }

    try {
      await sitesAPI.delete(site.id);
      setSites(prevSites => prevSites.filter(s => s.id !== site.id));
      toast({
        title: "Site removido",
        description: `${site.name} foi removido com sucesso`,
      });
    } catch (error) {
      console.error('Error deleting site:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover site",
        variant: "destructive",
      });
    }
  };

  const toggleSiteActive = async (site) => {
    try {
      const response = await sitesAPI.toggle(site.id);
      setSites(prevSites => prevSites.map(s => 
        s.id === site.id 
          ? { ...s, is_active: response.data.is_active }
          : s
      ));
    } catch (error) {
      console.error('Error toggling site:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do site",
        variant: "destructive",
      });
    }
  };

  const exportSites = async () => {
    try {
      const response = await sitesAPI.export();
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `autoclick-sites-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Sites exportados",
        description: "Arquivo de configuração baixado com sucesso",
      });
    } catch (error) {
      console.error('Error exporting sites:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar sites",
        variant: "destructive",
      });
    }
  };

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

  return (
    <div className="space-y-6">
      <Card className="cyber-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="terminal-glow">Gerenciamento de Sites</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure os sites para automação (máximo 10 simultâneos)
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={exportSites}
                disabled={!isConnected || sites.length === 0}
                data-testid="export-sites-btn"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => openDialog()} 
                    disabled={sites.length >= 10 || !isConnected}
                    data-testid="add-site-btn"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Site
                  </Button>
                </DialogTrigger>
                <DialogContent className="cyber-border">
                  <DialogHeader>
                    <DialogTitle className="terminal-glow">
                      {editingSite ? "Editar Site" : "Novo Site"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome do Site</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Google, YouTube, etc."
                        className="cyber-border"
                        data-testid="site-name-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        placeholder="https://example.com"
                        className="cyber-border"
                        data-testid="site-url-input"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="duration">Duração (segundos)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          max="300"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 5 })}
                          className="cyber-border"
                          data-testid="site-duration-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="interval">Intervalo (segundos)</Label>
                        <Input
                          id="interval"
                          type="number"
                          min="1"
                          max="3600"
                          value={formData.interval}
                          onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) || 10 })}
                          className="cyber-border"
                          data-testid="site-interval-input"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isLoading}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        data-testid="save-site-btn"
                      >
                        {isLoading ? "Salvando..." : editingSite ? "Atualizar" : "Criar"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isConnected && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">
                ⚠️ Sem conexão com o servidor. Algumas funcionalidades podem estar indisponíveis.
              </p>
            </div>
          )}
          
          {sites.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum site cadastrado</p>
              <p className="text-sm text-muted-foreground">Clique em "Adicionar Site" para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Intervalo</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sites.map((site) => (
                    <TableRow key={site.id} data-testid={`site-row-${site.id}`}>
                      <TableCell className="font-medium">{site.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[200px]" title={site.url}>
                            {site.url}
                          </span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={site.is_active}
                            onCheckedChange={() => toggleSiteActive(site)}
                            disabled={!isConnected}
                            data-testid={`site-toggle-${site.id}`}
                          />
                          <Badge 
                            variant={site.is_active ? "default" : "secondary"}
                            data-testid={`site-status-${site.id}`}
                          >
                            {site.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {site.duration}s
                        </div>
                      </TableCell>
                      <TableCell>{site.interval}s</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MousePointer className="h-3 w-3" />
                          {site.clicks || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatLastAccess(site.last_access)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDialog(site)}
                            disabled={!isConnected}
                            data-testid={`edit-site-${site.id}`}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteSite(site)}
                            disabled={!isConnected}
                            data-testid={`delete-site-${site.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {sites.length >= 10 && (
            <p className="text-sm text-warning mt-2">
              Limite máximo de 10 sites simultâneos atingido
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};