/**
 * Animation System Showcase
 *
 * A modern, SaaS-style showcase of the animation capabilities
 * designed to demonstrate the power and flexibility of the animation system.
 */

import { createSignal, onMount, onCleanup, createEffect, For, Show } from "solid-js";

import animated from "./animatedStyled";
import { runAnimationDiagnostics } from "./diagnostics";
import { styled } from "../src";

// Spring physics presets for different animation feels
const springPresets = {
  responsive: {
    stiffness: 170,
    damping: 26,
  },
  elastic: {
    stiffness: 150,
    damping: 15,
  },
  bounce: {
    stiffness: 180,
    damping: 8,
  },
  smooth: {
    stiffness: 120,
    damping: 24,
  },
  gentle: {
    stiffness: 100,
    damping: 20,
  },
  pop: {
    stiffness: 200,
    damping: 18,
  },
  wobbly: {
    stiffness: 300,
    damping: 10,
  },
  snappy: {
    stiffness: 220,
    damping: 30,
  },
  subtle: {
    stiffness: 120,
    damping: 30,
  },
};

// Enable animation diagnostics
onMount(() => {
  runAnimationDiagnostics();
});

// ==============================
// Styled Components
// ==============================

// Modern app-like container
const AppContainer = styled("div")`
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  color: #333;
  background: #fafafa;
  min-height: 100vh;
  line-height: 1.6;
`;

// Hero section with full-width design
const Hero = styled("div")`
  min-height: 85vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
`;

const AnimatedHero = animated(Hero);

// Heading with modern typography
const Heading = styled("h1")`
  font-size: 4rem;
  font-weight: 800;
  margin: 0;
  text-align: center;
  position: relative;
  z-index: 2;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const AnimatedHeading = animated(Heading);

// Subheading with lighter weight
const Subheading = styled("h2")`
  font-size: 1.8rem;
  font-weight: 400;
  margin: 1.5rem 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  max-width: 700px;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    font-size: 1.4rem;
    padding: 0 20px;
  }
`;

const AnimatedSubheading = animated(Subheading);

// Content section with card-like design
const Section = styled("section")`
  padding: 100px 0;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;

  @media (max-width: 1240px) {
    padding: 80px 20px;
  }
`;

// Section header
const SectionHeader = styled("div")`
  margin-bottom: 60px;
  text-align: center;
`;

// Section title
const SectionTitle = styled("h2")`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 15px;
  color: #2c3e50;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const AnimatedSectionTitle = animated(SectionTitle);

// Section description
const SectionDescription = styled("p")`
  font-size: 1.2rem;
  color: #7f8c8d;
  max-width: 700px;
  margin: 0 auto;
`;

// Card component for showcasing animations
const Card = styled("div")`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  margin: 0 auto 30px auto;
  max-width: 350px;
  height: 250px;
  cursor: pointer;
`;

const AnimatedCard = animated(Card);

// Modern button with hover state
const Button = styled("button")`
  background: #3498db;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin: 0 auto;
  display: block;
  position: relative;
  overflow: hidden;
`;

const AnimatedButton = animated(Button);

// Mobile device mockup
const PhoneMockup = styled("div")`
  width: 280px;
  height: 580px;
  background: white;
  border-radius: 36px;
  position: relative;
  margin: 0 auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  border: 10px solid #333;

  &:before {
    content: "";
    width: 150px;
    height: 30px;
    background: #333;
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    border-bottom-left-radius: 17px;
    border-bottom-right-radius: 17px;
    z-index: 2;
  }
`;

const AnimatedPhoneMockup = animated(PhoneMockup);

// Phone screen
const PhoneScreen = styled("div")`
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  position: relative;
  overflow: hidden;
`;

// Notification toast
const Toast = styled("div")`
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  width: 90%;
  margin: 10px auto;

  .icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #3498db;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    color: white;
    font-weight: bold;
  }

  .content {
    flex: 1;

    .title {
      font-weight: bold;
      margin-bottom: 4px;
    }

    .message {
      font-size: 14px;
      color: #666;
    }
  }
`;

const AnimatedToast = animated(Toast);

// App card for mobile app design
const AppIcon = styled("div")`
  width: 60px;
  height: 60px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 24px;
  margin: 12px;
`;

const AnimatedAppIcon = animated(AppIcon);

// Grid container
const Grid = styled("div")`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// E-commerce product card
const ProductCard = styled("div")`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);

  .image {
    height: 220px;
    background: #f9f9f9;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .details {
    padding: 20px;
  }

  .name {
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 8px;
  }

  .price {
    color: #e74c3c;
    font-weight: bold;
    margin-bottom: 16px;
  }
`;

const AnimatedProductCard = animated(ProductCard);

// Email subscription form
const SubscribeForm = styled("div")`
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Input = styled("input")`
  width: 100%;
  padding: 16px;
  border: 2px solid #ddd;
  border-radius: 12px;
  font-size: 16px;
  margin-bottom: 20px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
  }
`;

const AnimatedInput = animated(Input);

// Feature list item
const FeatureItem = styled("div")`
  display: flex;
  align-items: center;
  margin-bottom: 20px;

  .icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20px;
    flex-shrink: 0;
  }

  .content {
    flex: 1;

    h3 {
      margin: 0 0 8px 0;
      font-size: 1.1rem;
    }

    p {
      margin: 0;
      color: #666;
    }
  }
`;

const AnimatedFeatureItem = animated(FeatureItem);

// Footer
const Footer = styled("footer")`
  background: #2c3e50;
  color: white;
  padding: 60px 0;
  text-align: center;
`;

// Main showcase component
export function AnimationDebugExample() {
  // State variables
  const [heroGradientPhase, setHeroGradientPhase] = createSignal(0);
  const [hoverStates, setHoverStates] = createSignal<Record<string, boolean>>({});
  const [showElements, setShowElements] = createSignal(false);
  const [showNotification, setShowNotification] = createSignal(false);
  const [expandedCards, setExpandedCards] = createSignal<Record<string, boolean>>({});
  const [viewportSections, setViewportSections] = createSignal<Record<string, boolean>>({});

  // Products for e-commerce section
  const products = [
    { id: "p1", name: "Wireless Headphones", price: "$129.99", color: "#3498db" },
    { id: "p2", name: "Smart Watch", price: "$249.99", color: "#9b59b6" },
    { id: "p3", name: "Portable Speaker", price: "$89.99", color: "#2ecc71" },
  ];

  // Mobile app icons
  const appIcons = [
    { id: "app1", label: "A", color: "#3498db" },
    { id: "app2", label: "B", color: "#e74c3c" },
    { id: "app3", label: "C", color: "#2ecc71" },
    { id: "app4", label: "D", color: "#f39c12" },
    { id: "app5", label: "E", color: "#9b59b6" },
    { id: "app6", label: "F", color: "#1abc9c" },
  ];

  // Features for feature list
  const features = [
    {
      id: "f1",
      title: "Responsive Spring Physics",
      description: "Animations respond naturally to user interactions with realistic physics",
    },
    {
      id: "f2",
      title: "Color & Gradient Animations",
      description: "Smooth transitions between colors and complex gradients",
    },
    {
      id: "f3",
      title: "Viewport Animations",
      description: "Elements animate as they enter the viewport during scrolling",
    },
  ];

  // Helper function to set hover state
  const setHover = (id: string, state: boolean) => {
    setHoverStates((prev) => ({ ...prev, [id]: state }));
  };

  // Helper function to toggle card expansion
  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Continuously changing gradient for hero section
  createEffect(() => {
    const interval = setInterval(() => {
      setHeroGradientPhase((prev) => (prev + 0.005) % 1);
    }, 100);

    return () => clearInterval(interval);
  });

  // Notification timer
  createEffect(() => {
    if (showNotification()) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  });

  // Simulate viewport animations by revealing sections after mounting
  // This is a simplified simulation of scroll-triggered animations that works without window
  createEffect(() => {
    const revealSections = () => {
      setShowElements(true);

      // Simulate progressive reveal of sections
      setTimeout(() => setViewportSections((prev) => ({ ...prev, section1: true })), 300);
      setTimeout(() => setViewportSections((prev) => ({ ...prev, section2: true })), 600);
      setTimeout(() => setViewportSections((prev) => ({ ...prev, section3: true })), 900);
      setTimeout(() => setViewportSections((prev) => ({ ...prev, section4: true })), 1200);
      setTimeout(() => setViewportSections((prev) => ({ ...prev, section5: true })), 1500);
    };

    // Delayed revealing of sections (simulating scroll)
    setTimeout(revealSections, 500);
  });

  // Set up initial state
  onMount(() => {
    // Trigger initial notification after 2 seconds
    setTimeout(() => {
      setShowNotification(true);
    }, 2000);
  });

  // Calculate current gradient for hero based on phase
  const calculateHeroGradient = () => {
    const phase = heroGradientPhase();
    const gradients = [
      "linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)",
      "linear-gradient(135deg, #43cea2 0%, #185a9d 100%)",
      "linear-gradient(135deg, #ff512f 0%, #dd2476 100%)",
      "linear-gradient(135deg, #4776E6 0%, #8E54E9 100%)",
    ];

    // Calculate which two gradients to interpolate between
    const gradientCount = gradients.length;
    const gradientIndex = Math.floor(phase * gradientCount);
    const nextGradientIndex = (gradientIndex + 1) % gradientCount;

    return {
      from: { backgroundImage: gradients[gradientIndex] },
      to: { backgroundImage: gradients[nextGradientIndex] },
    };
  };

  const heroGradient = calculateHeroGradient();

  return (
    <AppContainer>
      {/* Hero Section with auto-animating gradient */}
      <AnimatedHero
        animate={{
          backgroundImage: heroGradient.from.backgroundImage,
          to: { backgroundImage: heroGradient.to.backgroundImage },
          ...springPresets.gentle,
        }}
      >
        <AnimatedHeading
          animate={{
            from: { opacity: 0, scale: 0.9, translateY: 30 },
            to: { opacity: 1, scale: 1, translateY: 0 },
            ...springPresets.elastic,
            delay: 300,
          }}
        >
          Spring Animation System
        </AnimatedHeading>

        <AnimatedSubheading
          animate={{
            from: { opacity: 0, translateY: 30 },
            to: { opacity: 1, translateY: 0 },
            ...springPresets.smooth,
            delay: 600,
          }}
        >
          Create fluid, responsive animations with realistic physics
        </AnimatedSubheading>

        <AnimatedButton
          animate={{
            from: {
              opacity: 0,
              scale: 0.9,
              boxShadow: "0 0px 0px rgba(0,0,0,0)",
            },
            to: {
              opacity: 1,
              scale: 1,
              boxShadow: "0 15px 30px rgba(0,0,0,0.3)",
            },
            delay: 900,
            ...springPresets.pop,
          }}
          style={{
            "margin-top": "40px",
            background: "white",
            color: "#333",
            "font-size": "18px",
            padding: "16px 32px",
          }}
          onMouseEnter={() => setHover("heroButton", true)}
          onMouseLeave={() => setHover("heroButton", false)}
          animate:hover={{
            from: { scale: 1, translateY: 0 },
            to: { scale: 1.05, translateY: -5 },
            when: () => hoverStates()["heroButton"],
            reverseOnExit: true,
            ...springPresets.snappy,
          }}
        >
          Explore Examples
        </AnimatedButton>
      </AnimatedHero>

      {/* Hover Animation Section */}
      <Section>
        <SectionHeader>
          <AnimatedSectionTitle
            animate={{
              from: { opacity: 0, translateY: 30 },
              to: {
                opacity: viewportSections().section1 ? 1 : 0,
                translateY: viewportSections().section1 ? 0 : 30,
              },
              ...springPresets.smooth,
            }}
          >
            Hover Interactions
          </AnimatedSectionTitle>
          <SectionDescription>
            Create delightful hover effects that respond naturally to user interaction
          </SectionDescription>
        </SectionHeader>

        <Grid>
          <AnimatedCard
            animate={{
              from: { opacity: 0, translateX: -50 },
              to: {
                opacity: viewportSections().section1 ? 1 : 0,
                translateX: viewportSections().section1 ? 0 : -50,
              },
              delay: 100,
              ...springPresets.smooth,
            }}
            onMouseEnter={() => setHover("card1", true)}
            onMouseLeave={() => setHover("card1", false)}
            animate:hover={{
              from: {
                scale: 1,
                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
              },
              to: {
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              },
              when: () => hoverStates()["card1"],
              reverseOnExit: true,
              ...springPresets.responsive,
            }}
            style={{ background: "#f8f9fa" }}
          >
            <div style={{ "font-size": "24px", "margin-bottom": "16px" }}>Scale & Shadow</div>
            <div style={{ color: "#666" }}>Hover to see the effect</div>
          </AnimatedCard>

          <AnimatedCard
            animate={{
              from: { opacity: 0, translateY: 50 },
              to: {
                opacity: viewportSections().section1 ? 1 : 0,
                translateY: viewportSections().section1 ? 0 : 50,
              },
              delay: 200,
              ...springPresets.smooth,
            }}
            onMouseEnter={() => setHover("card2", true)}
            onMouseLeave={() => setHover("card2", false)}
            animate:hover={{
              from: {
                rotate: 0,
                backgroundColor: "#f8f9fa",
              },
              to: {
                rotate: 5,
                backgroundColor: "#e1f5fe",
              },
              when: () => hoverStates()["card2"],
              reverseOnExit: true,
              ...springPresets.wobbly,
            }}
          >
            <div style={{ "font-size": "24px", "margin-bottom": "16px" }}>Rotate & Color</div>
            <div style={{ color: "#666" }}>Hover to see the effect</div>
          </AnimatedCard>

          <AnimatedCard
            animate={{
              from: { opacity: 0, translateX: 50 },
              to: {
                opacity: viewportSections().section1 ? 1 : 0,
                translateX: viewportSections().section1 ? 0 : 50,
              },
              delay: 300,
              ...springPresets.smooth,
            }}
            onMouseEnter={() => setHover("card3", true)}
            onMouseLeave={() => setHover("card3", false)}
            animate:hover={{
              from: {
                translateY: 0,
                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
              },
              to: {
                translateY: -15,
                boxShadow: "0 30px 60px rgba(0, 0, 0, 0.15)",
              },
              when: () => hoverStates()["card3"],
              reverseOnExit: true,
              ...springPresets.smooth,
            }}
            style={{ background: "#f8f9fa" }}
          >
            <div style={{ "font-size": "24px", "margin-bottom": "16px" }}>Float Effect</div>
            <div style={{ color: "#666" }}>Hover to see the effect</div>
          </AnimatedCard>
        </Grid>
      </Section>

      {/* Click Animation Section */}
      <Section style={{ background: "#f5f9ff", "padding-top": "100px", "padding-bottom": "100px" }}>
        <SectionHeader>
          <AnimatedSectionTitle
            animate={{
              from: { opacity: 0, translateY: 30 },
              to: {
                opacity: viewportSections().section2 ? 1 : 0,
                translateY: viewportSections().section2 ? 0 : 30,
              },
              ...springPresets.smooth,
            }}
          >
            Click Interactions
          </AnimatedSectionTitle>
          <SectionDescription>Create engaging animations that respond to user clicks</SectionDescription>
        </SectionHeader>

        <Grid>
          <AnimatedCard
            animate={{
              from: { opacity: 0, translateY: 50 },
              to: {
                opacity: viewportSections().section2 ? 1 : 0,
                translateY: viewportSections().section2 ? 0 : 50,
              },
              delay: 100,
              ...springPresets.smooth,
            }}
            onClick={() => toggleCard("card1")}
            animate:click={{
              from: {
                height: "250px",
                backgroundImage: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
              },
              to: {
                height: expandedCards()["card1"] ? "350px" : "250px",
                backgroundImage: expandedCards()["card1"]
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
              },
              ...springPresets.elastic,
            }}
          >
            <div
              style={{
                "font-size": "24px",
                "margin-bottom": "16px",
                color: expandedCards()["card1"] ? "white" : "black",
                transition: "color 0.3s",
              }}
            >
              {expandedCards()["card1"] ? "Click to Close" : "Click to Expand"}
            </div>
            <div
              style={{
                color: expandedCards()["card1"] ? "rgba(255,255,255,0.8)" : "#666",
                transition: "color 0.3s",
              }}
            >
              {expandedCards()["card1"]
                ? "This card has expanded with a smooth spring animation, changing both its size and gradient."
                : "Click to see the animation effect"}
            </div>
          </AnimatedCard>

          <AnimatedCard
            animate={{
              from: { opacity: 0, translateY: 50 },
              to: {
                opacity: viewportSections().section2 ? 1 : 0,
                translateY: viewportSections().section2 ? 0 : 50,
              },
              delay: 200,
              ...springPresets.smooth,
            }}
            style={{ background: "#f8f9fa" }}
          >
            <AnimatedButton
              animate={{
                from: { scale: 1 },
                to: { scale: 1 },
                ...springPresets.pop,
              }}
              animate:active={{
                from: {
                  scale: 1,
                  backgroundColor: "#3498db",
                },
                to: {
                  scale: 0.95,
                  backgroundColor: "#2980b9",
                },
                when: "active",
                reverseOnExit: true,
                ...springPresets.snappy,
              }}
              onMouseEnter={() => setHover("button1", true)}
              onMouseLeave={() => setHover("button1", false)}
              animate:hover={{
                from: { translateY: 0 },
                to: { translateY: -3 },
                when: () => hoverStates()["button1"],
                reverseOnExit: true,
                ...springPresets.subtle,
              }}
            >
              Press Me
            </AnimatedButton>
            <div style={{ color: "#666", "margin-top": "20px" }}>Press and hold to see the button animation</div>
          </AnimatedCard>

          <AnimatedCard
            animate={{
              from: { opacity: 0, translateY: 50 },
              to: {
                opacity: viewportSections().section2 ? 1 : 0,
                translateY: viewportSections().section2 ? 0 : 50,
              },
              delay: 300,
              ...springPresets.smooth,
            }}
            onClick={() => toggleCard("card3")}
            animate:click={{
              from: {
                borderRadius: "16px",
                rotate: 0,
              },
              to: {
                borderRadius: expandedCards()["card3"] ? "50%" : "16px",
                rotate: expandedCards()["card3"] ? 180 : 0,
              },
              ...springPresets.bounce,
            }}
            style={{
              background: expandedCards()["card3"] ? "#e74c3c" : "#f8f9fa",
              transition: "background-color 0.5s",
            }}
          >
            <div
              style={{
                "font-size": "24px",
                "margin-bottom": "16px",
                color: expandedCards()["card3"] ? "white" : "black",
                transition: "color 0.3s",
              }}
            >
              {expandedCards()["card3"] ? "Click Again" : "Shape Change"}
            </div>
            <div
              style={{
                color: expandedCards()["card3"] ? "rgba(255,255,255,0.8)" : "#666",
                transition: "color 0.3s",
              }}
            >
              Click to see the effect
            </div>
          </AnimatedCard>
        </Grid>
      </Section>

      {/* Mobile Interactions */}
      <Section>
        <SectionHeader>
          <AnimatedSectionTitle
            animate={{
              from: { opacity: 0, translateY: 30 },
              to: {
                opacity: viewportSections().section3 ? 1 : 0,
                translateY: viewportSections().section3 ? 0 : 30,
              },
              ...springPresets.smooth,
            }}
          >
            Mobile Interactions
          </AnimatedSectionTitle>
          <SectionDescription>Realistic mobile UI animations for a native-app feel</SectionDescription>
        </SectionHeader>

        <div style={{ display: "flex", "justify-content": "center", "flex-wrap": "wrap", gap: "60px" }}>
          <div>
            <AnimatedPhoneMockup
              animate={{
                from: { opacity: 0, translateY: 100, rotate: 5 },
                to: {
                  opacity: viewportSections().section3 ? 1 : 0,
                  translateY: viewportSections().section3 ? 0 : 100,
                  rotate: viewportSections().section3 ? 0 : 5,
                },
                ...springPresets.elastic,
              }}
            >
              <PhoneScreen>
                <div style={{ padding: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      "justify-content": "space-between",
                      "margin-bottom": "30px",
                    }}
                  >
                    <div style={{ "font-weight": "bold" }}>12:30</div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <span>📶</span>
                      <span>🔋</span>
                    </div>
                  </div>

                  <AnimatedButton
                    style={{
                      width: "100%",
                      "margin-bottom": "20px",
                      background: "#3498db",
                    }}
                    onClick={() => setShowNotification(true)}
                  >
                    Show Notification
                  </AnimatedButton>

                  <Show
                    when={showNotification()}
                    children={
                      <div
                        style={{
                          position: "fixed",
                          top: "20px",
                          right: "20px",
                          padding: "16px",
                          background: "linear-gradient(45deg, #667eea 0%, #764ba2 100%)",
                          color: "white",
                          borderRadius: "8px",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          fontSize: "14px",
                          fontWeight: "500",
                          zIndex: 1000,
                          minWidth: "280px",
                          transform: "translateX(0px)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        🎉 Animation completed successfully!
                      </div>
                    }
                  />

                  <div
                    style={{
                      display: "flex",
                      "flex-wrap": "wrap",
                      "justify-content": "space-between",
                      "margin-top": "30px",
                    }}
                  >
                    <For
                      each={appIcons}
                      children={(app: { id: string; label: string; color: string }, index: () => number) => (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "12px",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            transform: `translateY(${index() * 2}px)`,
                          }}
                          onMouseEnter={(e: MouseEvent) => {
                            const target = e.currentTarget as HTMLElement;
                            target.style.backgroundColor = app.color;
                            target.style.color = "#white";
                            target.style.transform = `translateY(${index() * 2 - 4}px) scale(1.02)`;
                          }}
                          onMouseLeave={(e: MouseEvent) => {
                            const target = e.currentTarget as HTMLElement;
                            target.style.backgroundColor = "#f8f9fa";
                            target.style.color = "inherit";
                            target.style.transform = `translateY(${index() * 2}px) scale(1)`;
                          }}
                        >
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              backgroundColor: app.color,
                              borderRadius: "50%",
                              marginRight: "12px",
                            }}
                          />
                          <span style={{ fontWeight: "500" }}>{app.label}</span>
                        </div>
                      )}
                    />
                  </div>
                </div>
              </PhoneScreen>
            </AnimatedPhoneMockup>
          </div>

          <div
            style={{
              "max-width": "400px",
              display: "flex",
              "flex-direction": "column",
              "justify-content": "center",
            }}
          >
            <AnimatedFeatureItem
              animate={{
                from: { opacity: 0, translateX: 50 },
                to: {
                  opacity: viewportSections().section3 ? 1 : 0,
                  translateX: viewportSections().section3 ? 0 : 50,
                },
                delay: 100,
                ...springPresets.smooth,
              }}
            >
              <div
                class="icon"
                style={{ background: "#3498db", color: "white" }}
              >
                🔔
              </div>
              <div class="content">
                <h3>Realistic Notifications</h3>
                <p>Toast notifications with spring physics feel more natural to users</p>
              </div>
            </AnimatedFeatureItem>

            <AnimatedFeatureItem
              animate={{
                from: { opacity: 0, translateX: 50 },
                to: {
                  opacity: viewportSections().section3 ? 1 : 0,
                  translateX: viewportSections().section3 ? 0 : 50,
                },
                delay: 200,
                ...springPresets.smooth,
              }}
            >
              <div
                class="icon"
                style={{ background: "#2ecc71", color: "white" }}
              >
                🔄
              </div>
              <div class="content">
                <h3>Staggered Animations</h3>
                <p>Elements animate in sequence creating a cohesive experience</p>
              </div>
            </AnimatedFeatureItem>

            <AnimatedFeatureItem
              animate={{
                from: { opacity: 0, translateX: 50 },
                to: {
                  opacity: viewportSections().section3 ? 1 : 0,
                  translateX: viewportSections().section3 ? 0 : 50,
                },
                delay: 300,
                ...springPresets.smooth,
              }}
            >
              <div
                class="icon"
                style={{ background: "#9b59b6", color: "white" }}
              >
                👆
              </div>
              <div class="content">
                <h3>Touch Feedback</h3>
                <p>Immediate visual feedback makes interfaces feel responsive</p>
              </div>
            </AnimatedFeatureItem>
          </div>
        </div>
      </Section>

      {/* E-commerce Section */}
      <Section style={{ background: "#f9f9f9", "padding-top": "100px", "padding-bottom": "100px" }}>
        <SectionHeader>
          <AnimatedSectionTitle
            animate={{
              from: { opacity: 0, translateY: 30 },
              to: {
                opacity: viewportSections().section4 ? 1 : 0,
                translateY: viewportSections().section4 ? 0 : 30,
              },
              ...springPresets.smooth,
            }}
          >
            E-commerce Experiences
          </AnimatedSectionTitle>
          <SectionDescription>Enhance product showcases with delightful animations</SectionDescription>
        </SectionHeader>

        <Grid>
          <For
            each={products}
            children={(product: { id: string; name: string; price: string; color: string }, index: () => number) => (
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  border: "1px solid #e1e5e9",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  transform: `translateY(${index() * 4}px)`,
                }}
                onMouseEnter={(e: MouseEvent) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.transform = `translateY(${index() * 4 - 8}px) scale(1.05)`;
                  target.style.boxShadow = "0 12px 40px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e: MouseEvent) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.transform = `translateY(${index() * 4}px) scale(1)`;
                  target.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)";
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "160px",
                    backgroundColor: product.color,
                    borderRadius: "8px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "24px",
                    fontWeight: "bold",
                    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  {product.name.charAt(0)}
                </div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600", color: "#2c3e50" }}>
                  {product.name}
                </h3>
                <p style={{ margin: "0", fontSize: "20px", fontWeight: "bold", color: product.color }}>
                  {product.price}
                </p>
              </div>
            )}
          />
        </Grid>
      </Section>

      {/* Call to Action */}
      <Section style={{ "padding-top": "100px", "padding-bottom": "150px" }}>
        <SectionHeader>
          <AnimatedSectionTitle
            animate={{
              from: { opacity: 0, translateY: 30 },
              to: {
                opacity: viewportSections().section5 ? 1 : 0,
                translateY: viewportSections().section5 ? 0 : 30,
              },
              ...springPresets.smooth,
            }}
          >
            Ready to Get Started?
          </AnimatedSectionTitle>
          <SectionDescription>Add fluid animations to your project in minutes</SectionDescription>
        </SectionHeader>

        <SubscribeForm>
          <AnimatedInput
            placeholder="Enter your email"
            animate={{
              from: { opacity: 0, translateX: -30 },
              to: {
                opacity: viewportSections().section5 ? 1 : 0,
                translateX: viewportSections().section5 ? 0 : -30,
              },
              ...springPresets.smooth,
            }}
            onFocus={() => setHover("subscribeInput", true)}
            onBlur={() => setHover("subscribeInput", false)}
            animate:focus={{
              from: {
                borderColor: "#ddd",
                boxShadow: "0 0 0 0 rgba(52, 152, 219, 0)",
              },
              to: {
                borderColor: "#3498db",
                boxShadow: "0 0 0 4px rgba(52, 152, 219, 0.2)",
              },
              when: () => hoverStates()["subscribeInput"],
              reverseOnExit: true,
              ...springPresets.smooth,
            }}
          />

          <AnimatedButton
            style={{ width: "100%" }}
            animate={{
              from: { opacity: 0, translateX: 30 },
              to: {
                opacity: viewportSections().section5 ? 1 : 0,
                translateX: viewportSections().section5 ? 0 : 30,
              },
              delay: 100,
              ...springPresets.smooth,
            }}
            onMouseEnter={() => setHover("subscribeButton", true)}
            onMouseLeave={() => setHover("subscribeButton", false)}
            animate:hover={{
              from: {
                scale: 1,
                backgroundColor: "#3498db",
              },
              to: {
                scale: 1.02,
                backgroundColor: "#2980b9",
              },
              when: () => hoverStates()["subscribeButton"],
              reverseOnExit: true,
              ...springPresets.subtle,
            }}
          >
            Subscribe for Updates
          </AnimatedButton>
        </SubscribeForm>
      </Section>

      {/* Footer */}
      <Footer>
        <div>Animation System Demo</div>
        <div style={{ "margin-top": "10px", "font-size": "14px", opacity: 0.7 }}>
          A showcase of spring animations for modern interfaces
        </div>
      </Footer>
    </AppContainer>
  );
}

export default AnimationDebugExample;
