import { CanalNotificacion } from '../dominio/canalNotificacion';

export class EmailCanal implements CanalNotificacion {
  enviar(destinatario: string, mensaje: string): void {
    console.log(`[EMAIL -> ${destinatario}] ${mensaje}`);
  }
}
