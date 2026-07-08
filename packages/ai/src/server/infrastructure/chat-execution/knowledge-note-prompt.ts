export function buildKnowledgeNotePrompt(input: { topic: string; title?: string }): string {
  return [
    `Topic: ${input.topic}`,
    input.title ? `Preferred title: ${input.title}` : null,
    'Style requirements:',
    '- write in Markdown',
    '- make the note concise and readable',
    '- explain terms plainly for a non-expert reader',
    '- use short sections and practical examples when useful',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildKnowledgeNoteSystemPrompt(): string {
  return (
    'You write concise, well-structured Markdown knowledge notes. ' +
    'Always respond with Markdown only. Include a title, a short introduction, ' +
    'clear section headings, and a short closing summary.'
  );
}
