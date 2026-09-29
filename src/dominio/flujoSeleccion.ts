import { Etapa } from './etapa';

export class FlujoSeleccion {
  private readonly etapas: Etapa[];

  constructor(etapas: Etapa[]) {
    if (etapas.length === 0) {
      throw new Error('Un flujo de selección necesita al menos una etapa');
    }
    this.etapas = etapas;
  }

  etapaInicial(): Etapa {
    return this.etapas[0];
  }

  siguienteEtapa(actual: Etapa): Etapa {
    const indice = this.etapas.findIndex((etapa) => etapa.esIgualA(actual));
    if (indice === -1) {
      throw new Error(`La etapa "${actual.nombre}" no pertenece a este flujo`);
    }
    if (this.etapas[indice].esFinal || indice === this.etapas.length - 1) {
      throw new Error(`La etapa "${actual.nombre}" es final; no se puede avanzar`);
    }
    return this.etapas[indice + 1];
  }
}
