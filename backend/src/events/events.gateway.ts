import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  emitScoreCreated(payload: unknown) {
    this.server.emit('score:created', payload);
  }

  emitRecordUpdated(payload: unknown) {
    this.server.emit('record:updated', payload);
  }
}
