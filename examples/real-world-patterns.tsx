/**
 * Real-World Animation Patterns
 * 
 * This file contains "real-world" usage scenarios for solid-styles animations,
 * covering common UI patterns like lists, modals, tabs, and shared layouts.
 */

import { createSignal, For, Show, onMount } from "solid-js";
import { styled } from "../src";
import { LayoutAnimated } from "../animation/layout-components";
import "../animation"; // Ensure animation system is loaded

// =============================================================================
// 1. List Reordering (Todo List)
// =============================================================================

const TodoContainer = styled("div")`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  max-width: 400px;
  margin-bottom: 2rem;
`;

const TodoItem = styled("div")`
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  cursor: grab;
  border: 1px solid #eee;
  
  &:active {
    cursor: grabbing;
    background: #e9ecef;
  }
`;

const Button = styled("button")`
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 0.5rem;
  transition: background 0.2s;

  &:hover {
    background: #4338ca;
  }
`;

const ButtonGroup = styled("div")`
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
`;

const TodoListExample = () => {
  const [items, setItems] = createSignal([
    { id: 1, text: "Buy groceries" },
    { id: 2, text: "Walk the dog" },
    { id: 3, text: "Read documentation" },
    { id: 4, text: "Write code" },
    { id: 5, text: "Deploy to production" },
  ]);

  const shuffle = () => {
    const newItems = [...items()];
    for (let i = newItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newItems[i], newItems[j]] = [newItems[j], newItems[i]];
    }
    setItems(newItems);
  };

  const addItem = () => {
    const id = Math.max(...items().map(i => i.id), 0) + 1;
    setItems([{ id, text: `New Item ${id}` }, ...items()]);
  };

  const removeItem = (id: number) => {
    setItems(items().filter(i => i.id !== id));
  };

  return (
    <TodoContainer>
      <h3>List Reordering</h3>
      <p style={{ color: "#666", "margin-bottom": "1rem" }}>
        Items animate to their new positions when order changes.
      </p>
      
      <ButtonGroup>
        <Button onClick={addItem}>Add Item</Button>
        <Button onClick={shuffle}>Shuffle</Button>
      </ButtonGroup>

      <div style={{ position: "relative" }}>
        <For each={items()}>
          {(item) => (
            <LayoutAnimated
              as={TodoItem}
              layout
              layoutTransition={{ stiffness: 300, damping: 25 }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => removeItem(item.id)}
            >
              <span style={{ "margin-right": "auto" }}>{item.text}</span>
              <span style={{ color: "#999", "font-size": "0.8em" }}>✕</span>
            </LayoutAnimated>
          )}
        </For>
      </div>
    </TodoContainer>
  );
};

// =============================================================================
// 2. Shared Layout Transition (Gallery to Detail)
// =============================================================================

const GalleryGrid = styled("div")`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const GalleryItem = styled("div")`
  aspect-ratio: 1;
  border-radius: 8px;
  cursor: pointer;
  background-size: cover;
  background-position: center;
`;

const Overlay = styled("div")`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 2rem;
`;

const DetailCard = styled("div")`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  width: 100%;
  max-width: 500px;
  aspect-ratio: 16/9;
  position: relative;
`;

const DetailImage = styled("div")`
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
`;

const images = [
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80",
  "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=80",
  "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&q=80",
  "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=400&q=80",
];

const SharedLayoutExample = () => {
  const [selectedId, setSelectedId] = createSignal<number | null>(null);

  return (
    <div style={{ "margin-bottom": "3rem" }}>
      <h3>Shared Layout Transition</h3>
      <p style={{ color: "#666", "margin-bottom": "1rem" }}>
        Click an image to expand it. (Note: Full shared element transition requires layoutId support, simulating with layout animations)
      </p>

      <GalleryGrid>
        <For each={images}>
          {(src, index) => (
            <LayoutAnimated
              as={GalleryItem}
              layout
              style={{ "background-image": `url(${src})` }}
              onClick={() => setSelectedId(index())}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            />
          )}
        </For>
      </GalleryGrid>

      <Show when={selectedId() !== null}>
        <LayoutAnimated
          as={Overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedId(null)}
        >
          <LayoutAnimated
            as={DetailCard}
            layout
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            <DetailImage style={{ "background-image": `url(${images[selectedId()!]})` }} />
          </LayoutAnimated>
        </LayoutAnimated>
      </Show>
    </div>
  );
};

// =============================================================================
// 3. Staggered List Entry
// =============================================================================

const StaggerContainer = styled("div")`
  background: #1a1a1a;
  padding: 2rem;
  border-radius: 16px;
  color: white;
  max-width: 400px;
  margin-bottom: 2rem;
`;

const StaggerItem = styled("div")`
  background: rgba(255,255,255,0.1);
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Avatar = styled("div")`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b6b, #feca57);
`;

const StaggerExample = () => {
  const [show, setShow] = createSignal(false);

  return (
    <div style={{ "margin-bottom": "3rem" }}>
      <h3>Staggered Entry</h3>
      <Button onClick={() => setShow(!show())}>
        {show() ? "Hide" : "Show"} List
      </Button>

      <div style={{ "margin-top": "1rem", "min-height": "300px" }}>
        <Show when={show()}>
          <StaggerContainer>
            <h4 style={{ "margin-bottom": "1.5rem" }}>Team Members</h4>
            <For each={[1, 2, 3, 4]}>
              {(i) => (
                <StaggerItem
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    transition: { 
                      delay: i * 0.1, // Stagger delay
                      stiffness: 200,
                      damping: 20
                    }
                  }}
                  initial={{ opacity: 0, x: -50 }}
                >
                  <Avatar />
                  <div>
                    <div style={{ "font-weight": "bold" }}>Member {i}</div>
                    <div style={{ "font-size": "0.8em", opacity: 0.7 }}>Role Description</div>
                  </div>
                </StaggerItem>
              )}
            </For>
          </StaggerContainer>
        </Show>
      </div>
    </div>
  );
};

// =============================================================================
// 4. Modal/Dialog Transition
// =============================================================================

const ModalBackdrop = styled("div")`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled("div")`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.2);
`;

const ModalExample = () => {
  const [isOpen, setIsOpen] = createSignal(false);

  return (
    <div style={{ "margin-bottom": "3rem" }}>
      <h3>Modal Transition</h3>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>

      <Show when={isOpen()}>
        <ModalBackdrop
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
        >
          <ModalContent
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            <h2 style={{ "margin-top": 0 }}>Beautiful Modal</h2>
            <p>
              This modal enters with a spring animation and exits smoothly.
              The backdrop fades in/out independently.
            </p>
            <div style={{ "margin-top": "2rem", "text-align": "right" }}>
              <Button onClick={() => setIsOpen(false)} style={{ background: "#eee", color: "#333" }}>
                Cancel
              </Button>
              <Button onClick={() => setIsOpen(false)}>
                Confirm
              </Button>
            </div>
          </ModalContent>
        </ModalBackdrop>
      </Show>
    </div>
  );
};

// =============================================================================
// 5. Tabs with Sliding Background
// =============================================================================

const TabsContainer = styled("div")`
  background: #f0f0f0;
  padding: 0.5rem;
  border-radius: 12px;
  display: inline-flex;
  position: relative;
  margin-bottom: 2rem;
`;

const TabButton = styled("button")`
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 600;
  color: #666;
  position: relative;
  z-index: 2;
  transition: color 0.2s;

  &[data-active="true"] {
    color: #000;
  }
`;

const ActiveIndicator = styled("div")`
  position: absolute;
  top: 0.5rem;
  bottom: 0.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 1;
`;

const TabsExample = () => {
  const [activeTab, setActiveTab] = createSignal(0);
  const tabs = ["Account", "Settings", "Notifications", "Billing"];

  // Calculate position based on active index (simplified for demo)
  // In a real app, you'd measure the elements
  const getIndicatorStyle = () => {
    const width = 100 / tabs.length;
    const left = activeTab() * width;
    return {
      width: `${width}%`,
      left: `${left}%`
    };
  };

  return (
    <div>
      <h3>Sliding Tabs</h3>
      <TabsContainer style={{ width: "100%", "max-width": "600px", display: "flex" }}>
        <LayoutAnimated
          as={ActiveIndicator}
          layout
          style={{
            width: `${100 / tabs.length}%`,
            left: `${activeTab() * (100 / tabs.length)}%`
          }}
          transition={{ stiffness: 400, damping: 30 }}
        />
        
        <For each={tabs}>
          {(tab, index) => (
            <TabButton
              data-active={activeTab() === index()}
              onClick={() => setActiveTab(index())}
              style={{ flex: 1 }}
            >
              {tab}
            </TabButton>
          )}
        </For>
      </TabsContainer>

      <div style={{ 
        background: "#f8f9fa", 
        padding: "2rem", 
        "border-radius": "12px",
        "min-height": "200px"
      }}>
        <LayoutAnimated
          key={activeTab()}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <h4>{tabs[activeTab()]} Content</h4>
          <p>This is the content for the {tabs[activeTab()]} tab.</p>
        </LayoutAnimated>
      </div>
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export default function RealWorldPatterns() {
  return (
    <div style={{ padding: "2rem", "max-width": "1200px", margin: "0 auto" }}>
      <h1>Real-World Patterns</h1>
      <p style={{ "margin-bottom": "3rem", "font-size": "1.1em", color: "#666" }}>
        Collection of common UI patterns implemented with solid-styles animations.
      </p>

      <div style={{ display: "grid", gap: "4rem" }}>
        <TodoListExample />
        <SharedLayoutExample />
        <StaggerExample />
        <ModalExample />
        <TabsExample />
      </div>
    </div>
  );
}
