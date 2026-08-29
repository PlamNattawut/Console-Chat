import {
    createCliRenderer,
    CliRenderer,
    BoxRenderable,
    ScrollBoxRenderable,
    TextRenderable,
    InputRenderable,
    InputRenderableEvents
} from "@opentui/core";

export class TerminalUI {
    private messages: string[] = [];

    private constructor(
        private readonly renderer: CliRenderer,
        private readonly rootBox: BoxRenderable,
        private readonly scrollBox: ScrollBoxRenderable,
        private readonly chatText: TextRenderable,
        private readonly inputBox: BoxRenderable,
        private readonly input: InputRenderable
    ) {}

    static async create(): Promise<TerminalUI> {
        const renderer = await createCliRenderer({
            exitOnCtrlC: true
        });

        const rootBox = new BoxRenderable(renderer, {
            width: "100%",
            height: "100%",
            border: true,
            title: " 💬 Terminal Chat ",
            titleAlignment: "center"
        });

        const scrollBox = new ScrollBoxRenderable(renderer, {
            width: "100%",
            height: "88%",
            border: false,
            stickyScroll: true
        });

        const chatText = new TextRenderable(renderer, {
            content: ""
        });

        scrollBox.add(chatText);
        rootBox.add(scrollBox);

        const inputBox = new BoxRenderable(renderer, {
            width: "100%",
            height: 3,
            border: true,
            title: " Username "
        });

        const input = new InputRenderable(renderer, {
            placeholder: "Enter your username..."
        });

        inputBox.add(input);
        rootBox.add(inputBox);

        renderer.root.add(rootBox);
        input.focus();

        return new TerminalUI(
            renderer,
            rootBox,
            scrollBox,
            chatText,
            inputBox,
            input
        );
    }

    addMessage(message: string): void {
        this.messages.push(message);
        this.chatText.content = this.messages.join("\n");
        this.scrollBox.scrollTo({ x: 0, y: 999999 });
        this.renderer.requestRender();
    }

    clear(): void {
        this.messages = [];
        this.chatText.content = "";
        this.scrollBox.scrollTo({ x: 0, y: 0 });
        this.renderer.requestRender();
    }

    setPlaceholder(placeholder: string): void {
        this.input.placeholder = placeholder;
        this.renderer.requestRender();
    }

    setInputTitle(title: string): void {
        this.inputBox.title = title;
        this.renderer.requestRender();
    }

    onSubmit(callback: (value: string) => void): void {
        this.input.on(InputRenderableEvents.ENTER, (value: string) => {
            const trimmed = value.trim();
            this.input.value = "";
            this.input.focus();
            callback(trimmed);
            this.renderer.requestRender();
        });
    }

    destroy(): void {
        this.renderer.destroy();
    }
}