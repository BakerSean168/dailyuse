import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-react-shadcn';
import CodeSnippetView from '../components/CodeSnippetView';
import { useGovernanceStore } from '../stores/governance-store';

export function RuleDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { currentRule, loading, error, fetchRuleById } = useGovernanceStore();

  useEffect(() => {
    if (id) {
      fetchRuleById(id);
    }
  }, [id, fetchRuleById]);

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">加载中...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-destructive">{error}</div>;
  }

  if (!currentRule) {
    return <div className="p-6 text-sm text-muted-foreground">未找到规则</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{currentRule.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{currentRule.code}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/governance')}>
          返回列表
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Badge>{currentRule.status}</Badge>
        <Badge variant="outline">{currentRule.severity}</Badge>
        {currentRule.tags.map((tag) => (
          <Badge key={tag.value} variant="secondary">
            {tag.value}
          </Badge>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>规则说明</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-7 whitespace-pre-wrap">{currentRule.description}</p>
        </CardContent>
      </Card>

      {currentRule.liveReferenceLocation && (
        <Card>
          <CardHeader>
            <CardTitle>代码位置</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono">{currentRule.liveReferenceLocation}</p>
          </CardContent>
        </Card>
      )}

      {currentRule.goodExamples.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Good Examples</h2>
          {currentRule.goodExamples.map((snippet) => (
            <CodeSnippetView
              key={snippet.id}
              title={snippet.caption ?? 'Good Example'}
              language={snippet.language}
              content={snippet.content}
            />
          ))}
        </div>
      )}

      {currentRule.badExamples.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Bad Examples</h2>
          {currentRule.badExamples.map((snippet) => (
            <CodeSnippetView
              key={snippet.id}
              title={snippet.caption ?? 'Bad Example'}
              language={snippet.language}
              content={snippet.content}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default RuleDetailView;
