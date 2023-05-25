import type { PageLoad } from './$types';

export const load: PageLoad<{faq:string}> = (async ({ fetch }) => {
    const data = await fetch("/FAQ.md");
    const textData = await data.text();
    console.log("data", textData);

    return {
        faq: textData
    };
});
