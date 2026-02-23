import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Card, CardContent, CardHeader, CardTitle } from '@dailyuse/ui-react-shadcn';
import RuleCard from '../components/RuleCard';
import { useGovernanceStore } from '../stores/governance-store';

export function RuleListView() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const { rules, loading, error, fetchRules, searchRules } = useGovernanceStore();

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      searchRules(query);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query, searchRules]);

  const title = useMemo(() => (query.trim() ? '搜索结果' : '治理规则'), [query]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="搜索规则标题、编码、描述或标签..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </CardContent>
      </Card>

      {loading && <div className="text-sm text-muted-foreground">加载中...</div>}
      {error && <div className="text-sm text-destructive">{error}</div>}

      {!loading && !error && rules.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            暂无匹配规则
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {rules.map((rule) => (
          <RuleCard key={rule.id} rule={rule} onOpen={(id) => navigate(`/governance/${id}`)} />
        ))}
      </div>
    </div>
  );
}

export default RuleListView;
