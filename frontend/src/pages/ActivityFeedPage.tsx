import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MessageSquare, Heart, Send, Loader2, Image as ImageIcon } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Link } from 'react-router-dom';

interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  hasLiked: boolean;
  author: {
    id: string;
    name: string;
    familySurname?: string;
    accountType: string;
  };
  _count: {
    comments: number;
    likes: number;
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
}

function PostCard({ post }: { post: Post }) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  
  const { register, handleSubmit, reset } = useForm<{ content: string }>();

  const likeMutation = useMutation({
    mutationFn: () => api.post(`/posts/${post.id}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  const { data: comments, isLoading: loadingComments } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: async () => {
      const res = await api.get(`/posts/${post.id}/comments`);
      return res.data.data as Comment[];
    },
    enabled: showComments
  });

  const commentMutation = useMutation({
    mutationFn: (data: { content: string }) => api.post(`/posts/${post.id}/comments`, data),
    onSuccess: () => {
      toast.success('Comment added');
      queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add comment');
    }
  });

  return (
    <div className="glass-panel p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-brand-700/50 flex items-center justify-center text-brand-100 font-bold border border-brand-500/30">
          {post.author.name.charAt(0)}
        </div>
        <div>
          <Link to={`/profile/${post.author.id}`} className="font-semibold text-brand-100 hover:text-brand-300 transition-colors">
            {post.author.name} {post.author.familySurname && `(${post.author.familySurname})`}
          </Link>
          <div className="text-xs text-brand-400">
            {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="text-brand-100 mb-4 whitespace-pre-wrap">{post.content}</div>
      
      {post.imageUrl && (
        <div className="mb-4 rounded-xl overflow-hidden border border-brand-500/20">
          <img src={post.imageUrl} alt="Post" className="w-full h-auto object-cover max-h-96" />
        </div>
      )}

      <div className="flex items-center gap-6 pt-4 border-t border-brand-500/20 text-brand-300">
        <button 
          onClick={() => likeMutation.mutate()}
          disabled={likeMutation.isPending}
          className={`flex items-center gap-2 hover:text-brand-100 transition-colors ${post.hasLiked ? 'text-red-400 hover:text-red-300' : ''}`}
        >
          <Heart className={`w-5 h-5 ${post.hasLiked ? 'fill-current' : ''}`} />
          <span>{post._count.likes}</span>
        </button>
        
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 hover:text-brand-100 transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          <span>{post._count.comments}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-6 pt-4 border-t border-brand-500/20">
          {loadingComments ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
            </div>
          ) : (
            <div className="space-y-4 mb-4">
              {comments?.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-800/80 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                    {comment.author.name.charAt(0)}
                  </div>
                  <div className="bg-brand-900/40 rounded-2xl rounded-tl-none px-4 py-2 flex-1 border border-brand-500/10">
                    <div className="font-medium text-brand-200 text-sm">{comment.author.name}</div>
                    <div className="text-brand-100">{comment.content}</div>
                  </div>
                </div>
              ))}
              {comments?.length === 0 && (
                <div className="text-center text-brand-400 text-sm">No comments yet. Be the first!</div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit((data) => commentMutation.mutate(data))} className="flex gap-2">
            <input
              {...register('content', { required: true })}
              type="text"
              placeholder="Write a comment..."
              className="input-field flex-1 !rounded-full !py-2"
              disabled={commentMutation.isPending}
            />
            <button 
              type="submit" 
              disabled={commentMutation.isPending}
              className="btn-primary !rounded-full !p-3 !w-auto"
            >
              {commentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ActivityFeedPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<{ content: string, imageUrl?: string }>();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const res = await api.get('/posts');
      return res.data.data as Post[];
    }
  });

  const createPostMutation = useMutation({
    mutationFn: (data: { content: string, imageUrl?: string }) => api.post('/posts', data),
    onSuccess: () => {
      toast.success('Post created successfully!');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create post');
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-playfair font-bold text-white mb-2">Activity Feed</h1>
        <p className="text-brand-300">Stay updated with your family's latest moments.</p>
      </div>

      {/* Create Post */}
      <div className="glass-panel p-6 mb-8">
        <form onSubmit={handleSubmit((data) => createPostMutation.mutate(data))}>
          <div className="flex gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-brand-700/50 flex-shrink-0 flex items-center justify-center text-brand-100 font-bold text-lg border border-brand-500/30">
              {user?.name?.charAt(0)}
            </div>
            <textarea
              {...register('content', { required: true })}
              placeholder={`What's on your mind, ${user?.name}?`}
              className="input-field flex-1 resize-none min-h-[80px]"
              disabled={createPostMutation.isPending}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {/* Future: Image upload handling */}
              <button type="button" className="p-2 text-brand-400 hover:text-brand-200 transition-colors rounded-full hover:bg-brand-500/10">
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
            <button 
              type="submit" 
              disabled={createPostMutation.isPending}
              className="btn-primary"
            >
              {createPostMutation.isPending ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {posts?.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
        
        {posts?.length === 0 && (
          <div className="text-center py-12 text-brand-400 glass-panel">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-brand-200 mb-2">No posts yet</h3>
            <p>Be the first to share an update with your family!</p>
          </div>
        )}
      </div>
    </div>
  );
}
