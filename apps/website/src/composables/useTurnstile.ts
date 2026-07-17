import { ref, watch } from "vue";
import { useColorMode } from "@vueuse/core";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: (error: any) => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

export function useTurnstile(
  sitekey: string = (import.meta.env.VITE_TURNSTILE_SITEKEY as string) ||
    "1x00000000000000000000AA",
) {
  const colorMode = useColorMode();
  const turnstileContainer = ref<HTMLElement | null>(null);
  const turnstileToken = ref("");
  let turnstileWidgetId: string | null = null;

  const getTheme = (): "light" | "dark" | "auto" => {
    if (colorMode.value === "dark") return "dark";
    if (colorMode.value === "light") return "light";
    return "auto";
  };

  const render = () => {
    if (turnstileContainer.value && window.turnstile) {
      if (turnstileWidgetId !== null) {
        try {
          window.turnstile.remove(turnstileWidgetId);
        } catch {
          // widget container may have been removed from DOM
        }
        turnstileWidgetId = null;
        turnstileToken.value = "";
      }
      try {
        turnstileWidgetId = window.turnstile.render(turnstileContainer.value, {
          sitekey,
          callback: (token: string) => {
            turnstileToken.value = token;
          },
          theme: getTheme(),
        });
      } catch (error) {
        console.error("Failed to render Cloudflare Turnstile:", error);
      }
    }
  };

  // Re-render widget when app color mode changes
  watch(colorMode, () => {
    if (turnstileWidgetId !== null) {
      render();
    }
  });

  const reset = () => {
    if (turnstileWidgetId !== null && window.turnstile) {
      window.turnstile.reset(turnstileWidgetId);
      turnstileToken.value = "";
    }
  };

  const remove = () => {
    if (turnstileWidgetId !== null && window.turnstile) {
      window.turnstile.remove(turnstileWidgetId);
      turnstileWidgetId = null;
    }
    turnstileToken.value = "";
  };

  return {
    turnstileContainer,
    turnstileToken,
    render,
    reset,
    remove,
  };
}
