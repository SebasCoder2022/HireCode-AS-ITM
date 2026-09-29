import assert from 'assert';
import { Etapa } from './dominio/etapa';
import { FlujoSeleccion } from './dominio/flujoSeleccion';
import { Candidato, FabricaComandos } from './dominio/candidato';
import { PublicadorEventos } from './aplicacion/publicadorEventos';
import { NotificadorGerencia } from './aplicacion/notificadorGerencia';
import { GestorCandidato } from './aplicacion/gestorCandidato';
import { EmailCanal } from './infraestructura/emailCanal';
import { RegistradorAuditoria } from './infraestructura/registradorAuditoria';

const aplicado = new Etapa('APLICADO');
const entrevista = new Etapa('ENTREVISTA');
const pruebaTecnica = new Etapa('PRUEBA_TECNICA');
const oferta = new Etapa('OFERTA', false, true);
const contratado = new Etapa('CONTRATADO', true, true);
const rechazado = new Etapa('RECHAZADO', true, true);

const flujo = new FlujoSeleccion([aplicado, entrevista, pruebaTecnica, oferta, contratado]);
const fabricaComandos = new FabricaComandos(flujo, rechazado);

const publicador = new PublicadorEventos();
publicador.suscribir(new RegistradorAuditoria());
publicador.suscribir(new NotificadorGerencia(new EmailCanal(), 'gerencia@electritorres.com'));

const gestor = new GestorCandidato(publicador, fabricaComandos);

const candidato = new Candidato('C-001', 'Ana Torres', flujo.etapaInicial());
console.log(`Inicio: ${candidato}`);

gestor.avanzar(candidato);
gestor.avanzar(candidato);
gestor.avanzar(candidato);
console.log(`Tras 3 avances: ${candidato}`);

gestor.deshacerUltimoCambio(candidato);
console.log(`Tras deshacer: ${candidato}`);
assert.strictEqual(candidato.etapaActual().nombre, pruebaTecnica.nombre);

gestor.rechazar(candidato);
console.log(`Tras rechazo: ${candidato}`);
assert.strictEqual(candidato.etapaActual().nombre, rechazado.nombre);

try {
  gestor.avanzar(candidato);
  throw new Error('Debía fallar: no se avanza desde una etapa final');
} catch (error) {
  console.log(`OK: guard de etapa final funcionó -> ${(error as Error).message}`);
}

gestor.deshacerUltimoCambio(candidato);
console.log(`Tras deshacer el rechazo: ${candidato}`);
assert.strictEqual(candidato.etapaActual().nombre, pruebaTecnica.nombre);

gestor.deshacerUltimoCambio(candidato);
console.log(`Tras deshacer dos veces seguidas: ${candidato}`);
assert.strictEqual(candidato.etapaActual().nombre, entrevista.nombre);

console.log('Demo OK.');
