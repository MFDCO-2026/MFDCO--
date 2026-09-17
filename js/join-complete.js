/* =========================================
   MFDCO JOIN COMPLETE GUARD
========================================= */

"use strict";


document.addEventListener(
    "DOMContentLoaded",
    async function () {

        if (!window.supabaseClient) {

            return;

        }


        try {

            const {
                data: userData,
                error: userError
            } =
                await window.supabaseClient
                    .auth
                    .getUser();


            if (userError) {

                console.warn(
                    "JOIN COMPLETE AUTH ERROR:",
                    userError
                );

                return;

            }


            const user =
                userData?.user ||
                null;


            if (!user) {

                window.location.replace(
                    "join.html"
                );

                return;

            }


            const {
                data: profile,
                error: profileError
            } =
                await window.supabaseClient
                    .from(
                        "profiles"
                    )
                    .select(`
                        id,
                        activity_name
                    `)
                    .eq(
                        "id",
                        user.id
                    )
                    .maybeSingle();


            if (profileError) {

                throw profileError;

            }


            const activityName =
                String(
                    profile?.activity_name ||
                    ""
                ).trim();


            if (!activityName) {

                window.location.replace(
                    "profile-setup.html"
                );

            }

        }
        catch (error) {

            console.error(
                "JOIN COMPLETE CHECK ERROR:",
                error
            );

        }

    }
);

