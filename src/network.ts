import Peer, { DataConnection } from 'peerjs';
import { Piece } from './board';
import { PEER_HOST, PEER_PORT } from './constants';

export type PieceState = {
    id: Piece;
    i: number;
    j: number;
};

export type StateData = {
    pieceState: PieceState[];
    offboardState: PieceState[];
};

export class NetworkManager {
    private peer: Peer;
    private conn: DataConnection | null = null;
    private onDataCallback: ((data: StateData) => void) | null = null;
    private onConnectedCallback: (() => void) | null = null;

    constructor() {
        this.peer = new Peer({ host: PEER_HOST, port: PEER_PORT });
        this.setupPeerListeners();
    }

    private setupPeerListeners(): void {
        this.peer.on('open', (id) => {
            console.log('Peer opened with ID:', id);
        });

        this.peer.on('connection', (connection) => {
            console.log('Incoming connection received');
            if (this.conn) {
                connection.close();
            } else {
                this.conn = connection;
                this.setupConnectionListeners();
                this.onConnectedCallback?.();
            }
        });

        this.peer.on('error', (err) => console.error('Peer error:', err));
    }

    private setupConnectionListeners(): void {
        if (!this.conn) return;

        this.conn.on('data', (data) => {
            console.log('Received data:', data);
            this.onDataCallback?.(data as StateData);
        });

        this.conn.on('error', (err) => console.error('Connection error:', err));
    }

    public connectToPeer(peerId: string): void {
        this.conn = this.peer.connect(peerId);

        this.conn.on('open', () => {
            console.log('Connected to peer:', peerId);
            this.onConnectedCallback?.();
        });

        this.setupConnectionListeners();
    }

    public sendState(data: StateData): void {
        if (!this.conn) {
            console.warn('No connection available to send state');
            return;
        }
        console.log('Sending state:', data);
        this.conn.send(data);
    }

    public onData(callback: (data: StateData) => void): void {
        this.onDataCallback = callback;
    }

    public onConnected(callback: () => void): void {
        this.onConnectedCallback = callback;
    }

    public isConnected(): boolean {
        return this.conn !== null && this.conn.open;
    }
}
