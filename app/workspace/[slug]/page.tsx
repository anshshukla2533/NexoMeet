import WorkspaceClient from './WorkspaceClient';

type Props = { params: Promise<{ slug: string }> };

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <WorkspaceClient slug={slug} />;
}
