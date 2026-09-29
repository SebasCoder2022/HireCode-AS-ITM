export class Etapa {
  constructor(
    public readonly nombre: string,
    public readonly esFinal: boolean = false,
    public readonly esPuntoDeDecision: boolean = false,
  ) {}

  esIgualA(otra: Etapa): boolean {
    return this.nombre === otra.nombre;
  }
}
