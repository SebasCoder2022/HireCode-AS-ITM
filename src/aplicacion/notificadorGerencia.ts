import { Candidato } from '../dominio/candidato';
import { Etapa } from '../dominio/etapa';
import { ObservadorEventos } from '../dominio/observadorEventos';
import { CanalNotificacion } from '../dominio/canalNotificacion';

export class NotificadorGerencia implements ObservadorEventos {
  constructor(
    private readonly canal: CanalNotificacion,
    private readonly destinatario: string,
  ) {}

  onCambio(candidato: Candidato, etapaAnterior: Etapa): void {
    void etapaAnterior;
    if (candidato.etapaActual().esPuntoDeDecision) {
      this.canal.enviar(this.destinatario, `Candidato ${candidato.nombre} llegó a ${candidato.etapaActual().nombre}`);
    }
  }
}
