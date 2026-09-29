import { Candidato } from './candidato';
import { Etapa } from './etapa';

export interface ObservadorEventos {
  onCambio(candidato: Candidato, etapaAnterior: Etapa): void;
}
