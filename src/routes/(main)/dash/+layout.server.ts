import { auth } from "$lib/auth";
import type { LayoutServerLoad } from "./$types";
// import { redirect } from "@sveltejs/kit";
// import { toast } from "svelte-sonner";

export const load: LayoutServerLoad = async ({ request }) => {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    // if (!session) {
    //     console.log('No session found , redirecting to home', new Date().toISOString());
    //     toast.error('Please log in to continue');
    //     throw redirect(303, '/');
    // }

    return session;
};