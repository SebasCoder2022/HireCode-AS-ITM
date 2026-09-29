import { CanalNotificacion } from '../dominio/canalNotificacion';

export class SmsCanal implements CanalNotificacion {
  enviar(destinatario: string, mensaje: string): void {
    console.log(`[SMS -> ${destinatario}] ${mensaje}`);
  }
}
