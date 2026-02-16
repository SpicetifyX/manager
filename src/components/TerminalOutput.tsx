import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

interface TerminalOutputProps {
  initialText?: string;
}

export interface TerminalOutputRef {
  write: (text: string) => void;
  clear: () => void;
}

const TerminalOutput = forwardRef<TerminalOutputRef, TerminalOutputProps>(({ initialText }, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const term = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);

  const initializeTerminal = useCallback(() => {
    if (terminalRef.current && !term.current) {
      term.current = new Terminal({
        cursorBlink: false,
        convertEol: true,
        theme: {
          background: "#0c0e11",
          foreground: "#abaeb3",
        },
        fontSize: 11,
        disableStdin: true,
      });

      fitAddon.current = new FitAddon();
      term.current.loadAddon(fitAddon.current);

      term.current.open(terminalRef.current);
      requestAnimationFrame(() => {
        if (fitAddon.current) {
          fitAddon.current.fit();
        }
      });

      if (initialText) {
        term.current.write(initialText);
      }
    }
  }, [initialText]);

  useEffect(() => {
    initializeTerminal();

    const resizeHandler = () => {
      if (terminalRef.current && terminalRef.current.clientWidth > 0 && terminalRef.current.clientHeight > 0) {
        fitAddon.current?.fit();
      }
    };

    window.addEventListener("resize", resizeHandler);

    return () => {
      window.removeEventListener("resize", resizeHandler);
      term.current?.dispose();
      term.current = null;
      fitAddon.current = null;
    };
  }, [initializeTerminal]);

  useImperativeHandle(ref, () => ({
    write: (text: string) => {
      term.current?.write(text);
    },
    clear: () => {
      term.current?.clear();
    },
  }));

  return <div ref={terminalRef} style={{ width: "100%", height: "100%" }} />;
});

TerminalOutput.displayName = "TerminalOutput";

export default TerminalOutput;
