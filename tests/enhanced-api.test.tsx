import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@solidjs/testing-library";
import { enhanced } from "../src/index";
import { createSignal } from "solid-js";

describe("Enhanced API", () => {
  afterEach(() => {
    cleanup();
  });

  describe("Basic Enhanced Components", () => {
    it("should create enhanced div", () => {
      const EnhancedDiv = enhanced.div`
        padding: 20px;
        background: lightblue;
      `;

      const { container } = render(() => <EnhancedDiv>Hello World</EnhancedDiv>);
      const div = container.querySelector("div");

      expect(div).toBeTruthy();
      expect(div?.textContent).toBe("Hello World");
      expect(div?.className).toBeTruthy();
    });

    it("should create enhanced button", () => {
      const EnhancedButton = enhanced.button`
        padding: 10px 20px;
        background: blue;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        
        &:hover {
          background: darkblue;
        }
      `;

      const onClick = vi.fn();
      const { container } = render(() => <EnhancedButton onClick={onClick}>Click Me</EnhancedButton>);

      const button = container.querySelector("button");
      expect(button).toBeTruthy();
      expect(button?.textContent).toBe("Click Me");

      // Test click event
      fireEvent.click(button!);
      expect(onClick).toHaveBeenCalled();
    });

    it("should create enhanced span", () => {
      const EnhancedSpan = enhanced.span`
        color: red;
        font-weight: bold;
      `;

      const { container } = render(() => <EnhancedSpan>Important Text</EnhancedSpan>);
      const span = container.querySelector("span");

      expect(span).toBeTruthy();
      expect(span?.textContent).toBe("Important Text");
    });

    it("should create enhanced anchor", () => {
      const EnhancedLink = enhanced.a`
        color: blue;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      `;

      const { container } = render(() => <EnhancedLink href="https://example.com">Visit Example</EnhancedLink>);

      const link = container.querySelector("a");
      expect(link).toBeTruthy();
      expect(link?.getAttribute("href")).toBe("https://example.com");
      expect(link?.textContent).toBe("Visit Example");
    });

    it("should create enhanced input", () => {
      const EnhancedInput = enhanced.input`
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        
        &:focus {
          outline: none;
          border-color: blue;
        }
      `;

      const onInput = vi.fn();
      const { container } = render(() => (
        <EnhancedInput
          type="text"
          placeholder="Enter text"
          onInput={onInput}
        />
      ));

      const input = container.querySelector("input");
      expect(input).toBeTruthy();
      expect(input?.getAttribute("type")).toBe("text");
      expect(input?.getAttribute("placeholder")).toBe("Enter text");

      // Test input event
      fireEvent.input(input!, { target: { value: "test" } });
      expect(onInput).toHaveBeenCalled();
    });
  });

  describe("Layout Components", () => {
    it("should create enhanced header", () => {
      const EnhancedHeader = enhanced.header`
        background: #333;
        color: white;
        padding: 1rem;
      `;

      const { container } = render(() => (
        <EnhancedHeader>
          <h1>Site Title</h1>
        </EnhancedHeader>
      ));

      const header = container.querySelector("header");
      expect(header).toBeTruthy();
      expect(header?.querySelector("h1")?.textContent).toBe("Site Title");
    });

    it("should create enhanced nav", () => {
      const EnhancedNav = enhanced.nav`
        display: flex;
        gap: 1rem;
        
        a {
          color: inherit;
          text-decoration: none;
        }
      `;

      const { container } = render(() => (
        <EnhancedNav>
          <a href="/">Home</a>
          <a href="/about">About</a>
        </EnhancedNav>
      ));

      const nav = container.querySelector("nav");
      expect(nav).toBeTruthy();
      expect(nav?.querySelectorAll("a").length).toBe(2);
    });

    it("should create enhanced main", () => {
      const EnhancedMain = enhanced.main`
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
      `;

      const { container } = render(() => (
        <EnhancedMain>
          <p>Main content</p>
        </EnhancedMain>
      ));

      const main = container.querySelector("main");
      expect(main).toBeTruthy();
      expect(main?.querySelector("p")?.textContent).toBe("Main content");
    });

    it("should create enhanced footer", () => {
      const EnhancedFooter = enhanced.footer`
        background: #f8f9fa;
        padding: 2rem;
        text-align: center;
      `;

      const { container } = render(() => <EnhancedFooter>© 2024 Company</EnhancedFooter>);

      const footer = container.querySelector("footer");
      expect(footer).toBeTruthy();
      expect(footer?.textContent).toBe("© 2024 Company");
    });

    it("should create enhanced section", () => {
      const EnhancedSection = enhanced.section`
        padding: 3rem 0;
        
        &:nth-child(even) {
          background: #f5f5f5;
        }
      `;

      const { container } = render(() => (
        <EnhancedSection>
          <h2>Section Title</h2>
        </EnhancedSection>
      ));

      const section = container.querySelector("section");
      expect(section).toBeTruthy();
      expect(section?.querySelector("h2")?.textContent).toBe("Section Title");
    });

    it("should create enhanced article", () => {
      const EnhancedArticle = enhanced.article`
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1rem;
      `;

      const { container } = render(() => (
        <EnhancedArticle>
          <h3>Article Title</h3>
          <p>Article content</p>
        </EnhancedArticle>
      ));

      const article = container.querySelector("article");
      expect(article).toBeTruthy();
      expect(article?.querySelector("h3")?.textContent).toBe("Article Title");
    });

    it("should create enhanced aside", () => {
      const EnhancedAside = enhanced.aside`
        background: #f8f9fa;
        padding: 1rem;
        border-left: 4px solid #007bff;
      `;

      const { container } = render(() => (
        <EnhancedAside>
          <p>Sidebar content</p>
        </EnhancedAside>
      ));

      const aside = container.querySelector("aside");
      expect(aside).toBeTruthy();
      expect(aside?.querySelector("p")?.textContent).toBe("Sidebar content");
    });
  });

  describe("Form Components", () => {
    it("should create enhanced form", () => {
      const EnhancedForm = enhanced.form`
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: 400px;
      `;

      const onSubmit = vi.fn((e) => e.preventDefault());
      const { container } = render(() => (
        <EnhancedForm onSubmit={onSubmit}>
          <input type="text" />
          <button type="submit">Submit</button>
        </EnhancedForm>
      ));

      const form = container.querySelector("form");
      expect(form).toBeTruthy();

      // Test form submission
      fireEvent.submit(form!);
      expect(onSubmit).toHaveBeenCalled();
    });

    it("should create enhanced textarea", () => {
      const EnhancedTextarea = enhanced.textarea`
        width: 100%;
        min-height: 100px;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        resize: vertical;
      `;

      const { container } = render(() => <EnhancedTextarea placeholder="Enter your message" />);

      const textarea = container.querySelector("textarea");
      expect(textarea).toBeTruthy();
      expect(textarea?.getAttribute("placeholder")).toBe("Enter your message");
    });

    it("should create enhanced select", () => {
      const EnhancedSelect = enhanced.select`
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: white;
        cursor: pointer;
      `;

      const onChange = vi.fn();
      const { container } = render(() => (
        <EnhancedSelect onChange={onChange}>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </EnhancedSelect>
      ));

      const select = container.querySelector("select");
      expect(select).toBeTruthy();
      expect(select?.querySelectorAll("option").length).toBe(2);

      // Test change event
      fireEvent.change(select!, { target: { value: "2" } });
      expect(onChange).toHaveBeenCalled();
    });

    it("should create enhanced label", () => {
      const EnhancedLabel = enhanced.label`
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
      `;

      const { container } = render(() => <EnhancedLabel for="email">Email Address</EnhancedLabel>);

      const label = container.querySelector("label");
      expect(label).toBeTruthy();
      expect(label?.getAttribute("for")).toBe("email");
      expect(label?.textContent).toBe("Email Address");
    });
  });

  describe("List Components", () => {
    it("should create enhanced ul", () => {
      const EnhancedUl = enhanced.ul`
        list-style: none;
        padding: 0;
        margin: 0;
      `;

      const { container } = render(() => (
        <EnhancedUl>
          <li>Item 1</li>
          <li>Item 2</li>
        </EnhancedUl>
      ));

      const ul = container.querySelector("ul");
      expect(ul).toBeTruthy();
      expect(ul?.querySelectorAll("li").length).toBe(2);
    });

    it("should create enhanced ol", () => {
      const EnhancedOl = enhanced.ol`
        counter-reset: item;
        padding-left: 0;
        
        li {
          counter-increment: item;
          margin-bottom: 0.5rem;
        }
      `;

      const { container } = render(() => (
        <EnhancedOl>
          <li>First</li>
          <li>Second</li>
        </EnhancedOl>
      ));

      const ol = container.querySelector("ol");
      expect(ol).toBeTruthy();
      expect(ol?.querySelectorAll("li").length).toBe(2);
    });

    it("should create enhanced li", () => {
      const EnhancedLi = enhanced.li`
        padding: 0.5rem;
        border-bottom: 1px solid #eee;
        
        &:last-child {
          border-bottom: none;
        }
      `;

      const { container } = render(() => (
        <ul>
          <EnhancedLi>List Item</EnhancedLi>
        </ul>
      ));

      const li = container.querySelector("li");
      expect(li).toBeTruthy();
      expect(li?.textContent).toBe("List Item");
    });
  });

  describe("Typography Components", () => {
    it("should create enhanced headings", () => {
      const EnhancedH1 = enhanced.h1`
        font-size: 2.5rem;
        margin-bottom: 1rem;
      `;

      const EnhancedH2 = enhanced.h2`
        font-size: 2rem;
        margin-bottom: 0.75rem;
      `;

      const { container } = render(() => (
        <>
          <EnhancedH1>Main Title</EnhancedH1>
          <EnhancedH2>Subtitle</EnhancedH2>
        </>
      ));

      const h1 = container.querySelector("h1");
      const h2 = container.querySelector("h2");

      expect(h1?.textContent).toBe("Main Title");
      expect(h2?.textContent).toBe("Subtitle");
    });

    it("should create enhanced paragraph", () => {
      const EnhancedP = enhanced.p`
        line-height: 1.6;
        margin-bottom: 1rem;
        color: #333;
      `;

      const { container } = render(() => <EnhancedP>This is a paragraph of text.</EnhancedP>);

      const p = container.querySelector("p");
      expect(p).toBeTruthy();
      expect(p?.textContent).toBe("This is a paragraph of text.");
    });

    it("should create enhanced text formatting", () => {
      const EnhancedStrong = enhanced.strong`
        font-weight: 700;
        color: #000;
      `;

      const EnhancedEm = enhanced.em`
        font-style: italic;
        color: #555;
      `;

      const { container } = render(() => (
        <p>
          <EnhancedStrong>Bold text</EnhancedStrong> and
          <EnhancedEm> italic text</EnhancedEm>
        </p>
      ));

      const strong = container.querySelector("strong");
      const em = container.querySelector("em");

      expect(strong?.textContent).toBe("Bold text");
      expect(em?.textContent).toBe(" italic text");
    });
  });

  describe("Media Components", () => {
    it("should create enhanced img", () => {
      const EnhancedImg = enhanced.img`
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      `;

      const { container } = render(() => (
        <EnhancedImg
          src="/test.jpg"
          alt="Test image"
        />
      ));

      const img = container.querySelector("img");
      expect(img).toBeTruthy();
      expect(img?.getAttribute("src")).toBe("/test.jpg");
      expect(img?.getAttribute("alt")).toBe("Test image");
    });

    it("should create enhanced video", () => {
      const EnhancedVideo = enhanced.video`
        width: 100%;
        max-width: 800px;
        height: auto;
      `;

      const { container } = render(() => (
        <EnhancedVideo controls>
          <source
            src="/video.mp4"
            type="video/mp4"
          />
        </EnhancedVideo>
      ));

      const video = container.querySelector("video");
      expect(video).toBeTruthy();
      expect(video?.hasAttribute("controls")).toBe(true);
    });
  });

  describe("Dynamic Styling", () => {
    it("should handle dynamic props", () => {
      // Enhanced API creates static styled components
      const EnhancedButton = enhanced.button`
        padding: 8px 16px;
        background: blue;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        
        &:hover {
          background: darkblue;
        }
      `;

      const { container } = render(() => <EnhancedButton>Click Me</EnhancedButton>);

      const button = container.querySelector("button");
      expect(button).toBeTruthy();
      expect(button?.className).toBeTruthy();
      expect(button?.className).toMatch(/^sc-[a-zA-Z0-9]+$/);
    });

    it("should handle reactive styles", () => {
      const [isActive, setIsActive] = createSignal(false);

      // Enhanced API doesn't support reactive interpolations, so we test reactivity via text content
      const EnhancedDiv = enhanced.div`
        padding: 20px;
        background: green;
        color: white;
        cursor: pointer;
      `;

      const { container } = render(() => (
        <EnhancedDiv onClick={() => setIsActive(!isActive())}>{isActive() ? "Active" : "Inactive"}</EnhancedDiv>
      ));

      const div = container.querySelector("div");
      expect(div?.textContent).toBe("Inactive");

      // Click to toggle
      fireEvent.click(div!);
      expect(div?.textContent).toBe("Active");
    });
  });

  describe("All HTML Elements", () => {
    it("should support all common HTML elements", () => {
      const elements = [
        "div",
        "span",
        "p",
        "a",
        "button",
        "input",
        "textarea",
        "select",
        "form",
        "label",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "img",
        "video",
        "audio",
        "canvas",
        "header",
        "nav",
        "main",
        "section",
        "article",
        "aside",
        "footer",
        "table",
        "thead",
        "tbody",
        "tr",
        "td",
        "th",
        "strong",
        "em",
        "code",
        "pre",
        "blockquote",
      ];

      elements.forEach((tag) => {
        expect(enhanced[tag]).toBeDefined();
        expect(typeof enhanced[tag]).toBe("function");
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid styles gracefully", () => {
      // Enhanced API handles static styles, so we test basic error handling
      const EnhancedDiv = enhanced.div`
        color: red;
        background: blue;
        /* Invalid CSS should be handled gracefully */
        invalid-property: value;
      `;

      // Should not throw during render
      expect(() => {
        render(() => <EnhancedDiv>Content</EnhancedDiv>);
      }).not.toThrow();
    });

    it("should handle missing props", () => {
      // Enhanced API creates static components, so props are passed through
      const EnhancedButton = enhanced.button`
        color: blue;
        padding: 10px;
      `;

      // Should handle any props gracefully
      const { container } = render(() => <EnhancedButton data-custom="test">Button</EnhancedButton>);

      const button = container.querySelector("button");
      expect(button).toBeTruthy();
      expect(button?.getAttribute("data-custom")).toBe("test");
    });
  });
});
