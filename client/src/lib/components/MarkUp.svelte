<script lang="ts">
  import { serializeLd } from "$lib/utils";
  import { onMount } from "svelte";

  interface Props {
    faq: string;
  }

  let { faq }: Props = $props();

  interface QuestionAndAnswer {
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }

  let faqHeader: string = $state("");

  onMount(() => {
    const lines = faq.split("\n").filter((line) => line.trim().length > 0);

    let index = -1;
    const questions: [string, string[]][] = [];
    for (const line of lines) {
      if (line.startsWith("#")) {
        questions[++index] = [line, []];
      } else if(questions[index]) {
        questions[index][1].push(line);
      }
    }

    const questionWithAnswers: QuestionAndAnswer[] = questions.map(
      ([question, answer]) =>
        ({
          "@type": "Question",
          name: question,
          acceptedAnswer: {
            "@type": "Answer",
            text: `<p>${answer.join("<br/>")}</p>`,
          },
        }) as QuestionAndAnswer,
    );

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: questionWithAnswers,
    };

    faqHeader = JSON.stringify(faqSchema);
  });
</script>

<!-- eslint-disable svelte/no-at-html-tags -->
<svelte:head>
  {@html serializeLd(faqHeader)}
</svelte:head>
