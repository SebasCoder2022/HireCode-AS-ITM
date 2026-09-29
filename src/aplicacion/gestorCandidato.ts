import { Candidato } from '../dominio/candidato';
import { Comando, FabricaComandos, TipoAccion } from '../dominio/candidato';
import { PublicadorEventos } from './publicadorEventos';

export class GestorCandidato {
  private readonly historiales = new Map<string, Comando[]>();

  constructor(
    private readonly publicador: PublicadorEventos,
    private readonly fabricaComandos: FabricaComandos,
  ) {}

  avanzar(candidato: Candidato): void {
    this.ejecutar(candidato, 'AVANZAR');
  }

  rechazar(candidato: Candidato): void {
    this.ejecutar(candidato, 'RECHAZAR');
  }

  deshacerUltimoCambio(candidato: Candidato): void {
    const historial = this.historiales.get(candidato.id);
    if (!historial || historial.length === 0) {
      throw new Error(`No hay cambios para deshacer sobre ${candidato.id}`);
    }
    const antes = candidato.etapaActual();
    const comando = historial.pop() as Comando;
    comando.deshacer();
    this.publicador.publicar(candidato, antes);
  }

  private ejecutar(candidato: Candidato, tipo: TipoAccion): void {
    const antes = candidato.etapaActual();
    const comando = this.fabricaComandos.crear(tipo, candidato);
    comando.ejecutar();
    const historial = this.historiales.get(candidato.id) ?? [];
    historial.push(comando);
    this.historiales.set(candidato.id, historial);
    this.publicador.publicar(candidato, antes);
  }
}
