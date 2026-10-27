import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { AppError } from '../middleware/errorHandler';

export const postsRouter = Router();
postsRouter.use(authenticate);

const createPostSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  imageUrl: z.string().optional(),
});

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
});

// ── GET /posts ───────────────────────────────
postsRouter.get('/', async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: { id: true, name: true, familySurname: true, accountType: true }
      },
      _count: {
        select: { comments: true, likes: true }
      },
      likes: {
        where: { userId }
      }
    },
    take: 50,
  });

  const formattedPosts = posts.map(post => ({
    ...post,
    hasLiked: post.likes.length > 0,
    likes: undefined 
  }));

  res.json({ success: true, data: formattedPosts });
});

// ── POST /posts ──────────────────────────────
postsRouter.post('/', async (req: AuthRequest, res) => {
  const data = createPostSchema.parse(req.body);
  
  const post = await prisma.post.create({
    data: {
      content: data.content,
      imageUrl: data.imageUrl,
      authorId: req.userId!
    },
    include: {
      author: { select: { id: true, name: true, familySurname: true, accountType: true } },
      _count: { select: { comments: true, likes: true } }
    }
  });

  res.status(201).json({ success: true, data: { ...post, hasLiked: false } });
});

// ── DELETE /posts/:id ────────────────────────
postsRouter.delete('/:id', async (req: AuthRequest, res) => {
  const postId = req.params.id as string;
  
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError(404, 'Post not found');
  if (post.authorId !== req.userId) throw new AppError(403, 'Not authorized');

  await prisma.post.delete({ where: { id: postId } });
  res.json({ success: true, message: 'Post deleted' });
});

// ── POST /posts/:id/like ─────────────────────
postsRouter.post('/:id/like', async (req: AuthRequest, res) => {
  const postId = req.params.id as string;
  const userId = req.userId!;

  const existingLike = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId } }
  });

  if (existingLike) {
    await prisma.like.delete({
      where: { postId_userId: { postId, userId } }
    });
    res.json({ success: true, data: { liked: false } });
  } else {
    await prisma.like.create({
      data: { postId, userId }
    });
    res.json({ success: true, data: { liked: true } });
  }
});

// ── GET /posts/:id/comments ──────────────────
postsRouter.get('/:id/comments', async (req: AuthRequest, res) => {
  const postId = req.params.id as string;

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, name: true, accountType: true } }
    }
  });

  res.json({ success: true, data: comments });
});

// ── POST /posts/:id/comments ─────────────────
postsRouter.post('/:id/comments', async (req: AuthRequest, res) => {
  const postId = req.params.id as string;
  const data = createCommentSchema.parse(req.body);

  const comment = await prisma.comment.create({
    data: {
      content: data.content,
      postId,
      authorId: req.userId!
    },
    include: {
      author: { select: { id: true, name: true, accountType: true } }
    }
  });

  res.status(201).json({ success: true, data: comment });
});
