class NotificacionService {
    private static instance: NotificacionService;
    
    private constructor() {
        this.solicitarPermisos();
    }

    static getInstance(): NotificacionService {
        if (!NotificacionService.instance) {
            NotificacionService.instance = new NotificacionService();
        }
        return NotificacionService.instance;
    }

    async notificarLimitePresupuesto(categoria: string, porcentaje: number): Promise<void> {
        if (Notification.permission === 'granted' && porcentaje >= 90) {
            new Notification(`¡Alerta de presupuesto!`, {
                body: `Has alcanzado el ${porcentaje}% de tu presupuesto en ${categoria}`,
                icon: '/icon.png'
            });
        }
    }

    private async solicitarPermisos(): Promise<void> {
        if (Notification.permission !== 'granted') {
            await Notification.requestPermission();
        }
    }
} 