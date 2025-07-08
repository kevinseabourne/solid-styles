/**
 * Advanced Animation Examples
 *
 * Demonstrating CSS Grid, SVG, 3D transforms, and gesture animations
 * using styled components with the animate prop and spring physics
 */

import { createSignal, onMount, For } from "solid-js";
import { styled } from "../src";
// Animation system is available through the animate prop when imported
import "../animation";

// ============= CSS Grid Animation Example =============

const Container = styled("div")`
  padding: 2rem;
  margin-bottom: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const AnimatedGrid = styled("div")`
  display: grid;
  gap: 1rem;
  padding: 1rem;
  background: #f0f0f0;
  border-radius: 8px;
`;

const GridItem = styled("div")`
  background: #3498db;
  color: white;
  padding: 1rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
`;

const GridExample = () => {
  const [expanded, setExpanded] = createSignal(false);

  return (
    <Container>
      <h2>CSS Grid Animation</h2>
      <AnimatedGrid
        animate={{
          gridTemplateColumns: expanded() ? "1fr 1fr 1fr" : "1fr 1fr",
          gridTemplateRows: expanded() ? "repeat(3, 100px)" : "repeat(2, 100px)",
        }}
      >
        <For
          each={[1, 2, 3, 4, 5, 6]}
          children={(item: number) => (
            <div
              style={{
                width: "60px",
                height: "60px",
                backgroundColor: "#3498db",
                margin: "8px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onClick={() => setExpanded(!expanded())}
            >
              {item}
            </div>
          )}
        />
      </AnimatedGrid>
      <Button onClick={() => setExpanded(!expanded())}>{expanded() ? "Collapse" : "Expand"} Grid</Button>
    </Container>
  );
};

// ============= SVG Path Animation Example =============

const AnimatedPath = styled("path")``;
const AnimatedCircle = styled("circle")``;

const SVGExample = () => {
  const [morphed, setMorphed] = createSignal(false);
  const [drawn, setDrawn] = createSignal(false);

  return (
    <Container>
      <h2>SVG Animations</h2>
      <svg
        width="400"
        height="200"
        viewBox="0 0 400 200"
      >
        {/* Path Morphing */}
        <AnimatedPath
          fill="none"
          stroke="#3498db"
          stroke-width="3"
          animate={{
            d: morphed() ? "M 10 80 Q 52.5 10 95 80 T 180 80" : "M 10 80 Q 95 10 180 80",
          }}
        />

        {/* Stroke Animation */}
        <AnimatedCircle
          cx="300"
          cy="100"
          r="50"
          fill="none"
          stroke="#e74c3c"
          animate={{
            strokeWidth: morphed() ? 8 : 3,
            strokeDasharray: morphed() ? "20 5" : "5 10",
          }}
        />

        {/* SVG Draw-on Animation using stroke-dashoffset */}
        <AnimatedPath
          d="M 210 50 L 250 150 L 290 50"
          fill="none"
          stroke="#2ecc71"
          stroke-width="4"
          stroke-linecap="round"
          stroke-dasharray="200"
          animate={{
            strokeDashoffset: drawn() ? 0 : 200,
          }}
        />
      </svg>
      <ButtonGroup>
        <Button onClick={() => setMorphed(!morphed())}>{morphed() ? "Unmorph" : "Morph"} Paths</Button>
        <Button onClick={() => setDrawn(!drawn())}>{drawn() ? "Erase" : "Draw"} Path</Button>
      </ButtonGroup>
    </Container>
  );
};

// ============= 3D Transform Animation Example =============

const Card3D = styled("div")`
  width: 200px;
  height: 280px;
  position: relative;
  transform-style: preserve-3d;
`;

const CardFace = styled("div")`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  background: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  border-radius: 8px;
`;

const CardBack = styled(CardFace)`
  background: #e74c3c;
  transform: rotateY(180deg);
`;

const Cube = styled("div")`
  width: 100px;
  height: 100px;
  position: relative;
  transform-style: preserve-3d;
`;

const CubeFace = styled("div")`
  position: absolute;
  width: 100px;
  height: 100px;
  background: rgba(52, 152, 219, 0.8);
  border: 2px solid #2980b9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
`;

const Transform3DExample = () => {
  const [flipped, setFlipped] = createSignal(false);
  const [rotated, setRotated] = createSignal(false);

  return (
    <Container>
      <h2>3D Transform Animations</h2>
      <PerspectiveContainer>
        {/* Card Flip */}
        <Card3D
          animate={{
            rotateY: flipped() ? 180 : 0,
          }}
        >
          <CardFace>Front</CardFace>
          <CardBack>Back</CardBack>
        </Card3D>

        {/* 3D Cube */}
        <Cube
          animate={{
            rotateX: rotated() ? 45 : 0,
            rotateY: rotated() ? 45 : 0,
            rotateZ: rotated() ? 45 : 0,
          }}
        >
          <CubeFace style={{ transform: "translateZ(50px)" }}>Front</CubeFace>
          <CubeFace style={{ transform: "rotateY(90deg) translateZ(50px)" }}>Right</CubeFace>
          <CubeFace style={{ transform: "rotateY(180deg) translateZ(50px)" }}>Back</CubeFace>
          <CubeFace style={{ transform: "rotateY(-90deg) translateZ(50px)" }}>Left</CubeFace>
          <CubeFace style={{ transform: "rotateX(90deg) translateZ(50px)" }}>Top</CubeFace>
          <CubeFace style={{ transform: "rotateX(-90deg) translateZ(50px)" }}>Bottom</CubeFace>
        </Cube>
      </PerspectiveContainer>
      <ButtonGroup>
        <Button onClick={() => setFlipped(!flipped())}>Flip Card</Button>
        <Button onClick={() => setRotated(!rotated())}>Rotate Cube</Button>
      </ButtonGroup>
    </Container>
  );
};

// ============= Gesture Animation Example =============

const DraggableBox = styled("div")`
  position: absolute;
  width: 100px;
  height: 100px;
  background: #e74c3c;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: 8px;
  cursor: grab;
  user-select: none;
  top: 150px;
  left: 150px;

  &:active {
    cursor: grabbing;
  }
`;

const GestureExample = () => {
  const [position, setPosition] = createSignal({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = createSignal(false);
  const [scale, setScale] = createSignal(1);

  let containerRef: HTMLDivElement;
  let startPos = { x: 0, y: 0 };
  let startMouse = { x: 0, y: 0 };

  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true);
    startMouse = { x: e.clientX, y: e.clientY };
    startPos = position();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging()) return;

    const deltaX = e.clientX - startMouse.x;
    const deltaY = e.clientY - startMouse.y;

    setPosition({
      x: startPos.x + deltaX,
      y: startPos.y + deltaY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Snap to nearest 50px grid
    setPosition({
      x: Math.round(position().x / 50) * 50,
      y: Math.round(position().y / 50) * 50,
    });
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.max(0.5, Math.min(2, s * delta)));
  };

  onMount(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  });

  return (
    <Container>
      <h2>Gesture-Based Animations</h2>
      <GestureContainer
        ref={containerRef!}
        onWheel={handleWheel}
      >
        <DraggableBox
          onMouseDown={handleMouseDown}
          animate={{
            x: position().x,
            y: position().y,
            scale: scale(),
            boxShadow: isDragging() ? "0 10px 30px rgba(0,0,0,0.3)" : "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          Drag me!
          <br />
          Scroll to zoom
        </DraggableBox>

        <Grid />
      </GestureContainer>
      <p>Drag the box around - it will snap to the grid when released!</p>
    </Container>
  );
};

// ============= Styled Components =============

const Button = styled("button")`
  background: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  margin-right: 0.5rem;
  font-size: 1rem;

  &:hover {
    background: #2980b9;
  }
`;

const ButtonGroup = styled("div")`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const PerspectiveContainer = styled("div")`
  perspective: 1000px;
  display: flex;
  gap: 4rem;
  justify-content: center;
  margin: 2rem 0;
`;

const GestureContainer = styled("div")`
  position: relative;
  height: 400px;
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

const Grid = styled("div")`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
`;

// ============= App Component =============

export default function AdvancedAnimations() {
  return (
    <div style={{ padding: "2rem", "max-width": "1200px", margin: "0 auto" }}>
      <h1>Advanced Animation Examples</h1>
      <p>All animations use spring physics through the animate prop!</p>

      <GridExample />
      <SVGExample />
      <Transform3DExample />
      <GestureExample />
    </div>
  );
}
