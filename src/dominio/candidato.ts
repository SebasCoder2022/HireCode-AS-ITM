import { Etapa } from './etapa';
import { FlujoSeleccion } from './flujoSeleccion';

export interface Comando {
  ejecutar(): void;
  deshacer(): void;
}

export type TipoAccion = 'AVANZAR' | 'RECHAZAR';

export class Candidato {
  private etapa: Etapa;

  constructor(
    public readonly id: string,
    public readonly nombre: string,
    etapaInicial: Etapa,
  ) {
    this.etapa = etapaInicial;
  }

  etapaActual(): Etapa {
    return this.etapa;
  }

  avanzarA(nuevaEtapa: Etapa): void {
    this.etapa = nuevaEtapa;
  }

  toString(): string {
    return `Candidato[${this.id}, ${this.nombre}, etapa=${this.etapa.nombre}]`;
  }
}

class ComandoAvanzar implements Comando {
  private etapaAnterior: Etapa | undefined;

  constructor(
    private readonly candidato: Candidato,
    private readonly flujo: FlujoSeleccion,
  ) {}

  ejecutar(): void {
    this.etapaAnterior = this.candidato.etapaActual();
    if (this.etapaAnterior.esFinal) {
      throw new Error(`La etapa "${this.etapaAnterior.nombre}" es final; no se puede avanzar`);
    }
    this.candidato.avanzarA(this.flujo.siguienteEtapa(this.etapaAnterior));
  }

  deshacer(): void {
    if (!this.etapaAnterior) {
      throw new Error('No se puede deshacer un comando que no se ha ejecutado');
    }
    this.candidato.avanzarA(this.etapaAnterior);
  }
}

class ComandoRechazar implements Comando {
  private etapaAnterior: Etapa | undefined;

  constructor(
    private readonly candidato: Candidato,
    private readonly etapaRechazo: Etapa,
  ) {}

  ejecutar(): void {
    this.etapaAnterior = this.candidato.etapaActual();
    if (this.etapaAnterior.esFinal) {
      throw new Error(`No se puede rechazar a ${this.candidato.nombre}: ya está en una etapa final`);
    }
    this.candidato.avanzarA(this.etapaRechazo);
  }

  deshacer(): void {
    if (!this.etapaAnterior) {
      throw new Error('No se puede deshacer un comando que no se ha ejecutado');
    }
    this.candidato.avanzarA(this.etapaAnterior);
  }
}

export class FabricaComandos {
  constructor(
    private readonly flujo: FlujoSeleccion,
    private readonly etapaRechazo: Etapa,
  ) {}

  crear(tipo: TipoAccion, candidato: Candidato): Comando {
    if (tipo === 'AVANZAR') {
      return new ComandoAvanzar(candidato, this.flujo);
    }
    return new ComandoRechazar(candidato, this.etapaRechazo);
  }
}
