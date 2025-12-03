import { agentPlaygroundFlagFrontend } from '@/flags';
import { isFlagEnabled } from '@/lib/feature-flags';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Agent Conversation | AtlasAI0',
  description: 'Interactive agent conversation powered by AtlasAI0',
  openGraph: {
    title: 'Agent Conversation | AtlasAI0',
    description: 'Interactive agent conversation powered by AtlasAI0',
    type: 'website',
  },
};

export default async function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
