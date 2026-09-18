"use strict";

/* =========================================================
   MFDCO - EDIT WORK
========================================================= */

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_WORK_FILE_SIZE = 500 * 1024 * 1024;

const WORK_IMAGE_BUCKET = "work-images";
const PRIVATE_WORK_BUCKET = "work-files";
const PUBLIC_WORK_BUCKET = "work-files-public";
const DOWNLOAD_ACCESS_VALUES = new Set([
    "public",
    "user",
    "member",
    "private"
]);

let currentUser = null;
let currentProfile = null;
let currentWork = null;
let currentWorkId = null;

let selectedPreviewImage = null;
let selectedWorkFile = null;

const elements = {};

document.addEventListener("DOMContentLoaded", async () => {
    cacheElements();
    setupEvents();
    renderTags();
    await initializeEditPage();
});

function cacheElements() {
    elements.loading = document.getElementById("edit-loading");
    elements.loginRequired = document.getElementById("login-required");
    elements.forbidden = document.getElementById("edit-forbidden");
    elements.forbiddenText = document.getElementById("edit-forbidden-text");

    elements.form = document.getElementById("edit-work-form");

    elements.title = document.getElementById("work-title");
    elements.description = document.getElementById("work-description");

    elements.currentImage = document.getElementById("current-work-image");
    elements.currentImagePlaceholder =
        document.getElementById("current-work-image-placeholder");
    elements.imageInput = document.getElementById("work-image");
    elements.imagePreview = document.getElementById("work-image-preview");

    elements.tags = document.getElementById("work-tags");

    elements.directFileArea = document.getElementById("direct-file-area");
    elements.externalUrlArea = document.getElementById("external-url-area");

    elements.currentWorkFileInfo =
        document.getElementById("current-work-file-info");
    elements.workFile = document.getElementById("work-file");
    elements.workFileInfo = document.getElementById("work-file-info");
    elements.externalUrl = document.getElementById("external-url");

    elements.downloadAccessHelp = document.getElementById("download-access-help");
    elements.downloadAccessHelpTitle =
        document.getElementById("download-access-help-title");
    elements.downloadAccessHelpText =
        document.getElementById("download-access-help-text");

    elements.otherTerms = document.getElementById("other-terms");

    elements.profileCreditArea = document.getElementById("profile-credit-area");
    elements.profileCreditText = document.getElementById("profile-credit-text");
    elements.customCreditArea = document.getElementById("custom-credit-area");
    elements.customCreditText = document.getElementById("custom-credit-text");

    elements.error = document.getElementById("submit-error");
    elements.success = document.getElementById("submit-success");
    elements.submitButton = document.getElementById("edit-work-button");
    elements.cancelLink = document.getElementById("cancel-edit-link");
}

function setupEvents() {
    elements.form?.addEventListener("submit", handleSave);

    document
        .querySelectorAll('input[name="submission_type"]')
        .forEach(input => input.addEventListener("change", updateSubmissionType));

    document
        .querySelectorAll('input[name="download_access"]')
        .forEach(input => input.addEventListener("change", updateDownloadAccessHelp));

    document
        .querySelectorAll('input[name="credit_type"]')
        .forEach(input => input.addEventListener("change", updateCreditType));

    elements.imageInput?.addEventListener("change", handleImageSelection);
    elements.workFile?.addEventListener("change", handleWorkFileSelection);
}

async function initializeEditPage() {
    try {
        if (!window.supabaseClient) {
            throw new Error("Supabaseクライアントが初期化されていません。");
        }

        const params = new URLSearchParams(window.location.search);
        currentWorkId = params.get("id");

        if (!currentWorkId) {
            showForbidden("作品IDが指定されていません。");
            return;
        }

        const { data, error } =
            await window.supabaseClient.auth.getUser();

        if (error) throw error;

        currentUser = data?.user || null;

        if (!currentUser) {
            showLoggedOut();
            return;
        }

        await loadCurrentProfile();
        await loadCurrentWork();

        if (currentWork.user_id !== currentUser.id) {
            showForbidden("この作品は投稿者本人のみ編集できます。");
            return;
        }

        populateForm();

        if (elements.cancelLink) {
            elements.cancelLink.href =
                `work.html?id=${encodeURIComponent(currentWorkId)}`;
        }

        document.title =
            `${currentWork.title || "作品"}を編集 | MFDCO`;

        showForm();
    } catch (error) {
        console.error("EDIT WORK INIT ERROR:", error);
        showForbidden(getErrorMessage(error));
    }
}

async function loadCurrentProfile() {
    currentProfile = null;

    const { data, error } = await window.supabaseClient
        .from("profiles")
        .select("activity_name")
        .eq("id", currentUser.id)
        .maybeSingle();

    if (error) {
        console.warn("PROFILE LOAD ERROR:", error);
        return;
    }

    currentProfile = data || null;
}

async function loadCurrentWork() {
    const { data, error } = await window.supabaseClient
        .from("works")
        .select(`
            id,
            user_id,
            title,
            description,
            image_url,
            tags,
            status,
            created_at,

            submission_type,
            file_path,
            external_url,
            original_filename,
            file_size,
            file_type,
            download_access,

            commercial_use,
            modification,
            setting_modification,
            destruction_depiction,
            other_terms,

            credit_type,
            credit_text
        `)
        .eq("id", currentWorkId)
        .maybeSingle();

    if (error) throw error;

    if (!data) {
        throw new Error("作品が見つかりません。");
    }

    currentWork = data;

    if (currentWork.download_access == null) {
        // download_access導入前の作品だけを旧既定値へ補完する。
        currentWork.download_access = "user";
    }

    if (!DOWNLOAD_ACCESS_VALUES.has(currentWork.download_access)) {
        throw new Error("作品のダウンロード公開範囲が不正です。管理者へ連絡してください。");
    }
}

function renderTags() {
    if (!elements.tags) return;

    if (typeof window.renderMfdcoWorkTags === "function") {
        window.renderMfdcoWorkTags(elements.tags, {
            inputName: "work_tags"
        });
        return;
    }

    if (typeof window.MFDCO_TAGS !== "undefined" && Array.isArray(window.MFDCO_TAGS)) {
        elements.tags.innerHTML = "";

        for (const tag of window.MFDCO_TAGS) {
            const label = document.createElement("label");
            label.className = "work-tag-option";

            const input = document.createElement("input");
            input.type = "checkbox";
            input.name = "work_tags";
            input.value = tag;

            const text = document.createElement("span");
            text.textContent = tag;

            label.append(input, text);
            elements.tags.appendChild(label);
        }

        return;
    }

    console.warn("タグ描画関数またはMFDCO_TAGSが見つかりません。");
}

function selectExistingTags() {
    const selected =
        Array.isArray(currentWork?.tags)
            ? currentWork.tags
            : [];

    elements.tags
        ?.querySelectorAll('input[type="checkbox"]')
        .forEach(input => {
            input.checked = selected.includes(input.value);
        });
}

function getSelectedTags() {
    if (!elements.tags) return [];

    if (typeof window.getSelectedMfdcoWorkTags === "function") {
        return window.getSelectedMfdcoWorkTags(elements.tags);
    }

    return Array.from(
        elements.tags.querySelectorAll('input[type="checkbox"]:checked')
    ).map(input => input.value);
}

function populateForm() {
    elements.title.value = currentWork.title || "";
    elements.description.value = currentWork.description || "";

    renderCurrentImage();
    selectExistingTags();

    setRadioValue(
        "submission_type",
        currentWork.submission_type || "file"
    );

    const accessInputFound = setRadioValue(
        "download_access",
        currentWork.download_access
    );

    if (!accessInputFound) {
        throw new Error(
            "編集画面に現在のダウンロード公開範囲の選択肢がありません。"
        );
    }

    elements.externalUrl.value =
        currentWork.external_url || "";

    renderCurrentWorkFile();

    setRadioValue(
        "commercial_use",
        currentWork.commercial_use || "consult"
    );

    setRadioValue(
        "modification",
        currentWork.modification || "consult"
    );

    setRadioValue(
        "setting_modification",
        currentWork.setting_modification || "consult"
    );

    setRadioValue(
        "destruction_depiction",
        currentWork.destruction_depiction || "consult"
    );

    elements.otherTerms.value =
        currentWork.other_terms || "";

    setRadioValue(
        "credit_type",
        currentWork.credit_type || "profile"
    );

    elements.customCreditText.value =
        currentWork.credit_type === "custom"
            ? currentWork.credit_text || ""
            : "";

    renderProfileCredit();

    updateSubmissionType();
    updateDownloadAccessHelp();
    updateCreditType();
}

function renderCurrentImage() {
    const url = currentWork?.image_url;

    if (!url) {
        if (elements.currentImage) {
            elements.currentImage.hidden = true;
        }

        if (elements.currentImagePlaceholder) {
            elements.currentImagePlaceholder.hidden = false;
        }

        return;
    }

    elements.currentImage.src = url;
    elements.currentImage.hidden = false;

    if (elements.currentImagePlaceholder) {
        elements.currentImagePlaceholder.hidden = true;
    }

    elements.currentImage.onerror = () => {
        elements.currentImage.hidden = true;

        if (elements.currentImagePlaceholder) {
            elements.currentImagePlaceholder.hidden = false;
        }
    };
}

function renderCurrentWorkFile() {
    if (!elements.currentWorkFileInfo) return;

    if (currentWork.submission_type === "url") {
        elements.currentWorkFileInfo.textContent =
            "現在は外部URLで提供されています。";
        return;
    }

    if (!currentWork.file_path) {
        elements.currentWorkFileInfo.textContent =
            "現在の作品ファイル情報がありません。";
        return;
    }

    const name =
        currentWork.original_filename ||
        "作品ファイル";

    const size =
        formatFileSize(currentWork.file_size);

    const type =
        currentWork.file_type ||
        "FILE";

    const accessLabel =
        getDownloadAccessLabel(
            currentWork.download_access
        );

    elements.currentWorkFileInfo.textContent =
        `${name} / ${type} / ${size} / ${accessLabel}`;
}

function handleImageSelection(event) {
    clearMessages();
    selectedPreviewImage = null;

    const file = event.target.files?.[0] || null;

    if (!file) {
        if (elements.imagePreview) {
            elements.imagePreview.src = "";
            elements.imagePreview.hidden = true;
        }
        return;
    }

    const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        event.target.value = "";
        showError("プレビュー画像はPNG、JPEG、WebPのみ使用できます。");
        return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
        event.target.value = "";
        showError("プレビュー画像は10MB以下にしてください。");
        return;
    }

    selectedPreviewImage = file;

    const reader = new FileReader();

    reader.onload = () => {
        if (elements.imagePreview) {
            elements.imagePreview.src = String(reader.result);
            elements.imagePreview.hidden = false;
        }
    };

    reader.readAsDataURL(file);
}

function handleWorkFileSelection(event) {
    clearMessages();
    selectedWorkFile = null;

    const file = event.target.files?.[0] || null;

    if (!file) {
        if (elements.workFileInfo) {
            elements.workFileInfo.textContent =
                "新しいファイルは選択されていません。";
        }

        return;
    }

    if (file.size > MAX_WORK_FILE_SIZE) {
        event.target.value = "";

        if (elements.workFileInfo) {
            elements.workFileInfo.textContent =
                "新しいファイルは選択されていません。";
        }

        showError("作品ファイルは500MB以下にしてください。");
        return;
    }

    selectedWorkFile = file;

    if (elements.workFileInfo) {
        elements.workFileInfo.textContent =
            `${file.name} / ${getFileType(file)} / ${formatFileSize(file.size)}`;
    }
}

function getSubmissionType() {
    return getCheckedValue("submission_type") || "file";
}

function updateSubmissionType() {
    const isFile =
        getSubmissionType() === "file";

    if (elements.directFileArea) {
        elements.directFileArea.hidden = !isFile;
    }

    if (elements.externalUrlArea) {
        elements.externalUrlArea.hidden = isFile;
    }

    /*
     * 編集画面では既存ファイルを再利用できるため、
     * work-fileは常にrequired=false。
     */
    if (elements.workFile) {
        elements.workFile.required = false;
    }

    if (elements.externalUrl) {
        elements.externalUrl.required = !isFile;
    }
}

function getDownloadAccess() {
    const access = getCheckedValue("download_access");

    return DOWNLOAD_ACCESS_VALUES.has(access)
        ? access
        : null;
}

function updateDownloadAccessHelp() {
    if (!elements.downloadAccessHelpTitle || !elements.downloadAccessHelpText) {
        return;
    }

    const access =
        getDownloadAccess() ||
        (DOWNLOAD_ACCESS_VALUES.has(currentWork?.download_access)
            ? currentWork.download_access
            : null);

    if (!access) {
        elements.downloadAccessHelpTitle.textContent =
            "公開範囲を選択してください";
        elements.downloadAccessHelpText.textContent =
            "未選択のまま保存することはできません。";
        return;
    }

    const descriptions = {
        public: {
            title: "🌐 ログイン不要",
            text: "MFDCOへログインしていない人でも、この作品を取得できます。"
        },
        user: {
            title: "🔐 ログインユーザー",
            text: "MFDCOへログインしているユーザーが、この作品を取得できます。"
        },
        member: {
            title: "🔒 加盟国・許可ユーザー",
            text: "MFDCOから許可されたユーザーのみ、この作品を取得できます。"
        },
        private: {
            title: "非公開",
            text: "作品ページを公開していても、作品データ自体はダウンロードできません。"
        }
    };

    const info = descriptions[access];

    elements.downloadAccessHelpTitle.textContent = info.title;
    elements.downloadAccessHelpText.textContent = info.text;
}

function getDownloadAccessLabel(access) {
    switch (access) {
        case "public":
            return "ログイン不要";
        case "member":
            return "加盟国限定";
        case "private":
            return "非公開";
        case "user":
        default:
            return "ログイン必須";
    }
}

function getCreditType() {
    return getCheckedValue("credit_type") || "profile";
}

function updateCreditType() {
    const type = getCreditType();

    if (elements.profileCreditArea) {
        elements.profileCreditArea.hidden =
            type !== "profile";
    }

    if (elements.customCreditArea) {
        elements.customCreditArea.hidden =
            type !== "custom";
    }

    if (elements.customCreditText) {
        elements.customCreditText.required =
            type === "custom";
    }
}

function renderProfileCredit() {
    if (!elements.profileCreditText) return;

    elements.profileCreditText.textContent =
        String(currentProfile?.activity_name || "").trim() ||
        "プロフィールの活動名を取得できません。";
}

function getCreditText() {
    switch (getCreditType()) {
        case "profile":
            return nullableText(currentProfile?.activity_name);

        case "custom":
            return nullableText(elements.customCreditText?.value);

        case "none":
        case "free":
        default:
            return null;
    }
}

function validateForm() {
    clearMessages();

    if (!currentUser || !currentWork) {
        showError("作品情報またはログイン情報を確認できません。");
        return false;
    }

    if (currentWork.user_id !== currentUser.id) {
        showError("この作品を編集する権限がありません。");
        return false;
    }

    const title = String(elements.title?.value || "").trim();

    if (!title) {
        showError("作品名を入力してください。");
        elements.title?.focus();
        return false;
    }

    const submissionType = getSubmissionType();

    if (submissionType === "url") {
        const url = String(elements.externalUrl?.value || "").trim();

        if (!url) {
            showError("外部URLを入力してください。");
            return false;
        }

        if (!isValidHttpUrl(url)) {
            showError("外部URLには http:// または https:// で始まるURLを入力してください。");
            return false;
        }
    }

    if (submissionType === "file") {
        const hasExistingFile =
            currentWork.submission_type === "file" &&
            Boolean(currentWork.file_path);

        const hasNewFile =
            Boolean(
                selectedWorkFile ||
                elements.workFile?.files?.[0]
            );

        if (!hasExistingFile && !hasNewFile) {
            showError("ファイル提供へ変更する場合は作品ファイルを選択してください。");
            return false;
        }
    }

    if (!getDownloadAccess()) {
        showError("ダウンロードできるユーザーを選択してください。");
        document
            .querySelector('input[name="download_access"]')
            ?.focus();
        return false;
    }

    for (const name of [
        "commercial_use",
        "modification",
        "setting_modification",
        "destruction_depiction"
    ]) {
        if (!getCheckedValue(name)) {
            showError("すべての利用条件を選択してください。");
            return false;
        }
    }

    if (getCreditType() === "custom" &&
        !nullableText(elements.customCreditText?.value)) {
        showError("クレジット書式を入力してください。");
        return false;
    }

    if (getCreditType() === "profile" &&
        !nullableText(currentProfile?.activity_name)) {
        showError("プロフィールの活動名を取得できません。別のクレジット設定を選択してください。");
        return false;
    }

    return true;
}

async function handleSave(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    setSubmitting(true);
    clearMessages();

    let newImagePath = null;
    let newWorkFilePath = null;
    let newWorkFileBucket = null;

    let migratedFile = null;

    try {
        const { data, error: userError } =
            await window.supabaseClient.auth.getUser();

        if (userError) throw userError;

        const user = data?.user;

        if (!user || user.id !== currentWork.user_id) {
            throw new Error("作品を編集する権限を確認できません。");
        }

        /*
         * IMAGE
         */

        let imageUrl =
            currentWork.image_url || null;

        const newImage =
            selectedPreviewImage ||
            elements.imageInput?.files?.[0] ||
            null;

        if (newImage) {
            const result =
                await uploadPreviewImage(currentWorkId, newImage);

            newImagePath = result.path;
            imageUrl = result.url;
        }

        /*
         * WORK DATA
         */

        const submissionType =
            getSubmissionType();

        const downloadAccess =
            getDownloadAccess();

        const oldAccess =
            currentWork.download_access;

        const oldBucket =
            getWorkBucket(oldAccess);

        const targetBucket =
            getWorkBucket(downloadAccess);

        let filePath =
            currentWork.file_path || null;

        let externalUrl =
            currentWork.external_url || null;

        let originalFilename =
            currentWork.original_filename || null;

        let fileSize =
            currentWork.file_size ?? null;

        let fileType =
            currentWork.file_type || null;

        /*
         * FILE
         */

        if (submissionType === "file") {
            externalUrl = null;

            const newFile =
                selectedWorkFile ||
                elements.workFile?.files?.[0] ||
                null;

            if (newFile) {
                const result =
                    await uploadWorkFile(
                        currentWorkId,
                        newFile,
                        targetBucket
                    );

                newWorkFilePath = result.path;
                newWorkFileBucket = targetBucket;

                filePath = result.path;
                originalFilename = newFile.name;
                fileSize = newFile.size;
                fileType = getFileType(newFile);
            } else {
                /*
                 * 同じ既存ファイルを使い続けるが、
                 * public <-> private が変わった場合は
                 * Bucket間を移動する。
                 */
                const hasExistingFile =
                    currentWork.submission_type === "file" &&
                    Boolean(currentWork.file_path);

                if (hasExistingFile && oldBucket !== targetBucket) {
                    migratedFile =
                        await migrateWorkFile({
                            fromBucket: oldBucket,
                            toBucket: targetBucket,
                            path: currentWork.file_path
                        });

                    filePath = migratedFile.path;
                }
            }
        }

        /*
         * URL
         */

        if (submissionType === "url") {
            externalUrl =
                String(elements.externalUrl?.value || "").trim();

            filePath = null;
            originalFilename = null;
            fileSize = null;
            fileType = "external";
        }

        /*
         * PAYLOAD
         */

        const payload = {
            title:
                String(elements.title?.value || "").trim(),

            description:
                nullableText(elements.description?.value),

            image_url:
                imageUrl,

            tags:
                getSelectedTags(),

            submission_type:
                submissionType,

            file_path:
                filePath,

            external_url:
                externalUrl,

            original_filename:
                originalFilename,

            file_size:
                fileSize,

            file_type:
                fileType,

            download_access:
                downloadAccess,

            commercial_use:
                getCheckedValue("commercial_use"),

            modification:
                getCheckedValue("modification"),

            setting_modification:
                getCheckedValue("setting_modification"),

            destruction_depiction:
                getCheckedValue("destruction_depiction"),

            other_terms:
                nullableText(elements.otherTerms?.value),

            credit_type:
                getCreditType(),

            credit_text:
                getCreditText()
        };

        /*
         * id / user_id / status は更新しない。
         */

        const {
            data: updatedWork,
            error: updateError
        } = await window.supabaseClient
            .from("works")
            .update(payload)
            .eq("id", currentWorkId)
            .eq("user_id", user.id)
            .select("id")
            .maybeSingle();

        if (updateError) throw updateError;

        if (!updatedWork) {
            throw new Error("作品を更新できませんでした。権限設定を確認してください。");
        }

        /*
         * OLD IMAGE CLEANUP
         */

        if (newImagePath && currentWork.image_url) {
            const oldImagePath =
                getStoragePathFromPublicUrl(
                    currentWork.image_url,
                    WORK_IMAGE_BUCKET
                );

            if (oldImagePath && oldImagePath !== newImagePath) {
                await removeStorageFile(
                    WORK_IMAGE_BUCKET,
                    oldImagePath
                );
            }
        }

        /*
         * OLD WORK FILE CLEANUP
         */

        const oldFilePath =
            currentWork.file_path;

        if (oldFilePath) {
            if (submissionType === "url") {
                await removeStorageFile(
                    oldBucket,
                    oldFilePath
                );
            } else if (newWorkFilePath &&
                       (
                           oldFilePath !== newWorkFilePath ||
                           oldBucket !== newWorkFileBucket
                       )) {
                await removeStorageFile(
                    oldBucket,
                    oldFilePath
                );
            } else if (migratedFile) {
                await removeStorageFile(
                    oldBucket,
                    oldFilePath
                );
            }
        }

        showSuccess("作品情報を更新しました。");

        setTimeout(() => {
            window.location.href =
                `work.html?id=${encodeURIComponent(currentWorkId)}`;
        }, 700);

    } catch (error) {
        console.error("EDIT WORK SAVE ERROR:", error);

        if (newImagePath) {
            await removeStorageFile(
                WORK_IMAGE_BUCKET,
                newImagePath
            );
        }

        if (newWorkFilePath && newWorkFileBucket) {
            await removeStorageFile(
                newWorkFileBucket,
                newWorkFilePath
            );
        }

        if (migratedFile) {
            await removeStorageFile(
                migratedFile.bucket,
                migratedFile.path
            );
        }

        showError(getErrorMessage(error));
    } finally {
        setSubmitting(false);
    }
}

async function uploadPreviewImage(workId, file) {
    const extension = getImageExtension(file);

    const path =
        `${currentUser.id}/${workId}-${createUuid()}.${extension}`;

    const { error } = await window.supabaseClient
        .storage
        .from(WORK_IMAGE_BUCKET)
        .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
        });

    if (error) {
        throw new Error(`プレビュー画像のアップロードに失敗しました: ${error.message}`);
    }

    const { data } = window.supabaseClient
        .storage
        .from(WORK_IMAGE_BUCKET)
        .getPublicUrl(path);

    if (!data?.publicUrl) {
        throw new Error("プレビュー画像のURLを取得できませんでした。");
    }

    return {
        path,
        url: data.publicUrl
    };
}

async function uploadWorkFile(workId, file, bucket) {
    const safeFilename =
        getSafeStorageFilename(file);

    const path =
        `${currentUser.id}/${workId}/${createUuid()}-${safeFilename}`;

    const { error } = await window.supabaseClient
        .storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "application/octet-stream"
        });

    if (error) {
        throw new Error(`作品ファイルのアップロードに失敗しました: ${error.message}`);
    }

    return {
        path,
        bucket
    };
}

async function migrateWorkFile({
    fromBucket,
    toBucket,
    path
}) {
    if (!fromBucket || !toBucket || !path) {
        throw new Error("作品ファイルの移動情報が不足しています。");
    }

    if (fromBucket === toBucket) {
        return {
            bucket: toBucket,
            path
        };
    }

    const { data: blob, error: downloadError } =
        await window.supabaseClient
            .storage
            .from(fromBucket)
            .download(path);

    if (downloadError || !blob) {
        throw new Error(
            `既存作品ファイルを読み込めませんでした: ${downloadError?.message || "download failed"}`
        );
    }

    const { error: uploadError } =
        await window.supabaseClient
            .storage
            .from(toBucket)
            .upload(path, blob, {
                cacheControl: "3600",
                upsert: false,
                contentType:
                    blob.type ||
                    "application/octet-stream"
            });

    if (uploadError) {
        throw new Error(
            `作品ファイルの公開範囲変更に失敗しました: ${uploadError.message}`
        );
    }

    return {
        bucket: toBucket,
        path
    };
}

function getWorkBucket(access) {
    return access === "public"
        ? PUBLIC_WORK_BUCKET
        : PRIVATE_WORK_BUCKET;
}

async function removeStorageFile(bucket, path) {
    if (!bucket || !path) return;

    try {
        const { error } = await window.supabaseClient
            .storage
            .from(bucket)
            .remove([path]);

        if (error) {
            console.warn(`STORAGE REMOVE ERROR (${bucket}):`, error);
        }
    } catch (error) {
        console.warn(`STORAGE REMOVE ERROR (${bucket}):`, error);
    }
}

function getStoragePathFromPublicUrl(publicUrl, bucket) {
    if (!publicUrl || !bucket) return null;

    try {
        const url = new URL(publicUrl);
        const marker =
            `/storage/v1/object/public/${bucket}/`;

        const index =
            url.pathname.indexOf(marker);

        if (index === -1) {
            return null;
        }

        return decodeURIComponent(
            url.pathname.slice(
                index + marker.length
            )
        );
    } catch {
        return null;
    }
}

function showForm() {
    if (elements.loading) elements.loading.hidden = true;
    if (elements.loginRequired) elements.loginRequired.hidden = true;
    if (elements.forbidden) elements.forbidden.hidden = true;
    if (elements.form) elements.form.hidden = false;
}

function showLoggedOut() {
    if (elements.loading) elements.loading.hidden = true;
    if (elements.form) elements.form.hidden = true;
    if (elements.forbidden) elements.forbidden.hidden = true;
    if (elements.loginRequired) elements.loginRequired.hidden = false;
}

function showForbidden(message) {
    if (elements.loading) elements.loading.hidden = true;
    if (elements.form) elements.form.hidden = true;
    if (elements.loginRequired) elements.loginRequired.hidden = true;

    if (elements.forbiddenText) {
        elements.forbiddenText.textContent = message;
    }

    if (elements.forbidden) {
        elements.forbidden.hidden = false;
    }
}

function setSubmitting(value) {
    if (!elements.submitButton) return;

    elements.submitButton.disabled = value;
    elements.submitButton.textContent =
        value
            ? "保存しています..."
            : "変更を保存する";
}

function clearMessages() {
    if (elements.error) {
        elements.error.hidden = true;
        elements.error.textContent = "";
    }

    if (elements.success) {
        elements.success.hidden = true;
        elements.success.textContent = "";
    }
}

function showError(message) {
    if (!elements.error) {
        console.error(message);
        return;
    }

    elements.error.textContent = message;
    elements.error.hidden = false;

    if (elements.success) {
        elements.success.hidden = true;
    }
}

function showSuccess(message) {
    if (!elements.success) return;

    elements.success.textContent = message;
    elements.success.hidden = false;

    if (elements.error) {
        elements.error.hidden = true;
    }
}

function setRadioValue(name, value) {
    const input = document.querySelector(
        `input[name="${name}"][value="${value}"]`
    );

    if (input) {
        input.checked = true;
        return true;
    }

    return false;
}

function getCheckedValue(name) {
    return document.querySelector(
        `input[name="${name}"]:checked`
    )?.value || null;
}

function nullableText(value) {
    const text = String(value ?? "").trim();
    return text || null;
}

function isValidHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function getImageExtension(file) {
    const extension = getFileExtension(file.name);

    if (["png", "jpg", "jpeg", "webp"].includes(extension)) {
        return extension === "jpeg" ? "jpg" : extension;
    }

    switch (file.type) {
        case "image/jpeg":
            return "jpg";
        case "image/webp":
            return "webp";
        default:
            return "png";
    }
}

function getFileExtension(filename) {
    const parts =
        String(filename || "").split(".");

    return parts.length > 1
        ? String(parts.pop()).toLowerCase()
        : "";
}

function getFileType(file) {
    const extension =
        getFileExtension(file?.name);

    return extension
        ? extension.toUpperCase()
        : file?.type || "FILE";
}

function getSafeStorageFilename(file) {
    const original =
        String(file?.name || "file");

    const normalized = original
        .normalize("NFKC")
        .replace(/[\\/:*?"<>|#%{}[\]`~&+]/g, "_")
        .replace(/\s+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");

    return normalized || "file";
}

function formatFileSize(bytes) {
    const value = Number(bytes);

    if (!Number.isFinite(value) || value < 0) {
        return "-";
    }

    if (value === 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];

    const index = Math.min(
        Math.floor(Math.log(value) / Math.log(1024)),
        units.length - 1
    );

    const size =
        value / Math.pow(1024, index);

    return `${size.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function createUuid() {
    if (crypto?.randomUUID) {
        return crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        char => {
            const random =
                Math.random() * 16 | 0;

            const value =
                char === "x"
                    ? random
                    : (random & 0x3 | 0x8);

            return value.toString(16);
        }
    );
}

function getErrorMessage(error) {
    if (!error) {
        return "不明なエラーが発生しました。";
    }

    if (typeof error === "string") {
        return error;
    }

    return error.message ||
        error.error_description ||
        "処理中にエラーが発生しました。";
}

console.log("MFDCO edit-work.js loaded.");
