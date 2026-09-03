"use strict";


document.addEventListener(
    "DOMContentLoaded",
    async () => {


        /* =========================================
           DOM
        ========================================= */

        const loginRequired =
            document.getElementById(
                "login-required"
            );

        const formSection =
            document.getElementById(
                "submit-form-section"
            );

        const providerName =
            document.getElementById(
                "provider-name"
            );

        const form =
            document.getElementById(
                "work-form"
            );

        const titleInput =
            document.getElementById(
                "work-title"
            );

        const previewImageInput =
            document.getElementById(
                "preview-image"
            );

        const imagePreview =
            document.getElementById(
                "image-preview"
            );

        const removeImageButton =
            document.getElementById(
                "remove-image"
            );

        const workUrlInput =
            document.getElementById(
                "work-url"
            );

        const descriptionInput =
            document.getElementById(
                "work-description"
            );

        const usageTermsInput =
            document.getElementById(
                "usage-terms"
            );

        const tagsContainer =
            document.getElementById(
                "work-tags"
            );

        const agreementInput =
            document.getElementById(
                "work-agreement"
            );

        const submitButton =
            document.getElementById(
                "submit-button"
            );

        const submitButtonText =
            document.getElementById(
                "submit-button-text"
            );

        const submitError =
            document.getElementById(
                "submit-error"
            );

        const submitSuccess =
            document.getElementById(
                "submit-success"
            );



        /* =========================================
           SUPABASE
        ========================================= */

        const supabase =
            window.supabaseClient;


        if (!supabase) {

            showError(
                "Supabaseへ接続できませんでした。"
            );

            return;

        }



        /* =========================================
           STATE
        ========================================= */

        let currentUser =
            null;

        let selectedTags =
            new Set();

        let previewObjectUrl =
            null;



        /* =========================================
           AUTH CHECK
        ========================================= */

        await checkLogin();



        /* =========================================
           TAGS
        ========================================= */

        renderTags();



        /* =========================================
           IMAGE PREVIEW
        ========================================= */

        previewImageInput
            ?.addEventListener(
                "change",
                handleImageChange
            );


        removeImageButton
            ?.addEventListener(
                "click",
                clearSelectedImage
            );



        /* =========================================
           SUBMIT
        ========================================= */

        form?.addEventListener(
            "submit",
            handleSubmit
        );



        /* =========================================
           LOGIN
        ========================================= */

        async function checkLogin() {

            try {

                const {
                    data,
                    error
                } =
                    await supabase.auth
                        .getUser();


                if (error) {

                    console.warn(
                        "ログイン確認:",
                        error
                    );

                }


                currentUser =
                    data?.user || null;


                if (!currentUser) {

                    loginRequired
                        ?.classList
                        .remove(
                            "hidden"
                        );

                    formSection
                        ?.classList
                        .add(
                            "hidden"
                        );

                    return;

                }


                loginRequired
                    ?.classList
                    .add(
                        "hidden"
                    );

                formSection
                    ?.classList
                    .remove(
                        "hidden"
                    );


                await loadProfile();

            } catch (error) {

                console.error(
                    "ログイン確認エラー:",
                    error
                );


                loginRequired
                    ?.classList
                    .remove(
                        "hidden"
                    );

            }

        }



        /* =========================================
           PROFILE
        ========================================= */

        async function loadProfile() {

            if (!currentUser) {
                return;
            }


            const {
                data,
                error
            } = await supabase
                .from("profiles")
                .select(
                    "activity_name"
                )
                .eq(
                    "id",
                    currentUser.id
                )
                .maybeSingle();


            if (error) {

                console.warn(
                    "プロフィール取得エラー:",
                    error
                );

            }


            if (providerName) {

                providerName.textContent =
                    data?.activity_name ||
                    currentUser.email ||
                    "MFDCO MEMBER";

            }

        }



        /* =========================================
           TAGS
        ========================================= */

        function renderTags() {

            if (!tagsContainer) {
                return;
            }


            tagsContainer.innerHTML =
                "";


            if (
                typeof MFDCO_TAGS ===
                "undefined"
            ) {

                console.warn(
                    "MFDCO_TAGS が定義されていません。"
                );

                return;

            }


            MFDCO_TAGS.forEach(
                tag => {

                    const label =
                        document.createElement(
                            "label"
                        );


                    label.className =
                        "work-tag-option";


                    const checkbox =
                        document.createElement(
                            "input"
                        );


                    checkbox.type =
                        "checkbox";

                    checkbox.value =
                        tag;


                    const text =
                        document.createElement(
                            "span"
                        );


                    text.textContent =
                        tag;


                    checkbox.addEventListener(
                        "change",
                        () => {

                            if (
                                checkbox.checked
                            ) {

                                selectedTags.add(
                                    tag
                                );

                            } else {

                                selectedTags.delete(
                                    tag
                                );

                            }

                        }
                    );


                    label.appendChild(
                        checkbox
                    );

                    label.appendChild(
                        text
                    );


                    tagsContainer
                        .appendChild(
                            label
                        );

                }
            );

        }



        /* =========================================
           IMAGE
        ========================================= */

        function handleImageChange() {

            clearPreviewObjectUrl();


            const file =
                previewImageInput
                    ?.files?.[0];


            /*
             * 未選択ならNO IMAGE
             */

            if (!file) {

                setNoImage();

                return;

            }



            /*
             * TYPE CHECK
             */

            const allowedTypes = [

                "image/png",

                "image/jpeg",

                "image/webp"

            ];


            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                showError(
                    "プレビュー画像はPNG・JPEG・WebPのみ使用できます。"
                );

                previewImageInput.value =
                    "";

                setNoImage();

                return;

            }



            /*
             * SIZE CHECK
             */

            const maxSize =
                10 * 1024 * 1024;


            if (
                file.size >
                maxSize
            ) {

                showError(
                    "プレビュー画像は10MB以下にしてください。"
                );

                previewImageInput.value =
                    "";

                setNoImage();

                return;

            }



            /*
             * PREVIEW
             */

            previewObjectUrl =
                URL.createObjectURL(
                    file
                );


            if (imagePreview) {

                imagePreview.src =
                    previewObjectUrl;

            }


            hideError();

        }



        /* =========================================
           CLEAR IMAGE
        ========================================= */

        function clearSelectedImage() {

            if (
                previewImageInput
            ) {

                previewImageInput.value =
                    "";

            }


            clearPreviewObjectUrl();

            setNoImage();

        }



        /* =========================================
           NO IMAGE
        ========================================= */

        function setNoImage() {

            if (imagePreview) {

                imagePreview.src =
                    "assets/noimage.png";

            }

        }



        /* =========================================
           OBJECT URL CLEANUP
        ========================================= */

        function clearPreviewObjectUrl() {

            if (
                previewObjectUrl
            ) {

                URL.revokeObjectURL(
                    previewObjectUrl
                );

                previewObjectUrl =
                    null;

            }

        }



        /* =========================================
           SUBMIT
        ========================================= */

        async function handleSubmit(
            event
        ) {

            event.preventDefault();


            hideError();

            hideSuccess();



            /* =====================================
               USER
            ====================================== */

            if (!currentUser) {

                showError(
                    "ログインが必要です。"
                );

                return;

            }



            /* =====================================
               AGREEMENT
            ====================================== */

            if (
                !agreementInput
                    ?.checked
            ) {

                showError(
                    "作品掲載への同意が必要です。"
                );

                return;

            }



            /* =====================================
               TITLE
            ====================================== */

            const title =
                titleInput
                    ?.value
                    .trim();


            if (!title) {

                showError(
                    "作品名を入力してください。"
                );

                return;

            }



            /* =====================================
               DATA
            ====================================== */

            const description =
                descriptionInput
                    ?.value
                    .trim() || null;


            const usageTerms =
                usageTermsInput
                    ?.value
                    .trim() || null;


            const workUrl =
                workUrlInput
                    ?.value
                    .trim() || null;


            const imageFile =
                previewImageInput
                    ?.files?.[0] ||
                null;


            const workId =
                crypto.randomUUID();


            let imageUrl =
                null;

            let uploadedImagePath =
                null;



            /* =====================================
               BUTTON
            ====================================== */

            setSubmitting(
                true
            );



            try {


                /* =================================
                   IMAGE UPLOAD
                   画像がある場合だけ実行
                ================================== */

                if (imageFile) {


                    const allowedTypes = [

                        "image/png",

                        "image/jpeg",

                        "image/webp"

                    ];


                    if (
                        !allowedTypes.includes(
                            imageFile.type
                        )
                    ) {

                        throw new Error(
                            "プレビュー画像はPNG・JPEG・WebPのみ使用できます。"
                        );

                    }



                    const maxSize =
                        10 * 1024 * 1024;


                    if (
                        imageFile.size >
                        maxSize
                    ) {

                        throw new Error(
                            "プレビュー画像は10MB以下にしてください。"
                        );

                    }



                    let extension =
                        imageFile.name
                            .split(".")
                            .pop()
                            ?.toLowerCase();


                    if (!extension) {

                        extension =
                            getExtensionFromMime(
                                imageFile.type
                            );

                    }



                    uploadedImagePath =
                        `${currentUser.id}/${workId}.${extension}`;



                    const {
                        error: uploadError
                    } = await supabase
                        .storage
                        .from(
                            "work-images"
                        )
                        .upload(
                            uploadedImagePath,
                            imageFile,
                            {
                                cacheControl:
                                    "3600",

                                upsert:
                                    false
                            }
                        );


                    if (uploadError) {

                        console.error(
                            "画像アップロードエラー:",
                            uploadError
                        );


                        throw new Error(
                            "プレビュー画像をアップロードできませんでした。"
                        );

                    }



                    const {
                        data: publicUrlData
                    } = supabase
                        .storage
                        .from(
                            "work-images"
                        )
                        .getPublicUrl(
                            uploadedImagePath
                        );


                    imageUrl =
                        publicUrlData
                            ?.publicUrl ||
                        null;

                }



                /* =================================
                   DATABASE
                ================================== */

                const {
                    error: insertError
                } = await supabase
                    .from(
                        "works"
                    )
                    .insert({

                        id:
                            workId,

                        user_id:
                            currentUser.id,

                        title:
                            title,

                        description:
                            description,

                        image_url:
                            imageUrl,

                        usage_terms:
                            usageTerms,

                        tags:
                            [
                                ...selectedTags
                            ],

                        status:
                            "pending",

                        work_url:
                            workUrl

                    });



                /* =================================
                   INSERT ERROR
                ================================== */

                if (insertError) {

                    console.error(
                        "作品登録エラー:",
                        insertError
                    );


                    /*
                     * DB登録失敗時、
                     * アップロード済み画像を削除
                     */

                    if (
                        uploadedImagePath
                    ) {

                        const {
                            error:
                                removeError
                        } =
                            await supabase
                                .storage
                                .from(
                                    "work-images"
                                )
                                .remove([
                                    uploadedImagePath
                                ]);


                        if (removeError) {

                            console.warn(
                                "アップロード画像の削除に失敗:",
                                removeError
                            );

                        }

                    }


                    throw new Error(
                        "作品を登録できませんでした。"
                    );

                }



                /* =================================
                   SUCCESS
                ================================== */

                form.reset();


                selectedTags.clear();


                document
                    .querySelectorAll(
                        "#work-tags input[type='checkbox']"
                    )
                    .forEach(
                        checkbox => {

                            checkbox.checked =
                                false;

                        }
                    );


                clearPreviewObjectUrl();

                setNoImage();

                showSuccess();


                window.scrollTo({

                    top:
                        submitSuccess
                            ?.offsetTop -
                        120,

                    behavior:
                        "smooth"

                });


            } catch (error) {

                console.error(
                    "作品提出エラー:",
                    error
                );


                showError(
                    error.message ||
                    "作品の提出中にエラーが発生しました。"
                );

            } finally {

                setSubmitting(
                    false
                );

            }

        }



        /* =========================================
           MIME → EXTENSION
        ========================================= */

        function getExtensionFromMime(
            mime
        ) {

            switch (mime) {

                case "image/jpeg":
                    return "jpg";

                case "image/webp":
                    return "webp";

                case "image/png":
                default:
                    return "png";

            }

        }



        /* =========================================
           SUBMIT BUTTON
        ========================================= */

        function setSubmitting(
            submitting
        ) {

            if (
                submitButton
            ) {

                submitButton.disabled =
                    submitting;

            }


            if (
                submitButtonText
            ) {

                submitButtonText.textContent =
                    submitting
                        ? "送信中..."
                        : "作品を提出する";

            }

        }



        /* =========================================
           ERROR
        ========================================= */

        function showError(
            message
        ) {

            if (!submitError) {
                return;
            }


            submitError.textContent =
                message;


            submitError
                .classList
                .remove(
                    "hidden"
                );

        }


        function hideError() {

            submitError
                ?.classList
                .add(
                    "hidden"
                );

        }



        /* =========================================
           SUCCESS
        ========================================= */

        function showSuccess() {

            submitSuccess
                ?.classList
                .remove(
                    "hidden"
                );

        }


        function hideSuccess() {

            submitSuccess
                ?.classList
                .add(
                    "hidden"
                );

        }



        /* =========================================
           PAGE LEAVE CLEANUP
        ========================================= */

        window.addEventListener(
            "beforeunload",
            clearPreviewObjectUrl
        );


    }
);