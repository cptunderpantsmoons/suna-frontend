import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Agent | AtlasAI0',
  description: 'Interactive agent playground powered by AtlasAI0',
  openGraph: {
    title: 'Agent Playground | AtlasAI0',
    description: 'Interactive agent playground powered by AtlasAI0',
    type: 'website',
  },
};

export default async function NewAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
