import { Candidato } from '../dominio/candidato';
import { Etapa } from '../dominio/etapa';
import { ObservadorEventos } from '../dominio/observadorEventos';

export class RegistradorAuditoria implements ObservadorEventos {
  onCambio(candidato: Candidato, etapaAnterior: Etapa): void {
    console.log(`[AUDITORIA] ${candidato.id} ${etapaAnterior.nombre} -> ${candidato.etapaActual().nombre}`);
  }
}
