import { useState, useEffect } from 'react';
import { Toaster } from "./components/ui/sonner";
import { useToast } from "./components/ui/use-toast";
import Dashboard from "./components/Dashboard";
import { websocketService } from './services/api';
import './App.css';

function App() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect();

    // Set up WebSocket listeners
    websocketService.on('connected', () => {
      setIsConnected(true);
      toast({
        title: "Conectado",
        description: "Conexão com o servidor estabelecida",
      });
    });

    websocketService.on('disconnected', () => {
      setIsConnected(false);
      toast({
        title: "Desconectado",
        description: "Conexão com o servidor perdida",
        variant: "destructive",
      });
    });

    websocketService.on('error', (error) => {
      toast({
        title: "Erro de Conexão",
        description: "Erro na comunicação com o servidor",
        variant: "destructive",
      });
    });

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, [toast]);

  return (
    <>
      <Dashboard isConnected={isConnected} />
      <Toaster />
    </>
  );
}

export default App;
