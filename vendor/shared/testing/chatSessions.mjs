import { randomUUID } from 'node:crypto';

const OPEN = 1;
const DIRECT_TIMEOUT_MS = 10_000;
const send = (socket, frame) => {
  if (socket.readyState === OPEN) socket.send(JSON.stringify(frame));
};
const deviceKey = identity => JSON.stringify([identity.ownerId, identity.deviceId]);

/** Local browser-test coordinator for the fixture host's version-one protocol.
 * Authentication, quotas, resumable sessions and production validation belong to the Go backend.
 * This fixture only pairs test clients and forwards opaque encrypted messages.
 */
export class ChatSessionsFixture {
  #desktops = new Map();
  #sessions = new Map();

  join(socket, identity, frame, iceServers = []) {
    const key = deviceKey(identity);
    if (identity.role === 'desktop') {
      if (frame.transportVersion !== 1) throw new Error('The fixture host requires transport version one');
      const previous = this.#desktops.get(key);
      if (previous && previous.socket !== socket) this.disconnect(previous.socket);
      this.#desktops.set(key, { socket, expiresAt: identity.expiresAt });
      send(socket, { type: 'registered' });
      return;
    }
    if (identity.role !== 'mobile') throw new Error('Unsupported fixture role');
    const desktop = this.#desktops.get(key);
    if (!desktop || desktop.socket.readyState !== OPEN) {
      socket.close(4004, 'PC chat is offline');
      return;
    }
    if (frame.resume) { socket.close(4004, 'Session unavailable'); return; }
    const sessionId = randomUUID();
    this.#sessions.set(sessionId, { desktop: desktop.socket, mobile: socket, relay: false });
    send(desktop.socket, { type: 'peer-open', sessionId, publicKey: frame.publicKey, iceServers,
      clientInfo: frame.clientInfo, expiresAt: Math.min(identity.expiresAt, desktop.expiresAt) });
    send(socket, { type: 'paired', sessionId, iceServers, directTimeoutMs: DIRECT_TIMEOUT_MS });
  }

  route(socket, frame) {
    const session = this.#sessions.get(frame.sessionId);
    if (!session || (session.desktop !== socket && session.mobile !== socket)) throw new Error('Unknown fixture session');
    const target = socket === session.desktop ? session.mobile : session.desktop;
    if (frame.type === 'peer-close') { this.#sessions.delete(frame.sessionId); send(target, frame); return; }
    if (frame.type === 'relay-request') {
      session.relay = true;
      const ready = { type: 'relay-ready', sessionId: frame.sessionId };
      send(session.desktop, ready); send(session.mobile, ready);
      return;
    }
    if (frame.type !== 'signal' && !(frame.type === 'relay' && session.relay)) {
      throw new Error('Unsupported fixture frame');
    }
    send(target, frame);
  }

  disconnect(socket) {
    for (const [key, desktop] of this.#desktops) {
      if (desktop.socket === socket) this.#desktops.delete(key);
    }
    for (const [sessionId, session] of this.#sessions) {
      if (session.desktop !== socket && session.mobile !== socket) continue;
      this.#sessions.delete(sessionId);
      send(socket === session.desktop ? session.mobile : session.desktop, { type: 'peer-close', sessionId });
    }
  }
}
