import { Application, Assets, Container, Sprite, Point, FederatedPointerEvent } from 'pixi.js';
import { initDevtools } from '@pixi/devtools';
import { loadSounds, playSound, Sound } from './sound';
import { ImpatienceStateMachine } from './impatience';
import { INITIAL_OFFBOARD_POSITIONS, INITIAL_PIECES, INITIAL_POSITIONS, Piece, PIECE_VALUE } from './board';
import { NetworkManager, PieceState, StateData } from './network';
import { createButton, createInput } from './ui';
import {
  BOARD_SQUARE_SIZE,
  BOARD_OFFSET,
  BOARD_SIZE,
  DRAG_ALPHA,
  NORMAL_ALPHA,
  IMPATIENCE_MIN_WAIT,
  IMPATIENCE_MAX_WAIT
} from './constants';

type PieceSprite = Sprite & PieceState;

class ChessGame {
  private app: Application;
  private container: Container;
  private pieces: PieceSprite[] = [];
  private dragTarget: PieceSprite | null = null;
  private offboardPositions: Map<Piece, [number, number]>;
  private boardSprite!: Sprite;
  private boardScale!: number;
  private impatienceStateMachine: ImpatienceStateMachine;
  private networkManager: NetworkManager;
  private menuContainer: Container;

  constructor(app: Application) {
    this.app = app;
    this.container = new Container();
    this.offboardPositions = new Map(INITIAL_OFFBOARD_POSITIONS);
    this.impatienceStateMachine = new ImpatienceStateMachine(IMPATIENCE_MIN_WAIT, IMPATIENCE_MAX_WAIT);
    this.networkManager = new NetworkManager();
    this.menuContainer = new Container();

    this.setupNetworking();
  }

  private setupNetworking(): void {
    this.networkManager.onData((data) => this.receiveState(data));
    this.networkManager.onConnected(() => this.menuContainer.removeFromParent());
  }

  public async init(): Promise<void> {
    this.app.stage.addChild(this.container);

    const boardTexture = await Assets.load('assets/board.svg');
    const piecesTextures = await Assets.load('assets/pieces.json');

    loadSounds();

    this.createBoard(boardTexture);
    this.createPieces(piecesTextures);
    this.setupDragHandlers();
    this.createMenu();
  }

  private createBoard(boardTexture: any): void {
    this.boardSprite = new Sprite(boardTexture);

    const scale = Math.min(
      this.app.screen.width / boardTexture.width,
      this.app.screen.height / boardTexture.height
    );

    this.boardScale = scale;
    this.boardSprite.scale = scale;
    this.boardSprite.x = this.app.screen.width / 2 - this.boardSprite.width / 2;
    this.boardSprite.y = this.app.screen.height / 2 - this.boardSprite.height / 2;

    this.container.addChild(this.boardSprite);
  }

  private getPosition([i, j]: [number, number]): Point {
    return new Point(
      this.boardSprite.x + this.boardScale * BOARD_SQUARE_SIZE * (i + BOARD_OFFSET),
      this.boardSprite.y + this.boardScale * BOARD_SQUARE_SIZE * (j + BOARD_OFFSET)
    );
  }

  private getIndex(p: Point): [number, number] {
    return [
      Math.round((p.x - this.boardSprite.x) / (this.boardScale * BOARD_SQUARE_SIZE) - BOARD_OFFSET),
      Math.round((p.y - this.boardSprite.y) / (this.boardScale * BOARD_SQUARE_SIZE) - BOARD_OFFSET)
    ];
  }

  private createPieces(piecesTextures: any): void {
    this.pieces = INITIAL_PIECES.map((pieceId: Piece) => {
      const piece = new Sprite(piecesTextures.textures[pieceId]) as PieceSprite;
      const position = INITIAL_POSITIONS.get(pieceId)!;

      piece.id = pieceId;
      piece.i = position[0];
      piece.j = position[1];
      piece.anchor.set(0.5);
      piece.position = this.getPosition(position);
      piece.scale = this.boardSprite.width / piecesTextures.textures[pieceId].source.width;
      piece.interactiveChildren = false;
      piece.eventMode = 'static';
      piece.cursor = 'pointer';
      piece.on('pointerdown', () => this.onDragStart(piece));

      this.container.addChild(piece);
      return piece;
    });
  }

  private setupDragHandlers(): void {
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerup', (e) => this.onDragEnd(e));
    this.app.stage.on('pointerupoutside', (e) => this.onDragEnd(e));
  }

  private onDragMove(event: FederatedPointerEvent): void {
    if (this.dragTarget) {
      this.dragTarget.parent.toLocal(event.global, undefined, this.dragTarget.position);
    }
  }

  private onDragStart(piece: PieceSprite): void {
    playSound(Sound.PICKUP);
    piece.alpha = DRAG_ALPHA;
    this.dragTarget = piece;
    this.app.stage.on('pointermove', (e) => this.onDragMove(e));
  }

  private onDragEnd(event: FederatedPointerEvent): void {
    if (!this.dragTarget) return;

    this.app.stage.off('pointermove', (e) => this.onDragMove(e));
    const position = this.dragTarget.parent.toLocal(event.global);
    const [i, j] = this.getIndex(position);
    const offBoard = i < 0 || i > BOARD_SIZE - 1 || j < 0 || j > BOARD_SIZE - 1;

    const matches = this.pieces.filter(p => p.i === i && p.j === j);

    if (matches.length === 0) {
      this.handleEmptySquare(i, j, offBoard);
    } else if (matches.length === 1) {
      this.handleOccupiedSquare(matches[0], i, j, offBoard);
    }

    this.dragTarget.alpha = NORMAL_ALPHA;
    this.dragTarget = null;
  }

  private handleEmptySquare(i: number, j: number, offBoard: boolean): void {
    if (!this.dragTarget) return;

    this.dragTarget.position = this.getPosition([i, j]);
    this.dragTarget.i = i;
    this.dragTarget.j = j;

    if (offBoard) {
      this.swapOffboardPositions(i, j);
    } else {
      this.impatienceStateMachine.onMove();
    }

    this.sendState();
    playSound(Sound.PUTDOWN);
  }

  private swapOffboardPositions(i: number, j: number): void {
    if (!this.dragTarget) return;

    this.offboardPositions.forEach(([ti, tj], p) => {
      if (ti === i && tj === j) {
        this.offboardPositions.set(p, this.offboardPositions.get(this.dragTarget!.id)!);
        this.offboardPositions.set(this.dragTarget!.id, [i, j]);
      }
    });
  }

  private handleOccupiedSquare(targetPiece: PieceSprite, i: number, j: number, offBoard: boolean): void {
    if (!this.dragTarget) return;

    const sameSide = targetPiece.id.substring(0, 5) === this.dragTarget.id.substring(0, 5);

    if (sameSide || offBoard) {
      this.dragTarget.position = this.getPosition([this.dragTarget.i, this.dragTarget.j]);
    } else {
      this.capturePiece(targetPiece, i, j);
    }
  }

  private capturePiece(targetPiece: PieceSprite, i: number, j: number): void {
    if (!this.dragTarget) return;

    const [bi, bj] = this.offboardPositions.get(targetPiece.id)!;
    targetPiece.position = this.getPosition([bi, bj]);
    targetPiece.i = bi;
    targetPiece.j = bj;

    this.dragTarget.position = this.getPosition([i, j]);
    this.dragTarget.i = i;
    this.dragTarget.j = j;

    this.sendState();
    this.impatienceStateMachine.onMove();
    this.playCaptureSound(targetPiece);
  }

  private playCaptureSound(targetPiece: PieceSprite): void {
    playSound(Sound.TAKE);
    const value = PIECE_VALUE.get(targetPiece.id)!;

    const soundMap: Record<number, { taken: Sound; take: Sound; takenVol: number; takeVol: number }> = {
      9: {
        taken: Sound.PIECE_VALUE_9_TAKEN,
        take: Sound.PIECE_VALUE_9_TAKE,
        takenVol: 0.9,
        takeVol: 0.7
      },
      5: {
        taken: Sound.PIECE_VALUE_5_TAKEN,
        take: Sound.PIECE_VALUE_5_TAKE,
        takenVol: 0.7,
        takeVol: 0.3
      },
      3: {
        taken: Sound.PIECE_VALUE_3_TAKEN,
        take: Sound.PIECE_VALUE_3_TAKE,
        takenVol: 0.5,
        takeVol: 0.2
      },
      1: {
        taken: Sound.PIECE_VALUE_1_TAKEN,
        take: Sound.PIECE_VALUE_1_TAKE,
        takenVol: 0.3,
        takeVol: 0.1
      },
    };

    const sounds = soundMap[value];
    if (sounds) {
      playSound(sounds.taken, sounds.takenVol);
      playSound(sounds.take, sounds.takeVol);
    }
  }

  private sendState(): void {
    const pieceState = this.pieces.map(piece => ({
      id: piece.id,
      i: piece.i,
      j: piece.j,
    }));

    const offboardState: PieceState[] = Array.from(this.offboardPositions.entries()).map(
      ([id, [i, j]]) => ({ id, i, j })
    );

    this.networkManager.sendState({ pieceState, offboardState });
  }

  private receiveState(data: StateData): void {
    this.pieces.forEach((piece) => {
      const pieceData = data.pieceState.find(({ id }) => id === piece.id);
      if (pieceData && (piece.i !== pieceData.i || piece.j !== pieceData.j)) {
        piece.i = pieceData.i;
        piece.j = pieceData.j;
        piece.position = this.getPosition([piece.i, piece.j]);
      }
    });

    this.offboardPositions = new Map(
      data.offboardState.map(({ id, i, j }) => [id, [i, j]])
    );
  }

  private createMenu(): void {
    const playSoloButton = createButton("PLAY OFFLINE");
    playSoloButton.view.x = this.app.screen.width / 2 - playSoloButton.view.width / 2;
    playSoloButton.view.y = this.app.screen.height / 2 - 4 * playSoloButton.view.height / 2;
    playSoloButton.onPress.connect(() => this.menuContainer.removeFromParent());
    this.menuContainer.addChild(playSoloButton.view);

    const playOnlineButton = createButton("PLAY ONLINE");
    playOnlineButton.view.x = this.app.screen.width / 2 - playOnlineButton.view.width / 2;
    playOnlineButton.view.y = this.app.screen.height / 2 - playOnlineButton.view.height / 2;
    this.menuContainer.addChild(playOnlineButton.view);

    const input = createInput("PEER ID...", this.app.screen.width, this.app.screen.height);
    this.menuContainer.addChild(input);

    let peerId = '';
    input.onChange.connect((val) => {
      peerId = val;
    });

    playOnlineButton.onPress.connect(() => {
      if (peerId) {
        this.networkManager.connectToPeer(peerId);
      }
    });

    this.container.addChild(this.menuContainer);
  }
}

(async () => {
  const app = new Application();
  initDevtools({ app });

  await app.init({
    resizeTo: window,
    background: "white"
  });

  document.body.appendChild(app.canvas);

  const game = new ChessGame(app);
  await game.init();
})();