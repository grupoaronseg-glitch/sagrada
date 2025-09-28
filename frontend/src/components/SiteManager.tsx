import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Trash2, Edit, Plus, ExternalLink, Clock, MousePointer } from "lucide-react";
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

interface SiteManagerProps {
  sites: Site[];
  setSites: (sites: Site[]) => void;
}

export const SiteManager = ({ sites, setSites }: SiteManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    duration: 5,
    interval: 10,
  });
  const { toast } = useToast();

  const openDialog = (site?: Site) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.url) {
      toast({
        title: "Erro",
        description: "Nome e URL são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (editingSite) {
      setSites(sites.map(site => 
        site.id === editingSite.id 
          ? { ...site, ...formData }
          : site
      ));
      toast({
        title: "Site atualizado",
        description: `${formData.name} foi atualizado com sucesso`,
      });
    } else {
      const newSite: Site = {
        id: Date.now().toString(),
        ...formData,
        isActive: false,
        clicks: 0,
      };
      setSites([...sites, newSite]);
      toast({
        title: "Site adicionado",
        description: `${formData.name} foi adicionado com sucesso`,
      });
    }

    setIsDialogOpen(false);
  };

  const deleteSite = (id: string) => {
    const site = sites.find(s => s.id === id);
    setSites(sites.filter(s => s.id !== id));
    toast({
      title: "Site removido",
      description: `${site?.name} foi removido com sucesso`,
    });
  };

  const toggleSiteActive = (id: string) => {
    setSites(sites.map(site => 
      site.id === id 
        ? { ...site, isActive: !site.isActive }
        : site
    ));
  };

  const formatLastAccess = (date?: Date) => {
    if (!date) return "Nunca";
    return new Intl.RelativeTimeFormat('pt-BR').format(
      Math.floor((date.getTime() - Date.now()) / 60000),
      'minute'
    );
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openDialog()} disabled={sites.length >= 10}>
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
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                        className="cyber-border"
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
                        onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) })}
                        className="cyber-border"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingSite ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {sites.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum site cadastrado</p>
              <p className="text-sm text-muted-foreground">Clique em "Adicionar Site" para começar</p>
            </div>
          ) : (
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
                  <TableRow key={site.id}>
                    <TableCell className="font-medium">{site.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[200px]">{site.url}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={site.isActive}
                          onCheckedChange={() => toggleSiteActive(site.id)}
                        />
                        <Badge variant={site.isActive ? "default" : "secondary"}>
                          {site.isActive ? "Ativo" : "Inativo"}
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
                        {site.clicks}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatLastAccess(site.lastAccess)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(site)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteSite(site.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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