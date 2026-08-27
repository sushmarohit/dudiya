"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  description: string;
  tryAgainLabel: string;
}

interface State {
  hasError: boolean;
}

class ErrorBoundaryInner extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center"
          role="alert"
        >
          <h2 className="text-lg font-semibold text-red-900">
            {this.props.fallbackTitle}
          </h2>
          <p className="mt-2 text-sm text-red-700">
            {this.props.description}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => this.setState({ hasError: false })}
          >
            {this.props.tryAgainLabel}
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary({
  children,
  fallbackTitle,
}: Omit<Props, "description" | "tryAgainLabel">) {
  const tc = useTranslations("common");
  const te = useTranslations("errors");

  return (
    <ErrorBoundaryInner
      fallbackTitle={fallbackTitle ?? tc("somethingWrong")}
      description={te("GENERIC")}
      tryAgainLabel={tc("tryAgain")}
    >
      {children}
    </ErrorBoundaryInner>
  );
}
