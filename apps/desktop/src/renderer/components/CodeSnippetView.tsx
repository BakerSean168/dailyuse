import { Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-react-shadcn';

interface CodeSnippetViewProps {
  title: string;
  language: string;
  content: string;
}

export function CodeSnippetView({ title, language, content }: CodeSnippetViewProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{title}</span>
          <span className="text-xs text-muted-foreground">{language}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs rounded-md bg-muted p-3 overflow-x-auto whitespace-pre-wrap break-words">
          <code>{content}</code>
        </pre>
      </CardContent>
    </Card>
  );
}

export default CodeSnippetView;
