import { getLoungePost } from '@/app/dashboard/lounge-actions';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LoungeWriteForm from '@/components/library/LoungeWriteForm';

export default async function LoungeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log('[DEBUG LoungeEditPage] received id:', id);
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  let post;
  try {
    const res = await getLoungePost(id);
    post = res.data;
  } catch (error) {
    console.error('[DEBUG LoungeEditPage] getLoungePost threw:', error);
    return notFound();
  }

  if (!post) {
    return notFound();
  }

  if (post.user_id !== user.id) {
    return redirect(`/dashboard/lounge/${id}`);
  }

  return <LoungeWriteForm editId={id} initialData={post} />;
}
