import { createUploadthing } from "uploadthing/server";
import type { FileRouter } from "uploadthing/server";
import { auth } from "$lib/auth"; // Import the auth logic


const f = createUploadthing();

export const ourFileRouter = {
  mediaUploader: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({
        headers: req.headers,
      });
      if (!session || !session.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Media upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
    }),

  profilePicture: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({
        headers: req.headers,
      });
      if (!session || !session.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Profile picture upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
    }),

  kycDocument: f({
    image: {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({
        headers: req.headers,
      });
      if (!session || !session.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("KYC document upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
