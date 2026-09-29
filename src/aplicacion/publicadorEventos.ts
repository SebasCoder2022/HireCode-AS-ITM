import { Candidato } from '../dominio/candidato';
import { Etapa } from '../dominio/etapa';
import { ObservadorEventos } from '../dominio/observadorEventos';

export class PublicadorEventos {
  private readonly observadores: ObservadorEventos[] = [];

  suscribir(observador: ObservadorEventos): void {
    this.observadores.push(observador);
  }

  publicar(candidato: Candidato, etapaAnterior: Etapa): void {
    for (const observador of this.observadores) {
      observador.onCambio(candidato, etapaAnterior);
    }
  }
}
