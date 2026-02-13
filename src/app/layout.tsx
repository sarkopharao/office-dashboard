import "@once-ui-system/core/css/styles.css";
import "@once-ui-system/core/css/tokens.css";
import "@/resources/custom.css";

import classNames from "classnames";

import { meta, fonts, style, dataStyle } from "@/resources/once-ui.config";
import { Flex, Column } from "@once-ui-system/core";
import { Providers } from "@/components/Providers";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: meta.home.title,
  description: meta.home.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Flex
      suppressHydrationWarning
      as="html"
      lang="de"
      fillWidth
      className={classNames(
        fonts.heading.variable,
        fonts.body.variable,
        fonts.label.variable,
        fonts.code.variable,
      )}
    >
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var root = document.documentElement;
                  var config = ${JSON.stringify({
                    theme: style.theme,
                    brand: style.brand,
                    accent: style.accent,
                    neutral: style.neutral,
                    solid: style.solid,
                    "solid-style": style.solidStyle,
                    border: style.border,
                    surface: style.surface,
                    transition: style.transition,
                    scaling: style.scaling,
                    "viz-style": dataStyle.variant,
                  })};
                  Object.entries(config).forEach(function(entry) {
                    root.setAttribute('data-' + entry[0], entry[1]);
                  });
                  root.setAttribute('data-theme', 'light');
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              })();
            `,
          }}
        />
      </head>
      <Providers>
        <Column as="body" background="page" fillWidth margin="0" padding="0">
          {children}
        </Column>
      </Providers>
    </Flex>
  );
}
