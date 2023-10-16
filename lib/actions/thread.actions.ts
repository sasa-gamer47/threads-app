"use server";

import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";

interface Params {
    text: string,
    author: string,
    communityId: string | null,
    path: string,
    likes: number,
}

export async function createThread({ text, author, communityId, path, likes }: Params) {
    try {
        connectToDB()
    
        const createdThread = await Thread.create({
            text,
            author,
            community: null,
            path,
            likes,
        })
    
        // Update user model
        await User.findByIdAndUpdate(author, {
            $push: { threads: createdThread._id }
        })
    
        revalidatePath(path)
        
    } catch (error: any) {
        throw new Error('Error creating thread: ', error.message)
    }
}

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
    connectToDB();

  // Calculate the number of posts to skip based on the page number and page size.
  const skipAmount = (pageNumber - 1) * pageSize;

  // Create a query to fetch the posts that have no parent (top-level threads) (a thread that is not a comment/reply).
    const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
        .sort({ createdAt: "desc" })
        .skip(skipAmount)
        .limit(pageSize)
        .populate({
        path: "author",
        model: User,
        })
        .populate({
        path: "children", // Populate the children field
        populate: {
            path: "author", // Populate the author field within children
            model: User,
            select: "_id name parentId image", // Select only _id and username fields of the author
        },
        });

    // Count the total number of top-level posts (threads) i.e., threads that are not comments.
    const totalPostsCount = await Thread.countDocuments({
        parentId: { $in: [null, undefined] },
    }); // Get the total count of posts

    const posts = await postsQuery.exec();

    const isNext = totalPostsCount > skipAmount + posts.length;

    return { posts, isNext };
}

export async function leaveLike({ likes, id }: { likes: number, id: string }, formData: FormData) {
        
        
        console.log(likes);
        
        
        try {
    
            await Thread.findOneAndUpdate(
                { id: id },
                { likes: likes + 1 },
                { upsert: true }
                )

                // revalidatePath(pathname)
            } catch (error) {
                
            }
}

export async function fetchThreadById(id: string) {
    connectToDB()

    try {
        const thread = await Thread.findById(id)
            .populate({
                path: 'author',
                model: User,
                select: "_id id name image"
            })
            .populate({
                path: 'children',
                populate: [
                    {
                        path: 'author',
                        model: User,
                        select: "_id id name image parentId"
                    },
                    {
                        path: 'children',
                        model: Thread,
                        populate: {
                            path: 'author',
                            model: User,
                            select: "_id id name image parentId"
                        }
                    },
                ]
            }).exec()

        return thread

    } catch (error: any) {
        throw new Error('Could not fetch thread: ', error.message)
    }
}

export async function addCommentToThread(
    threadId: string,
    commentText: string,
    userId: string,
    path: string
) {
    connectToDB()

    try {
        const originalThread = await Thread.findById(threadId)

        if (!originalThread) throw new Error('Thread not found')

        const commentThread = new Thread({
            text: commentText,
            author: userId,
            parentId: threadId,
        })

        const savedCommentThread = await commentThread.save()

        await originalThread.children.push(savedCommentThread._id)

        await originalThread.save()

        revalidatePath(path)
    } catch (error: any) {
        throw new Error('Could not create comment: ', error.message)
    }
}