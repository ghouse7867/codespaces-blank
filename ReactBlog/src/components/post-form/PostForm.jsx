import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, RTE, Select } from "../index";
import appwriteservice from "../../appwrite/appwriteconfig";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function PostForm({ post }) {
    const { register, handleSubmit, watch, setValue, control, getValues } = useForm({
        defaultValues: {
            title: post?.title || "",
            slug: post?.$id || "",
            content: post?.content || "",
            status: post?.status || "active",
        },
    });

    const navigate = useNavigate();
    const userData = useSelector((state) => state.auth.userData);
    console.log("userId - ", userData.$id)

    const submit = async (data) => {
    try {
        let fileId = null;

        if (data.featuredImage && data.featuredImage.length > 0) {
            const file = await appwriteservice.uploadFile(data.featuredImage[0]);
            fileId = file.$id;

            if (post && post.featuredImage) {
                await appwriteservice.deleteFile(post.featuredImage);
            }
        }

        const postData = {
            ...data,
            featuredImage: fileId || post?.featuredImage,
            userid: userData.$id,
           
        };
        console.log(userData.$id)

        let dbPost;
        if (post) {
            dbPost = await appwriteservice.updatePost(post.$id, postData);
        } else {
            dbPost = await appwriteservice.createPost(postData);
        }

        if (dbPost) {
            navigate(`/post/${dbPost.$id}`);
        }
    } catch (error) {
        console.error("Error submitting post:---", error);
    }
};


    const slugTransform = useCallback((value) => {
        if (value && typeof value === "string")
            return value
                .trim()
                .toLowerCase()
                .replace(/[^a-zA-Z\d\s]+/g, "-")
                .replace(/\s/g, "-");

        return "";
    }, []);

    React.useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === "title") {
                setValue("slug", slugTransform(value.title), { shouldValidate: true });
            }
        });

        return () => subscription.unsubscribe();
    }, [watch, slugTransform, setValue]);

    return (
        <form onSubmit={handleSubmit(submit)} className="flex flex-wrap">
            <div className="w-2/3 px-2">
                <Input
                    label="Title :"
                    placeholder="Title"
                    className="mb-4"
                    {...register("title", { required: true })}
                />
                <Input
                    label="Slug :"
                    placeholder="Slug"
                    className="mb-4"
                    {...register("slug", { required: true })}
                    onInput={(e) => {
                        setValue("slug", slugTransform(e.currentTarget.value), { shouldValidate: true });
                    }}
                />
                <RTE label="Content :" name="content" control={control} defaultValue={getValues("content")} />
            </div>
            <div className="w-1/3 px-2">
                <Input
                    label="Featured Image :"
                    type="file"
                    className="mb-4"
                    accept="image/png, image/jpg, image/jpeg, image/gif"
                    {...register("featuredImage")}
                />
                {post && (
                    <div className="w-full mb-4">
                        <img
                            src={appwriteservice.getFilePreview(post.featuredImage)}
                            alt={post.title}
                            className="rounded-lg"
                        />
                    </div>
                )}
                <Select
                    options={["active", "inactive"]}
                    label="Status"
                    className="mb-4"
                    {...register("status", { required: true })}
                />
                <Button type="submit" bgColor={post ? "bg-green-500" : undefined} className="w-full">
                    {post ? "Update" : "Submit"}
                </Button>
            </div>
        </form>
    );
}