import type { Metadata, Viewport } from "next";
import { ServiceWorker } from "@/components/pwa/service-worker";
import { I18nProvider } from "@/i18n/client";
import { getI18n } from "@/i18n/server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: "Taskly",
    description: t.meta.description,
    applicationName: "Taskly",
    appleWebApp: { capable: true, title: "Taskly", statusBarStyle: "default" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, t } = await getI18n();
  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale} dictionary={t}>
          {children}
        </I18nProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
