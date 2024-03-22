<script lang="ts">
  import { onMount } from "svelte";

  export let faq: string;

  type QuestionAndAnswer = {
        "@type": "Question",
        name: string,
        acceptedAnswer: {
          "@type": "Answer",
          text: string,
        },
      };

  let faqHeader:string;


  onMount(() => {
    const lines = faq.split("\n").filter((line) => line.trim().length > 0);

    let index = -1;
    const questions: [string, string[]][] = [];
    for (const line of lines) {
      if (line.startsWith("#")) {
        questions[++index] = [line, []];
      } else {
        questions[index][1].push(line);
      }
    }

    const questionWithAnswers:QuestionAndAnswer[] = questions.map(([question, answer]) => {
      return {
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: `<p>${answer.join("<br/>")}</p>`,
        },
      } as QuestionAndAnswer;
    });

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": questionWithAnswers
    }
    
    faqHeader = JSON.stringify(faqSchema);
  });
</script>

<svelte:head>
{@html `<script type="application/ld+json">${faqHeader}</script>`}
</svelte:head>
