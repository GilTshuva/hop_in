import { useState } from "react";
import hole from "../assets/hole.png";
import empty_tile from "../assets/empty_tile.png";
import fox_back from "../assets/fox_back.png";
import fox_front from "../assets/fox_front.png";
import white_rabbit from "../assets/white_rabbit.png";
import mushroom from "../assets/mushroom.png";

// --- Types ---
type PieceType = "rabbit" | "fox" | "mushroom";
type RabbitColor = "white" | "brown" | "gray";
type Facing = "up" | "down" | "left" | "right";
type Coordinate = { x: number; y: number };

interface GamePiece {
  type: PieceType;

  color?: RabbitColor;

  facing?: Facing;
  front?: boolean;
}

interface Cell {
  isHole: boolean;
  piece: GamePiece | null;
}

// --- Constants ---
const BOARD_SIZE = 5;
const GREEN_BG = "rgb(0, 157, 71)";

export default function JumpInGame() {
  const [moveCount, setMoveCount] = useState(0);

  const [board, setBoard] = useState<Cell[][]>(() => {
    const holePositions: Coordinate[] = [
      { x: 0, y: 0 },
      { x: 0, y: 4 },
      { x: 2, y: 2 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
    ];
    const initialBoard: Cell[][] = Array.from({ length: BOARD_SIZE }, (_, y) =>
      Array.from({ length: BOARD_SIZE }, (_, x) => ({
        isHole: holePositions.some((h) => h.y === y && h.x === x),
        piece: null,
      })),
    );
    // // Initial Level Setup
    // initialBoard[0][1].piece = { type: "rabbit", color: "white" };
    // initialBoard[1][1].piece = { type: "mushroom" };
    // initialBoard[3][1].piece = { type: "fox", facing: "down", front: true };
    // initialBoard[2][1].piece = { type: "fox", facing: "down", front: false };
    console.log(initialBoard);
    return initialBoard;
  });

  const decode_board = (code: string) => {
    if (code.length != BOARD_SIZE * BOARD_SIZE) {
      console.warn("got", code.length, "instand of", BOARD_SIZE * BOARD_SIZE);
      return;
    }
    const newBoard: Cell[][] = Array.from({ length: BOARD_SIZE }, (_, y) =>
      Array.from({ length: BOARD_SIZE }, (_, x) => ({
        isHole:
          ((y === 0 || y === 4) && (x === 0 || x === 4)) ||
          (y === 2 && x === 2),
        piece: null,
      })),
    );

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const row = Math.floor(i / BOARD_SIZE);
      const col = i % BOARD_SIZE;

      if (row >= BOARD_SIZE) break;

      switch (char) {
        case "w":
          newBoard[row][col].piece = { type: "rabbit", color: "white" };
          break;
        case "b":
          newBoard[row][col].piece = { type: "rabbit", color: "brown" };
          break;
        case "g":
          newBoard[row][col].piece = { type: "rabbit", color: "gray" };
          break;
        case "m":
          newBoard[row][col].piece = { type: "mushroom" };
          break;
        case "u": // Up
          newBoard[row][col].piece = { type: "fox", front: true, facing: "up" };
          if (row + 1 < BOARD_SIZE)
            newBoard[row + 1][col].piece = {
              type: "fox",
              front: false,
              facing: "up",
            };

          break;
        case "d": // Down
          newBoard[row][col].piece = {
            type: "fox",
            front: true,
            facing: "down",
          };
          if (row - 1 >= 0)
            newBoard[row - 1][col].piece = {
              type: "fox",
              front: false,
              facing: "down",
            };
          break;
        case "l": // Left
          newBoard[row][col].piece = {
            type: "fox",
            front: true,
            facing: "left",
          };
          if (col + 1 < BOARD_SIZE)
            newBoard[row][col + 1].piece = {
              type: "fox",
              front: false,
              facing: "left",
            };
          break;
        case "r": // Right
          newBoard[row][col].piece = {
            type: "fox",
            front: true,
            facing: "right",
          };
          if (col - 1 >= 0)
            newBoard[row][col - 1].piece = {
              type: "fox",
              front: false,
              facing: "right",
            };
          break;
      }
    }
    return newBoard;
  };

  // State to track dragging
  const [dragStart, setDragStart] = useState<{ r: number; c: number } | null>(
    null,
  );

  const handleMouseDown = (r: number, c: number, piece: any) => {
    if (!piece) return;
    if (piece.type === "fox" || piece.type === "rabbit") {
      setDragStart({ r, c });
    }
  };

  const handleMouseUp = (r: number, c: number, up: boolean = false) => {
    if (!dragStart) return;

    const startR = dragStart.r;
    const startC = dragStart.c;
    const piece = board[startR][startC].piece;
    if (piece?.type === "rabbit") {
      const possibleMoves = rabbit_valid_moves(startR, startC);
      const isValid = possibleMoves.some((m) => m.y === r && m.x === c);

      if (isValid) {
        // Perform Move
        const newBoard = [...board.map((row) => [...row])];
        newBoard[r][c].piece = piece;
        newBoard[startR][startC].piece = null;
        setBoard(newBoard);
        setDragStart({ r, c });
        setMoveCount((prev) => prev + 1);
      }
    } else if (piece?.type === "fox") {
      const isVertical = piece.facing === "up" || piece.facing === "down";
      let dr = 0;
      let dc = 0;

      // Determine direction based on drag distance
      if (isVertical) {
        dr = r > startR ? 1 : r < startR ? -1 : 0;
      } else {
        dc = c > startC ? 1 : c < startC ? -1 : 0;
      }

      if (dr !== 0 || dc !== 0) {
        executeFoxMove(startR, startC, piece, dr, dc);
      }
    }
    if (up) {
      setDragStart(null);
    } else if (piece?.type === "fox") {
      setDragStart({ r, c });
    }
  };

  const getFoxSegments = (r: number, c: number, piece: any) => {
    const isVertical = piece.facing === "up" || piece.facing === "down";
    const offset = piece.front ? 1 : -1;

    let otherPart;
    if (isVertical) {
      const otherRow = piece.facing === "down" ? r - offset : r + offset;
      otherPart = { r: otherRow, c };
    } else {
      const otherCol = piece.facing === "right" ? c - offset : c + offset;
      otherPart = { r, c: otherCol };
    }

    return [{ r, c }, otherPart];
  };

  const executeFoxMove = (
    r: number,
    c: number,
    piece: any,
    dr: number,
    dc: number,
  ) => {
    const segments = getFoxSegments(r, c, piece);
    const newBoard = [...board.map((row) => [...row])];

    const target1 = { r: segments[0].r + dr, c: segments[0].c + dc };
    const target2 = { r: segments[1].r + dr, c: segments[1].c + dc };

    const isWithin = (pos: { r: number; c: number }) =>
      pos.r >= 0 && pos.r < BOARD_SIZE && pos.c >= 0 && pos.c < BOARD_SIZE;

    if (isWithin(target1) && isWithin(target2)) {
      // Check if targets are empty (ignoring cells the fox already occupies)
      const isOccupiedBySelf = (tr: number, tc: number) =>
        segments.some((s) => s.r === tr && s.c === tc);

      const cell1Empty =
        (isOccupiedBySelf(target1.r, target1.c) ||
          !newBoard[target1.r][target1.c].piece) &&
        !newBoard[target1.r][target1.c].isHole;
      const cell2Empty =
        (isOccupiedBySelf(target2.r, target2.c) ||
          !newBoard[target2.r][target2.c].piece) &&
        !newBoard[target2.r][target2.c].isHole;

      if (cell1Empty && cell2Empty) {
        const p1 = newBoard[segments[0].r][segments[0].c].piece;
        const p2 = newBoard[segments[1].r][segments[1].c].piece;

        newBoard[segments[0].r][segments[0].c].piece = null;
        newBoard[segments[1].r][segments[1].c].piece = null;

        newBoard[target1.r][target1.c].piece = p1;
        newBoard[target2.r][target2.c].piece = p2;

        setBoard(newBoard);
        setMoveCount((prev) => prev + 1);
      }
    }
  };

  const rabbit_valid_moves = (r: number, c: number): Coordinate[] => {
    const directions = [
      { dr: -1, dc: 0 }, // Up
      { dr: 1, dc: 0 }, // Down
      { dr: 0, dc: -1 }, // Left
      { dr: 0, dc: 1 }, // Right
    ];

    const validMoves: Coordinate[] = [];

    directions.forEach(({ dr, dc }) => {
      let currR = r + dr;
      let currC = c + dc;
      let obstaclesFound = 0;

      // Scan in the current direction until we hit the edge of the 5x5 board
      while (
        currR >= 0 &&
        currR < BOARD_SIZE &&
        currC >= 0 &&
        currC < BOARD_SIZE
      ) {
        const cell = board[currR][currC];

        if (cell.piece) {
          // We found something to jump over
          obstaclesFound++;
        } else {
          // We found an empty spot
          if (obstaclesFound > 0) {
            // VALID: This is the first empty spot after at least one obstacle
            validMoves.push({ x: currC, y: currR });
          }
          // Whether it was a valid move or not, the rabbit's jump ends at the first gap
          break;
        }

        currR += dr;
        currC += dc;
      }
    });

    return validMoves;
  };

  const Board = (b: Cell[][], interactive: boolean = true) => {
    // Logic to determine if a cell is a hole or empty
    const getTileType = (row: number, col: number) => {
      const isCorner = (row === 0 || row === 4) && (col === 0 || col === 4);
      const isCenter = row === 2 && col === 2;

      return isCorner || isCenter ? hole : empty_tile;
    };

    const getRotation = (facing: Facing | undefined): string => {
      switch (facing) {
        case "up":
          return "rotate(180deg)";
        case "left":
          return "rotate(90deg)";
        case "right":
          return "rotate(-90deg)";
        case "down":
        default:
          return "rotate(0deg)";
      }
    };

    const getPieceImage = (piece: any) => {
      if (!piece) return undefined;

      // Logic to select the correct image asset based on piece type
      switch (piece.type) {
        case "rabbit":
          return white_rabbit; // or your rabbit image variable
        case "mushroom":
          return mushroom;
        case "fox":
          // You might have different images for fox head vs tail
          return piece.front ? fox_front : fox_back;
        default:
          return undefined;
      }
    };

    return (
      <div
        style={{
          position: "relative",
          width: "fit-content",
          margin: "30px auto",
          padding: interactive ? "0 30px 0 30px" : "0px",
          backgroundColor: GREEN_BG,
        }}
      >
        {/* Move Counter UI */}
        {interactive && (
          <div
            style={{
              position: "absolute",
              top: "-5px",
              left: "-5px",
              color: "white",
              padding: "5px 15px",
              borderRadius: "20px",
              fontFamily: "sans-serif",
              fontWeight: "bold",
              fontSize: "14px",
              pointerEvents: "none",
            }}
          >
            Moves: {moveCount}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 50px)`,
            //   backgroundColor: GREEN_BG, // Board background
            borderRadius: "16px",
            width: "fit-content",
            // borderColor: "rgb(255, 255, 255)",
            padding: "10px",
            outline: "3px solid rgb(255, 255, 255)",
            marginBottom: "15px",
            marginTop: "30px",
          }}
        >
          {b.map((rowData, row) =>
            rowData.map((cell, col) => {
              const isPossibleMove =
                dragStart &&
                b[dragStart.r][dragStart.c].piece?.type === "rabbit" &&
                rabbit_valid_moves(dragStart.r, dragStart.c).some(
                  (m) => m.y === row && m.x === col,
                );
              return (
                <div
                  key={`${row}-${col}`}
                  onMouseDown={() =>
                    interactive && handleMouseDown(row, col, cell.piece)
                  }
                  onMouseEnter={() =>
                    interactive && dragStart && handleMouseUp(row, col)
                  }
                  onMouseUp={() =>
                    interactive && dragStart && handleMouseUp(row, col, true)
                  }
                  //   onClick={() => {
                  //     if (cell.piece?.type === "fox") {

                  //     }
                  //   }}
                  style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor: GREEN_BG,
                    // borderRadius: "10%", // Makes each cell a circle
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    position: "relative",
                    outline: isPossibleMove
                      ? "3px solid rgba(255, 255, 255, 0.5)"
                      : "none",
                    boxShadow: isPossibleMove ? "inset 0 0 15px white" : "none",
                  }}
                >
                  <img
                    src={getTileType(row, col)}
                    alt="tile"
                    draggable={false}
                    style={{
                      userSelect: "none",
                      width: "100%",
                      height: "100%",
                      zIndex: 0,
                      position: "absolute",
                      pointerEvents: "none",
                    }}
                  />
                  {cell.piece && (
                    <img
                      src={getPieceImage(cell.piece)}
                      alt={cell.piece.type}
                      draggable={false}
                      style={{
                        userSelect: "none",
                        width: "100%",
                        height: "100%",
                        zIndex: 1,
                        // If it's a fox, you might want to rotate it based on piece.facing
                        transform:
                          cell.piece.type === "fox"
                            ? getRotation(cell.piece.facing)
                            : "none",
                        position: "absolute",
                        transition: "all 0.2s ease-in-out",
                      }}
                    />
                  )}
                </div>
              );
            }),
          )}
        </div>
        {interactive && (
          <div
            style={{
              width: "fit-content",
              margin: "0 auto", // Centers the block
              marginBottom: "15px",
              color: "white",
              padding: "8px 20px",
              borderRadius: "20px",
              backgroundColor: "rgba(255, 255, 255, 0.2)", // Subtle background
              fontFamily: "sans-serif",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
              textAlign: "center",
              transition: "background 0.2s",
            }}
            onClick={() => {
              console.log("resetting board");
              const newBoard = decode_board(" mm    r     w          d");
              if (newBoard) setBoard(newBoard);
              if (newBoard) setMoveCount(() => 0);
              // resetBoard(); // Call your reset logic here
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.3)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.2)")
            }
          >
            Restart
          </div>
        )}
      </div>
    );
  };
  return (
    <>
      {Board(board)}
      <div style={{ transform: "scale(0.5)", transformOrigin: "top center" }}>
        {Board(board, false)}
      </div>
    </>
  );
}
