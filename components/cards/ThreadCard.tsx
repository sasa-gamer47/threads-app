

import Thread from "@/lib/models/thread.model"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { connectToDB } from "@/lib/mongoose"
import { revalidatePath } from "next/cache"

interface Props {
    id: string,
    currentUserId: string,
    parentId: string | null,
    content: string,
    author: {
        name: string,
        image: string,
        id: string, 
    },
        community: {
            id: string,
            name: string,
            image: string,
    } | null,
    createdAt: Date,
        comments: {
            author: {
                image: string,
        }
    }[],
    isComment?: boolean,
    likes: number,
}

const ThreadCard = ({
    id,
    currentUserId,
    parentId,
    content,
    author,
    community,
    createdAt,
    comments,
    likes,
    isComment,
}: Props) => {

    let likeLeft = false

    // const pathname = usePathname()

    async function leaveLike(formData: FormData) {
        "use server"
        
        // console.log(formData);
        
        likes += 1

        console.log(likes, likeLeft);
        
        
        try {

            connectToDB()

            const data = await Thread.findOneAndUpdate(
                { _id: JSON.parse(id) },
                {
                    // $push: { likeUsers: author },
                    likes: likes,
                },
                
                { upsert: true }
            )

            // const thread = await Thread.findById(id)

            // thread.likes += 1 
            // // thread.likeUser.push(author)

            // console.log(thread);
            

            // await thread.save()
            
            // updateLikeUsers()
            revalidatePath('/')
            
            
            } catch (error) {
                
            }
        }

    async function updateLikeUsers() {
        "use server"

        console.log('working');
        

            try {

            connectToDB()
                console.log(author);
                
                
            const data = await Thread.findOneAndUpdate(
                { _id: id },
                {
                    $push: { likeUsers: author },
                    // likes: likes,
                },
                
                { upsert: true }
                )
                
                console.log(data);
                


                // revalidatePath('/')
            } catch (error) {
                
            }
        }
        


    return (
        <article className={`flex w-full flex-col rounded-xl  ${isComment ? 'px-0 xs:px-7 ' : 'bg-dark-2 p-7'}`}>
            <div className="flex items-start justify-between">
                <div className="flex w-full fle-1 flex-row gap-4">
                    <div className="flex flex-col items-center">
                        <Link href={`/profile/${author.id}`} className="relative h-11 w-11">
                            <Image src={author.image} alt="profile image" fill className="cursor-pointer rounded-full" />
                        </Link>

                        <div className="thread-card_bar" />
                    </div>

                    <div className="flex w-full flex-col"> 
                        <Link href={`/profile/${author.id}`} className="w-fit">
                            <h4 className="cursor-pointer text-base-semibold text-light-1">{author.name}</h4>
                        </Link>

                        <p className="mt-2 text-small-regular text-light-2">{content}</p>

                        <div className="mt-5 flex flex-col gap-3">
                            <div className="flex gap-3.5">
                            
                                {/* <Likes id={id} likes={likes} pathname={'/'} /> */}
                                {/* <div className="object-contain flex flex-row justify-between items-center">
                                    <Image src="/assets/heart-gray.svg" alt="heart" width={24} height={24} className="cursor-pointer" />
                                    <p className="text-light-2">{ likes }</p>

                                </div> */}
                                <form action={leaveLike}>
                                    <button type="submit" className="object-contain flex flex-row justify-between items-center">
                                        <Image src="/assets/heart-gray.svg" alt="heart" width={24} height={24} className="cursor-pointer"  />
                                        <p className="text-light-2">{ likes }</p>

                                    </button>
                                </form>

                                <Link href={`/thread/${JSON.parse(id)}`}>
                                    <Image src="/assets/reply.svg" alt="reply" width={24} height={24} className="cursor-pointer object-contain" />
                                </Link>
                                <Image src="/assets/repost.svg" alt="repost" width={24} height={24} className="cursor-pointer object-contain" />
                                <Image src="/assets/share.svg" alt="share" width={24} height={24} className="cursor-pointer object-contain" />
                            </div>

                            {isComment && comments.length > 0 && (
                                <Link href={`/thread/${JSON.parse(id)}`}>
                                    <p className="mt-1 text-subtle-medium text-gray-1">{comments.length} replies</p>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    )
}

export default ThreadCard