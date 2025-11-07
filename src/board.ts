export enum Piece {
    WHITE_KING = "white_king",
    WHITE_QUEEN = "white_queen",
    WHITE_ROOK1 = "white_rook1",
    WHITE_ROOK2 = "white_rook2",
    WHITE_KNIGHT1 = "white_knight1",
    WHITE_KNIGHT2 = "white_knight2",
    WHITE_BISHOP1 = "white_bishop1",
    WHITE_BISHOP2 = "white_bishop2",
    WHITE_PAWN1 = "white_pawn1",
    WHITE_PAWN2 = "white_pawn2",
    WHITE_PAWN3 = "white_pawn3",
    WHITE_PAWN4 = "white_pawn4",
    WHITE_PAWN5 = "white_pawn5",
    WHITE_PAWN6 = "white_pawn6",
    WHITE_PAWN7 = "white_pawn7",
    WHITE_PAWN8 = "white_pawn8",
    BLACK_KING = "black_king",
    BLACK_QUEEN = "black_queen",
    BLACK_ROOK1 = "black_rook1",
    BLACK_ROOK2 = "black_rook2",
    BLACK_KNIGHT1 = "black_knight1",
    BLACK_KNIGHT2 = "black_knight2",
    BLACK_BISHOP1 = "black_bishop1",
    BLACK_BISHOP2 = "black_bishop2",
    BLACK_PAWN1 = "black_pawn1",
    BLACK_PAWN2 = "black_pawn2",
    BLACK_PAWN3 = "black_pawn3",
    BLACK_PAWN4 = "black_pawn4",
    BLACK_PAWN5 = "black_pawn5",
    BLACK_PAWN6 = "black_pawn6",
    BLACK_PAWN7 = "black_pawn7",
    BLACK_PAWN8 = "black_pawn8",
}

type PieceType = 'king' | 'queen' | 'rook' | 'knight' | 'bishop' | 'pawn';
type Color = 'white' | 'black';

const PIECE_TYPE_VALUES: Record<PieceType, number> = {
    king: -1,
    queen: 9,
    rook: 5,
    knight: 3,
    bishop: 3,
    pawn: 1,
};

// Helper to extract piece type from piece ID
const getPieceType = (piece: Piece): PieceType => {
    const pieceStr = piece.toString();
    if (pieceStr.includes('king')) return 'king';
    if (pieceStr.includes('queen')) return 'queen';
    if (pieceStr.includes('rook')) return 'rook';
    if (pieceStr.includes('knight')) return 'knight';
    if (pieceStr.includes('bishop')) return 'bishop';
    return 'pawn';
};

// Generate all pieces programmatically
const generatePieces = (): Piece[] => {
    const colors: Color[] = ['black', 'white'];
    const pieces: Piece[] = [];

    colors.forEach(color => {
        const pieceOrder = ['rook1', 'knight1', 'bishop1', 'king', 'queen', 'bishop2', 'knight2', 'rook2'];
        pieceOrder.forEach(type => pieces.push(`${color}_${type}` as Piece));

        for (let i = 1; i <= 8; i++) {
            pieces.push(`${color}_pawn${i}` as Piece);
        }
    });

    return pieces;
};

export const INITIAL_PIECES = generatePieces();

// Generate piece values based on type
export const PIECE_VALUE: Map<Piece, number> = new Map(
    INITIAL_PIECES.map(piece => [piece, PIECE_TYPE_VALUES[getPieceType(piece)]])
);

// Generate initial board positions
const generateInitialPositions = (): Map<Piece, [number, number]> => {
    const positions = new Map<Piece, [number, number]>();

    // Black pieces (top, row 0 and 1)
    const blackBackRow = [
        Piece.BLACK_ROOK1, Piece.BLACK_KNIGHT1, Piece.BLACK_BISHOP1,
        Piece.BLACK_KING, Piece.BLACK_QUEEN, Piece.BLACK_BISHOP2,
        Piece.BLACK_KNIGHT2, Piece.BLACK_ROOK2
    ];
    blackBackRow.forEach((piece, i) => positions.set(piece, [i, 0]));

    for (let i = 0; i < 8; i++) {
        positions.set(`black_pawn${i + 1}` as Piece, [i, 1]);
    }

    // White pieces (bottom, row 6 and 7)
    const whiteBackRow = [
        Piece.WHITE_ROOK1, Piece.WHITE_KNIGHT1, Piece.WHITE_BISHOP1,
        Piece.WHITE_KING, Piece.WHITE_QUEEN, Piece.WHITE_BISHOP2,
        Piece.WHITE_KNIGHT2, Piece.WHITE_ROOK2
    ];
    whiteBackRow.forEach((piece, i) => positions.set(piece, [i, 7]));

    for (let i = 0; i < 8; i++) {
        positions.set(`white_pawn${i + 1}` as Piece, [i, 6]);
    }

    return positions;
};

export const INITIAL_POSITIONS = generateInitialPositions();

// Generate off-board positions for captured pieces
const generateOffboardPositions = (): Map<Piece, [number, number]> => {
    const positions = new Map<Piece, [number, number]>();

    // Black pieces on left and top
    const blackBackRow = [
        Piece.BLACK_ROOK1, Piece.BLACK_KNIGHT1, Piece.BLACK_BISHOP1,
        Piece.BLACK_KING, Piece.BLACK_QUEEN, Piece.BLACK_BISHOP2,
        Piece.BLACK_KNIGHT2, Piece.BLACK_ROOK2
    ];
    blackBackRow.forEach((piece, i) => positions.set(piece, [-1, i]));

    for (let i = 0; i < 8; i++) {
        positions.set(`black_pawn${i + 1}` as Piece, [i, -1]);
    }

    // White pieces on right and bottom
    const whiteBackRow = [
        Piece.WHITE_ROOK1, Piece.WHITE_KNIGHT1, Piece.WHITE_BISHOP1,
        Piece.WHITE_KING, Piece.WHITE_QUEEN, Piece.WHITE_BISHOP2,
        Piece.WHITE_KNIGHT2, Piece.WHITE_ROOK2
    ];
    whiteBackRow.forEach((piece, i) => positions.set(piece, [8, i]));

    for (let i = 0; i < 8; i++) {
        positions.set(`white_pawn${i + 1}` as Piece, [i, 8]);
    }

    return positions;
};

export const INITIAL_OFFBOARD_POSITIONS = generateOffboardPositions();